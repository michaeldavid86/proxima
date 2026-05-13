// Guided Learning Track types.
//
// A LearningSection is a unit of foundational RPO content rendered in the
// LearningTrackPlayer. Each section has a title, time estimate, body copy,
// an optional demo component slot, and an optional example problem.

export type DemoKind =
  | 'none'
  | 'historical_carousel' // section 1: 5 historical thumbnails
  | 'three_phase_demo' // section 2: walkthrough of three phases
  | 'rho_side_by_side' // section 3: ECI + RIC views side by side
  | 'ric_frame_demo' // section 4: rotating RIC axis triad
  | 'cw_vs_kepler' // section 5: model fidelity comparison
  | 'sandbox_perch' // section 6: sandbox locked to Perch
  | 'sandbox_drift' // section 7: sandbox locked to Linear Drift
  | 'sandbox_nmc' // section 8: sandbox locked to NMC
  | 'engagement_toggles' // section 9: a scene with all overlays toggleable
  | 'quiz' // section 10: self-check

export interface LearningSection {
  id: string
  title: string
  subtitle?: string
  estMinutes: number
  body: string // multi-paragraph text, '\n\n' between paragraphs
  citation?: string
  demoKind: DemoKind
  // Optional: id of an example problem to attach to this section.
  problemId?: string
}

// --- Example problems ---

export interface ExampleProblem {
  id: string
  title: string
  setup: string // scenario description
  // Variables presented to the cadet:
  variables: { label: string; value: string }[]
  // The single numeric answer (in m/s typically). Cadet input is checked
  // against this with a tolerance.
  expectedAnswerMps: number
  toleranceFraction: number // e.g. 0.05 for ±5%
  unit: string
  workedSolution: string // multi-paragraph reveal text
  citation?: string
}

// --- Reading list ---

export interface ReadingReference {
  id: string
  title: string
  author?: string
  publication?: string
  url?: string
  note?: string
}

// --- Self-check quiz ---

export interface QuizQuestion {
  id: string
  prompt: string
  choices: { id: string; text: string }[]
  correctChoiceId: string
  explanation: string // shown after reveal
}
