// Simulation step: advance time, apply scheduled maneuvers, run tactical
// effects, resolve link budget, update attribution, and score the mission.
import { propagateState } from '../physics/kepler'
import { applyImpulseEci, burnFromRic, propellantUsed } from '../physics/maneuver'
import { norm, sub } from '../physics/vec'
import {
  dbw,
  resolveLink,
  type LinkEndpoint,
} from '../physics/link-budget'
import { ricBasisOf, ricToEci } from '../physics/frames'
import { actionsById } from './actions'
import { scoreTick } from './scoring'
import { runScriptWaypoints, vignetteCompleted } from './script-runner'
import { budgetFromMass, lifeYearsFromDv } from './operational-life'
import type {
  ActiveEffect,
  DebriefData,
  GameStore,
  LinkStatus,
  PlannedManeuver,
  SpacecraftState,
} from './state'
import type { AdversaryAction, Mission } from '../missions/types'

// Maximum sub-step (seconds). Keplerian propagation is stable at any dt, but
// we still cap it so a maneuver schedule fires near the right time and
// mission scoring samples aren't too coarse.
const MAX_SUBSTEP_SEC = 60

const applyRicImpulseToShip = (ship: SpacecraftState, dvRic: [number, number, number]) => {
  const dvMag = Math.sqrt(dvRic[0] ** 2 + dvRic[1] ** 2 + dvRic[2] ** 2)
  if (dvMag === 0) return { ship, dvMag: 0 }
  const burn = burnFromRic(ship.rEci, ship.vEci, dvRic)
  const vNew = applyImpulseEci(ship.vEci, burn)
  const dm = propellantUsed(ship.mass, dvMag, ship.isp)
  const propNew = Math.max(0, ship.propellantMass - dm)
  const massNew = ship.dryMass + propNew
  return { ship: { ...ship, vEci: vNew, propellantMass: propNew, mass: massNew }, dvMag }
}

const propagateShip = (ship: SpacecraftState, dt: number): SpacecraftState => {
  const sv = propagateState({ r: ship.rEci, v: ship.vEci }, dt)
  return { ...ship, rEci: sv.r, vEci: sv.v }
}

// Compute the absolute ECI boresight for a ship given its RIC boresight setting.
const boresightEci = (ship: SpacecraftState): [number, number, number] => {
  const basis = ricBasisOf(ship.rEci, ship.vEci)
  return ricToEci(ship.boresightRic, basis) as [number, number, number]
}

// Mission 3 link resolver.
//
// We intentionally don't compute a realistic ground-to-player slant-range FSPL:
// Earth-rotating horizon geometry is out of scope for v1, and a faithful model
// would leave the player denied for most of each orbit regardless of adversary
// behavior. The teaching target is the defender's playbook, not LOS logistics.
//
// Instead: anchor a constant nominal ground signal level at the player receiver
// (abstraction), and compute a per-tick J/S from the adversary jammer using the
// Friis math in link-budget.ts (the thing the physics tests validate). Defender
// countermeasures (emcon / point_away / frequency_agility / hardening) modify
// the result per the spec.
const NOMINAL_SIGNAL_DBW = -95

