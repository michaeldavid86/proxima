// 3D scene for the Historical Ops Library. Renders Earth, orbital arcs, and
// satellite glyphs computed from the active snapshot's authored elements.
// Animates between adjacent snapshots by lerping each craft's ECI position.
// Camera framing follows the snapshot.camera preset.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Line, Html } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { HistoricalVignette, Snapshot, CraftSnapshot } from '../historical/types'
import { resolveCraft, lerpVec3, anchorToCoe } from '../historical/positions'
import { R_EARTH } from '../physics/constants'
import type { COE } from '../physics/orbital-elements'
import type { Vec3 } from '../physics/vec'
import Earth3D from '../3d/Earth3D'
import Starfield3D from '../3d/Starfield3D'
import Orbit3D from '../3d/Orbit3D'
import { mToUnits } from '../3d/units'
import { eciToThreeUnits } from '../3d/Orbit3D'
import { colors } from '../theme/colors'

interface Props {
  vignette: HistoricalVignette
  snapshotIdx: number
  playbackT: number
  // Bump this to force the camera to re-run its auto-frame animation
  // without changing the snapshot (e.g. a "Reframe" button).
  reframeKey?: number
}

const sideColor = (s: CraftSnapshot['side']) =>
  s === 'blue' ? colors.friendly : s === 'red' ? colors.adversary : colors.amber

// Coalesce a possibly missing next-snapshot entry. If a craft appears in the
// current snapshot but not the next, we keep its position fixed for the
// interpolation.
const findCraftIn = (snap: Snapshot | undefined, id: string): CraftSnapshot | undefined =>
  snap?.craft.find((c) => c.id === id)

// A simple satellite glyph: a colored body with two flat solar panels, a
// floating name label, and a halo ring. All materials are transparent + draw
// with depthTest disabled and a very high renderOrder so the glyph always
// draws on top — including over Earth's atmosphere halo, which is itself
// transparent (the transparent pass runs after opaque, so the glyph has to
// share that pass and beat the atmosphere's renderOrder to win).
//
// Glyph SIZE is auto-scaled per frame based on camera distance so the
// marker stays visually consistent (~2% of view radius) at any zoom level:
// not invisible at regime framing, not overwhelming during a 5 m capture.
const GLYPH_RENDER_ORDER = 1000

