// Vignette script types for Watch-mode instructor playback.
// A vignette is a deterministic sequence of scripted maneuvers, narration
// updates, teaching pauses, and view changes that turns a mission into a
// guided lesson.

export type DiagramId =
  | 'hohmann'
  | 'ric'
  | 'vbar_approach'
  | 'rbar_approach'
  | 'link_budget'
  | 'attribution_ladder'

export interface NarrationBlock {
  title: string
  body: string
  operationalNote?: string
  citation?: string
  diagram?: DiagramId
}

export type WaypointKind =
  | 'maneuver'
  | 'action'
  | 'narration'
  | 'teach_pause'
  | 'view_change'
  | 'phase_marker'

// Maneuver direction vocabulary.
// prograde/retrograde/radial_*/normal/anti_normal resolve in the commanding
// ship's own RIC frame.
// vbar_*, rbar_* resolve in the target spacecraft's RIC frame (used by the
// chaser during terminal approach).
export type ManeuverDirection =
  | 'prograde'
  | 'retrograde'
  | 'radial_out'
  | 'radial_in'
  | 'normal'
  | 'anti_normal'
  | 'vbar_plus'
  | 'vbar_minus'
  | 'rbar_plus'
  | 'rbar_minus'

export interface ManeuverWaypointData {
  craftId: string
  direction: ManeuverDirection
  dv_mps: number
  label: string
}

export interface ActionWaypointData {
  craftId: string
  actionId: string
}

export interface Waypoint {
  t_sim: number
  kind: WaypointKind
  id: string
  maneuver?: ManeuverWaypointData
  action?: ActionWaypointData
  narration?: NarrationBlock
  teach?: NarrationBlock
  viewChange?: 'map' | 'prox'
  phase?: string
}

export interface VignetteScript {
  id: string
  missionId: string
  title: string
  subtitle: string
  totalDurationSec: number
  intro: NarrationBlock
  outro: NarrationBlock
  waypoints: Waypoint[]
  // phase name -> action ids recommended while that phase is current
  recommendedActions: Record<string, string[]>
  // per-action one-sentence justification shown in the tooltip when a badge is visible
  actionReasons?: Record<string, string>
  learningObjectives: string[]
}

// Utility: phase markers ordered, used by the scrubber UI.
export const phaseMarkers = (v: VignetteScript) =>
  v.waypoints.filter((w) => w.kind === 'phase_marker')
