// Mission 4 — Handoff. GSSAP-style two-asset bracketed observation.
// Player commands Alpha and Bravo in GEO. Mission objective: maintain at least
// 85% observation coverage of the target over 4 hours sim time by coordinating
// the two assets.
import { R_GEO } from '../physics/constants'
import { periodFromA } from '../physics/orbital-elements'
import type { Mission } from './types'

// Alpha starts 200 km EAST of the target on a slightly lower drift orbit.
// Bravo starts 200 km WEST of the target on a slightly lower drift orbit.
// Drift direction at GEO: lower orbit = shorter period = angular motion in the
// prograde direction relative to the stationary target. So both assets close
// on the target naturally. Alpha drifts westward toward target; Bravo
// drifts... also westward, away from the target. We correct by placing Bravo
// on a slightly HIGHER drift orbit so it drifts the opposite way and
// approaches the target from the west.
const aPlayerLow = R_GEO - 30_000
const aPlayerHigh = R_GEO + 30_000
const aTarget = R_GEO
const phasing200km = 200_000 / R_GEO // radians

export const mission4: Mission = {
  id: 'm4_handoff',
  name: 'Handoff',
  brief:
    'Two friendly inspectors are positioned on opposite sides of a target in GEO. ' +
    'Your job is to coordinate them so that at least one asset has continuous ' +
    'sensor coverage of the target for the full four-hour window. Each asset ' +
    'burns from its own propellant tank. Switching between assets is one key ' +
    'press. Waste either and you lose coverage.',
  teachingTargets: [
    'Multi-asset command and control',
    'Bracket geometry for continuous coverage',
    'Handoff mechanics: who holds, who moves, when',
    'Asset-level budget discipline',
  ],
  realWorldCallout: {
    text:
      'Inspired by the March 2026 coordinated observation of Shijian-29A and 29B ' +
      'by USA 324 and USA 325. The operational idea is the same: two friendly ' +
      'assets on opposite sides of a target give complementary angles and ' +
      'enable handoffs without loss of coverage.',
    cite: [
      { label: 'SpaceNews GSSAP coverage' },
      { label: 'Secure World Foundation, Global Counterspace Capabilities' },
      { label: 'COMSPOC public analysis, March 2026' },
    ],
  },
  spacecraft: [
    {
      id: 'alpha',
      name: 'ALPHA',
      side: 'blue',
      regime: 'GEO',
      coe: { a: aPlayerLow, e: 0, i: 0, raan: 0, argp: 0, nu: -phasing200km },
      dryMass: 1200,
      propellantMass: 250,
      isp: 230,
      power: 900,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 150 }],
      boresightRic: [-1, 0, 0],
    },
    {
      id: 'bravo',
      name: 'BRAVO',
      side: 'blue', // also blue; rendering uses a distinct tint based on assetIndex
      regime: 'GEO',
      coe: { a: aPlayerHigh, e: 0, i: 0, raan: 0, argp: 0, nu: phasing200km },
      dryMass: 1200,
      propellantMass: 250,
      isp: 230,
      power: 900,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 150 }],
      boresightRic: [-1, 0, 0],
    },
    {
      id: 'target',
      name: 'TARGET',
      side: 'neutral',
      regime: 'GEO',
      coe: { a: aTarget, e: 0, i: 0, raan: 0, argp: 0, nu: 0 },
      dryMass: 2000,
      propellantMass: 300,
      isp: 300,
      power: 1500,
      boresightRic: [-1, 0, 0],
    },
  ],
  playerId: 'alpha',
  targetId: 'target',
  assets: ['alpha', 'bravo'],
  success: {
    kind: 'observationCoverage',
    coveragePctRequired: 85,
    missionDurationSec: 4 * 3600,
    lowWaterFailPct: 50,
  },
  failure: {
    attributionMax: 100,
    // propellant exhaustion on either asset handled in scoring
  },
  maxDurationSec: 4 * 3600 + periodFromA(R_GEO) * 0.1,
  initialViewMode: 'map',
  vignetteId: 'v4_handoff',
  linkFGHz: 8,
  initialGuidance:
    'Use A and B to switch between Alpha and Bravo. Plan burns that balance the two ' +
    'assets so one is always in range of the target. Overcommitting either asset ' +
    'will break coverage when they have to move.',
}