const resolveMission3Link = (state: GameStore): LinkStatus => {
  const m = state.mission
  if (!m || !m.groundStation) return 'nominal'
  const player = state.spacecraft[m.playerId]
  const adv = state.spacecraft[m.targetId]
  if (!player) return 'nominal'

  const emcon = state.activeEffects['emcon'] !== undefined
  const pointAway = state.activeEffects['point_away'] !== undefined
  const freqHop = state.activeEffects['frequency_agility'] !== undefined
  const hardening = state.activeEffects['hardening'] !== undefined

  if (emcon) return 'denied'

  // No adversary jamming => nominal.
  const jammerEmit = adv?.emitters.find((e) => e.role === 'jammer' && e.active)
  if (!adv || !jammerEmit) return 'nominal'

  const victim: LinkEndpoint = {
    posEci: player.rEci,
    antenna:
      player.emitters.find((e) => e.role === 'downlink')?.antenna ?? {
        peakGainDb: 30,
        halfPowerBeamwidthRad: 0.1,
      },
    boresightEci: boresightEci(player),
    txPowerDbw: 0,
  }
  // Dummy source so resolveLink can run; we don't use its signal number.
  const source: LinkEndpoint = {
    posEci: m.groundStation.posEci,
    antenna: m.groundStation.antenna,
    boresightEci: sub(player.rEci, m.groundStation.posEci) as [number, number, number],
    txPowerDbw: dbw(m.groundStation.txPowerW),
  }
  const jammer: LinkEndpoint = {
    posEci: adv.rEci,
    antenna: jammerEmit.antenna,
    boresightEci: sub(player.rEci, adv.rEci) as [number, number, number],
    txPowerDbw: dbw(jammerEmit.txPowerW),
  }

  const out = resolveLink({ source, victim, jammer, fGHz: m.linkFGHz ?? 8 })
  if (out.jammerDbw === null) return 'nominal'

  let jam = out.jammerDbw
  if (pointAway) jam -= 15 // antenna rolled off jammer axis
  if (freqHop) jam -= 10 // jammer has to re-acquire
  if (hardening) jam -= 3

  // Nominal signal takes a small penalty when we sacrifice own-link for
  // countermeasures.
  const sigDbw = NOMINAL_SIGNAL_DBW + (pointAway ? -6 : 0) + (freqHop ? -3 : 0)

  const jToS = jam - sigDbw
  if (jToS >= 10) return 'denied'
  if (jToS >= 0) return 'degraded'
  return 'nominal'
}

// Update active-effect lifecycle (expire oneTurn etc. by end-time).
const expireEffects = (state: GameStore): Record<string, ActiveEffect> => {
  const out: Record<string, ActiveEffect> = {}
  for (const [id, eff] of Object.entries(state.activeEffects)) {
    if (eff.endsAt !== null && state.simTimeSec >= eff.endsAt) continue
    out[id] = eff
  }
  return out
}

// Apply adversary-scripted actions whose time has come (before the substep).
const runAdversaryScript = (
  state: GameStore,
  nextTime: number,
): Partial<GameStore> | null => {
  const script = state.mission?.adversaryScript
  if (!script) return null
  let patch: Partial<GameStore> | null = null
  const log = state.log.slice()
  let spacecraft = state.spacecraft
  let idx = state.adversaryScriptIdx
  while (idx < script.length && script[idx].atTimeSec <= nextTime) {
    const act = script[idx]
    if (act.kind === 'maneuver') {
      const ship = spacecraft[act.shipId]
      if (ship) {
        const { ship: updated, dvMag } = applyRicImpulseToShip(ship, act.dvRic)
        spacecraft = { ...spacecraft, [act.shipId]: updated }
        log.push({
          t: act.atTimeSec,
          text: `${ship.name} executes scripted burn (${dvMag.toFixed(2)} m/s RIC).`,
          tone: 'warn',
        })
        // NOTE: adversary dv is not summed into totalDvUsed (that's player-only).
      }
    } else if (act.kind === 'jam') {
      const ship = spacecraft[act.shipId]
      if (ship) {
        const emitters = ship.emitters.map((e) =>
          e.role === 'jammer' ? { ...e, active: true } : e,
        )
        spacecraft = { ...spacecraft, [act.shipId]: { ...ship, emitters } }
        log.push({
          t: act.atTimeSec,
          text: `${ship.name} lights up jammer (${act.target}).`,
          tone: 'danger',
        })
      }
    } else if (act.kind === 'closeApproach') {
      // Not used in Mission 3 currently; left for future wiring.
      log.push({
        t: act.atTimeSec,
        text: `${act.shipId} commits close approach (target range ${act.rangeKm} km).`,
        tone: 'warn',
      })
    }
    idx++
  }
  if (idx !== state.adversaryScriptIdx) {
    patch = {
      adversaryScriptIdx: idx,
      spacecraft,
      log,
    }
  }
  return patch
}

