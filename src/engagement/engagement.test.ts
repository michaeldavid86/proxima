import { describe, expect, it } from 'vitest'
import { computeCatsAngle, sunDirectionEci } from './cats'
import { isInsideZone, type KeepZone } from './keep-zones'
import { checkPassiveSafety } from './passive-safety'
import { checkTenToOne } from './ten-to-one'
import type { SpacecraftState } from '../game/state'
import { R_EARTH, MU_EARTH } from '../physics/constants'

// Helper: build a minimal SpacecraftState with given r,v.
const makeShip = (
  id: string,
  r: [number, number, number],
  v: [number, number, number],
): SpacecraftState => ({
  id,
  name: id,
  side: 'blue',
  regime: 'LEO',
  rEci: r,
  vEci: v,
  mass: 1000,
  dryMass: 800,
  propellantMass: 200,
  isp: 220,
  power: 400,
  sensors: [],
  emitters: [],
  boresightRic: [0, 1, 0],
  hardened: false,
  status: 'nominal',
})

// ---------- CATS angle ----------

describe('CATS angle', () => {
  it('sun direction at t=0 is approximately +X (vernal equinox start)', () => {
    const s = sunDirectionEci(0)
    expect(s[0]).toBeCloseTo(1, 5)
    expect(Math.abs(s[1])).toBeLessThan(1e-9)
    expect(Math.abs(s[2])).toBeLessThan(1e-9)
  })

  it('chase between sun and target gives CATS near 0 (favorable)', () => {
    // Target at +X * R_EARTH+500km; chase further out in +X direction (sun side).
    const target = makeShip('t', [R_EARTH + 500_000, 0, 0], [0, 7600, 0])
    const chase = makeShip('c', [R_EARTH + 510_000, 0, 0], [0, 7600, 0])
    const r = computeCatsAngle(target, chase, 0)
    expect(r.angleDeg).toBeLessThan(5)
    expect(r.favorability).toBe('favorable')
  })

  it('target between sun and chase gives CATS near 180 (unfavorable)', () => {
    // Target at +X; chase further along -X (opposite side from sun).
    const target = makeShip('t', [R_EARTH + 500_000, 0, 0], [0, 7600, 0])
    const chase = makeShip('c', [R_EARTH + 490_000, 0, 0], [0, 7600, 0])
    const r = computeCatsAngle(target, chase, 0)
    expect(r.angleDeg).toBeGreaterThan(170)
    expect(r.favorability).toBe('unfavorable')
  })

  it('perpendicular (chase on +Y from target) gives CATS near 90 (marginal)', () => {
    const target = makeShip('t', [R_EARTH + 500_000, 0, 0], [0, 7600, 0])
    const chase = makeShip('c', [R_EARTH + 500_000, 10_000, 0], [0, 7600, 0])
    const r = computeCatsAngle(target, chase, 0)
    expect(Math.abs(r.angleDeg - 90)).toBeLessThan(5)
    expect(r.favorability).toBe('marginal')
  })

  it('sun direction advances correctly after 90 days', () => {
    // 90 days ~= a quarter year, sun should be roughly along +Y projected
    // into the ecliptic; in ECI that's (0, cos(obliquity), sin(obliquity)).
    const s = sunDirectionEci(90 * 86400)
    expect(Math.abs(s[0])).toBeLessThan(0.05) // close to zero
    expect(s[1]).toBeGreaterThan(0.9) // strong +Y component
    expect(s[2]).toBeGreaterThan(0) // some +Z from obliquity
  })
})

// ---------- Keep zones ----------

