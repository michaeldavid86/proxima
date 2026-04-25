// Mission 3 Watch script — Contested Approach (defender role).
// Teaching beats: Friis link budget, J/S ratio, defender playbook, Luch/Olymp
// and Meadowlands real-world callout.
import type { VignetteScript } from './types'

export const vignette3: VignetteScript = {
  id: 'v3_contested_approach',
  missionId: 'm3_contested_approach',
  title: 'Contested Approach',
  subtitle: 'Scripted defender playbook',
  totalDurationSec: 3600,
  intro: {
    title: 'You are the defender',
    body:
      'An adversary inspector is closing on your LEO sensor platform from below ' +
      'and behind. Your mission: keep your downlink alive to the ground and end ' +
      'the window with more than 50 km of separation. The adversary will light ' +
      'up a jammer when they get close. You have three tools: EMCON, point ' +
      'antenna away, frequency agility. Each has a cost. Choose which to use ' +
      'and when.',
  },
  outro: {
    title: 'The defender playbook',
    body:
      'Three pillars, all in the Space Force Warfighting Framework. Deny the ' +
      "adversary's collect (EMCON). Preserve your own link (point away, " +
      'frequency agility). Maneuver to break geometry if you have the delta-V. ' +
      'This is the unclassified shape of what operators actually train to in ' +
      'exercises like Space Flag.',
    citation:
      'CSIS Space Threat Assessment; Secure World Foundation; Bloomberg reporting on Meadowlands',
  },
  waypoints: [
    { t_sim: 0, kind: 'phase_marker', id: 'p-open', phase: 'Opening' },
    {
      t_sim: 0,
      kind: 'narration',
      id: 'n-open',
      narration: {
        title: 'Quiet for now',
        body:
          'Adversary is 5 degrees behind you on a 50 km lower orbit. Angular ' +
          'rate difference puts them on a slow closing trajectory. No jamming ' +
          'yet. Your downlink to the ground station is nominal.',
      },
    },
    {
      t_sim: 60,
      kind: 'teach_pause',
      id: 't-link-budget',
      teach: {
        title: 'Link budget and J/S',
        body:
          'Every RF link is a balance of signal and noise. Free-space path loss ' +
          'scales with range squared and frequency squared. A close jammer is ' +
          'geometrically favored: closer means less path loss, means more power ' +
          'at the victim receiver. The metric that matters is Jam-to-Signal ' +
          'ratio. Below 0 dB, nominal. Between 0 and 10 dB, degraded. Above 10 ' +
          'dB, denied.',
        diagram: 'link_budget',
        citation: 'Friis (1946), ITU-R antenna pattern recommendations',
      },
    },
    {
      t_sim: 120,
      kind: 'action',
      id: 'a-char',
      action: { craftId: 'chaser', actionId: 'threat_characterization' },
    },
    {
      t_sim: 125,
      kind: 'narration',
      id: 'n-char',
      narration: {
        title: 'Characterize the threat',
        body:
          'Turn sensors on the inspector. Log their emitter signatures. Even if ' +
          'they are not radiating yet, their RCS, orbital elements, and attitude ' +
          'go into the book.',
      },
    },
    { t_sim: 300, kind: 'phase_marker', id: 'p-contested', phase: 'Contested' },
    {
      t_sim: 1200,
      kind: 'narration',
      id: 'n-closure',
      narration: {
        title: 'Adversary inside 30 km',
        body:
          'The inspector has closed to within 30 km. Their jammer lights up — ' +
          'visible in the telemetry panel as a link-status downgrade. J/S is ' +
          'climbing. Time to pick a countermeasure.',
      },
    },
    {
      t_sim: 1260,
      kind: 'teach_pause',
      id: 't-countermeasures',
      teach: {
        title: 'Three tools, three tradeoffs',
        body:
          'EMCON mutes your transmitter: denies them your emissions and denies ' +
          'you your own downlink. Point antenna away: rolls the receive lobe ' +
          'off the jammer line, giving you about 15 dB of rejection but costing ' +
          'you some signal. Frequency agility: the adversary has to re-acquire, ' +
          "a one-turn penalty, but your own link is degraded while you're " +
          'jumping bands. Pick one. Each has a cost.',
      },
    },
    {
      t_sim: 1320,
      kind: 'action',
      id: 'a-pointaway',
      action: { craftId: 'chaser', actionId: 'point_away' },
    },
    {
      t_sim: 1325,
      kind: 'narration',
      id: 'n-pointaway',
      narration: {
        title: 'Point antenna away',
        body:
          'Antenna rolled off the jammer line. You lose a few dB of ground ' +
          'signal but cut the jammer contribution by about 15 dB. Link recovers ' +
          'to degraded, usable.',
        operationalNote: 'No delta-V cost. Trade is made in antenna pointing budget.',
      },
    },
    {
      t_sim: 1800,
      kind: 'action',
      id: 'a-freqhop',
      action: { craftId: 'chaser', actionId: 'frequency_agility' },
    },
    {
      t_sim: 1810,
      kind: 'narration',
      id: 'n-freqhop',
      narration: {
        title: 'Frequency agility',
        body:
          'Jump to a new band. Adversary has to reacquire. For one turn their ' +
          'jam is penalized. Chain this with point_away and you can hold the ' +
          'link even when the adversary is very close.',
      },
    },
    { t_sim: 2400, kind: 'phase_marker', id: 'p-break', phase: 'Break' },
    {
      t_sim: 2400,
      kind: 'teach_pause',
      id: 't-maneuver',
      teach: {
        title: 'Break geometry',
        body:
          'If you have delta-V to spend, the best countermeasure is often to ' +
          'separate. A radial burn changes your orbit shape quickly. An along-' +
          'track burn drifts the adversary off V-bar over the next half orbit. ' +
          'This is expensive (real m/s) but it resets the whole J/S problem.',
      },
    },
    {
      t_sim: 2460,
      kind: 'maneuver',
      id: 'm-break',
      maneuver: {
        craftId: 'chaser',
        direction: 'radial_out',
        dv_mps: 3.0,
        label: 'Defensive radial burn to break geometry',
      },
    },
    {
      t_sim: 2465,
      kind: 'narration',
      id: 'n-break-result',
      narration: {
        title: 'Separation growing',
        body:
          'Your radial burn raises apogee and changes your in-track phasing. ' +
          'Range opens. The adversary has to reposition, which they cannot do ' +
          'without showing intent to everyone watching.',
        operationalNote: 'Cost: 3 m/s, about one month of operational life.',
      },
    },
  ],
  recommendedActions: {
    Opening: ['threat_characterization'],
    Contested: ['emcon', 'point_away', 'frequency_agility'],
    Break: ['defensive_maneuver'],
  },
  actionReasons: {
    threat_characterization: 'Log the inspector profile before they start radiating.',
    emcon: 'Mute your transmitter to deny the adversary your emissions.',
    point_away: 'Roll the antenna off the jammer line; cheap and reversible.',
    frequency_agility: 'Force the adversary to re-acquire; one turn of relief.',
    defensive_maneuver: 'Expensive but decisive: change the geometry entirely.',
  },
  learningObjectives: [
    'Define J/S ratio and the nominal / degraded / denied thresholds.',
    "Describe the defender's three-pillar playbook: deny, preserve, maneuver.",
    'Explain why a close jammer dominates a far ground station in the Friis equation.',
  ],
}
