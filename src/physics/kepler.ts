// Two-body Keplerian propagator via mean-anomaly advance and Kepler's equation.
// Reference: Curtis, Orbital Mechanics for Engineering Students, Ch. 3.
import { MU_EARTH } from './constants'
import { coeToState, stateToCoe, type COE, type StateVector } from './orbital-elements'

const TWO_PI = 2 * Math.PI

const wrap2pi = (x: number): number => {
  let y = x % TWO_PI
  if (y < 0) y += TWO_PI
  return y
}

// Newton-Raphson solve for eccentric anomaly from Kepler's equation M = E - e sin E.
export const solveKeplerE = (M: number, e: number, tol = 1e-12, maxIter = 80): number => {
  const Mw = wrap2pi(M)
  // Good starter per Vallado.
  let E = e < 0.8 ? Mw : Math.PI
  for (let k = 0; k < maxIter; k++) {
    const f = E - e * Math.sin(E) - Mw
    const fp = 1 - e * Math.cos(E)
    const dE = f / fp
    E -= dE
    if (Math.abs(dE) < tol) break
  }
  return E
}

export const eToNu = (E: number, e: number): number => {
  // Use atan2 formulation to avoid quadrant ambiguity.
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E))
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E))
  return wrap2pi(Math.atan2(sinNu, cosNu))
}

export const nuToE = (nu: number, e: number): number => {
  const sinE = (Math.sqrt(1 - e * e) * Math.sin(nu)) / (1 + e * Math.cos(nu))
  const cosE = (e + Math.cos(nu)) / (1 + e * Math.cos(nu))
  return wrap2pi(Math.atan2(sinE, cosE))
}

// Propagate COEs by dt seconds. Only nu changes under unperturbed two-body motion.
export const propagateCoe = (coe: COE, dt: number, mu: number = MU_EARTH): COE => {
  const { a, e } = coe
  const n = Math.sqrt(mu / (a * a * a))
  const E0 = nuToE(coe.nu, e)
  const M0 = E0 - e * Math.sin(E0)
  const M = wrap2pi(M0 + n * dt)
  const E = solveKeplerE(M, e)
  const nu = eToNu(E, e)
  return { ...coe, nu }
}

// Convenience: propagate a state vector by dt seconds.
export const propagateState = (sv: StateVector, dt: number, mu: number = MU_EARTH): StateVector => {
  const coe = stateToCoe(sv, mu)
  const advanced = propagateCoe(coe, dt, mu)
  return coeToState(advanced, mu)
}
