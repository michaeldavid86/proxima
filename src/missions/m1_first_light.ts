import { R_EARTH } from '../physics/constants'
import { periodFromA } from '../physics/orbital-elements'
import type { Mission } from './types'

const aPlayer = R_EARTH + 400_000
const aTarget = R_EARTH + 420_000

export const mission1: Mission = {
  id: 'm1_first_light',
  name: 'First Light',
  brief:
    'A friendly experimental cubesat has drifted off its test orbit after a thruster fault. ' +
    'Rendezvous with it, close to within 1 km, and hold station for 5 minutes. ' +
    'Mind your delta-v budget.',
  teachingTargets: [
    'Hohmann transfer to raise or lower orbit',
    'Phasing — lower-and-overtake vs raise-and-wait',
    'RIC frame interpretation at close range',
    'Terminal station-keeping',
  ],
  realWorldCallout: {
    text:
      'This mirrors the Gemini VII / VI-A rendezvous in December 1965, the first ' +
      'crewed rendezvous in space. Gemini demonstrated that two vehicles could be ' +
      'controlled into formation — a prerequisite for every lunar and ISS mission that ' +
      'followed.',
    cite: [
      { label: 'NASA History: Gemini VII / VI-A', url: 'https://www.nasa.gov/mission/gemini-vi-a-vii/' },
    ],
  },
  spacecraft: [
    {
      id: 'chaser',
      name: 'PROXIMA-01',
      side: 'blue',
      regime: 'LEO',
      coe: { a: aPlayer, e: 0, i: 0, raan: 0, argp: 0, nu: 0 },
      dryMass: 800,
      propellantMass: 200,
      isp: 220,
      power: 400,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 500 }],
      boresightRic: [0, 1, 0],
    },
    {
      id: 'target',
      name: 'CUBESAT-7',
      side: 'neutral',
      regime: 'LEO',
      coe: {
        a: aTarget,
        e: 0,
        i: 0,
        raan: 0,
        argp: 0,
        nu: (60 * Math.PI) / 180,
      },
      dryMass: 12,
      propellantMass: 0,
      isp: 1,
      power: 10,
      boresightRic: [0, 1, 0],
    },
  ],
  playerId: 'chaser',
  targetId: 'target',
  success: {
    kind: 'holdStation',
    rangeKmMax: 1,
    relSpeedMsMax: 2,
    holdSeconds: 300,
  },
  failure: {
    collisionRangeM: 10,
    collisionRelSpeedMs: 5,
  },
  // ~4 orbits worth to give enough time to set up and execute a Hohmann + phasing.
  maxDurationSec: 4 * periodFromA(aPlayer),
  initialViewMode: 'map',
  initialGuidance:
    'Target leads you by 60° on a slightly higher orbit. A small prograde burn now will ' +
    'raise your orbit to close the phasing gap; circularize when your radius matches the target.',
}
