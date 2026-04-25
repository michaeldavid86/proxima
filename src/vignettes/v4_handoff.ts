// Mission 4 Watch script — Handoff. Two friendly assets bracket a target in
// GEO and coordinate a continuous-coverage observation, then execute a handoff.
// Teaching beats per v1.2 spec Section 6.5.
import type { VignetteScript } from './types'

export const vignette4: VignetteScript = {
  id: 'v4_handoff',
  missionId: 'm4_handoff',
  title: 'Handoff',
  subtitle: 'Two assets, one target, continuous coverage',
  totalDurationSec: 7200,
  intro: {
    title: 'Two is not just twice one',
    body:
      'A single inspector has to choose: stay, or leave. Coverage of a target is binary ' +
      'per asset. If you have two assets, you can build a bracket. One holds station ' +
      'while the other repositions, and the target is observed continuously through the ' +
      'transition. This vignette walks through the GSSAP-style geometry that played out ' +
      'in GEO in March 2026.',
  },
  outro: {
    title: 'A two-asset team is a different tool',
    body:
      'The March 2026 GSSAP bracketed observation of Shijian-29A and 29B showed exactly ' +
      "this choreography. USA 324 and USA 325 approached from opposite sides of the " +
      'Chinese pair, held station for four days, and then executed a handoff with one ' +
      'departing and the other closing in. Coverage was continuous. Budget was shared. ' +
      'Neither side created a public incident. Two assets doing what one cannot is the ' +
      "3-degree year lesson the Dean's spiral is pointing cadets toward.",
    citation: 'SpaceNews, COMSPOC public analyses, March 2026',
  },
  waypoints: [
    { t_sim: 0, kind: 'phase_marker', id: 'p-setup', phase: 'Setup' },
    {
      t_sim: 0,
      kind: 'narration',
      id: 'n-setup',
      narration: {
        title: 'Alpha east, Bravo west',
        body:
          'Alpha is 200 km east of the target on a slightly lower drift orbit. Bravo is ' +
          '200 km west, on a slightly higher drift orbit. Both are approaching the target ' +
          'passively. Neither has burned fuel yet.',
      },
    },
    {
      t_sim: 60,
      kind: 'teach_pause',
      id: 't-bracket',
      teach: {
        title: 'The bracket concept',
        body:
          'Two assets on opposite sides of a target give complementary viewing angles. ' +
          'That matters for target characterization, because the shape you see depends on ' +
          'the angle. It also matters operationally: with a bracket, either asset can move ' +
          'and the other covers the gap. A target cannot escape one inspector without ' +
          'closing on the other.',
        operationalNote:
          'The bracket forces the target into a choice: accept observation, or burn fuel ' +
          'to leave. Both options are legible to the observer team.',
      },
    },
    { t_sim: 120, kind: 'phase_marker', id: 'p-close', phase: 'Closure' },
    {
      t_sim: 180,
      kind: 'maneuver',
      id: 'm-alpha-close',
      maneuver: {
        craftId: 'alpha',
        direction: 'retrograde',
        dv_mps: 2,
        label: 'Alpha: brake to hold at 100 km east',
      },
    },
    {
      t_sim: 200,
      kind: 'narration',
      id: 'n-alpha-close',
      narration: {
        title: 'Alpha holds station',
        body:
          'Alpha executes a small retrograde burn. This raises its orbit toward target ' +
          'altitude and reduces drift rate. Alpha is now closing slowly, in the mode that ' +
          'reads as routine inspection rather than hostile approach.',
        operationalNote: 'Cost: 2 m/s from Alpha budget.',
      },
    },
    {
      t_sim: 1800,
      kind: 'maneuver',
      id: 'm-bravo-close',
      maneuver: {
        craftId: 'bravo',
        direction: 'prograde',
        dv_mps: 2,
        label: 'Bravo: brake to hold at 100 km west',
      },
    },
    {
      t_sim: 1820,
      kind: 'narration',
      id: 'n-bravo-close',
      narration: {
        title: 'Bravo holds station',
        body:
          'Bravo fires prograde. Bravo was on a higher drift orbit, so prograde lowers ' +
          'it toward target altitude and slows its relative rate. Bravo now holds at about ' +
          '100 km west of the target. The bracket is formed.',
        operationalNote: 'Cost: 2 m/s from Bravo budget.',
      },
    },
    {
      t_sim: 1900,
      kind: 'teach_pause',
      id: 't-handoff',
      teach: {
        title: 'Handoff mechanics',
        body:
          'Both assets are now in sensor range of the target. Coverage is redundant. If ' +
          'either has to move, the other carries the coverage. That is the handoff. The ' +
          'assets trade responsibilities without creating a gap.',
      },
    },
    { t_sim: 1920, kind: 'phase_marker', id: 'p-hold', phase: 'Hold' },
    {
      t_sim: 2000,
      kind: 'narration',
      id: 'n-hold',
      narration: {
        title: 'Dual coverage',
        body:
          'For the next interval both assets track the target. Characterization is happening ' +
          'from two angles simultaneously, which reveals more than any single inspector ' +
          'could see. Attribution stays low because neither asset is closing aggressively.',
      },
    },
    { t_sim: 4200, kind: 'phase_marker', id: 'p-handoff', phase: 'Handoff' },
    {
      t_sim: 4200,
      kind: 'maneuver',
      id: 'm-bravo-depart',
      maneuver: {
        craftId: 'bravo',
        direction: 'retrograde',
        dv_mps: 3,
        label: 'Bravo: depart westward',
      },
    },
    {
      t_sim: 4220,
      kind: 'narration',
      id: 'n-bravo-depart',
      narration: {
        title: 'Bravo departs',
        body:
          'Bravo executes a retrograde burn to drift back west, away from the target. ' +
          'Bravo is now opening range. Coverage would be broken if Alpha were not in range. ' +
          'Alpha is.',
        operationalNote: 'Bravo total: 5 m/s.',
      },
    },
    {
      t_sim: 4240,
      kind: 'maneuver',
      id: 'm-alpha-close-in',
      maneuver: {
        craftId: 'alpha',
        direction: 'retrograde',
        dv_mps: 2,
        label: 'Alpha: close to 63 km',
      },
    },
    {
      t_sim: 4260,
      kind: 'narration',
      id: 'n-alpha-close-in',
      narration: {
        title: 'Alpha closes in',
        body:
          'At the same moment Bravo begins departing, Alpha fires a small retrograde to ' +
          'close range on the target. This mirrors the USA 324 maneuver in March 2026: the ' +
          'incoming asset takes over coverage as the outgoing asset pulls off.',
      },
    },
    {
      t_sim: 5400,
      kind: 'teach_pause',
      id: 't-implications',
      teach: {
        title: 'Operational implications',
        body:
          'A two-asset team achieves what a single inspector cannot: continuous observation ' +
          'across maneuvers. Each asset consumes roughly half of what a single-asset ' +
          'continuous-coverage mission would require. And the bracket geometry itself is ' +
          'a signal to the target and to anyone watching that you can hold station ' +
          'indefinitely, even under attempted evasion.',
        operationalNote: 'Combined cost so far: 9 m/s across both assets.',
      },
    },
    { t_sim: 5500, kind: 'phase_marker', id: 'p-steady', phase: 'Steady State' },
    {
      t_sim: 6000,
      kind: 'narration',
      id: 'n-steady',
      narration: {
        title: 'Steady state',
        body:
          'Alpha continues to hold the target from the close-in position. Bravo has drifted ' +
          'back to a standby station to the west. If the target maneuvers, both assets have ' +
          'delta-V to respond. The bracket is the operating mode.',
      },
    },
  ],
  recommendedActions: {
    Setup: [],
    Closure: [],
    Hold: ['inspection_collect', 'threat_characterization'],
    Handoff: [],
    'Steady State': [],
  },
  actionReasons: {
    inspection_collect: 'Run a collect while both assets have the target in range.',
    threat_characterization: 'Record emissions from both angles.',
  },
  learningObjectives: [
    'Explain why a two-asset bracket provides continuous coverage during maneuvers.',
    'Describe the handoff sequence: one asset closes as the other departs.',
    'Estimate the delta-V savings of shared coverage versus single-asset persistent observation.',
  ],
}
