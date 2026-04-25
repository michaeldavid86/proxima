// Closed-form coplanar circular-to-circular Hohmann transfer.
// Reference: Curtis 6.2.
import { MU_EARTH } from './constants'

export interface HohmannResult {
  dv1: number // m/s, burn at the starting circular orbit
  dv2: number // m/s, burn at the destination circular orbit
  totalDv: number // m/s
  transferTime: number // s, half-period of the transfer ellipse
  aTransfer: number // m, semi-major axis of the transfer ellipse
}

export const hohmann = (
  r1: number,
  r2: number,
  mu: number = MU_EARTH,
): HohmannResult => {
  const aT = (r1 + r2) / 2
  const dv1 = Math.sqrt(mu / r1) * (Math.sqrt((2 * r2) / (r1 + r2)) - 1)
  const dv2 = Math.sqrt(mu / r2) * (1 - Math.sqrt((2 * r1) / (r1 + r2)))
  const totalDv = Math.abs(dv1) + Math.abs(dv2)
  const transferTime = Math.PI * Math.sqrt((aT * aT * aT) / mu)
  return { dv1, dv2, totalDv, transferTime, aTransfer: aT }
}
