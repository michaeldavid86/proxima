// 3D spacecraft glyph: a small box body with two flat solar-panel wings and
// an optional name label. Position comes from GameState.spacecraft[id].rEci.
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'
import type { SpacecraftState } from '../game/state'
import { colors, assetColor } from '../theme/colors'
import { eciToThreeUnits } from './Orbit3D'
import { mToUnits } from './units'

interface Props {
  ship: SpacecraftState
  isTarget: boolean
  isController: boolean
  assetIdx: number | null
}

const SC_BODY_UNITS = 0.018 // glyph size in Three.js units. Adjust to taste.

const colorFor = (
  side: SpacecraftState['side'],
  isTarget: boolean,
  assetIdx: number | null,
): string => {
  if (assetIdx !== null) return assetColor(assetIdx)
  if (side === 'blue') return colors.friendly
  if (side === 'red') return colors.adversary
  return isTarget ? colors.amber : colors.neutral
}

export default function Spacecraft3D({ ship, isTarget, isController, assetIdx }: Props) {
  const pos = useMemo(() => eciToThreeUnits(ship.rEci), [ship.rEci])
  const color = colorFor(ship.side, isTarget, assetIdx)

  // Heading: align the body's long axis with the ECI velocity vector.
  const velDir = useMemo(() => {
    const v = ship.vEci
    const mag = Math.hypot(v[0], v[1], v[2]) || 1
    // Apply the same ECI -> Three.js axis swap as in eciToThreeUnits.
    return new THREE.Vector3(v[0] / mag, v[2] / mag, -v[1] / mag)
  }, [ship.vEci])
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), velDir)
    return q
  }, [velDir])

  return (
    <group position={pos} quaternion={quaternion}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[SC_BODY_UNITS, SC_BODY_UNITS * 0.55, SC_BODY_UNITS * 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {/* Solar panels: two flat boxes extending +/- z */}
      <mesh position={[0, 0, SC_BODY_UNITS * 1.05]}>
        <boxGeometry args={[SC_BODY_UNITS * 0.6, SC_BODY_UNITS * 0.06, SC_BODY_UNITS * 1.4]} />
        <meshStandardMaterial color={color} opacity={0.55} transparent />
      </mesh>
      <mesh position={[0, 0, -SC_BODY_UNITS * 1.05]}>
        <boxGeometry args={[SC_BODY_UNITS * 0.6, SC_BODY_UNITS * 0.06, SC_BODY_UNITS * 1.4]} />
        <meshStandardMaterial color={color} opacity={0.55} transparent />
      </mesh>
      {/* Active-asset / target ring */}
      {(isController || isTarget) && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[SC_BODY_UNITS * 1.8, SC_BODY_UNITS * 2.0, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Label */}
      <Html
        position={[0, SC_BODY_UNITS * 2.5, 0]}
        center
        zIndexRange={[1, 1]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          {ship.name}
        </div>
      </Html>
      {/* Velocity arrow */}
      <mesh position={[mToUnits(0) + SC_BODY_UNITS * 1.6, 0, 0]}>
        <coneGeometry args={[SC_BODY_UNITS * 0.4, SC_BODY_UNITS * 0.8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
