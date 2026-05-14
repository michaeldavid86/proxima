// Resolve a CraftSnapshot into a 3D ECI position + a COE describing the orbit
// it sits on. Pure presentation math; no physics propagation.
//
// Position resolution order:
//   1. coeOverride present → use it (merging with anchor defaults)
//   2. phaseDeg present    → anchor orbit, true anomaly += phaseDeg
//   3. ricKm present       → anchor reference state + RIC offset (in km)
//   4. x_km / y_km legacy  → treat as ricKm = [y_km, x_km, 0]
//   5. fallback            → anchor at its nominal true anomaly
import { R_EARTH } from '../physics/constants'
import { coeToState, type COE } from '../physics/orbital-elements'
import { ricBasisOf, ricToEci } from '../physics/frames'
import type { Vec3 } from '../physics/vec'
import type { AnchorOrbit, CraftSnapshot } from './types'

const DEG = Math.PI / 180

export const anchorToCoe = (a: AnchorOrbit): COE => ({
  a: R_EARTH + a.altitudeKm * 1000,
  e: a.eccentricity ?? 0,
  i: a.inclinationDeg * DEG,
  raan: (a.raanDeg ?? 0) * DEG,
  argp: (a.argpDeg ?? 0) * DEG,
  nu: (a.trueAnomalyDeg ?? 0) * DEG,
})

export interface ResolvedCraft {
  rEci: Vec3
  vEci: Vec3
  coe: COE // the orbit this craft sits on (for drawing the orbit ring)
}

export const resolveCraft = (
  craft: CraftSnapshot,
  anchor: AnchorOrbit,
): ResolvedCraft => {
  const anchorCoe = anchorToCoe(anchor)

  // (1) Explicit COE override → own orbit.
  if (craft.coeOverride) {
    const o = craft.coeOverride
    const coe: COE = {
      a: o.altitudeKm !== undefined ? R_EARTH + o.altitudeKm * 1000 : anchorCoe.a,
      e: o.eccentricity ?? anchorCoe.e,
      i: o.inclinationDeg !== undefined ? o.inclinationDeg * DEG : anchorCoe.i,
      raan: o.raanDeg !== undefined ? o.raanDeg * DEG : anchorCoe.raan,
      argp: o.argpDeg !== undefined ? o.argpDeg * DEG : anchorCoe.argp,
      nu: o.trueAnomalyDeg !== undefined ? o.trueAnomalyDeg * DEG : anchorCoe.nu,
    }
    const sv = coeToState(coe)
    return { rEci: sv.r, vEci: sv.v, coe }
  }

  // (2) Phase offset along the anchor orbit → same orbit, different nu.
  if (craft.phaseDeg !== undefined) {
    const coe: COE = { ...anchorCoe, nu: anchorCoe.nu + craft.phaseDeg * DEG }
    const sv = coeToState(coe)
    return { rEci: sv.r, vEci: sv.v, coe }
  }

  // (3) RIC offset from the anchor → anchor state + offset (km), drawn on
  //     the anchor orbit ring.
  const anchorSv = coeToState(anchorCoe)
  let ricKm: [number, number, number] | null = null
  if (craft.ricKm) ricKm = craft.ricKm
  else if (craft.x_km !== undefined || craft.y_km !== undefined) {
    // Legacy: x = in-track, y = radial.
    ricKm = [craft.y_km ?? 0, craft.x_km ?? 0, 0]
  }

  if (!ricKm) {
    return { rEci: anchorSv.r, vEci: anchorSv.v, coe: anchorCoe }
  }

  const basis = ricBasisOf(anchorSv.r, anchorSv.v)
  const offsetEci = ricToEci(
    [ricKm[0] * 1000, ricKm[1] * 1000, ricKm[2] * 1000],
    basis,
  )
  const rEci: Vec3 = [
    anchorSv.r[0] + offsetEci[0],
    anchorSv.r[1] + offsetEci[1],
    anchorSv.r[2] + offsetEci[2],
  ]
  // Velocity in the RIC-offset case is approximate (same as anchor). Good
  // enough for orientation since the orbit ring drawn is anchorCoe.
  return { rEci, vEci: anchorSv.v, coe: anchorCoe }
}

// Lerp helper for animating between two craft positions.
export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
