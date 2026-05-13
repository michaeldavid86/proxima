// The 18 v1.4 badges. Categories: mission (5), learning (4), discipline (4),
// discovery (5). All criteria are evaluated by code paths in state.ts and the
// UI; this file only defines metadata.
import type { Badge } from './types'

export const BADGES: Badge[] = [
  // ---- Mission completion (5) ----
  {
    id: 'primer_watched',
    title: 'First Briefing',
    category: 'mission',
    icon: '📡',
    hint: 'Watch the Primer end-to-end.',
    blurb: 'You sat through the orientation lecture without skipping.',
  },
  {
    id: 'm1_complete',
    title: 'First Light',
    category: 'mission',
    icon: '🛰️',
    hint: 'Complete Mission 1 in Play mode.',
    blurb: 'First successful rendezvous on the books.',
  },
  {
    id: 'm2_complete',
    title: 'Quiet Inspector',
    category: 'mission',
    icon: '🔍',
    hint: 'Complete Mission 2 with a clean inspection.',
    blurb: 'Held the inspection station without busting attribution.',
  },
  {
    id: 'm3_complete',
    title: 'Contested Approach',
    category: 'mission',
    icon: '⚡',
    hint: 'Complete Mission 3 against the jammer.',
    blurb: 'Closed the gap while link conditions worked against you.',
  },
  {
    id: 'm4_complete',
    title: 'Handoff',
    category: 'mission',
    icon: '🤝',
    hint: 'Complete Mission 4 (multi-asset handoff).',
    blurb: 'Sequenced two assets through the approach corridor.',
  },

  // ---- Learning track (4) ----
  {
    id: 'learning_complete',
    title: 'Foundational RPO',
    category: 'learning',
    icon: '📖',
    hint: 'Mark all 10 Learning Track sections done.',
    blurb: 'You can name every variable in the CW state transition matrix.',
  },
  {
    id: 'perch_master',
    title: 'Perch Master',
    category: 'learning',
    icon: '🎯',
    hint: 'Solve the Perch insertion problem on the first try.',
    blurb: 'Closed-form solution to the perch insertion, in one shot.',
  },
  {
    id: 'drift_master',
    title: 'Drift Master',
    category: 'learning',
    icon: '↗️',
    hint: 'Solve the Linear Drift problem on the first try.',
    blurb: 'The drift rate equals the in-plane velocity offset. Memorized.',
  },
  {
    id: 'nmc_master',
    title: 'NMC Master',
    category: 'learning',
    icon: '🔄',
    hint: 'Solve the Natural Motion Circumnavigation problem on the first try.',
    blurb: 'Δv equals mean motion times the radial amplitude. Solid.',
  },

  // ---- Operational discipline (4) ----
  {
    id: 'sun_at_back',
    title: 'Sun at Your Back',
    category: 'discipline',
    icon: '☀️',
    hint: 'Commit a maneuver while CATS is in the favorable band.',
    blurb: 'Approach geometry with the sun behind you. Camera loves it.',
  },
  {
    id: 'passive_safe',
    title: 'Fail-Safe',
    category: 'discipline',
    icon: '🛡️',
    hint: 'Commit a maneuver that is passively safe on free drift.',
    blurb: 'If your thrusters die now, you still miss the target.',
  },
  {
    id: 'within_the_rule',
    title: 'Within the Rule',
    category: 'discipline',
    icon: '📏',
    hint: 'Complete a mission without ever violating the 10-to-1 rule.',
    blurb: 'Closure rate stayed below the rule of thumb the whole way in.',
  },
  {
    id: 'plane_match',
    title: 'Plane Matched',
    category: 'discipline',
    icon: '✈️',
    hint: 'Transition out of the Plane Matching phase in a mission.',
    blurb: 'Inclination and RAAN aligned. The rest is in-plane geometry.',
  },

  // ---- Discovery (5) ----
  {
    id: 'historian',
    title: 'Historian',
    category: 'discovery',
    icon: '📚',
    hint: 'Open every Historical Ops vignette.',
    blurb: 'You traced the lineage from Gemini to today.',
  },
  {
    id: 'sandbox_explorer',
    title: 'Sandbox Explorer',
    category: 'discovery',
    icon: '🧪',
    hint: 'Try all three Trajectory Sandbox modes.',
    blurb: 'Perch, drift, and NMC, all swept through hands-on.',
  },
  {
    id: 'quiz_ace',
    title: 'Quiz Ace',
    category: 'discovery',
    icon: '🏆',
    hint: 'Answer every Learning Track quiz question correctly.',
    blurb: 'Perfect score on the self-check.',
  },
  {
    id: 'close_in',
    title: 'Close-In',
    category: 'discovery',
    icon: '🔬',
    hint: 'Reach the Close-In phase in any mission.',
    blurb: 'Inside 100 km of the target. The hard part begins now.',
  },
  {
    id: 'efficient_op',
    title: 'Efficient Op',
    category: 'discovery',
    icon: '⛽',
    hint: 'Complete a mission spending less than one year of operational life.',
    blurb: 'Light on the throttle. The bird will thank you.',
  },
]

export const BADGE_COUNT = BADGES.length
export const badgesById = Object.fromEntries(BADGES.map((b) => [b.id, b]))
export const badgesByCategory = (cat: Badge['category']) =>
  BADGES.filter((b) => b.category === cat)
