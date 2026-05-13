// Procedural Earth — recognizable from rough continent silhouettes drawn into
// an equirectangular canvas texture. No binary asset files required.
//
// To swap in a NASA Blue Marble JPG later, drop earth-day.jpg into
// src/3d/textures/ and wire it via useLoader(TextureLoader, ...) in place of
// the canvas texture below.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { R_EARTH } from '../physics/constants'
import {
  EARTH_AXIAL_TILT_RAD,
  mToUnits,
  simTimeToEarthRotationRad,
} from './units'
import { useGame } from '../game/state'
import { buildEarthCanvas } from './earth-texture'

const makeEarthTexture = (): THREE.CanvasTexture => {
  const tex = new THREE.CanvasTexture(buildEarthCanvas())
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function Earth3D() {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useMemo(makeEarthTexture, [])
  const simTime = useGame((s) => s.simTimeSec)

  const radiusUnits = mToUnits(R_EARTH)

  // Rotate the Earth group around its Y axis tied to sim time, so the
  // rotation pauses when the sim pauses.
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = simTimeToEarthRotationRad(simTime)
  })

  return (
    <group rotation-z={EARTH_AXIAL_TILT_RAD}>
      <group ref={groupRef}>
        {/* Earth */}
        <mesh>
          <sphereGeometry args={[radiusUnits, 96, 48]} />
          <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
        </mesh>
      </group>
      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[radiusUnits * 1.012, 48, 24]} />
        <meshBasicMaterial color="#5fb3ff" transparent opacity={0.10} side={THREE.BackSide} />
      </mesh>
      {/* Outer atmosphere fade */}
      <mesh>
        <sphereGeometry args={[radiusUnits * 1.04, 48, 24]} />
        <meshBasicMaterial color="#3a86c8" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
