// Unit scaling for the 3D scene.
//
// Internally the physics engine uses SI meters. Three.js cameras have practical
// near/far plane limits, so we scale meters down to Three.js units at the
// rendering boundary. We do NOT alter physics math anywhere; this is a pure
// presentation transform.
//
// Choice: 1 Three.js unit = 10,000 km = 1e7 m. That makes Earth radius ~0.638
// units and a GEO orbit ~4.2 units, all comfortably inside default
// near/far planes (0.1 / 1000).

export const METERS_PER_UNIT = 1e7
export const UNITS_PER_METER = 1 / METERS_PER_UNIT

export const mToUnits = (m: number): number => m * UNITS_PER_METER
export const m3ToUnits3 = (v: [number, number, number]): [number, number, number] => [
  v[0] * UNITS_PER_METER,
  v[1] * UNITS_PER_METER,
  v[2] * UNITS_PER_METER,
]

// Sim-time -> Earth rotation angle, in radians.
// One sidereal day = 86164.0905 s. Used by Earth3D for spin animation tied to sim time.
export const SIDEREAL_DAY_SEC = 86164.0905
export const simTimeToEarthRotationRad = (simTimeSec: number): number =>
  (2 * Math.PI * simTimeSec) / SIDEREAL_DAY_SEC

// Earth's axial tilt in radians (used to orient the Earth group).
export const EARTH_AXIAL_TILT_RAD = (23.4 * Math.PI) / 180
