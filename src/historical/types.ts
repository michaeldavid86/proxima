// Historical Ops Library — schematic, time-lined vignettes drawn from public
// documentation. These are NOT driven by the physics engine. They are hand-
// authored keyframes with narration, designed to run in 2-3 minutes as a
// classroom drop-in.

export type Regime = 'LEO' | 'MEO' | 'GEO' | 'CISLUNAR'
export type Side = 'blue' | 'red' | 'neutral'

export interface CraftSnapshot {
  id: string
  name: string
  side: Side
  x_km: number
  y_km: number
  regime: Regime
  labelVisible: boolean
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
}

export interface DiscussionPrompt {
  question: string
  instructorNotes?: string
}

export interface HistoricalVignette {
  id: string
  title: string
  subtitle: string
  era: string
  regime: Regime
  estimatedRuntimeSec: number
  thumbnail: string // emoji or short label
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
