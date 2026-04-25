import { describe, expect, it } from 'vitest'
import { MU_EARTH, R_EARTH, R_GEO } from './constants'
import {
  coeToState,
  meanMotionFromA,
  periodFromA,
  stateToCoe,
} from './orbital-elements'
import { propagateState, solveKeplerE } from './kepler'
import { hohmann } from './hohmann'
import { cwPropagate } from './cw'
import { fspl, fsplSi, offAxisGain, resolveLink, dbw, deg2rad } from './link-budget'
import { add, norm, sub } from './vec'
import { ricBasisOf, ricToEci, relativePosInRic } from './frames'

// ---------- 1. COE <-> state round trip ----------

describe('orbital elements round-trip', () => {
  it('round-trips a typical inclined LEO', () => {
    const coe = {
      a: R_EARTH + 550_000,
      e: 0.001,
      i: (45 * Math.PI) / 180,
      raan: (30 * Math.PI) / 180,
      argp: (40 * Math.PI) / 180,
      nu: (80 * Math.PI) / 180,
    }
    const sv = coeToState(coe)
    const coe2 = stateToCoe(sv)
    expect(coe2.a).toBeCloseTo(coe.a, 0)
    expect(coe2.e).toBeCloseTo(coe.e, 6)
    expect(coe2.i).toBeCloseTo(coe.i, 8)
    expect(coe2.raan).toBeCloseTo(coe.raan, 6)
    expect(coe2.argp).toBeCloseTo(coe.argp, 4)
    expect(coe2.nu).toBeCloseTo(coe.nu, 6)
  })

  it('handles a circular equatorial orbit', () => {
    const coe = {
      a: R_GEO,
      e: 0,
      i: 0,
      raan: 0,
      argp: 0,
      nu: 1.2,
    }
    const sv = coeToState(coe)
    const coe2 = stateToCoe(sv)
    expect(coe2.a).toBeCloseTo(coe.a, 0)
    expect(coe2.e).toBeLessThan(1e-6)
    expect(coe2.nu).toBeCloseTo(coe.nu, 6)
  })
})

// ---------- 2. Keplerian propagation for one period returns to start ----------

describe('keplerian propagation', () => {
  it('circular orbit returns to its start after one period (tol 1e-3)', () => {
    const a = R_EARTH + 400_000
    const coe = { a, e: 0.0001, i: 0, raan: 0, argp: 0, nu: 0.5 }
    const sv0 = coeToState(coe)
    const T = periodFromA(a)
    const sv1 = propagateState(sv0, T)
    const dr = norm(sub(sv1.r, sv0.r)) / norm(sv0.r)
    const dv = norm(sub(sv1.v, sv0.v)) / norm(sv0.v)
    expect(dr).toBeLessThan(1e-3)
    expect(dv).toBeLessThan(1e-3)
  })

  it('eccentric orbit also returns after one period', () => {
    const a = R_EARTH + 2_000_000
    const coe = {
      a,
      e: 0.1,
      i: 0.3,
      raan: 0.2,
      argp: 0.4,
      nu: 1.0,
    }
    const sv0 = coeToState(coe)
    const T = periodFromA(a)
    const sv1 = propagateState(sv0, T)
    const dr = norm(sub(sv1.r, sv0.r)) / norm(sv0.r)
    expect(dr).toBeLessThan(1e-6)
  })

  it('Kepler equation solver matches identity (M = E - e sin E)', () => {
    for (const e of [0.0, 0.1, 0.3, 0.7, 0.95]) {
      for (let M = 0; M < 2 * Math.PI; M += 0.3) {
        const E = solveKeplerE(M, e)
        expect(Math.abs(E - e * Math.sin(E) - M)).toBeLessThan(1e-10)
      }
    }
  })
})

// ---------- 3. Hohmann transfer matches closed form (and numerical sanity) ----------

