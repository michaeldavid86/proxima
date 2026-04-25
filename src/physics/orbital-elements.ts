// Classical orbital element <-> Cartesian state vector conversions.
// Reference: Vallado, Fundamentals of Astrodynamics, Ch. 2.
import { MU_EARTH, EPS } from './constants'
import { cross, dot, norm, sub, type Vec3 } from './vec'

export interface COE {
  a: number // semi-major axis (m)
  e: number // eccentricity
  i: number // inclination (rad)
  raan: number // right ascension of ascending node (rad)
  argp: number // argument of periapsis (rad)
  nu: number // true anomaly (rad)
}

export interface StateVector {
  r: Vec3 // position (m) in ECI
  v: Vec3 // velocity (m/s) in ECI
}

const TWO_PI = 2 * Math.PI

const wrap2pi = (x: number): number => {
  let y = x % TWO_PI
  if (y < 0) y += TWO_PI
  return y
}

export const stateToCoe = (sv: StateVector, mu: number = MU_EARTH): COE => {
  const { r, v } = sv
  const rmag = norm(r)
  const vmag = norm(v)

  const h = cross(r, v)
  const hmag = norm(h)

  // Node vector: K x h, where K = [0,0,1].
  const n: Vec3 = [-h[1], h[0], 0]
  const nmag = norm(n)

  // Eccentricity vector.
  const coef1 = vmag * vmag - mu / rmag
  const rdotv = dot(r, v)
  const eVec: Vec3 = [
    (coef1 * r[0] - rdotv * v[0]) / mu,
    (coef1 * r[1] - rdotv * v[1]) / mu,
    (coef1 * r[2] - rdotv * v[2]) / mu,
  ]
  const e = norm(eVec)

  // Specific energy -> semi-major axis (m). Negative for ellipse.
  const energy = (vmag * vmag) / 2 - mu / rmag
  const a = Math.abs(energy) < EPS ? Infinity : -mu / (2 * energy)

  // Inclination in [0, pi].
  const i = Math.acos(Math.max(-1, Math.min(1, h[2] / hmag)))

  // RAAN.
  let raan = 0
  if (nmag > EPS) {
    raan = Math.acos(Math.max(-1, Math.min(1, n[0] / nmag)))
    if (n[1] < 0) raan = TWO_PI - raan
  }

  // Argument of periapsis.
  let argp = 0
  if (nmag > EPS && e > EPS) {
    argp = Math.acos(Math.max(-1, Math.min(1, dot(n, eVec) / (nmag * e))))
    if (eVec[2] < 0) argp = TWO_PI - argp
  } else if (e > EPS) {
    // Equatorial non-circular: use longitude of periapsis instead of argp.
    argp = Math.acos(Math.max(-1, Math.min(1, eVec[0] / e)))
    if (eVec[1] < 0) argp = TWO_PI - argp
  }

  // True anomaly.
  let nu = 0
  if (e > EPS) {
    nu = Math.acos(Math.max(-1, Math.min(1, dot(eVec, r) / (e * rmag))))
    if (rdotv < 0) nu = TWO_PI - nu
  } else if (nmag > EPS) {
    // Circular inclined: argument of latitude stands in for nu.
    nu = Math.acos(Math.max(-1, Math.min(1, dot(n, r) / (nmag * rmag))))
    if (r[2] < 0) nu = TWO_PI - nu
  } else {
    // Circular equatorial: true longitude.
    nu = Math.acos(Math.max(-1, Math.min(1, r[0] / rmag)))
    if (r[1] < 0) nu = TWO_PI - nu
  }

  return { a, e, i, raan: wrap2pi(raan), argp: wrap2pi(argp), nu: wrap2pi(nu) }
}

export const coeToState = (coe: COE, mu: number = MU_EARTH): StateVector => {
  const { a, e, i, raan, argp, nu } = coe
  const p = a * (1 - e * e)
  const cosNu = Math.cos(nu)
  const sinNu = Math.sin(nu)
  const rPqw: Vec3 = [(p * cosNu) / (1 + e * cosNu), (p * sinNu) / (1 + e * cosNu), 0]
  const sqrtMuP = Math.sqrt(mu / p)
  const vPqw: Vec3 = [-sqrtMuP * sinNu, sqrtMuP * (e + cosNu), 0]

  // Rotate perifocal -> ECI by 3-1-3 Euler sequence (raan, i, argp).
  const cO = Math.cos(raan)
  const sO = Math.sin(raan)
  const ci = Math.cos(i)
  const si = Math.sin(i)
  const cw = Math.cos(argp)
  const sw = Math.sin(argp)

  const rotate = (u: Vec3): Vec3 => {
    // R = R3(-raan) * R1(-i) * R3(-argp) applied to column vector.
    const x1 = cw * u[0] - sw * u[1]
    const y1 = sw * u[0] + cw * u[1]
    const z1 = u[2]
    const x2 = x1
    const y2 = ci * y1 - si * z1
    const z2 = si * y1 + ci * z1
    const x3 = cO * x2 - sO * y2
    const y3 = sO * x2 + cO * y2
    const z3 = z2
    return [x3, y3, z3]
  }

  return { r: rotate(rPqw), v: rotate(vPqw) }
}

// Useful: orbital period of a closed orbit.
export const periodFromA = (a: number, mu: number = MU_EARTH): number =>
  2 * Math.PI * Math.sqrt((a * a * a) / mu)

// Useful: mean motion.
export const meanMotionFromA = (a: number, mu: number = MU_EARTH): number =>
  Math.sqrt(mu / (a * a * a))

// Range between two ECI positions.
export const rangeBetween = (a: Vec3, b: Vec3): number => norm(sub(a, b))
