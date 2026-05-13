// Cross-Domain Cues. Each cue ties an orbital RPO concept to its equivalent
// in another warfighting domain (air, cyber, EW) so cadets can transfer
// intuition. Rendered as small inline chips with a hover tooltip.
//
// v1.4 ships five cues: one per mission, plus one in the Learning Track
// engagement section.

export type Domain = 'air' | 'cyber' | 'ew' | 'land'

export interface CrossDomainCue {
  id: string
  domain: Domain
  spaceConcept: string // short label shown on the chip
  analogy: string // 1-2 sentence comparison shown in the tooltip
  citation?: string
}

export const CROSS_DOMAIN_CUES: CrossDomainCue[] = [
  {
    id: 'cdc_m1_terminal',
    domain: 'cyber',
    spaceConcept: 'Terminal closure',
    analogy:
      'A terminal-phase rendezvous is a TCP handshake at speed. Both sides must finish exchanging state before the window closes, or the session aborts and you have to back off and re-acquire.',
  },
  {
    id: 'cdc_m2_stationkeeping',
    domain: 'cyber',
    spaceConcept: 'Station-keeping',
    analogy:
      'Holding station next to a target is like maintaining a low-and-slow persistent presence on a network. Small periodic corrections cost less attention than a single big move and stay harder to attribute.',
  },
  {
    id: 'cdc_m3_jammer',
    domain: 'ew',
    spaceConcept: 'Jammer geometry',
    analogy:
      'An RF jammer in orbit obeys the same range-and-bearing math as an airborne SOJ. Closing in tightens the link budget for you and loosens it for them, but it also reveals your own emissions.',
  },
  {
    id: 'cdc_m4_handoff',
    domain: 'air',
    spaceConcept: 'Asset handoff',
    analogy:
      'Handing the target between two satellites mirrors handoff between a wingman and lead during a CAP turn. Both assets share a brief overlap window, then one disengages while the other carries the responsibility forward.',
  },
  {
    id: 'cdc_learning_cats',
    domain: 'air',
    spaceConcept: 'CATS / sun geometry',
    analogy:
      'CATS angle is the orbital version of a sun-position constraint on an attack run. Roll in with the sun behind you and your camera sees the target lit; let the sun get into your aperture and you are looking into glare.',
  },
]

export const cueById = Object.fromEntries(CROSS_DOMAIN_CUES.map((c) => [c.id, c]))

export const cuesByMission = (missionId: string | null): CrossDomainCue[] => {
  if (!missionId) return []
  if (missionId === 'm1_first_light') return [cueById['cdc_m1_terminal']!]
  if (missionId === 'm2_quiet_inspector') return [cueById['cdc_m2_stationkeeping']!]
  if (missionId === 'm3_contested_approach') return [cueById['cdc_m3_jammer']!]
  if (missionId === 'm4_handoff') return [cueById['cdc_m4_handoff']!]
  return []
}
