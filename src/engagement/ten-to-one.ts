// 10-to-1 rule.
//
// Standard RPO undergraduate heuristic (Jack Anthony, "Astro Corner — The
// 10-to-1 Rule"): the closing rate, in m/s, should not exceed range-in-km
// divided by ten. The intent is to keep enough time-to-impact reserve so
// the chase can react to attitude or sensor errors before any contact.
//
// Worked numbers:
//   At 100 km range, max safe closure = 10 m/s.
//   At 10 km range, max safe closure = 1 m/s.
//   At 1 km range, max safe closure = 0.1 m/s.
//
// Opening (negative closing rate) is always compliant.

export interface TenToOneResult {
  compliant: boolean
  safeMaxRateMps: number
  ratio: number // closing rate / safeMaxRate; > 1 means violation
}

export const checkTenToOne = (
  rangeM: number,
  closingRateMps: number,
): TenToOneResult => {
  const rangeKm = Math.max(0, rangeM / 1000)
  const safeMaxRateMps = rangeKm / 10
  if (closingRateMps <= 0) {
    return { compliant: true, safeMaxRateMps, ratio: 0 }
  }
  // Use a small epsilon when comparing against zero-range to avoid Infinity.
  const ratio = safeMaxRateMps > 0 ? closingRateMps / safeMaxRateMps : Infinity
  return {
    compliant: closingRateMps <= safeMaxRateMps,
    safeMaxRateMps,
    ratio,
  }
}