// Main simulation step. Advances state by up to `dtReq` seconds of sim time.
export const simStep = (state: GameStore, dtReq: number): Partial<GameStore> => {
  if (!state.mission || state.missionStatus !== 'active') return {}

  let next = state
  let remaining = dtReq

  while (remaining > 0 && next.missionStatus === 'active') {
    let dt = Math.min(remaining, MAX_SUBSTEP_SEC)

    // If the player's planned burn fires within this sub-step, clamp dt to
    // the burn time so we apply the impulse at exactly the right moment.
    const pm: PlannedManeuver | null = next.plannedManeuver
    const willBurn =
      pm !== null &&
      pm.burnTimeSec >= next.simTimeSec &&
      pm.burnTimeSec <= next.simTimeSec + dt
    if (willBurn && pm) dt = Math.max(0.001, pm.burnTimeSec - next.simTimeSec)

    // In Watch mode, clamp dt to the next un-fired vignette waypoint so the
    // runner fires events at (approximately) the right instant.
    if (next.mode === 'watch' && next.vignette) {
      for (const wp of next.vignette.waypoints) {
        if (next.firedWaypointIds.has(wp.id)) continue
        if (wp.t_sim <= next.simTimeSec) break
        if (wp.t_sim <= next.simTimeSec + dt) {
          dt = Math.max(0.001, wp.t_sim - next.simTimeSec)
        }
        break
      }
    }

    const nextTime = next.simTimeSec + dt

    // 1) Adversary scripted actions scheduled in [simTime, nextTime].
    const advPatch = runAdversaryScript(next, nextTime)
    if (advPatch) next = { ...next, ...advPatch }

    // 2) Propagate all spacecraft by dt.
    const spacecraft2: Record<string, SpacecraftState> = {}
    for (const [id, s] of Object.entries(next.spacecraft)) spacecraft2[id] = propagateShip(s, dt)
    next = { ...next, spacecraft: spacecraft2, simTimeSec: nextTime }

    // 3) Apply planned maneuver if this step ended at the burn time.
    if (willBurn && pm) {
      const ship = next.spacecraft[pm.shipId]
      if (ship) {
        const { ship: updated, dvMag } = applyRicImpulseToShip(ship, pm.dvRic)
        const newTotalDv = next.totalDvUsed + dvMag
        // Update operational-life for the player.
        let opLife = next.operationalLife
        if (pm.shipId === next.mission?.playerId) {
          // Recover the original budget from current mass + already-spent dv:
          // original propellant = current + consumed. We reconstruct using the
          // loadout that's still visible on next.mission.spacecraft.
          const loadout = next.mission.spacecraft.find((s) => s.id === pm.shipId)
          if (loadout) {
            const initialBudget = budgetFromMass(loadout.dryMass, loadout.propellantMass, loadout.isp)
            const remaining = Math.max(0, initialBudget - newTotalDv)
            const yearsNew = lifeYearsFromDv(remaining, next.operationalLife.regime)
            opLife = {
              ...next.operationalLife,
              currentYears: yearsNew,
              lastDeltaYears: yearsNew - next.operationalLife.currentYears,
              lastDeltaAtSec: next.simTimeSec,
            }
          }
        }
        // Per-asset dv tracking for multi-asset missions.
        let perAssetDvUsed = next.perAssetDvUsed
        if (next.mission?.assets?.includes(pm.shipId)) {
          perAssetDvUsed = {
            ...perAssetDvUsed,
            [pm.shipId]: (perAssetDvUsed[pm.shipId] ?? 0) + dvMag,
          }
        }
        next = {
          ...next,
          spacecraft: { ...next.spacecraft, [pm.shipId]: updated },
          plannedManeuver: null,
          totalDvUsed: newTotalDv,
          perAssetDvUsed,
          log: [
            ...next.log.slice(-199),
            {
              t: next.simTimeSec,
              text: `${ship.name} burns ${dvMag.toFixed(2)} m/s RIC (${pm.dvRic
                .map((x) => x.toFixed(2))
                .join(', ')}).`,
              tone: 'info',
            },
          ],
          dvSamples: [
            ...next.dvSamples,
            { t: next.simTimeSec, dvUsed: newTotalDv },
          ],
          operationalLife: opLife,
        }
      }
    }

    // 3b) Run vignette script waypoints whose t_sim has arrived.
    if (next.mode === 'watch' && next.vignette) {
      const vpatch = runScriptWaypoints(next)
      next = { ...next, ...vpatch }
      // If a teach_pause fired, it set paused=true. Break out of the substep
      // loop so the UI gets a chance to render the modal before time advances.
      if (next.paused) break
    }

    // 4) Expire time-limited effects.
    next = { ...next, activeEffects: expireEffects(next) }

    // 4a) Play-mode phase detection: lightweight rules so Recommended Action
    // rings work without a vignette loaded. Rules only fire for missions that
    // have a meaningful phase concept.
    if (next.mode === 'play' && next.mission) {
      const player = next.spacecraft[next.mission.playerId]
      const target = next.spacecraft[next.mission.targetId]
      if (player && target) {
        const rKm = norm(sub(player.rEci, target.rEci)) / 1000
        let phase: string | null = null
        if (next.mission.id === 'm3_contested_approach') {
          const jamOn = (target.emitters ?? []).some(
            (e) => e.role === 'jammer' && e.active,
          )
          phase = rKm < 30 || jamOn ? 'Contested' : 'Opening'
        } else if (next.mission.id === 'm2_quiet_inspector') {
          if (rKm < 40 && rKm > 5) phase = 'Station-keep'
          else if (rKm >= 40) phase = 'Closing'
          else phase = 'Departure'
        }
        if (phase && phase !== next.currentPhase) {
          next = { ...next, currentPhase: phase }
        }
      }
    }

    // 4b) Mission 2 reactive target evasion: once attribution crosses 70,
    // SATCOM-ALPHA executes a one-time small prograde drift away from the
    // player, simulating "target flees" heat rising.
    if (
      next.mission?.id === 'm2_quiet_inspector' &&
      next.attributionRisk >= 70 &&
      !next.activeEffects['target_evaded']
    ) {
      const tgt = next.spacecraft[next.mission.targetId]
      if (tgt) {
        const { ship: updatedTgt } = applyRicImpulseToShip(tgt, [0, 0.25, 0])
        next = {
          ...next,
          spacecraft: { ...next.spacecraft, [next.mission.targetId]: updatedTgt },
          activeEffects: {
            ...next.activeEffects,
            target_evaded: {
              id: 'target_evaded',
              shipId: next.mission.targetId,
              startedAt: next.simTimeSec,
              endsAt: null,
            },
          },
          log: [
            ...next.log.slice(-199),
            {
              t: next.simTimeSec,
              text: `${tgt.name} executes evasive drift (attribution crossed 70).`,
              tone: 'danger',
            },
          ],
        }
      }
    }

    // 5) Auto-adversary behavior: turn on jammer within 30 km in Mission 3.
    if (next.mission?.id === 'm3_contested_approach') {
      const adv = next.spacecraft[next.mission.targetId]
      const ply = next.spacecraft[next.mission.playerId]
      if (adv && ply) {
        const rKm = norm(sub(adv.rEci, ply.rEci)) / 1000
        const jam = adv.emitters.find((e) => e.role === 'jammer')
        if (jam && !jam.active && rKm < 30) {
          const emitters = adv.emitters.map((e) =>
            e.role === 'jammer' ? { ...e, active: true } : e,
          )
          next = {
            ...next,
            spacecraft: {
              ...next.spacecraft,
              [next.mission.targetId]: { ...adv, emitters },
            },
            log: [
              ...next.log.slice(-199),
              { t: next.simTimeSec, text: `${adv.name} activates jammer (< 30 km).`, tone: 'danger' },
            ],
          }
        }
      }
    }

    // 6) Resolve link (Mission 3 only uses uplink link for now).
    let link: LinkStatus = 'nominal'
    if (next.mission?.id === 'm3_contested_approach') link = resolveMission3Link(next)
    next = { ...next, linkStatus: link }

    // 7) Update attribution.
    next = applyAttribution(next, dt)

    // 8) Sample recorders (sub-sampled to avoid giant arrays).
    next = recordSamples(next)

    // 8b) Observation-coverage update for multi-asset missions.
    if (next.mission?.assets && next.mission.assets.length > 0) {
      const target = next.spacecraft[next.mission.targetId]
      let covered = false
      if (target) {
        for (const aid of next.mission.assets) {
          const ship = next.spacecraft[aid]
          if (!ship) continue
          const sensor = ship.sensors.find((s) => s.kind === 'optical') ?? ship.sensors[0]
          if (!sensor) continue
          const rKm = norm(sub(ship.rEci, target.rEci)) / 1000
          if (rKm <= sensor.maxRangeKm) {
            covered = true
            break
          }
        }
      }
      const cov = next.observationCoverage
      const totalTicks = cov.totalTicks + 1
      const coveredTicks = cov.coveredTicks + (covered ? 1 : 0)
      const pct = totalTicks > 0 ? (coveredTicks / totalTicks) * 100 : 100
      const lwm = Math.min(cov.lowWaterMark, pct)
      // Sub-sample the timeline so the array does not balloon.
      const lastSample = cov.samples.at(-1)
      const SAMPLE_EVERY = 30
      const samples =
        !lastSample || next.simTimeSec - lastSample.t >= SAMPLE_EVERY
          ? [...cov.samples, { t: next.simTimeSec, pct }]
          : cov.samples
      next = {
        ...next,
        observationCoverage: {
          totalTicks,
          coveredTicks,
          currentPct: pct,
          lowWaterMark: lwm,
          samples,
        },
      }
    }

    // 9) Score mission. In Watch mode we use vignette completion instead of
    // the mission's success/failure spec, which is typically not meaningful
    // for a guided tour.
    if (next.mode === 'watch') {
      if (vignetteCompleted(next)) {
        next = {
          ...next,
          missionStatus: 'success',
          debrief: buildDebrief(next, undefined, 'Vignette complete.'),
          screen: 'debrief',
          paused: true,
          activeNarration: next.vignette?.outro ?? next.activeNarration,
        }
        break
      }
    } else {
      const m = next.mission!
      const player = next.spacecraft[m.playerId]
      const target = next.spacecraft[m.targetId]
      const collectActive = next.activeEffects['inspection_collect'] !== undefined
      // Build per-asset propellant snapshot for multi-asset missions.
      const assetPropellantKg: Record<string, number> = {}
      if (m.assets) {
        for (const aid of m.assets) {
          const s = next.spacecraft[aid]
          if (s) assetPropellantKg[aid] = s.propellantMass
        }
      }
      const score = scoreTick({
        mission: m,
        simTimeSec: next.simTimeSec,
        dt,
        player,
        target,
        attributionRisk: next.attributionRisk,
        linkDenied: next.linkStatus === 'denied',
        linkDeniedStreakSec: next.linkDeniedStreakSec,
        holdTimerSec: next.holdTimerSec,
        inspectionCollected: next.inspectionCollected,
        collectActive,
        coverage: m.success.kind === 'observationCoverage' ? next.observationCoverage : undefined,
        assetPropellantKg: m.assets ? assetPropellantKg : undefined,
      })
      next = {
        ...next,
        holdTimerSec: score.holdTimerSec,
        inspectionCollected: score.inspectionCollected,
        linkDeniedStreakSec: score.linkDeniedStreakSec,
      }
      if (score.status !== 'active') {
        next = { ...next, missionStatus: score.status }
      }

      // 10) Mission clock guard (Play only).
      if (
        next.missionStatus === 'active' &&
        next.simTimeSec >= (next.mission?.maxDurationSec ?? Infinity)
      ) {
        next = {
          ...next,
          missionStatus: 'failure',
          log: [
            ...next.log.slice(-199),
            { t: next.simTimeSec, text: 'Mission time limit reached.', tone: 'danger' },
          ],
        }
      }

      if (next.missionStatus !== 'active') {
        next = {
          ...next,
          debrief: buildDebrief(next, score.failureReason, score.successNote),
          screen: 'debrief',
          paused: true,
        }
        break
      }
    }

    remaining -= dt
  }

  return next
}

