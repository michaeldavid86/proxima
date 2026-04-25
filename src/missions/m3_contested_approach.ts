import { R_EARTH } from '../physics/constants'
import type { Mission } from './types'

const aPlayer = R_EARTH + 550_000
const aAdversary = R_EARTH + 500_000
const inc = (45 * Math.PI) / 180

// Adversary phased 5 degrees behind player in true anomaly.
const adversaryPhase = -(5 * Math.PI) / 180

export const mission3: Mission = {
  id: 'm3_contested_approach',
  name: 'Contested Approach',
  brief:
    'Your on-orbit sensor asset has detected an adversary inspector closing from below. ' +
    'Protect the mission. Maintain link to ground. The adversary may attempt uplink jam ' +
    'as it closes — the defender toolbox includes emcon, point-away, and frequency agility.',
  teachingTargets: [
    'Link-budget intuition (FSPL, antenna gain, J/S)',
    'Defender playbook: emcon vs point-away vs freq-hop',
    'Directional antenna geometry',
    'Defensive maneuvering to break approach geometry',
  ],
  realWorldCallout: {
    text:
      'Reflects the operational pattern of Russian Luch / Olymp shadowing commercial and ' +
      'military GEO satellites, and the Space Force fielding of Meadowlands and Remote ' +
      'Modular Terminal jammers in 2025 as reversible counterspace options.',
    cite: [
      { label: 'CSIS Space Threat Assessment', url: 'https://aerospace.csis.org/space-threat-assessment/' },
      { label: 'Secure World Foundation', url: 'https://swfound.org/' },
      { label: 'Bloomberg: Meadowlands', url: 'https://www.bloomberg.com/' },
    ],
  },
  spacecraft: [
    {
      id: 'chaser',
      name: 'PROXIMA-03',
      side: 'blue',
      regime: 'LEO',
      coe: { a: aPlayer, e: 0, i: inc, raan: 0, argp: 0, nu: 0 },
      dryMass: 1000,
      propellantMass: 400,
      isp: 230,
      power: 1200,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 200 }],
      emitters: [
        {
          id: 'dl',
          role: 'downlink',
          txPowerW: 15,
          fGHz: 8.2,
          antenna: { peakGainDb: 30, halfPowerBeamwidthRad: (5 * Math.PI) / 180 },
          active: true,
        },
      ],
      // Downlink antenna default pointed nadir-ish (toward -R-bar) for ground coverage.
      boresightRic: [-1, 0, 0],
      hardened: false,
    },
    {
      id: 'adversary',
      name: 'INSPECTOR-R',
      side: 'red',
      regime: 'LEO',
      coe: { a: aAdversary, e: 0, i: inc, raan: 0, argp: 0, nu: adversaryPhase },
      dryMass: 900,
      propellantMass: 300,
      isp: 220,
      power: 900,
      sensors: [{ id: 'opt', kind: 'optical', maxRangeKm: 100 }],
      emitters: [
        {
          id: 'jammer',
          role: 'jammer',
          txPowerW: 10,
          // Hit the uplink band used by ground-station -> player.
          fGHz: 8,
          antenna: { peakGainDb: 10, halfPowerBeamwidthRad: (30 * Math.PI) / 180 },
          active: false,
        },
      ],
      boresightRic: [1, 0, 0],
    },
  ],
  playerId: 'chaser',
  targetId: 'adversary',
  adversaryScript: [
    // Script: at +300s, adversary executes a modest prograde burn to raise apogee
    // and begin closing. A tuning constant — magnitude chosen to drift into
    // proximity around 40-60 minutes into the run.
    { kind: 'maneuver', atTimeSec: 300, shipId: 'adversary', dvRic: [0, 6, 0] },
    // Turn on jammer when close (handled also by adaptive logic in turn.ts)
    { kind: 'jam', atTimeSec: 1800, shipId: 'adversary', target: 'victim-uplink' },
  ],
  groundStation: {
    id: 'gs',
    name: 'RAVEN-OPS',
    // Fixed ECI position beneath the orbital plane at equator, 6378+0 km radius.
    // Picking the +x direction gives periodic line-of-sight.
    posEci: [R_EARTH, 0, 0],
    txPowerW: 20_000,
    fGHz: 8,
    antenna: { peakGainDb: 45, halfPowerBeamwidthRad: (2 * Math.PI) / 180 },
  },
  success: {
    kind: 'maintainLinkDepart',
    // 60 min
    missionDurationSec: 60 * 60,
    departRangeKm: 50,
  },
  failure: {
    collisionRangeM: 20,
    collisionRelSpeedMs: 5,
    linkDeniedMaxSec: 10 * 60,
  },
  maxDurationSec: 60 * 60,
  initialViewMode: 'map',
  linkFGHz: 8,
  initialGuidance:
    'Adversary trails you by 5° on a lower orbit. Expect a prograde burn around T+5 min. ' +
    "If they close, consider emcon, pointing your antenna away, or a small defensive burn.",
}