describe('hohmann transfer', () => {
  it('matches the classical formula for LEO 400 -> 500 km', () => {
    const r1 = R_EARTH + 400_000
    const r2 = R_EARTH + 500_000
    const result = hohmann(r1, r2)
    // Recompute the same formula here as the reference.
    const dv1Ref = Math.sqrt(MU_EARTH / r1) * (Math.sqrt((2 * r2) / (r1 + r2)) - 1)
    const dv2Ref = Math.sqrt(MU_EARTH / r2) * (1 - Math.sqrt((2 * r1) / (r1 + r2)))
    expect(result.dv1).toBeCloseTo(dv1Ref, 8)
    expect(result.dv2).toBeCloseTo(dv2Ref, 8)
    expect(result.totalDv).toBeGreaterThan(0)
    expect(result.totalDv).toBeCloseTo(Math.abs(dv1Ref) + Math.abs(dv2Ref), 8)
  })

  it('transfer time is half the period of the transfer ellipse', () => {
    const r1 = R_EARTH + 400_000
    const r2 = R_EARTH + 500_000
    const h = hohmann(r1, r2)
    expect(h.transferTime).toBeCloseTo(periodFromA(h.aTransfer) / 2, 6)
  })

  it('actually delivers chaser to the higher circular orbit in a two-impulse test', () => {
    const r1 = R_EARTH + 400_000
    const r2 = R_EARTH + 500_000
    const h = hohmann(r1, r2)
    const v1 = Math.sqrt(MU_EARTH / r1)
    // Start with circular state at r1.
    const sv0 = { r: [r1, 0, 0] as [number, number, number], v: [0, v1, 0] as [number, number, number] }
    // First burn prograde: v -> v1 + dv1 in the +y direction.
    const postBurn1 = { r: sv0.r, v: [0, v1 + h.dv1, 0] as [number, number, number] }
    // Propagate half a transfer period.
    const arrived = propagateState(postBurn1, h.transferTime)
    // Distance from Earth should match r2.
    expect(Math.abs(norm(arrived.r) - r2) / r2).toBeLessThan(1e-6)
    // Second burn should circularize at r2.
    const vAtR2 = Math.sqrt(MU_EARTH / r2)
    const speedArrived = norm(arrived.v)
    expect(Math.abs(speedArrived + h.dv2 - vAtR2) / vAtR2).toBeLessThan(1e-6)
  })
})

// ---------- 4. Clohessy-Wiltshire reproduces the along-track drift case ----------

describe('Clohessy-Wiltshire state transition', () => {
  // Classic textbook case: start at origin with a small along-track initial velocity.
  // Analytical solution per Vallado:
  //   x(t) = (2*ydot0/n) * (1 - cos(nt))
  //   y(t) = -3*ydot0*t + (4*ydot0/n) * sin(nt)
  // This is the "along-track drift with radial coupling" case.
  it('matches analytical along-track initial velocity solution', () => {
    const a = R_EARTH + 500_000
    const n = meanMotionFromA(a)
    const ydot0 = 1.0 // 1 m/s along-track
    const t = 600 // 10 minutes
    const s = cwPropagate({ r: [0, 0, 0], v: [0, ydot0, 0] }, n, t)
    const nt = n * t
    const xExp = (2 * ydot0 * (1 - Math.cos(nt))) / n
    const yExp = -3 * ydot0 * t + (4 * ydot0 * Math.sin(nt)) / n
    expect(s.r[0]).toBeCloseTo(xExp, 6)
    expect(s.r[1]).toBeCloseTo(yExp, 6)
    expect(s.r[2]).toBeCloseTo(0, 6)
  })

  it('free-flying co-orbiting offset stays stationary', () => {
    // A chaser at pure along-track offset with zero relative velocity should
    // not drift under CW (nominal co-orbital case; actually drifts slowly
    // in a real world due to second-order effects, but CW says stay put).
    // NOTE: CW does predict nontrivial motion for radial offsets, but not for
    // a pure along-track offset with zero relative velocity. Verify.
    const n = meanMotionFromA(R_EARTH + 500_000)
    const s = cwPropagate({ r: [0, 1000, 0], v: [0, 0, 0] }, n, 600)
    expect(s.r[0]).toBeCloseTo(0, 6)
    expect(s.r[1]).toBeCloseTo(1000, 6)
    expect(s.v[0]).toBeCloseTo(0, 6)
    expect(s.v[1]).toBeCloseTo(0, 6)
  })

  it('cross-track motion is simple harmonic', () => {
    const n = meanMotionFromA(R_EARTH + 500_000)
    const T = (2 * Math.PI) / n
    const s = cwPropagate({ r: [0, 0, 100], v: [0, 0, 0] }, n, T)
    expect(s.r[2]).toBeCloseTo(100, 6)
    const sHalf = cwPropagate({ r: [0, 0, 100], v: [0, 0, 0] }, n, T / 2)
    expect(sHalf.r[2]).toBeCloseTo(-100, 6)
  })
})

