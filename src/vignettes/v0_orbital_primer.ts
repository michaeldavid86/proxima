// Mission 0 — Orbital Primer. Verbatim script from the v1.1 spec Section 7.
// This is the cadet's first exposure to PROXIMA. Every line is intentional.
import type { VignetteScript } from './types'

export const vignette0: VignetteScript = {
  id: 'v0_primer',
  missionId: 'm0_primer',
  title: 'Orbital Primer',
  subtitle: 'Delta-V, Hohmann transfers, and the RIC frame',
  totalDurationSec: 8400,
  intro: {
    title: 'Welcome to PROXIMA',
    body:
      'Before we run a rendezvous mission, we need three ideas firmly in hand: ' +
      'delta-V as a finite fuel budget, the Hohmann transfer as the cheapest ' +
      'way to change orbits, and the RIC frame as the way operators actually ' +
      'think about relative motion. This primer takes about five minutes. You ' +
      'can speed it up, pause, or skip ahead at any time.',
  },
  outro: {
    title: 'Primer complete',
    body:
      'You now have the three ideas you need for the rest of PROXIMA. ' +
      'Delta-V is finite and translates to spacecraft life. Hohmann ' +
      'transfers change altitude cheaply with two burns. The RIC frame is ' +
      "the operator's mental model for everything that happens close to a " +
      'target. Missions 1 through 3 apply these ideas to rendezvous, ' +
      'proximity operations, and contested approaches. Continue to the ' +
      'mission menu when you are ready.',
    citation: 'Space Force, Space Warfighting: A Framework for Planners, April 2025',
  },
  waypoints: [
    {
      t_sim: 0,
      kind: 'phase_marker',
      id: 'p-setup',
      phase: 'Setup',
    },
    {
      t_sim: 0,
      kind: 'narration',
      id: 'n-setup',
      narration: {
        title: 'Two spacecraft in LEO',
        body:
          'Alpha (cyan) and Bravo (amber) are both in a 400 km circular orbit. ' +
          'Same altitude, same speed, same orbital period of 92.6 minutes. Bravo ' +
          'is 10 km ahead of Alpha along the orbit. Nothing is moving relative to ' +
          'anything else. Yet.',
      },
    },
    {
      t_sim: 10,
      kind: 'teach_pause',
      id: 't-dv',
      teach: {
        title: 'What is delta-V?',
        body:
          'Delta-V is the total change in velocity a spacecraft can produce with ' +
          'its propellant before running dry. It is measured in meters per second. ' +
          'Think of it as the fuel gauge for everything a satellite will ever do: ' +
          'station-keeping, maneuvers, deorbit. Alpha begins this primer with ' +
          '300 m/s of delta-V. At a typical LEO station-keeping cost of 30 m/s ' +
          'per year to fight drag, that budget equals roughly 10 years of ' +
          'operational life if Alpha does nothing else.',
        operationalNote:
          'Every meter per second you spend buys you some operational capability ' +
          'and costs you some future life. Operators are always balancing the two.',
      },
    },
    {
      t_sim: 10,
      kind: 'phase_marker',
      id: 'p-hohmann',
      phase: 'Hohmann Transfer',
    },
    {
      t_sim: 15,
      kind: 'maneuver',
      id: 'm-hohmann-1',
      maneuver: {
        craftId: 'alpha',
        direction: 'prograde',
        dv_mps: 20,
        label: 'First Hohmann burn: raise apogee',
      },
    },
    {
      t_sim: 15,
      kind: 'narration',
      id: 'n-prograde',
      narration: {
        title: 'Prograde burn',
        body:
          'Alpha thrusts in the direction of motion. This does not simply make ' +
          'Alpha faster in a linear sense. Instead, it raises the opposite side ' +
          "of Alpha's orbit, creating an ellipse. Watch the orbit shape change.",
      },
    },
    {
      t_sim: 50,
      kind: 'teach_pause',
      id: 't-after-burn-1',
      teach: {
        title: 'What just happened?',
        body:
          "The 20 m/s prograde burn raised Alpha's apoapsis from 400 km to " +
          "roughly 473 km. The orbit is now elliptical. Alpha's periapsis (low " +
          'point) is still 400 km, but the far side is higher. Alpha will now ' +
          'take longer to come back around, which means Bravo will pull ahead.',
        operationalNote: 'Cost so far: 20 m/s, about 8 months of operational life.',
        diagram: 'hohmann',
      },
    },
    {
      t_sim: 2800,
      kind: 'maneuver',
      id: 'm-hohmann-2',
      maneuver: {
        craftId: 'alpha',
        direction: 'prograde',
        dv_mps: 19,
        label: 'Second Hohmann burn: circularize at 473 km',
      },
    },
    {
      t_sim: 2800,
      kind: 'narration',
      id: 'n-circ-up',
      narration: {
        title: 'Circularization burn',
        body:
          'Alpha arrives at apoapsis half an orbital period later. A second ' +
          'prograde burn raises periapsis up to match, leaving Alpha in a ' +
          'circular orbit at the new altitude. Two prograde burns at the ' +
          'ellipse extremes: this is a Hohmann transfer, and it is the lowest-' +
          'fuel way to change circular altitude.',
      },
    },
    {
      t_sim: 2830,
      kind: 'teach_pause',
      id: 't-hohmann-summary',
      teach: {
        title: 'Hohmann summary',
        body:
          'Total delta-V spent: 39 m/s. Total time: roughly 46 minutes, half the ' +
          'original orbital period. Alpha is now 73 km above Bravo in a higher, ' +
          "slower orbit. Because Alpha's orbit is slower, Bravo will appear to " +
          "drift forward from Alpha's perspective. We will look at that in the " +
          'RIC frame next.',
        operationalNote: 'Total life cost so far: about 16 months.',
        citation: 'Vallado, Fundamentals of Astrodynamics, Ch. 6',
      },
    },
    {
      t_sim: 2830,
      kind: 'view_change',
      id: 'v-to-prox',
      viewChange: 'prox',
    },
    {
      t_sim: 2830,
      kind: 'phase_marker',
      id: 'p-ric',
      phase: 'RIC Frame',
    },
    {
      t_sim: 2840,
      kind: 'narration',
      id: 'n-ric-intro',
      narration: {
        title: 'The RIC frame',
        body:
          "We switch to a frame of reference centered on Bravo. V-bar points " +
          "along Bravo's velocity vector (right). R-bar points radially outward " +
          'from Earth (up). This is how operators actually think during ' +
          'rendezvous: not in absolute coordinates, but relative to the target. ' +
          'Alpha now shows up as a single point to the upper-right of the origin, ' +
          'drifting as time passes.',
      },
    },
    {
      t_sim: 2900,
      kind: 'teach_pause',
      id: 't-ric-counter',
      teach: {
        title: 'Why RIC is counterintuitive',
        body:
          'In the RIC frame, raising your orbit (positive R-bar) makes you ' +
          'drift backward along V-bar, because you are now in a slower orbit. ' +
          'Lowering your orbit makes you drift forward. To catch up to a target ' +
          'ahead of you, you drop lower (not higher). To hold station next to a ' +
          'target, you match orbits exactly. Every orbital rendezvous in the ' +
          'history of spaceflight has played out on this kind of diagram.',
        diagram: 'ric',
      },
    },
    {
      t_sim: 5500,
      kind: 'maneuver',
      id: 'm-return-1',
      maneuver: {
        craftId: 'alpha',
        direction: 'retrograde',
        dv_mps: 19,
        label: "Lower back to Bravo's altitude",
      },
    },
    {
      t_sim: 5500,
      kind: 'narration',
      id: 'n-return',
      narration: {
        title: 'Return to co-orbit',
        body:
          'A retrograde burn starts Alpha back down. After a second matching ' +
          'burn at the new periapsis, Alpha is back in Bravo orbit, 73 km of ' +
          'relative motion erased. Total round-trip cost: 78 m/s, about 2.6 ' +
          'years of operational life.',
      },
    },
    {
      t_sim: 8300,
      kind: 'maneuver',
      id: 'm-return-2',
      maneuver: {
        craftId: 'alpha',
        direction: 'retrograde',
        dv_mps: 20,
        label: 'Circularize at 400 km',
      },
    },
    {
      t_sim: 8330,
      kind: 'teach_pause',
      id: 't-budget-real',
      teach: {
        title: 'The budget is real',
        body:
          'Alpha started with 300 m/s. A simple up-and-back excursion consumed ' +
          "78 m/s, or 26% of the spacecraft's operational life. This is why " +
          'real operators plan rendezvous trajectories to minimize delta-V: ' +
          'every burn trades future life for present capability. The Hohmann ' +
          'transfer is not a mathematical curiosity. It is how you preserve ' +
          'mission.',
        operationalNote: 'Remaining delta-V: 222 m/s, about 7.4 years of life.',
      },
    },
  ],
  recommendedActions: {},
  actionReasons: {},
  learningObjectives: [
    'Define delta-V and explain why it represents finite operational life.',
    'Describe the two-burn structure of a Hohmann transfer.',
    'Orient the RIC frame (V-bar, R-bar, cross-track) relative to a reference spacecraft.',
    'Predict the RIC drift direction of a spacecraft at a higher versus lower orbit.',
  ],
}