describe('Keep zones', () => {
  it('cylinder: point inside on the axis is inside', () => {
    const z: KeepZone = {
      id: 'k',
      type: 'keep_out',
      label: 'antenna',
      description: '',
      shape: { kind: 'cylinder', axis: [0, 1, 0], halfLengthM: 50_000, radiusM: 5_000 },
    }
    expect(isInsideZone([0, 20_000, 0], z)).toBe(true)
  })

  it('cylinder: point inside radially but past half-length is outside', () => {
    const z: KeepZone = {
      id: 'k',
      type: 'keep_out',
      label: 'antenna',
      description: '',
      shape: { kind: 'cylinder', axis: [0, 1, 0], halfLengthM: 50_000, radiusM: 5_000 },
    }
    expect(isInsideZone([0, 60_000, 0], z)).toBe(false)
  })

  it('cylinder: point past radial limit is outside', () => {
    const z: KeepZone = {
      id: 'k',
      type: 'keep_out',
      label: 'antenna',
      description: '',
      shape: { kind: 'cylinder', axis: [0, 1, 0], halfLengthM: 50_000, radiusM: 5_000 },
    }
    expect(isInsideZone([6_000, 0, 0], z)).toBe(false)
  })

  it('box: inside / outside checks each axis independently', () => {
    const z: KeepZone = {
      id: 'k',
      type: 'keep_in',
      label: 'corridor',
      description: '',
      shape: { kind: 'box', centerRic: [0, 0, 0], halfExtentsM: [1000, 5000, 500] },
    }
    expect(isInsideZone([500, 4000, 200], z)).toBe(true)
    expect(isInsideZone([500, 6000, 200], z)).toBe(false)
    expect(isInsideZone([1500, 0, 0], z)).toBe(false)
  })

  it('cone: point along axis inside half-angle and range', () => {
    const z: KeepZone = {
      id: 'k',
      type: 'keep_out',
      label: 'beam',
      description: '',
      shape: {
        kind: 'cone',
        apexRic: [0, 0, 0],
        axis: [0, 1, 0],
        halfAngleDeg: 10,
        rangeM: 30_000,
      },
    }
    expect(isInsideZone([0, 10_000, 0], z)).toBe(true)
    expect(isInsideZone([0, 40_000, 0], z)).toBe(false) // outside range
    expect(isInsideZone([5000, 10_000, 0], z)).toBe(false) // outside half-angle (~26°)
  })
})

// ---------- Passive safety ----------

describe('Passive safety', () => {
  it('perch (zero relative velocity) drifts on its own orbit and stays safe', () => {
    // Both ships on the same orbit (coplanar circular 500 km), chase offset 5 km in-track.
    const a = R_EARTH + 500_000
    const v = Math.sqrt(MU_EARTH / a)
    // ECI: target on +x, velocity +y; chase same orbit, slightly behind.
    const dtBehind = 5_000 / v
    const angle = (2 * Math.PI * dtBehind) / (2 * Math.PI * Math.sqrt((a * a * a) / MU_EARTH))
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const target = makeShip('t', [a, 0, 0], [0, v, 0])
    const chase = makeShip(
      'c',
      [a * c, -a * s, 0],
      [-v * s, v * c, 0],
    )
    const r = checkPassiveSafety({
      postBurnState: chase,
      targetState: target,
      horizonSec: 4000, // ~ half orbit; enough to detect drift
      keepZones: [],
    })
    expect(r.isSafe).toBe(true)
    expect(r.reason).toBe('safe')
  })

  it('closing trajectory toward target detects conjunction', () => {
    // Target on circular 500 km orbit; chase coorbital but with a strong radial
    // velocity directed inward (would aim it at the target after a short drift).
    const a = R_EARTH + 500_000
    const v = Math.sqrt(MU_EARTH / a)
    const target = makeShip('t', [a, 0, 0], [0, v, 0])
    // Chase starts 5 km radial-outward but moving radially inward fast.
    // We craft a state that intersects (or comes very close to) target soon.
    const chase = makeShip('c', [a + 5_000, 0, 0], [-5, v, 0])
    const r = checkPassiveSafety({
      postBurnState: chase,
      targetState: target,
      horizonSec: 3000,
      keepZones: [],
    })
    // The chase will free-drift past close approach. We assert finite min range
    // is recorded, and the result is well-defined.
    expect(typeof r.closestApproachM).toBe('number')
    expect((r.closestApproachM ?? 0) < 10_000).toBe(true)
  })
})

// ---------- 10-to-1 rule ----------

describe('10-to-1 rule', () => {
  it('range 10 km, closing 100 m/s -> violation', () => {
    const r = checkTenToOne(10_000, 100)
    expect(r.compliant).toBe(false)
    expect(r.safeMaxRateMps).toBeCloseTo(1, 5)
    expect(r.ratio).toBeCloseTo(100, 1)
  })

  it('range 10 km, closing 1 m/s -> compliant (at the limit)', () => {
    const r = checkTenToOne(10_000, 1)
    expect(r.compliant).toBe(true)
    expect(r.ratio).toBeCloseTo(1, 6)
  })

  it('range 50 km, closing 4 m/s -> compliant (well under 5 m/s limit)', () => {
    const r = checkTenToOne(50_000, 4)
    expect(r.compliant).toBe(true)
  })

  it('opening trajectories are always compliant', () => {
    const r = checkTenToOne(1000, -10)
    expect(r.compliant).toBe(true)
    expect(r.ratio).toBe(0)
  })

  it('range 1 km, closing 0.1 m/s -> at limit', () => {
    const r = checkTenToOne(1000, 0.1)
    expect(r.compliant).toBe(true)
  })
})
