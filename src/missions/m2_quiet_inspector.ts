import { MU_EARTH, R_GEO } from '../physics/constants'
import { periodFromA } from '../physics/orbital-elements'
import type { Mission } from './types'

// Player starts ~500 km east of target in longitude, i.e. on a drift orbit
// slightly lower than GEO so it drifts eastward relative to the target.
// We capture this by placing the player on a slightly smaller semi-major axis
// and phased accordingly. 500 km of linear distance at GEO radius corresponds
// to an angular offset of 500e3 / R_GEO radians.
const phasingOffsetRad = 500_000 / R_GEO
const aPlayer = R_GEO - 30_000 // small drift orbit
const aTarget = R_GEO

export const mission2: Mission = {
  id: 'm2_quiet_inspector',
  name: 'Quiet Inspector',
  brief:
    'An unidentified object has appeared 200 km west of a friendly GEO SATCOM asset. ' +
    'Approach for characterization. Minimize attribution: avoid rapid approach profiles ' +
    'that would signal hostile intent. You want a patient V-bar hold at 20 km for two hours ' +
    'of sim time, then collect and depart.',
  teachingTargets: [
    'GEO station-keeping',
    'Patient long-baseline V-bar approach',
    'Attribution risk management',
    'Inspection collect trade-off',
  ],
  realWorldCallout: {
    text:
      "Inspired by the U.S. GSSAP program (6 satellites operational as of early 2026) " +
      "and the March 2026 bracketed observation of China's Shijian-29A/B by USA 324 " +
      'and USA 325.',
    cite: [
      { label: 'Secure World Foundation: RPO Fact Sheet', url: 'https://swfound.org/resource-library/' },
      { label: 'SpaceNews coverage of GSSAP', url: 'https://spacenews.com/tag/gssap/' },
    ],
  },
  spacecraft: [
    {
      id: 'chaser',
      name: 'PROXIMA-02',
      side: 'blue',
      regime: 'GEO',
      coe: { a: aPlayer, e: 0, i: 0, raan: 0, argp: 0, nu: -phasingOffsetRad },
      dryMass: 1200,
      propellantMass: 300,
      isp: 230,
      power: 800,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 100 }],
      emitters: [
        {
          id: 'dl',
          role: 'downlink',
          txPowerW: 20,
          fGHz: 8,
          antenna: { peakGainDb: 30, halfPowerBeamwidthRad: (5 * Math.PI) / 180 },
          active: true,
        },
      ],
      boresightRic: [-1, 0, 0],
    },
    {
      id: 'target',
      name: 'SATCOM-ALPHA',
      side: 'neutral',
      regime: 'GEO',
      coe: { a: aTarget, e: 0, i: 0, raan: 0, argp: 0, nu: 0 },
      dryMass: 3800,
      propellantMass: 500,
      isp: 300,
      power: 1200,
      boresightRic: [-1, 0, 0],
    },
  ],
  playerId: 'chaser',
  targetId: 'target',
  success: {
    kind: 'inspectionProfile',
    vbarKm: 20,
    vbarToleranceKm: 4,
    // 2 hours
    holdSeconds: 2 * 3600,
    attributionMax: 70,
    departRangeKm: 100,
  },
  failure: {
    attributionMax: 100,
    rangeKmMin: 5,
  },
  maxDurationSec: 3 * periodFromA(R_GEO, MU_EARTH),
  initialViewMode: 'map',
  initialGuidance:
    'Drift in from the east at under 0.05 m/s relative. Use small V-bar braking burns. ' +
    'Rapid closures spike attribution.',
  // v1.4 engagement-consideration overlay (advisory only).
  // SATCOM antenna boresight points along -R-bar (toward Earth, nadir). The
  // keep-out cone shown here is the operationally sensitive region where an
  // approaching inspector would interfere with the target's downlink beam.
  keepZones: [
    {
      id: 'antenna_beam',
      type: 'keep_out',
      label: 'Antenna boresight',
      description:
        'Entering the target SATCOM antenna boresight cone risks RF interference and reveals your presence.',
      shape: {
        kind: 'cone',
        apexRic: [0, 0, 0],
        axis: [-1, 0, 0],
        halfAngleDeg: 10,
        rangeM: 30_000,
      },
    },
  ],
}
