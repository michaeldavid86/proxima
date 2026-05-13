// Render keep-in / keep-out zones as translucent meshes in 3D. Anchored to
// the target (zones declared in target-RIC), so they orbit with the target.
import { useMemo } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/state'
import { ricBasisOf, ricToEci } from '../physics/frames'
import { mToUnits } from './units'
import { eciToThreeUnits } from './Orbit3D'
import type { KeepZone } from '../engagement/keep-zones'
import type { Vec3 } from '../physics/vec'

const colorOf = (z: KeepZone): { color: string; opacity: number } =>
  z.type === 'keep_in'
    ? { color: '#35e08c', opacity: 0.15 }
    : { color: '#ff4466', opacity: 0.18 }

export default function KeepZoneRenderer3D() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)

  const zoneMeshes = useMemo(() => {
    if (!mission?.keepZones?.length) return []
    const tgt = spacecraft[mission.targetId]
    if (!tgt) return []
    const basis = ricBasisOf(tgt.rEci, tgt.vEci)
    // Convert a RIC-frame vector or position to a Three.js position by adding
    // it to the target's ECI position, then applying the standard ECI -> Three
    // axis swap used by Orbit3D.
    const ricPointToThree = (ricPos: Vec3): [number, number, number] => {
      const ricInEci = ricToEci(ricPos, basis) as Vec3
      const eci: [number, number, number] = [
        tgt.rEci[0] + ricInEci[0],
        tgt.rEci[1] + ricInEci[1],
        tgt.rEci[2] + ricInEci[2],
      ]
      return eciToThreeUnits(eci)
    }
    const targetThree = eciToThreeUnits(tgt.rEci as [number, number, number])
    return mission.keepZones.map((z) => {
      const { color, opacity } = colorOf(z)
      if (z.shape.kind === 'cylinder') {
        // Build a cylinder of given half-length and radius, oriented along
        // its axis (in RIC). Three.js CylinderGeometry is by default along Y;
        // we orient it by setting quaternion from (0,1,0) to the axis-in-Three.
        const axRic = z.shape.axis
        const axHat: Vec3 = (() => {
          const m = Math.hypot(...axRic)
          if (m === 0) return [0, 1, 0]
          return [axRic[0] / m, axRic[1] / m, axRic[2] / m]
        })()
        // Direction in Three.js coordinates: convert RIC axis to ECI direction
        // (rotate by basis), then apply the ECI -> Three axis swap.
        const eciDir = ricToEci(axHat, basis) as Vec3
        const threeDir = new THREE.Vector3(eciDir[0], eciDir[2], -eciDir[1]).normalize()
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          threeDir,
        )
        return {
          key: z.id,
          el: (
            <group key={z.id} position={targetThree} quaternion={quat}>
              <mesh>
                <cylinderGeometry
                  args={[
                    mToUnits(z.shape.radiusM),
                    mToUnits(z.shape.radiusM),
                    mToUnits(z.shape.halfLengthM * 2),
                    32,
                    1,
                    true,
                  ]}
                />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={opacity}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          ),
        }
      }
      if (z.shape.kind === 'box') {
        const center = ricPointToThree(z.shape.centerRic)
        return {
          key: z.id,
          el: (
            <mesh key={z.id} position={center}>
              <boxGeometry
                args={[
                  mToUnits(z.shape.halfExtentsM[0] * 2),
                  mToUnits(z.shape.halfExtentsM[1] * 2),
                  mToUnits(z.shape.halfExtentsM[2] * 2),
                ]}
              />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          ),
        }
      }
      // cone
      const apex = ricPointToThree(z.shape.apexRic)
      const halfAngleRad = (z.shape.halfAngleDeg * Math.PI) / 180
      const radius = Math.tan(halfAngleRad) * z.shape.rangeM
      const eciDir = ricToEci(z.shape.axis, basis) as Vec3
      const dirVec = new THREE.Vector3(eciDir[0], eciDir[2], -eciDir[1]).normalize()
      // Three.js cone default points along +Y from base, with apex at +Y end.
      // We want apex at the apex position, axis along dir. The geometry's
      // natural apex is at (0, halfHeight, 0); shift the mesh so the apex sits
      // at the apex position when rotated.
      const halfHeight = mToUnits(z.shape.rangeM / 2)
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dirVec,
      )
      // The cone's centroid sits halfHeight from the base, so its center should
      // be halfHeight units along dir from the apex (toward base direction is +dir? no
      // — the default cone has apex at +Y so its base is at -Y. We want apex at apex,
      // base at apex + dir*range, so the center is at apex + dir*halfHeight).
      const centerPos: [number, number, number] = [
        apex[0] + dirVec.x * halfHeight,
        apex[1] + dirVec.y * halfHeight,
        apex[2] + dirVec.z * halfHeight,
      ]
      return {
        key: z.id,
        el: (
          <group key={z.id} position={centerPos} quaternion={quat}>
            <mesh rotation-x={Math.PI}>
              <coneGeometry args={[mToUnits(radius), mToUnits(z.shape.rangeM), 32, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ),
      }
    })
  }, [mission, spacecraft])

  if (zoneMeshes.length === 0) return null
  return <group>{zoneMeshes.map((m) => m.el)}</group>
}
