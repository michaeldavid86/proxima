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

// A simple satellite glyph: a colored body with two flat solar panels and a
// floating name label.
function CraftGlyph({
  pos,
  color,
  name,
  showLabel,
  glyphSize,
}: {
  pos: [number, number, number]
  color: string
  name: string
  showLabel: boolean
  glyphSize: number
}) {
  return (
    <group position={pos}>
      <mesh>
        <boxGeometry args={[glyphSize, glyphSize * 0.55, glyphSize * 0.55]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, glyphSize * 1.05]}>
        <boxGeometry args={[glyphSize * 0.6, glyphSize * 0.06, glyphSize * 1.4]} />
        <meshStandardMaterial color={color} opacity={0.55} transparent />
      </mesh>
      <mesh position={[0, 0, -glyphSize * 1.05]}>
        <boxGeometry args={[glyphSize * 0.6, glyphSize * 0.06, glyphSize * 1.4]} />
        <meshStandardMaterial color={color} opacity={0.55} transparent />
      </mesh>
      {showLabel && (
        <Html
          position={[0, glyphSize * 2.5, 0]}
          center
          zIndexRange={[1, 1]}
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
    const earthU = mToUnits(R_EARTH)
    let distance = anchorAU * 2.5
    if (camPreset === 'close') distance = Math.max(anchorAU * 0.35, earthU * 1.2)
    else if (camPreset === 'proximity') distance = earthU * 0.15

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

  // Glyph size scales with the regime: GEO orbits are big, so glyphs must
  // be bigger to be visible from a regime-framed camera.
  const glyphUnits = useMemo(() => {
    const aUnits = mToUnits(R_EARTH + vignette.anchorOrbit.altitudeKm * 1000)
    return Math.max(0.012, aUnits * 0.022)
  }, [vignette])

  return (
    <Canvas
      camera={{ position: [3, 1.5, 3], near: 0.01, far: 1000, fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
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
              glyphSize={glyphUnits}
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
        minDistance={mToUnits(R_EARTH) * 1.05}
        maxDistance={mToUnits(R_EARTH) * 30}
      />
    </Canvas>
  )
}
