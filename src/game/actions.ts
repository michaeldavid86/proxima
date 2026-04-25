// Tactical action catalog. Data-driven; the effects are resolved in turn.ts.
// Cost fields are for UI display; attribution and power cost are applied per tick
// while the effect is active (see turn.ts).

export type ActionCategory =
  | 'orbital'
  | 'orbital_def'
  | 'ew_off'
  | 'ew_def'
  | 'cyber'
  | 'passive_def'
  | 'active_def'

export interface ActionDef {
  id: string
  name: string
  category: ActionCategory
  description: string
  // Per-turn effect instead of per-second, for tuning simplicity.
  cost: {
    powerW?: number // instantaneous power draw while active
    attributionDelta?: number // added once when initiated
    attributionPerMin?: number // continuous while active
    oncePerMission?: boolean
    dvBudgetHintMs?: number // for UI hinting only
  }
  duration?: 'one-shot' | 'untilCancelled' | 'oneTurn'
  disabled?: boolean // for doctrinal-completeness placeholders
}

export const actionsCatalog: ActionDef[] = [
  // --- Orbital warfare (offensive) ---
  {
    id: 'close_approach',
    name: 'Close Approach',
    category: 'orbital',
    description:
      'Commit to reducing range to the target. Uses your planned maneuver (Map or Prox) as the close-in burn and flags the intent in the attribution ledger.',
    cost: { attributionDelta: 20, dvBudgetHintMs: 10 },
    duration: 'one-shot',
  },
  {
    id: 'station_keep_offset',
    name: 'Station-Keep',
    category: 'orbital',
    description:
      'Hold a specified V-bar or R-bar offset. Small continuous delta-v cost, modest attribution.',
    cost: { attributionPerMin: 0.5, dvBudgetHintMs: 0.1 },
    duration: 'untilCancelled',
  },
  {
    id: 'inspection_collect',
    name: 'Inspection Collect',
    category: 'orbital',
    description:
      'Point sensor at target and integrate. Requires range under sensor limit and a nominal link.',
    cost: { powerW: 80, attributionDelta: 5 },
    duration: 'oneTurn',
  },
  {
    id: 'orbital_strike',
    name: 'Orbital Strike',
    category: 'orbital',
    description: 'Kinetic effects are out of scope for this trainer. Left here for doctrinal completeness.',
    cost: {},
    disabled: true,
  },
  // --- Orbital warfare (defensive) ---
  {
    id: 'defensive_maneuver',
    name: 'Defensive Maneuver',
    category: 'orbital_def',
    description:
      'Burn to break approach geometry — break track by changing your relative motion. Arm the Prox panel and commit a radial or anti-radial burn.',
    cost: { dvBudgetHintMs: 2 },
    duration: 'one-shot',
  },
  {
    id: 'escort_posture',
    name: 'Escort Posture',
    category: 'orbital_def',
    description:
      'Move to a shielding position between the adversary and a high-value asset. Ties the asset up; delta-v continuous.',
    cost: { attributionPerMin: 0.2 },
    duration: 'untilCancelled',
  },
  {
    id: 'threat_warning',
    name: 'Call Threat Warning',
    category: 'orbital_def',
    description: 'Alert the rest of the force. Logs the event — no mechanical effect in v1.',
    cost: {},
    duration: 'one-shot',
  },
  // --- EW (offensive) ---
  {
    id: 'uplink_jam',
    name: 'Uplink Jam',
    category: 'ew_off',
    description:
      'Radiate noise on the adversary uplink frequency. Raises J/S at the victim receiver; high attribution.',
    cost: { powerW: 120, attributionDelta: 30, attributionPerMin: 2 },
    duration: 'untilCancelled',
  },
  {
    id: 'downlink_jam',
    name: 'Downlink Jam',
    category: 'ew_off',
    description:
      'Radiate on the adversary downlink frequency at the downstream receiver. High attribution.',
    cost: { powerW: 120, attributionDelta: 30, attributionPerMin: 2 },
    duration: 'untilCancelled',
  },
  {
    id: 'spoof',
    name: 'Spoof',
    category: 'ew_off',
    description:
      "Inject a false signal. In v1: the adversary's next commanded action misfires on a roll weighted by the current J/S margin.",
    cost: { powerW: 60, attributionDelta: 15 },
    duration: 'oneTurn',
  },
  // --- EW (defensive) ---
  {
    id: 'emcon',
    name: 'EMCON (Go Silent)',
    category: 'ew_def',
    description:
      'Transmitter off. Denies the adversary your emissions and, in Mission 3, denies your own downlink to the ground.',
    cost: {},
    duration: 'untilCancelled',
  },
  {
    id: 'point_away',
    name: 'Point Antenna Away',
    category: 'ew_def',
    description:
      'Rotate the directional antenna off-axis from the adversary. Reduces their jammer coupling and your own link gain. 1 turn to slew.',
    cost: { powerW: 20 },
    duration: 'untilCancelled',
  },
  {
    id: 'frequency_agility',
    name: 'Frequency Agility',
    category: 'ew_def',
    description:
      "Hop to a new band. 1 turn of degraded own-link while re-acquiring; the jammer loses effectiveness for one turn.",
    cost: { powerW: 10 },
    duration: 'oneTurn',
  },
  // --- Cyber ---
  {
    id: 'network_probe',
    name: 'Network Probe',
    category: 'cyber',
    description: "Gain intel. Reveals the adversary's next commanded action with probability.",
    cost: { attributionDelta: 5 },
    duration: 'one-shot',
  },
  {
    id: 'link_disruption',
    name: 'Link Disruption',
    category: 'cyber',
    description: "Attempt a cyber effect on the adversary link. Once per mission. Degrades for N turns on a dice roll.",
    cost: { attributionDelta: 25, oncePerMission: true },
    duration: 'one-shot',
  },
  // --- Passive defense ---
  {
    id: 'hardening',
    name: 'Hardening Posture',
    category: 'passive_def',
    description:
      'Accept a thermal / pointing penalty for a shielded posture. Resists directed-energy effects.',
    cost: { powerW: 10 },
    duration: 'untilCancelled',
  },
  {
    id: 'dispersal',
    name: 'Dispersal',
    category: 'passive_def',
    description: 'Requires multiple friendlies. Disabled for single-ship missions.',
    cost: {},
    disabled: true,
  },
  {
    id: 'decoy',
    name: 'Decoy Deploy',
    category: 'passive_def',
    description: 'Single-use. Reduces adversary sensor fix probability and gains a small attribution discount.',
    cost: { oncePerMission: true },
    duration: 'one-shot',
  },
  // --- Active defense ---
  {
    id: 'threat_characterization',
    name: 'Threat Characterization',
    category: 'active_def',
    description:
      "Turn sensors on the adversary. Logs their emitter signatures and reveals their loadout.",
    cost: { powerW: 60 },
    duration: 'oneTurn',
  },
]

export const actionsById: Record<string, ActionDef> = Object.fromEntries(
  actionsCatalog.map((a) => [a.id, a]),
)

export const categoryLabel = (c: ActionCategory): string => {
  switch (c) {
    case 'orbital':
      return 'Orbital (Off)'
    case 'orbital_def':
      return 'Orbital (Def)'
    case 'ew_off':
      return 'EM Warfare (Off)'
    case 'ew_def':
      return 'EM Warfare (Def)'
    case 'cyber':
      return 'Cyber'
    case 'passive_def':
      return 'Passive Def'
    case 'active_def':
      return 'Active Def'
  }
}