// ---------- 5. Link budget: FSPL at 10 GHz, 36,000 km ----------

describe('link budget — free space path loss', () => {
  it('FSPL at 10 GHz over 36,000 km is ~203.6 dB', () => {
    const L = fspl(10, 36_000)
    // Reference: 92.45 + 20*log10(10) + 20*log10(36000) = 92.45 + 20 + 91.13 = 203.58
    expect(L).toBeGreaterThan(203.3)
    expect(L).toBeLessThan(203.9)
  })

  it('SI-unit form agrees with log10 form at the same geometry', () => {
    const L1 = fspl(10, 36_000)
    const L2 = fsplSi(10e9, 36_000_000)
    expect(Math.abs(L1 - L2)).toBeLessThan(0.01)
  })

  it('off-axis gain falls off parabolically inside the main lobe', () => {
    const ant = { peakGainDb: 30, halfPowerBeamwidthRad: deg2rad(5) }
    expect(offAxisGain(ant, 0)).toBe(30)
    // at HPBW the parabolic drop should be -12 dB
    expect(offAxisGain(ant, deg2rad(5))).toBeCloseTo(18, 6)
    // beyond 2 * HPBW clamps to sidelobe (30 - 13 = 17)
    expect(offAxisGain(ant, deg2rad(30))).toBe(17)
  })

  it('resolveLink classifies jamming correctly', () => {
    // Minimal 1-D geometry: source, victim, jammer on a line.
    const victim = {
      posEci: [R_EARTH + 550_000, 0, 0] as [number, number, number],
      antenna: { peakGainDb: 30, halfPowerBeamwidthRad: deg2rad(5) },
      boresightEci: [0, 1, 0] as [number, number, number],
      txPowerDbw: 0,
    }
    // Source 200 km +y, aimed at victim.
    const source = {
      posEci: [R_EARTH + 550_000, 200_000, 0] as [number, number, number],
      antenna: { peakGainDb: 30, halfPowerBeamwidthRad: deg2rad(5) },
      boresightEci: [0, -1, 0] as [number, number, number],
      txPowerDbw: dbw(15), // 15 W
    }
    // No jammer -> nominal
    const r1 = resolveLink({ source, victim, fGHz: 8 })
    expect(r1.status).toBe('nominal')

    // Strong close high-gain jammer co-located with source: should deny victim link.
    const jammer = {
      posEci: [R_EARTH + 550_000, 200_000, 0] as [number, number, number],
      antenna: { peakGainDb: 30, halfPowerBeamwidthRad: deg2rad(5) },
      boresightEci: [0, -1, 0] as [number, number, number],
      txPowerDbw: dbw(1000), // 1 kW ERP equivalent
    }
    const r2 = resolveLink({ source, victim, jammer, fGHz: 8 })
    expect(r2.status).toBe('denied')

    // Source muted (emcon) -> denied
    const r3 = resolveLink({ source, victim, jammer, fGHz: 8, muted: true })
    expect(r3.status).toBe('denied')
  })
})

// ---------- 6. Sanity: frame conversions ----------

describe('ECI <-> RIC frame conversions', () => {
  it('radial unit vector lies on the R-bar axis in RIC', () => {
    const r: [number, number, number] = [7e6, 0, 0]
    const v: [number, number, number] = [0, 7.5e3, 0]
    const basis = ricBasisOf(r, v)
    expect(basis.xHat[0]).toBeCloseTo(1, 9)
    expect(basis.yHat[1]).toBeCloseTo(1, 9)
    expect(basis.zHat[2]).toBeCloseTo(1, 9)
  })

  it('RIC -> ECI -> RIC round-trips', () => {
    const r: [number, number, number] = [5e6, 5e6, 0]
    const v: [number, number, number] = [-5e3, 5e3, 0]
    const basis = ricBasisOf(r, v)
    const u: [number, number, number] = [100, 200, 50]
    const eci = ricToEci(u, basis)
    const back = relativePosInRic(add(r, eci), r, v)
    expect(back[0]).toBeCloseTo(u[0], 6)
    expect(back[1]).toBeCloseTo(u[1], 6)
    expect(back[2]).toBeCloseTo(u[2], 6)
  })
})
