// Procedural Earth: a blue sphere with a subtle latitude/longitude grid overlay
// drawn from a canvas-generated texture. No binary texture file required.
//
// To swap in a higher-resolution Earth texture later, drop a public-domain image
// into src/3d/textures/earth-day.jpg and wire it via useLoader(TextureLoader, ...)
// in place of the canvas texture below.
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

const makeEarthTexture = (): THREE.CanvasTexture => {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Ocean base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h)
  oceanGrad.addColorStop(0, '#0c2a4d')
  oceanGrad.addColorStop(0.5, '#0e2238')
  oceanGrad.addColorStop(1, '#0c2a4d')
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, w, h)

  // Schematic continent blobs. Not geographically accurate, just enough so the
  // sphere reads as Earth rather than a uniform blue ball.
  ctx.fillStyle = '#1a4267'
  const blobs: [number, number, number][] = [
    // [cx, cy, radius] in texture-pixel coords
    [180, 230, 70],
    [260, 200, 55],
    [320, 270, 80],
    [550, 240, 90],
    [620, 290, 50],
    [720, 220, 55],
    [820, 280, 65],
    [880, 220, 40],
    [100, 380, 50],
    [400, 380, 35],
    [780, 380, 60],
  ]
  for (const [cx, cy, r] of blobs) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Latitude grid (parallels)
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)'
  ctx.lineWidth = 1
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = h / 2 - (lat / 90) * (h / 2)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  // Equator highlight
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.18)'
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()

  // Longitude grid (meridians)
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)'
  for (let lon = 0; lon < 360; lon += 30) {
    const x = (lon / 360) * w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function Earth3D() {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useMemo(makeEarthTexture, [])
  const simTime = useGame((s) => s.simTimeSec)

  const radiusUnits = mToUnits(R_EARTH)

  // Rotate the Earth group around its Z (tilted) axis, tied to sim time so the
  // rotation pauses when the sim pauses.
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = simTimeToEarthRotationRad(simTime)
  })

  return (
    <group rotation-z={EARTH_AXIAL_TILT_RAD}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[radiusUnits, 64, 32]} />
          <meshStandardMaterial map={texture} roughness={1} metalness={0} />
        </mesh>
        {/* Faint atmospheric halo */}
        <mesh>
          <sphereGeometry args={[radiusUnits * 1.015, 48, 24]} />
          <meshBasicMaterial color="#1a4267" transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
      </group>
    </group>
  )
}