function CraftGlyph({
  pos,
  color,
  name,
  showLabel,
}: {
  pos: [number, number, number]
  color: string
  name: string
  showLabel: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const posVec = useMemo(() => new THREE.Vector3(...pos), [pos])

  useFrame(() => {
    if (!groupRef.current) return
    const dist = camera.position.distanceTo(posVec)
    // ~2% of camera distance for a consistent screen-space marker size.
    const s = dist * 0.022
    groupRef.current.scale.setScalar(s)
  })

  // Use unit-sized geometry; the group scale applies per frame.
  return (
    <group ref={groupRef} position={pos}>
      {/* Halo ring */}
      <mesh rotation-x={Math.PI / 2} renderOrder={GLYPH_RENDER_ORDER}>
        <ringGeometry args={[1.4, 1.7, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* Body */}
      <mesh renderOrder={GLYPH_RENDER_ORDER + 1}>
        <boxGeometry args={[1, 0.55, 0.55]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {/* Solar panels */}
      <mesh position={[0, 0, 1.05]} renderOrder={GLYPH_RENDER_ORDER + 1}>
        <boxGeometry args={[0.6, 0.06, 1.4]} />
        <meshBasicMaterial
          color={color}
          opacity={0.85}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -1.05]} renderOrder={GLYPH_RENDER_ORDER + 1}>
        <boxGeometry args={[0.6, 0.06, 1.4]} />
        <meshBasicMaterial
          color={color}
          opacity={0.85}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      {showLabel && (
        <Html
          position={[0, 2.5, 0]}
          center
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="font-mono text-[10px] whitespace-nowrap px-1"
            style={{ color, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  )
}

// Draw a short polyline showing where each non-anchor craft has moved between
// the previous snapshot and the current one (in the orbit's neighborhood).
function MotionTrail({
  from,
  to,
  color,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
}) {
  return (
    <Line
      points={[from, to]}
      color={new THREE.Color(color)}
      lineWidth={1.0}
      opacity={0.5}
      transparent
      dashed
      dashSize={0.005}
      gapSize={0.004}
    />
  )
}

// Camera controller specifically for the historical scene. Snaps to a new
// framing when the snapshot changes, then yields to OrbitControls so the
// cadet can freely rotate / zoom / pan to look at the geometry. The animation
// runs for a short window (~800 ms) after each snapshot change and stops.
// For 'close' / 'proximity', distance is computed from the craft bounding
// box so RPO action at meter-to-km scales remains visible.
const AUTO_FRAME_DURATION_MS = 800

function HistoricalCamera({
  vignette,
  snapshotIdx,
  reframeKey,
}: {
  vignette: HistoricalVignette
  snapshotIdx: number
  reframeKey: number
}) {
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3; update: () => void } | null
  }
  const targetPos = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const animEndAt = useRef<number>(0)
  const initialized = useRef(false)

  // Recompute desired camera state when snapshot changes. Sets a short
  // animation window; user input takes over once it elapses.
  useEffect(() => {
    const cur = vignette.snapshots[snapshotIdx]
    if (!cur) return
    const focusId = cur.cameraFocusCraftId ?? cur.craft[0]?.id
    const focusCraft = cur.craft.find((c) => c.id === focusId) ?? cur.craft[0]
    if (!focusCraft) return
    const resolved = resolveCraft(focusCraft, vignette.anchorOrbit)
    const focusThree = new THREE.Vector3(...eciToThreeUnits(resolved.rEci))

    const camPreset = cur.camera ?? (snapshotIdx === 0 ? 'regime' : 'close')
    const anchorAU = mToUnits(R_EARTH + vignette.anchorOrbit.altitudeKm * 1000)
    let distance = anchorAU * 2.5

    if (camPreset === 'close' || camPreset === 'proximity') {
      // Find the largest separation from focus to any other craft in the
      // snapshot (in meters, ECI). Convert to Three.js units.
      let maxOffsetM = 0
      for (const c of cur.craft) {
        if (c.id === focusCraft.id) continue
        const r = resolveCraft(c, vignette.anchorOrbit)
        const dx = r.rEci[0] - resolved.rEci[0]
        const dy = r.rEci[1] - resolved.rEci[1]
        const dz = r.rEci[2] - resolved.rEci[2]
        maxOffsetM = Math.max(maxOffsetM, Math.hypot(dx, dy, dz))
      }
      const bboxUnits = mToUnits(maxOffsetM)
      if (camPreset === 'proximity') {
        // Tight frame; floor of 200 m so sub-meter offsets still render.
        distance = Math.max(bboxUnits * 2.5, mToUnits(200))
      } else {
        // 'close'. Defaults to a sensible near-focus zoom when alone.
        distance =
          maxOffsetM === 0
            ? anchorAU * 0.05
            : Math.max(bboxUnits * 3, mToUnits(5000))
      }
    }

    // Offset around focus along a stable bearing that varies per snapshot
    // so a static hold reads as a new view, not a frozen frame.
    const bearing = (snapshotIdx * 0.4) % (2 * Math.PI)
    const elev = camPreset === 'regime' ? 0.55 : 0.3
    const offset = new THREE.Vector3(
      Math.cos(bearing) * distance,
      distance * elev,
      Math.sin(bearing) * distance,
    )

    const lookCenter =
      camPreset === 'regime' ? new THREE.Vector3(0, 0, 0) : focusThree
    targetLookAt.current.copy(lookCenter)
    targetPos.current.copy(lookCenter).add(offset)
    animEndAt.current = performance.now() + AUTO_FRAME_DURATION_MS
  }, [vignette, snapshotIdx, reframeKey])

  useFrame(() => {
    // First frame: snap into place immediately so we never start from the
    // bogus default camera position.
    if (!initialized.current) {
      camera.position.copy(targetPos.current)
      if (controls?.target) controls.target.copy(targetLookAt.current)
      camera.lookAt(targetLookAt.current)
      controls?.update?.()
      initialized.current = true
      return
    }
    // After the auto-frame window expires, leave the camera alone so user
    // drags persist.
    if (performance.now() > animEndAt.current) return
    const lerpRate = 0.12
    camera.position.lerp(targetPos.current, lerpRate)
    if (controls?.target) {
      controls.target.lerp(targetLookAt.current, lerpRate)
      controls.update()
    } else {
      camera.lookAt(targetLookAt.current)
    }
  })

  return null
}

// Render a set of distinct orbit rings. We deduplicate rings whose COE
// is effectively identical to avoid stacking lines on top of each other.
const coeKey = (c: COE): string =>
  [c.a, c.e, c.i, c.raan, c.argp].map((x) => x.toFixed(4)).join('|')

export default function HistoricalScene3D({ vignette, snapshotIdx, playbackT, reframeKey = 0 }: Props) {
  const cur = vignette.snapshots[snapshotIdx]
  const nxt = vignette.snapshots[snapshotIdx + 1]
  const denom = nxt ? nxt.t_sec - cur.t_sec : 1
  const tFrac =
    nxt && denom > 0 ? Math.min(1, Math.max(0, (playbackT - cur.t_sec) / denom)) : 0

  // Resolve every craft in the current and next snapshot once per frame.
  const renderData = useMemo(() => {
    const items: {
      id: string
      name: string
      side: CraftSnapshot['side']
      labelVisible: boolean
      rNow: Vec3
      rPrev: Vec3 | null
      coe: COE
    }[] = []
    const orbitsByKey = new Map<string, { coe: COE; isAnchor: boolean; sample: CraftSnapshot }>()

    const anchorCoe = anchorToCoe(vignette.anchorOrbit)
    orbitsByKey.set(coeKey(anchorCoe), {
      coe: anchorCoe,
      isAnchor: true,
      sample: cur.craft[0],
    })

    const prevSnap = snapshotIdx > 0 ? vignette.snapshots[snapshotIdx - 1] : undefined

    for (const craft of cur.craft) {
      const resCur = resolveCraft(craft, vignette.anchorOrbit)
      const resNxt = nxt
        ? (() => {
            const found = findCraftIn(nxt, craft.id)
            return found ? resolveCraft(found, vignette.anchorOrbit) : resCur
          })()
        : resCur
      const resPrev = prevSnap
        ? (() => {
            const found = findCraftIn(prevSnap, craft.id)
            return found ? resolveCraft(found, vignette.anchorOrbit) : null
          })()
        : null
      const rNow = lerpVec3(resCur.rEci, resNxt.rEci, tFrac)
      items.push({
        id: craft.id,
        name: craft.name,
        side: craft.side,
        labelVisible: craft.labelVisible,
        rNow,
        rPrev: resPrev?.rEci ?? null,
        coe: resCur.coe,
      })
      const key = coeKey(resCur.coe)
      if (!orbitsByKey.has(key)) {
        orbitsByKey.set(key, { coe: resCur.coe, isAnchor: false, sample: craft })
      }
    }

    return { items, orbits: Array.from(orbitsByKey.values()) }
  }, [vignette, cur, nxt, tFrac, snapshotIdx])

  return (
    <Canvas
      // Near is tiny (10 m equivalent at 1 unit = 1e7 m) so proximity views
      // of meter-scale RPO action don't get clipped. logarithmicDepthBuffer
      // keeps z-precision usable across the resulting wide near/far range.
      camera={{ position: [3, 1.5, 3], near: 1e-6, far: 1000, fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
    >
      <color attach="background" args={['#020610']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 3, 4]} intensity={1.0} />
      <Starfield3D />
      <Earth3D />

      {renderData.orbits.map((o, i) => (
        <Orbit3D
          key={`orbit-${i}`}
          coe={o.coe}
          color={o.isAnchor ? colors.cyan : sideColor(o.sample.side)}
          lineWidth={o.isAnchor ? 1.2 : 1.0}
          opacity={o.isAnchor ? 0.55 : 0.7}
          dashed={!o.isAnchor}
        />
      ))}

      {renderData.items.map((it) => {
        const posThree = eciToThreeUnits(it.rNow)
        const prevThree = it.rPrev ? eciToThreeUnits(it.rPrev) : null
        const color = sideColor(it.side)
        return (
          <group key={it.id}>
            {prevThree && (
              <MotionTrail from={prevThree} to={posThree} color={color} />
            )}
            <CraftGlyph
              pos={posThree}
              color={color}
              name={it.name}
              showLabel={it.labelVisible}
            />
          </group>
        )
      })}

      <HistoricalCamera
        vignette={vignette}
        snapshotIdx={snapshotIdx}
        reframeKey={reframeKey}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        // minDistance lowered so RPO proximity views (10s of meters from
        // focus) are not clamped away by the orbit controller.
        minDistance={mToUnits(50)}
        maxDistance={mToUnits(R_EARTH) * 30}
      />
    </Canvas>
  )
}
