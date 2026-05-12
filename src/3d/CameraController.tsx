// Camera controller for the 3D scene. Listens for scalePreset state changes
// and smoothly lerps the camera position / lookAt target over ~500ms.
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../game/state'
import { R_EARTH } from '../physics/constants'
import { norm, sub } from '../physics/vec'
import { mToUnits } from './units'
import { eciToThreeUnits } from './Orbit3D'

const LERP_RATE = 0.12 // per frame at 60fps -> ~500ms to settle

interface Target {
  position: THREE.Vector3
  lookAt: THREE.Vector3
}

const safeMax = (xs: number[]): number => (xs.length === 0 ? 1 : Math.max(...xs))

export default function CameraController() {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3 } | null
  }
  const preset = useGame((s) => s.scalePreset)
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const targetRef = useRef<Target | null>(null)

  // Compute target camera state when preset, mission, or active ship changes.
  useEffect(() => {
    if (!mission) return
    const player = activeAssetId
      ? spacecraft[activeAssetId]
      : spacecraft[mission.playerId]
    const tgt = spacecraft[mission.targetId]
    if (!player) return

    const playerPos = new THREE.Vector3(...eciToThreeUnits(player.rEci))

    let camPos = new THREE.Vector3()
    let lookAt = new THREE.Vector3(0, 0, 0)

    if (preset === 'regime') {
      // Frame the entire orbital regime: Earth + largest orbit comfortably in view.
      const maxA = safeMax(mission.spacecraft.map((s) => s.coe.a))
      const dist = mToUnits(maxA) * 2.6
      camPos.set(dist, dist * 0.45, dist * 0.85)
      lookAt.set(0, 0, 0)
    } else if (preset === 'close') {
      // Frame within ~500 km of the player.
      const dist = mToUnits(500_000) * 6
      // Place camera at a 30deg elevation, looking down at the player.
      const dir = playerPos.clone().normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const right = new THREE.Vector3().crossVectors(dir, up).normalize()
      camPos = playerPos
        .clone()
        .add(dir.clone().multiplyScalar(dist * 0.4))
        .add(up.clone().multiplyScalar(dist * 0.45))
        .add(right.clone().multiplyScalar(dist * 0.2))
      lookAt = playerPos.clone()
    } else if (preset === 'proximity') {
      // Frame within ~50 km of the target (chase-cam style).
      const cam = tgt ?? player
      const camPosE = new THREE.Vector3(...eciToThreeUnits(cam.rEci))
      const dist = mToUnits(50_000) * 4
      const dir = camPosE.clone().normalize()
      const up = new THREE.Vector3(0, 1, 0)
      camPos = camPosE
        .clone()
        .add(dir.clone().multiplyScalar(dist * 0.4))
        .add(up.clone().multiplyScalar(dist * 0.35))
      lookAt = camPosE
    } else {
      // 'free' — leave camera under user control. Set target to null so we stop lerping.
      targetRef.current = null
      return
    }

    targetRef.current = { position: camPos, lookAt }
  }, [preset, mission, spacecraft, activeAssetId])

  // Lerp toward the target each frame.
  useFrame(() => {
    const t = targetRef.current
    if (!t) return
    camera.position.lerp(t.position, LERP_RATE)
    if (controls && controls.target) {
      controls.target.lerp(t.lookAt, LERP_RATE)
    } else {
      camera.lookAt(t.lookAt)
    }
    // Settle: stop updating once we're close.
    if (camera.position.distanceTo(t.position) < mToUnits(R_EARTH) * 0.001) {
      targetRef.current = null
    }
  })

  // Auto-switch to proximity preset when range to target drops below 50 km
  // (mirrors the existing 2D auto-switch behavior).
  const setScalePreset = useGame((s) => s.setScalePreset)
  useEffect(() => {
    if (!mission) return
    const tgt = spacecraft[mission.targetId]
    const ply = activeAssetId
      ? spacecraft[activeAssetId]
      : spacecraft[mission.playerId]
    if (!tgt || !ply) return
    const rKm = norm(sub(ply.rEci, tgt.rEci)) / 1000
    if (rKm < 50 && preset === 'regime') setScalePreset('proximity')
  }, [mission, spacecraft, activeAssetId, preset, setScalePreset])

  return null
}
