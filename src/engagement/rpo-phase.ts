// Derive the current RPO phase from orbital geometry. The four canonical
// phases of rendezvous (Vallado §6.6, Curtis Ch. 7) are:
//   1. Plane Matching — match inclination + RAAN
//   2. Shape & Align — match semi-major axis + eccentricity + argp
//   3. Phasing — close the true-anomaly gap
//   4. Close-In — within proximity range, fly relative
import type { COE } from '../physics/orbital-elements'

export type RpoPhase = 'plane_matching' | 'shape_align' | 'phasing' | 'close_in'

const DEG = Math.PI / 180

export const derivePhase = (
  chase: COE,
  target: COE,
  rangeM: number,
): RpoPhase => {
  if (rangeM < 100_000) return 'close_in'
  const iDiff = Math.abs(chase.i - target.i)
  const raanDiff = Math.abs(chase.raan - target.raan)
  if (iDiff > 0.5 * DEG || raanDiff > 0.5 * DEG) return 'plane_matching'
  const aDiff = Math.abs(chase.a - target.a)
  if (aDiff > 5_000 || Math.abs(chase.e - target.e) > 0.005) return 'shape_align'
  return 'phasing'
}

export const phaseLabel = (p: RpoPhase): string =>
  ({
    plane_matching: 'Plane Matching',
    shape_align: 'Shape & Align',
    phasing: 'Phasing',
    close_in: 'Close-In',
  })[p]

export const phaseDescription = (p: RpoPhase): string =>
  ({
    plane_matching:
      'Match inclination and RAAN with the target. Plane changes are the most expensive part of any rendezvous.',
    shape_align:
      'Match orbit shape: semi-major axis (altitude), eccentricity, and argument of perigee.',
    phasing:
      'Close the true-anomaly gap. Drop to a lower phasing orbit to overtake, or raise to fall behind.',
    close_in:
      'Within proximity range. Fly relative motion in the RIC frame, watch the CATS angle and 10-to-1 rule.',
  })[p]

export const PHASES_ORDER: RpoPhase[] = [
  'plane_matching',
  'shape_align',
  'phasing',
  'close_in',
]
