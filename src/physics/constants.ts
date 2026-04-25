// Gravitational parameter of Earth (m^3/s^2).
export const MU_EARTH = 3.986004418e14

// Earth's equatorial radius (m).
export const R_EARTH = 6378137

// Standard gravity used for specific-impulse / rocket equation work (m/s^2).
export const G0 = 9.80665

// Earth's J2 zonal harmonic (unused in v1 two-body model, kept for future use).
export const J2 = 0.00108263

// Geostationary orbital radius (m), computed from period = sidereal day.
export const R_GEO = Math.cbrt(MU_EARTH * (86164.0905 / (2 * Math.PI)) ** 2)

// Speed of light (m/s) — used by link-budget for wavelength from frequency.
export const C_LIGHT = 299792458

// Numerical tolerances
export const EPS = 1e-10
