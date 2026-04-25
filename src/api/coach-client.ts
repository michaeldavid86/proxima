// Frontend wrapper for POST /api/coach.
// Builds a compact mission log from game state and returns the coach response.
import type { GameState } from '../game/state'

export interface MissionLog {
  missionId: string
  missionTitle: string
  outcome: 'success' | 'failure' | 'aborted'
  durationSec: number
  objectives: Array<{ id: string; description: string; met: boolean }>
  maneuvers: Array<{
    t_sec: number
    craft: string
    direction: string
    dv_mps: number
    context?: string
  }>
  actions: Array<{ t_sec: number; craft: string; actionId: string }>
  finalStats: {
    deltaVConsumed_mps: number
    operationalLifeCost_years: number
    attributionPeak: number
    linkStatusTimeline: Array<{ t_sec: number; status: string }>
    coveragePct?: number
  }
  keyEvents: Array<{ t_sec: number; description: string }>
}

export const buildMissionLog = (state: GameState): MissionLog | null => {
  if (!state.mission || !state.debrief) return null
  const m = state.mission

  // Condense maneuver list from sim log + dv samples: we don't retain an
  // explicit maneuver list in state, so we reconstruct from log entries
  // with known burn-text. Trim to 20 most recent.
  const maneuvers = state.log
    .filter((e) => /burns? \d/.test(e.text) || /burn queued/.test(e.text))
    .slice(-20)
    .map((e) => ({
      t_sec: Math.round(e.t),
      craft: e.text.split(':')[0]?.trim() ?? '',
      direction: 'unknown',
      dv_mps: (() => {
        const m = e.text.match(/(\d+(?:\.\d+)?)\s*m\/s/)
        return m ? Number(m[1]) : 0
      })(),
      context: e.text,
    }))

  const actions = state.debrief.actionsTaken.slice(-20).map((a) => ({
    t_sec: Math.round(a.t),
    craft: state.mission?.playerId ?? '',
    actionId: a.actionId,
  }))

  const attributionPeak = state.attributionSamples.reduce(
    (mx, s) => Math.max(mx, s.attribution),
    0,
  )

  const linkStatusTimeline = state.linkSamples.slice(-40).map((s) => ({
    t_sec: Math.round(s.t),
    status: s.status,
  }))

  const opLifeCost =
    state.operationalLife.initialYears > 0
      ? state.operationalLife.initialYears - state.operationalLife.currentYears
      : 0

  return {
    missionId: m.id,
    missionTitle: m.name,
    outcome: state.missionStatus === 'success' ? 'success' : 'failure',
    durationSec: Math.round(state.debrief.endTimeSec),
    objectives: [{ id: 'primary', description: summarizeObjective(m), met: state.missionStatus === 'success' }],
    maneuvers,
    actions,
    finalStats: {
      deltaVConsumed_mps: Number(state.totalDvUsed.toFixed(2)),
      operationalLifeCost_years: Number(opLifeCost.toFixed(2)),
      attributionPeak: Number(attributionPeak.toFixed(1)),
      linkStatusTimeline,
      coveragePct: m.assets ? Number(state.observationCoverage.currentPct.toFixed(1)) : undefined,
    },
    keyEvents: state.log
      .filter((e) => e.tone === 'warn' || e.tone === 'danger' || e.tone === 'success')
      .slice(-12)
      .map((e) => ({ t_sec: Math.round(e.t), description: e.text })),
  }
}

const summarizeObjective = (m: NonNullable<GameState['mission']>): string => {
  switch (m.success.kind) {
    case 'holdStation':
      return `Hold station < ${m.success.rangeKmMax} km and < ${m.success.relSpeedMsMax} m/s for ${m.success.holdSeconds}s.`
    case 'inspectionProfile':
      return `V-bar hold at ${m.success.vbarKm} km, collect, depart past ${m.success.departRangeKm} km.`
    case 'maintainLinkDepart':
      return `Maintain link for ${Math.round(m.success.missionDurationSec / 60)} min; end > ${m.success.departRangeKm} km.`
    case 'observationCoverage':
      return `Keep observation coverage >= ${m.success.coveragePctRequired}% for ${Math.round(m.success.missionDurationSec / 60)} min.`
  }
}

export interface CoachResponse {
  coach: string
  model?: string
  usage?: unknown
}

export const fetchCoachResponse = async (log: MissionLog): Promise<CoachResponse> => {
  const resp = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionLog: log }),
  })
  if (!resp.ok) {
    let detail = ''
    try {
      const j = (await resp.json()) as { error?: string; detail?: string }
      detail = j.detail || j.error || ''
    } catch {
      /* ignore */
    }
    throw new Error(`Coach unavailable (HTTP ${resp.status})${detail ? ': ' + detail : ''}`)
  }
  return (await resp.json()) as CoachResponse
}
