// Friis-equation link budget with a simple antenna pattern model.
// All quantities in dB except ranges (km) and frequencies (GHz).
import { C_LIGHT } from './constants'
import { dot, norm, sub, type Vec3 } from './vec'

// Free-space path loss in dB at frequency f (GHz) and distance d (km).
// Convenient closed form: L = 92.45 + 20 log10(f_GHz) + 20 log10(d_km)
export const fspl = (fGHz: number, dKm: number): number =>
  92.45 + 20 * Math.log10(fGHz) + 20 * Math.log10(dKm)

// Same, but from SI inputs (Hz and m).
export const fsplSi = (fHz: number, dMeters: number): number => {
  const lambda = C_LIGHT / fHz
  return 20 * Math.log10((4 * Math.PI * dMeters) / lambda)
}

export interface Antenna {
  peakGainDb: number
  halfPowerBeamwidthRad: number
  sidelobeGainDb?: number // default: peakGain - 13
}

// Off-axis gain for angle theta (rad) from boresight.
// For |theta| < 2 * HPBW: parabolic 12*(theta/HPBW)^2 roll-off.
// Beyond that: clamp at sidelobe level.
export const offAxisGain = (ant: Antenna, thetaRad: number): number => {
  const sidelobe = ant.sidelobeGainDb ?? ant.peakGainDb - 13
  const t = Math.abs(thetaRad)
  if (t >= 2 * ant.halfPowerBeamwidthRad) return sidelobe
  const roll = 12 * (t / ant.halfPowerBeamwidthRad) ** 2
  return Math.max(ant.peakGainDb - roll, sidelobe)
}

// Angle between a boresight direction and a vector from antenna to target.
export const offAxisAngle = (boresight: Vec3, toTarget: Vec3): number => {
  const a = norm(boresight)
  const b = norm(toTarget)
  if (a === 0 || b === 0) return 0
  const cosT = Math.max(-1, Math.min(1, dot(boresight, toTarget) / (a * b)))
  return Math.acos(cosT)
}

export interface LinkEndpoint {
  posEci: Vec3
  antenna: Antenna
  boresightEci: Vec3
  txPowerDbw: number // for a receiver this is ignored
}

export interface LinkInputs {
  source: LinkEndpoint // intended transmitter
  victim: LinkEndpoint // intended receiver
  jammer?: LinkEndpoint // optional jammer transmitter
  fGHz: number // carrier freq (GHz)
  muted?: boolean // emcon: source off
}

export interface LinkOutcome {
  receivedDbw: number // signal power at victim (dBW); -Infinity if muted
  jammerDbw: number | null // jammer power at victim (dBW); null if no jammer
  jToS: number // J/S (dB); -Infinity if no jammer; +Infinity if source muted
  status: 'nominal' | 'degraded' | 'denied'
  rangeKm: number
  jamRangeKm: number | null
}

const M_TO_KM = 1 / 1000

export const resolveLink = (inp: LinkInputs): LinkOutcome => {
  const rangeM = norm(sub(inp.victim.posEci, inp.source.posEci))
  const rangeKm = rangeM * M_TO_KM

  // Signal chain
  const thetaSrc = offAxisAngle(
    inp.source.boresightEci,
    sub(inp.victim.posEci, inp.source.posEci),
  )
  const thetaRxFromSrc = offAxisAngle(
    inp.victim.boresightEci,
    sub(inp.source.posEci, inp.victim.posEci),
  )
  const Gs = offAxisGain(inp.source.antenna, thetaSrc)
  const GrxFromSrc = offAxisGain(inp.victim.antenna, thetaRxFromSrc)
  const Lfs = fspl(inp.fGHz, rangeKm)

  const sigDbw = inp.muted ? -Infinity : inp.source.txPowerDbw + Gs + GrxFromSrc - Lfs

  let jamDbw: number | null = null
  let jamRangeKm: number | null = null
  if (inp.jammer) {
    const jr = norm(sub(inp.victim.posEci, inp.jammer.posEci))
    jamRangeKm = jr * M_TO_KM
    const thetaJ = offAxisAngle(
      inp.jammer.boresightEci,
      sub(inp.victim.posEci, inp.jammer.posEci),
    )
    const thetaRxFromJ = offAxisAngle(
      inp.victim.boresightEci,
      sub(inp.jammer.posEci, inp.victim.posEci),
    )
    const Gj = offAxisGain(inp.jammer.antenna, thetaJ)
    const GrxFromJ = offAxisGain(inp.victim.antenna, thetaRxFromJ)
    const LfsJ = fspl(inp.fGHz, jamRangeKm)
    jamDbw = inp.jammer.txPowerDbw + Gj + GrxFromJ - LfsJ
  }

  let jToS: number
  if (jamDbw === null) jToS = -Infinity
  else if (sigDbw === -Infinity) jToS = Infinity
  else jToS = jamDbw - sigDbw

  let status: LinkOutcome['status'] = 'nominal'
  if (jToS >= 10) status = 'denied'
  else if (jToS >= 0) status = 'degraded'

  return { receivedDbw: sigDbw, jammerDbw: jamDbw, jToS, status, rangeKm, jamRangeKm }
}

// Watts -> dBW
export const dbw = (watts: number): number => 10 * Math.log10(Math.max(watts, 1e-12))

// Degrees -> radians (for antenna beamwidth specs in degrees)
export const deg2rad = (d: number): number => (d * Math.PI) / 180