// Attribution grows with closure rate when inside a sensitive radius and when
// active effects like uplink_jam / downlink_jam are radiating.
const applyAttribution = (state: GameStore, dt: number): GameStore => {
  const m = state.mission!
  const player = state.spacecraft[m.playerId]
  const target = state.spacecraft[m.targetId]
  if (!player || !target) return state
  const rangeKm = norm(sub(player.rEci, target.rEci)) / 1000

  let delta = 0
  // Active-effect attribution drip
  for (const eff of Object.values(state.activeEffects)) {
    const def = actionsById[eff.id]
    if (def?.cost.attributionPerMin) delta += (def.cost.attributionPerMin * dt) / 60
  }
  // Proximity-based drip (faster when closer and closing).
  if (rangeKm < 100) {
    const closureFactor = Math.max(0, 100 - rangeKm) / 100
    // Mission 2 tunes harder: rapid approach at GEO is suspicious.
    const scale = m.id === 'm2_quiet_inspector' ? 0.6 : 0.15
    delta += closureFactor * scale * (dt / 60)
  }
  const attributionRisk = Math.max(0, Math.min(100, state.attributionRisk + delta))
  return { ...state, attributionRisk }
}

// Periodic samples for the Debrief timeline.
const recordSamples = (state: GameStore): GameStore => {
  const m = state.mission!
  const player = state.spacecraft[m.playerId]
  const target = state.spacecraft[m.targetId]
  const rangeKm = norm(sub(player.rEci, target.rEci)) / 1000
  const SAMPLE_EVERY = Math.max(5, (state.mission?.maxDurationSec ?? 3600) / 600)
  const lastT = state.rangeSamples.at(-1)?.t ?? -Infinity
  if (state.simTimeSec - lastT < SAMPLE_EVERY) return state
  return {
    ...state,
    rangeSamples: [...state.rangeSamples, { t: state.simTimeSec, range: rangeKm }],
    attributionSamples: [
      ...state.attributionSamples,
      { t: state.simTimeSec, attribution: state.attributionRisk },
    ],
    linkSamples: [...state.linkSamples, { t: state.simTimeSec, status: state.linkStatus }],
  }
}

