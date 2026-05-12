// Renders the live maneuver-preview overlay in 3D: the projected post-burn
// orbit (dashed amber), a chevron at the burn point, and a thrust arrow in the
// direction of the impulse. Consumes the same `plannedManeuverPreview` state
// that the 2D MapView reads, so the two views stay in lockstep.
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'
import { useGame } from '../game/state'
import Orbit3D, { eciToThreeUnits } from './Orbit3D'
import { colors } from '../theme/colors'
import { mToUnits } from './units'

export default function ManeuverPreview3D() {
  const preview = useGame((s) => s.plannedManeuverPreview)
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const plannedManeuver = useGame((s) => s.plannedManeuver)

  // Pick a single source: prefer the live preview over a committed planned
  // maneuver. (Mirrors MapView 2D behavior.)
  const src = useMemo(() => {
    if (preview && preview.dvMag > 0) {
      return {
        burnPointEci: preview.burnPointEci,
        thrustVectorEci: preview.thrustVectorEci,
        projectedElements: preview.projectedElements,
      }
    }
    if (plannedManeuver) {
      // Best-effort post-burn projection from the committed maneuver. Skipped
      // for now (the 2D view does the same lift); rendering only the preview
      // is sufficient for the Dean's request.
    }
    void mission
    void spacecraft
    return null
  }, [preview, plannedManeuver, mission, spacecraft])

  if (!src) return null
  const { burnPointEci, thrustVectorEci, projectedElements } = src

  // Projected orbit (dashed amber).
  const showOrbit =
    Number.isFinite(projectedElements.a) && projectedElements.e < 1

  // Burn point and thrust arrow in Three.js units.
  const nodePos = eciToThreeUnits(burnPointEci)
  // Three.js-axis-swapped thrust direction (same convention as Orbit3D/eciToThreeUnits).
  const dir = new THREE.Vector3(
    thrustVectorEci[0],
    thrustVectorEci[2],
    -thrustVectorEci[1],
  ).normalize()
  // Arrow tip position: short, fixed visible length (~3% of a typical orbit).
  const ARROW_LEN_UNITS = mToUnits(80_000) // 80 km visible regardless of zoom
  const tip: [number, number, number] = [
    nodePos[0] + dir.x * ARROW_LEN_UNITS,
    nodePos[1] + dir.y * ARROW_LEN_UNITS,
    nodePos[2] + dir.z * ARROW_LEN_UNITS,
  ]
  const arrowQ = new THREE.Quaternion()
  arrowQ.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

  return (
    <group>
      {showOrbit && (
        <Orbit3D coe={projectedElements} color={colors.amber} dashed lineWidth={1.6} opacity={0.95} />
      )}
      {/* Burn-point chevron marker */}
      <mesh position={nodePos}>
        <sphereGeometry args={[mToUnits(15_000), 12, 12]} />
        <meshBasicMaterial color={colors.amber} />
      </mesh>
      {/* Thrust arrow: a thin line + a small cone tip */}
      <Line points={[nodePos, tip]} color={new THREE.Color(colors.red)} lineWidth={2.5} />
      <mesh position={tip} quaternion={arrowQ}>
        <coneGeometry args={[mToUnits(12_000), mToUnits(30_000), 12]} />
        <meshBasicMaterial color={colors.red} />
      </mesh>
    </group>
  )
}
