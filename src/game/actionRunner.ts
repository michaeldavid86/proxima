// Activation / deactivation of tactical actions. Pure state patches; the
// continuous per-tick work (attribution drip, J/S resolution) is handled in turn.ts.
import { actionsById } from './actions'
import { makeRng } from './events'
import type { ActiveEffect, GameStore } from './state'

// Approximate length of an action "turn" for one-turn actions.
const ONE_TURN_SEC = 60

export type ActionResult = {
  patch: Partial<GameStore>
  logText: string
  tone?: 'info' | 'warn' | 'danger' | 'success'
}

export const invokeAction = (state: GameStore, actionId: string): ActionResult | null => {
  const def = actionsById[actionId]
  if (!def) return null
  if (def.disabled) return null
  const mission = state.mission
  if (!mission) return null
  const ship = state.spacecraft[mission.playerId]
  if (!ship) return null
  const now = state.simTimeSec

  // once-per-mission check
  if (def.cost.oncePerMission) {
    const already = state.actionsTaken.find((a) => a.actionId === actionId)
    if (already) return { patch: {}, logText: `${def.name} already used this mission.`, tone: 'warn' }
  }

  // Toggle behavior for untilCancelled: click again cancels.
  if (def.duration === 'untilCancelled' && state.activeEffects[actionId]) {
    const next = { ...state.activeEffects }
    delete next[actionId]
    return {
      patch: { activeEffects: next },
      logText: `${def.name} disengaged.`,
      tone: 'info',
    }
  }

  const actionsTaken = [...state.actionsTaken, { actionId, t: now }]
  const startAttribution = state.attributionRisk + (def.cost.attributionDelta ?? 0)
  const clampedAttribution = Math.max(0, Math.min(100, startAttribution))

  // Build effect record when relevant.
  let activeEffects = state.activeEffects
  if (def.duration === 'untilCancelled' || def.duration === 'oneTurn') {
    const endsAt: number | null = def.duration === 'oneTurn' ? now + ONE_TURN_SEC : null
    const eff: ActiveEffect = {
      id: actionId,
      shipId: mission.playerId,
      startedAt: now,
      endsAt,
    }
    activeEffects = { ...state.activeEffects, [actionId]: eff }
  }

  // Special one-shot side effects.
  let extraPatch: Partial<GameStore> = {}
  let logText = `${def.name} activated.`
  let tone: ActionResult['tone'] = 'info'

  switch (actionId) {
    case 'network_probe': {
      // Reveal the next adversary action in the log, probabilistically.
      const script = mission.adversaryScript ?? []
      const upcoming = script.find((a) => a.atTimeSec >= now)
      // Seeded deterministic roll based on sim time + actionId.
      const rng = makeRng(Math.floor(now) ^ 0xbeef)
      const hit = rng() > 0.3
      if (hit && upcoming) {
        logText = `Probe: adversary plans ${upcoming.kind} at T+${Math.round(upcoming.atTimeSec)}s.`
        tone = 'success'
      } else {
        logText = 'Probe returned nothing actionable.'
        tone = 'info'
      }
      break
    }
    case 'link_disruption': {
      // Degrade adversary link for 2 turns: we model by adding an effect
      // that the turn-resolver will read and penalize adversary emitters.
      const endsAt = now + 2 * ONE_TURN_SEC
      activeEffects = {
        ...activeEffects,
        link_disruption: {
          id: 'link_disruption',
          shipId: mission.playerId,
          startedAt: now,
          endsAt,
        },
      }
      logText = `Cyber probe: adversary link degraded for ${Math.round((endsAt - now) / 60)} min (one-shot).`
      tone = 'warn'
      break
    }
    case 'threat_warning': {
      logText = 'Threat warning call transmitted.'
      tone = 'warn'
      break
    }
    case 'threat_characterization': {
      const adv = state.spacecraft[mission.targetId]
      if (adv) {
        const sigList =
          adv.emitters.map((e) => `${e.role}@${e.fGHz}GHz/${e.txPowerW}W`).join(', ') || 'no emissions detected'
        logText = `Characterization: ${adv.name} emitters [${sigList}].`
        tone = 'success'
      }
      break
    }
    case 'inspection_collect': {
      // Require range within primary sensor's max.
      const target = state.spacecraft[mission.targetId]
      const sensor = ship.sensors.find((s) => s.kind === 'optical') ?? ship.sensors[0]
      const rangeKm =
        target && ship
          ? Math.sqrt(
              (ship.rEci[0] - target.rEci[0]) ** 2 +
                (ship.rEci[1] - target.rEci[1]) ** 2 +
                (ship.rEci[2] - target.rEci[2]) ** 2,
            ) / 1000
          : Infinity
      const linkOk = state.linkStatus !== 'denied'
      if (!sensor) {
        logText = 'No sensor installed.'
        tone = 'warn'
      } else if (rangeKm > sensor.maxRangeKm) {
        logText = `Range ${rangeKm.toFixed(0)} km exceeds sensor max ${sensor.maxRangeKm} km.`
        tone = 'warn'
      } else if (!linkOk) {
        logText = 'Inspection collect requires nominal or degraded link.'
        tone = 'warn'
      } else {
        logText = 'Inspection collect initiated.'
        tone = 'success'
      }
      break
    }
    case 'uplink_jam':
    case 'downlink_jam': {
      logText = `${def.name} radiating. Attribution +${def.cost.attributionDelta ?? 0}.`
      tone = 'danger'
      break
    }
    case 'emcon': {
      logText = 'EMCON engaged: transmitter muted.'
      tone = 'warn'
      break
    }
    case 'point_away': {
      logText = 'Antenna slewing off-adversary (1 turn).'
      tone = 'warn'
      break
    }
    case 'frequency_agility': {
      logText = 'Frequency hopping: own-link degraded for 1 turn, jammer loses lock.'
      tone = 'warn'
      break
    }
    case 'decoy': {
      logText = 'Decoy deployed. Attribution shaved.'
      tone = 'info'
      break
    }
    case 'hardening': {
      logText = state.activeEffects['hardening']
        ? 'Hardening posture disengaged.'
        : 'Hardening posture engaged.'
      tone = 'info'
      break
    }
    case 'station_keep_offset':
    case 'escort_posture':
    case 'defensive_maneuver':
    case 'close_approach':
    case 'spoof': {
      logText = `${def.name} selected.`
      tone = 'info'
      break
    }
  }

  const patch: Partial<GameStore> = {
    attributionRisk: clampedAttribution,
    activeEffects,
    actionsTaken,
    ...extraPatch,
  }
  return { patch, logText, tone }
}
