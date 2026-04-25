// Translate remaining delta-V into an "operational life" number for pedagogy.
//
// The model is intentionally simple: divide remaining delta-V by a nominal
// annual station-keeping cost for the regime. Real operators reserve budget
// for deorbit, phasing, collision avoidance, and payload maneuvers, so in
// practice a 300 m/s budget does not equal (300 / 30) = 10 years of station-
// keeping. We gloss this in narration and note it here so the instructor can
// qualify the number if asked.

// Annual station-keeping cost (m/s per year) by regime.
export const ANNUAL_SK_MS: Record<'LEO' | 'GEO', number> = {
  LEO: 30, // drag plus J2 inclination maintenance at 400-550 km
  GEO: 50, // east-west plus north-south stationkeeping
}

// Convert remaining delta-V to operational-life years.
export const lifeYearsFromDv = (
  dvRemainingMs: number,
  regime: 'LEO' | 'GEO',
): number => {
  const rate = ANNUAL_SK_MS[regime]
  return Math.max(0, dvRemainingMs / rate)
}

// A budget estimate: many missions start with a rule-of-thumb initial budget
// (propellant * Isp * g0 / mass). We derive it from the loadout.
export const budgetFromMass = (
  dryMass: number,
  propellantMass: number,
  isp: number,
): number => {
  const G0 = 9.80665
  const m0 = dryMass + propellantMass
  const mf = dryMass
  if (mf <= 0 || propellantMass <= 0) return 0
  return isp * G0 * Math.log(m0 / mf)
}

// Format "years" or "months" for display. Always one decimal.
export const fmtLife = (years: number): { value: string; unit: 'years' | 'months' } => {
  if (years >= 1) return { value: years.toFixed(1), unit: 'years' }
  return { value: (years * 12).toFixed(1), unit: 'months' }
}

// Render a signed-delta chip value (e.g. "-0.7 years" or "-3 months").
export const fmtLifeDelta = (deltaYears: number): string => {
  if (Math.abs(deltaYears) >= 1) return `${deltaYears >= 0 ? '+' : ''}${deltaYears.toFixed(1)} years`
  const m = deltaYears * 12
  return `${m >= 0 ? '+' : ''}${m.toFixed(1)} months`
}
