// Historical Ops Library — schematic, time-lined vignettes drawn from public
// documentation. These are NOT driven by the physics engine. They are hand-
// authored keyframes with narration, designed to run in 2-3 minutes as a
// classroom drop-in.
//
// v1.5: positions are authored as orbital elements (or RIC offsets to an
// anchor orbit) so the renderer can draw real orbit arcs in 3D. The legacy
// x_km / y_km fields remain optional for backward compatibility — if a
// snapshot omits the 3D fields, they are interpreted as (in-track, radial)
// offsets in km on the anchor orbit.

export type Regime = 'LEO' | 'MEO' | 'GEO' | 'CISLUNAR'
export type Side = 'blue' | 'red' | 'neutral'

// Camera framing preset for a snapshot.
// - 'regime': frame the whole orbit (entire GEO ring, full LEO loop)
// - 'close': frame an active region around the anchor (few hundred km)
// - 'proximity': very close, focused on the action (terminal approach, grapple)
export type HistoricalCamera = 'regime' | 'close' | 'proximity'

export interface CraftSnapshot {
  id: string
  name: string
  side: Side
  regime: Regime
  labelVisible: boolean
  // Glyph style: 'satellite' (default), 'station', or 'debris'.
  glyph?: 'satellite' | 'station' | 'debris'
  // Position model (use one of):
  // (a) ricKm — offset from the vignette's anchor orbit, in km [radial, in-track, cross-track]
  // (b) phaseDeg — true anomaly offset along the anchor orbit, in degrees
  // (c) coeOverride — explicit orbital element override (any field not set falls back to the anchor)
  // (d) x_km / y_km — legacy 2D fields; interpreted as [in-track, radial] km
  ricKm?: [number, number, number]
  phaseDeg?: number
  coeOverride?: {
    altitudeKm?: number
    inclinationDeg?: number
    raanDeg?: number
    argpDeg?: number
    trueAnomalyDeg?: number
    eccentricity?: number
  }
  x_km?: number
  y_km?: number
}

export interface SnapshotNarration {
  title: string
  body: string
  operationalNote?: string
  citation: string
}

export interface Snapshot {
  t_sec: number
  label: string
  craft: CraftSnapshot[]
  narration: SnapshotNarration
  autoPauseAfter?: boolean
  // v1.5 camera framing for this snapshot. Defaults to 'regime' for the
  // first snapshot, 'close' afterward, unless overridden.
  camera?: HistoricalCamera
  // Optional: which craft id to center the camera on. Defaults to the first
  // craft listed in the snapshot.
  cameraFocusCraftId?: string
}

export interface DiscussionPrompt {
  question: string
  instructorNotes?: string
}

// Vignette-level anchor orbit. All RIC offsets and phase offsets are
// relative to this orbit. Each craft can override individual fields per
// snapshot via coeOverride for completely separate orbits (e.g., a
// raised-graveyard tow target).
export interface AnchorOrbit {
  altitudeKm: number
  inclinationDeg: number
  raanDeg?: number
  argpDeg?: number
  trueAnomalyDeg?: number
  eccentricity?: number
}

export interface HistoricalVignette {
  id: string
  title: string
  subtitle: string
  era: string
  regime: Regime
  estimatedRuntimeSec: number
  thumbnail: string
  // v1.5 anchor orbit for the 3D renderer. Required for new vignettes;
  // legacy x_km/y_km still works when present alongside an anchor.
  anchorOrbit: AnchorOrbit
  intro: {
    title: string
    body: string
    citation: string
  }
  snapshots: Snapshot[]
  outro: {
    title: string
    body: string
    citation: string
  }
  discussionPrompts: DiscussionPrompt[]
  primaryCitation: {
    title: string
    source: string
    url?: string
  }
}
