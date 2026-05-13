// Keep-in / keep-out zone math.
//
// Zones are declared in mission data and expressed in the target's RIC frame
// (origin = target center, +x = radial out, +y = in-track, +z = cross-track).
// We render them in 2D and 3D and check positions against them.
import { dot, norm, type Vec3 } from '../physics/vec'

export type ZoneShape =
  | { kind: 'cylinder'; axis: Vec3; halfLengthM: number; radiusM: number }
  | { kind: 'box'; centerRic: Vec3; halfExtentsM: Vec3 }
  | {
      kind: 'cone'
      apexRic: Vec3
      axis: Vec3
      halfAngleDeg: number
      rangeM: number
    }

export interface KeepZone {
  id: string
  type: 'keep_in' | 'keep_out'
  label: string
  description: string
  shape: ZoneShape
}

const unit = (v: Vec3): Vec3 => {
  const m = norm(v)
  if (m === 0) return [0, 0, 0]
  return [v[0] / m, v[1] / m, v[2] / m]
}

export const isInsideZone = (positionRic: Vec3, zone: KeepZone): boolean => {
  const s = zone.shape
  switch (s.kind) {
    case 'cylinder': {
      // Cylinder axis passes through the origin (target), with given
      // direction `axis`, half-length and radius. Project the position onto
      // the axis; inside iff |axial| <= halfLength and perpendicular distance
      // <= radius.
      const axisHat = unit(s.axis)
      const axial = dot(positionRic, axisHat)
      if (Math.abs(axial) > s.halfLengthM) return false
      // Perpendicular component magnitude.
      const projVec: Vec3 = [
        axisHat[0] * axial,
        axisHat[1] * axial,
        axisHat[2] * axial,
      ]
      const perp: Vec3 = [
        positionRic[0] - projVec[0],
        positionRic[1] - projVec[1],
        positionRic[2] - projVec[2],
      ]
      return norm(perp) <= s.radiusM
    }
    case 'box': {
      const dx = positionRic[0] - s.centerRic[0]
      const dy = positionRic[1] - s.centerRic[1]
      const dz = positionRic[2] - s.centerRic[2]
      return (
        Math.abs(dx) <= s.halfExtentsM[0] &&
        Math.abs(dy) <= s.halfExtentsM[1] &&
        Math.abs(dz) <= s.halfExtentsM[2]
      )
    }
    case 'cone': {
      // Cone with apex at apexRic, axis direction, half-angle, range from apex.
      // Inside iff distance from apex <= range AND angle to axis <= halfAngle.
      const rel: Vec3 = [
        positionRic[0] - s.apexRic[0],
        positionRic[1] - s.apexRic[1],
        positionRic[2] - s.apexRic[2],
      ]
      const d = norm(rel)
      if (d === 0) return true // at apex
      if (d > s.rangeM) return false
      const axisHat = unit(s.axis)
      const cosA = dot(rel, axisHat) / d
      const halfAngleRad = (s.halfAngleDeg * Math.PI) / 180
      return cosA >= Math.cos(halfAngleRad)
    }
  }
}

export const zonesIntersected = (
  positionRic: Vec3,
  zones: KeepZone[],
): KeepZone[] => zones.filter((z) => isInsideZone(positionRic, z))
