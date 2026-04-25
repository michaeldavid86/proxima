// Mission 0 — Orbital Primer. A Watch-only vignette. The mission data here is
// a lightweight stage for the vignette waypoints to run on: two coorbital
// spacecraft in a 400 km LEO circular orbit with alpha trailing bravo by 10 km.
import { R_EARTH } from '../physics/constants'
import { periodFromA } from '../physics/orbital-elements'
import type { Mission } from './types'

const aOrb = R_EARTH + 400_000

// 10 km arc along a circular orbit corresponds to 10,000 / aOrb radians.
const trailingRad = 10_000 / aOrb

export const mission0: Mission = {
  id: 'm0_primer',
  name: 'Orbital Primer',
  brief:
    'A five-minute cold-open vignette that establishes delta-V, Hohmann ' +
    'transfers, and the RIC frame before you fly any other mission.',
  teachingTargets: [
    'Delta-V as a finite operational-life budget',
    'Hohmann transfer: two prograde burns change altitude',
    'RIC frame and the "lower is faster" drift rule',
  ],
  realWorldCallout: {
    text:
      'These three ideas are the foundation of every rendezvous mission ' +
      'flown, from Gemini VII/VI-A in 1965 to every ISS resupply and every ' +
      'public counterspace RPO.',
    cite: [
      {
        label: 'Vallado, Fundamentals of Astrodynamics',
      },
      {
        label: 'Space Force, Space Warfighting: A Framework for Planners (April 2025)',
      },
    ],
  },
  spacecraft: [
    {
      id: 'alpha',
      name: 'ALPHA',
      side: 'blue',
      regime: 'LEO',
      coe: { a: aOrb, e: 0, i: 0, raan: 0, argp: 0, nu: -trailingRad },
      // Tuned so the initial delta-V budget comes out near 300 m/s for the primer narration.
      dryMass: 850,
      propellantMass: 125,
      isp: 220,
      power: 400,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 500 }],
      boresightRic: [0, 1, 0],
    },
    {
      id: 'bravo',
      name: 'BRAVO',
      side: 'neutral',
      regime: 'LEO',
      coe: { a: aOrb, e: 0, i: 0, raan: 0, argp: 0, nu: 0 },
      dryMass: 12,
      propellantMass: 0,
      isp: 1,
      power: 10,
      boresightRic: [0, 1, 0],
    },
  ],
  playerId: 'alpha',
  targetId: 'bravo',
  success: {
    // The primer does not have a pass/fail condition; scoring is satisfied by
    // playing the vignette to completion.
    kind: 'holdStation',
    rangeKmMax: 1000, // effectively unreachable, we never end on this path
    relSpeedMsMax: 1000,
    holdSeconds: 999_999,
  },
  failure: {},
  maxDurationSec: 2 * periodFromA(aOrb),
  initialViewMode: 'map',
  vignetteId: 'v0_primer',
  watchOnly: true,
  initialGuidance:
    'This is a guided tour. Press Play to begin; pause any time; skip ahead to the next teaching moment with the forward icon.',
}
