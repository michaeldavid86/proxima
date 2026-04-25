// Mission 2 Watch script — Quiet Inspector (GEO).
// Teaching beats: GEO delta-V cost, attribution risk, patient V-bar closure,
// GSSAP / Shijian-29 real-world callout.
import type { VignetteScript } from './types'

export const vignette2: VignetteScript = {
  id: 'v2_quiet_inspector',
  missionId: 'm2_quiet_inspector',
  title: 'Quiet Inspector',
  subtitle: 'Scripted GEO inspection',
  totalDurationSec: 9000,
  intro: {
    title: 'GEO is expensive',
    body:
      'An unidentified object has appeared west of a friendly GEO SATCOM. You ' +
      'need to inspect it. GEO orbits are enormous: a 500 km position change ' +
      'can cost 10 to 20 m/s of delta-V, versus a few m/s in LEO. Every ' +
      'maneuver here reads in the attribution ledger of anyone watching.',
  },
  outro: {
    title: 'Inspection complete',
    body:
      'This pattern mirrors the U.S. GSSAP program, six spacecraft operational ' +
      'in near-GEO as of early 2026, and the March 2026 bracketed observation ' +
      "of China's Shijian-29A and 29B by USA 324 and USA 325. Patient " +
      'closure, V-bar station-keeping, collect, patient departure. Every ' +
      'burn is observed. Every burn communicates intent.',
    citation: 'Secure World Foundation, RPO Fact Sheet. SpaceNews GSSAP coverage.',
  },
  waypoints: [
    { t_sim: 0, kind: 'phase_marker', id: 'p-closing', phase: 'Closing' },
    {
      t_sim: 0,
      kind: 'narration',
      id: 'n-intro',
      narration: {
        title: 'Standing off, drifting in',
        body:
          'You start 500 km east of the target, on a slightly lower drift orbit. ' +
          'The altitude difference produces a natural eastward drift toward the ' +
          'target. No burn needed yet. Just wait.',
      },
    },
    {
      t_sim: 60,
      kind: 'teach_pause',
      id: 't-attribution',
      teach: {
        title: 'Attribution is a resource',
        body:
          'Rapid closure reads as hostile intent. A fast, high-delta-V approach ' +
          'is readable from the ground as "this operator is in a hurry, ' +
          'probably up to something." Patient closure, minimum maneuvers, ' +
          'predictable drift: that profile reads as routine inspection. You ' +
          'are trying to preserve operational flexibility, not just get close.',
        diagram: 'attribution_ladder',
      },
    },
    {
      t_sim: 900,
      kind: 'narration',
      id: 'n-drift',
      narration: {
        title: 'Drift closure in progress',
        body:
          'You are closing on passive drift. No burns. This is the attribution-' +
          'cheapest approach possible.',
      },
    },
    { t_sim: 3000, kind: 'view_change', id: 'v-prox', viewChange: 'prox' },
    { t_sim: 3000, kind: 'phase_marker', id: 'p-station', phase: 'Station-keep' },
    {
      t_sim: 3000,
      kind: 'narration',
      id: 'n-vbar',
      narration: {
        title: 'V-bar approach geometry',
        body:
          'You are inside a few hundred kilometers now. Switch to the proximity ' +
          'view. A V-bar hold at 20 km is the standard inspection stance: close ' +
          'enough for a good collect, far enough to avoid misinterpretation, ' +
          'and passive-safe if thrusters fail.',
        diagram: 'vbar_approach',
      },
    },
    {
      t_sim: 3600,
      kind: 'maneuver',
      id: 'm-brake',
      maneuver: {
        craftId: 'chaser',
        direction: 'vbar_plus',
        dv_mps: 1.0,
        label: 'V-bar braking to hold at 20 km',
      },
    },
    {
      t_sim: 3620,
      kind: 'narration',
      id: 'n-collect',
      narration: {
        title: 'Collect window',
        body:
          'Running inspection collect. Sensor on target, integrating. The link ' +
          'to ground carries the take back home. Duration for a real GSSAP ' +
          'pass is typically measured in orbits, not minutes.',
      },
    },
    {
      t_sim: 3630,
      kind: 'action',
      id: 'a-collect',
      action: { craftId: 'chaser', actionId: 'inspection_collect' },
    },
    {
      t_sim: 5000,
      kind: 'teach_pause',
      id: 't-ladder',
      teach: {
        title: 'The attribution ladder',
        body:
          'Routine station-keeping reads as routine. A slow, deliberate V-bar ' +
          'closure reads as "interest". A rapid closure inside 20 km reads as ' +
          '"concern". Fast, unannounced, close-in maneuvers read as threat. ' +
          'A well-run inspection never climbs past the first two rungs.',
        diagram: 'attribution_ladder',
        citation: 'Secure World Foundation, CSIS Space Threat Assessment',
      },
    },
    { t_sim: 5020, kind: 'phase_marker', id: 'p-depart', phase: 'Departure' },
    {
      t_sim: 5200,
      kind: 'maneuver',
      id: 'm-depart',
      maneuver: {
        craftId: 'chaser',
        direction: 'vbar_minus',
        dv_mps: 1.2,
        label: 'Depart on V-bar',
      },
    },
    {
      t_sim: 5220,
      kind: 'narration',
      id: 'n-depart',
      narration: {
        title: 'Leaving is half the mission',
        body:
          'A sharp, aggressive departure also reads as threat. Small V-bar push ' +
          'away, same as you came in. Your full inspection profile — close, ' +
          'hold, collect, depart — now lives in the ledger of whoever was ' +
          'watching.',
        operationalNote: 'Cost for the full pass: about 2 m/s of delta-V.',
      },
    },
  ],
  recommendedActions: {
    Closing: [],
    'Station-keep': ['inspection_collect', 'threat_characterization'],
    Departure: [],
  },
  actionReasons: {
    inspection_collect: 'Primary collect window while holding V-bar station.',
    threat_characterization: 'Log the unknown object emissions while sensors can reach it.',
  },
  learningObjectives: [
    'Name at least two reasons GEO RPO is more delta-V expensive than LEO.',
    'Explain why patient closure lowers attribution.',
    'Describe a V-bar station-keeping profile and why it is passive-safe.',
  ],
}
