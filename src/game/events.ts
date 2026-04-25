// Deterministic 32-bit seeded RNG so debriefs are reproducible (Mulberry32).
export const makeRng = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

// Format seconds as h:mm:ss.
export const fmtClock = (t: number): string => {
  const s = Math.max(0, Math.floor(t))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s - h * 3600) / 60)
  const ss = s - h * 3600 - m * 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${ss
    .toString()
    .padStart(2, '0')}`
}