const buildDebrief = (
  state: GameStore,
  failureReason: string | undefined,
  successNote: string | undefined,
): DebriefData => {
  const notes: string[] = []
  if (successNote) notes.push(successNote)
  if (failureReason) notes.push(failureReason)
  // Auto-generated observations from the run.
  if (state.totalDvUsed > 0)
    notes.push(`Total \u0394v used: ${state.totalDvUsed.toFixed(1)} m/s.`)
  notes.push(`Actions taken: ${state.actionsTaken.length}.`)
  const m = state.mission!
  if (m.success.kind === 'holdStation')
    notes.push(
      `Closest station hold required: ${m.success.rangeKmMax} km, ${m.success.relSpeedMsMax} m/s for ${m.success.holdSeconds}s.`,
    )
  return {
    status: state.missionStatus,
    endTimeSec: state.simTimeSec,
    totalDvUsed: state.totalDvUsed,
    actionsTaken: state.actionsTaken,
    rangeSamples: state.rangeSamples,
    dvSamples: state.dvSamples,
    attributionSamples: state.attributionSamples,
    linkSamples: state.linkSamples,
    notes,
    realWorldCallout: m.realWorldCallout,
    missionName: m.name,
  }
}

export interface AdvanceArgs {
  state: GameStore
  realDtSec: number
}

// Drive from App (rAF). Returns a patch for the store.
export const stepFromRealTime = ({ state, realDtSec }: AdvanceArgs): Partial<GameStore> => {
  if (state.paused || state.screen !== 'game') return {}
  const simDt = realDtSec * state.timeWarp
  return simStep(state, simDt)
}

// Satisfy TS unused imports across the module boundary.
// (exporting adversary action type so the compiler won't drop it if it shifts)
export type { AdversaryAction, Mission }
