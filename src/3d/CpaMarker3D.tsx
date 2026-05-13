// Closest Point of Approach marker for the 3D scene.
// Mirrors the magenta CPA indicators in MapView's 2D canvas: samples both
// the active asset and the target's future orbits, finds the minimum range,
// and renders a dashed line connecting the two predicted positions with a
// floating label showing the range and time-to-CPA.
import { useMemo } from 'react'
import { Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/state'
import { periodFromA, stateToCoe } from '../physics/orbital-elements'
import { propagateState } from '../physics/kepler'
import { norm, sub, type Vec3 } from '../physics/vec'
import { colors } from '../theme/colors'
import { eciToThreeUnits } from './Orbit3D'
import { mToUnits } from './units'

export default function CpaMarker3D() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  // CPA recomputed only when the spacecraft state vectors change. The state
  // updates each sim tick so this stays current without burning frames on
  // continuous animation.
  const cpa = useMemo(() => {
    if (!mission) return null
    const playerId = activeAssetId ?? mission.playerId
    const p = spacecraft[playerId]
    const t = spacecraft[mission.targetId]
    if (!p || !t) return null
    const coeP = stateToCoe({ r: p.rEci, v: p.vEci })
    const coeT = stateToCoe({ r: t.rEci, v: t.vEci })
    const horizon = Math.max(periodFromA(coeP.a), periodFromA(coeT.a)) * 1.2
    const steps = 240
    let minR = Infinity
    let minT = 0
    let minP: Vec3 = p.rEci
    let minTpos: Vec3 = t.rEci
    for (let i = 0; i <= steps; i++) {
      const tau = (i / steps) * horizon
      const sp = propagateState({ r: p.rEci, v: p.vEci }, tau)
      const st = propagateState({ r: t.rEci, v: t.vEci }, tau)
      const r = norm(sub(sp.r, st.r))
      if (r < minR) {
        minR = r
        minT = tau
        minP = sp.r
        minTpos = st.r
      }
    }
    if (!Number.isFinite(minR) || minT <= 0) return null
    return {
      rangeKm: minR / 1000,
      tSec: minT,
      p3: eciToThreeUnits(minP),
      t3: eciToThreeUnits(minTpos),
    }
  }, [mission, spacecraft, activeAssetId])

  if (!cpa) return null
  const midpoint: [number, number, number] = [
    (cpa.p3[0] + cpa.t3[0]) / 2,
    (cpa.p3[1] + cpa.t3[1]) / 2,
    (cpa.p3[2] + cpa.t3[2]) / 2,
  ]
  const dotR = mToUnits(20_000)

  return (
    <group>
      {/* Dashed line between predicted positions */}
      <Line
        points={[cpa.p3, cpa.t3]}
        color={new THREE.Color(colors.magenta)}
        lineWidth={1.5}
        dashed
        dashSize={0.03}
        gapSize={0.025}
        transparent
        opacity={0.85}
      />
      {/* Endpoints */}
      <mesh position={cpa.p3}>
        <sphereGeometry args={[dotR, 10, 10]} />
        <meshBasicMaterial color={colors.magenta} />
      </mesh>
      <mesh position={cpa.t3}>
        <sphereGeometry args={[dotR, 10, 10]} />
        <meshBasicMaterial color={colors.magenta} />
      </mesh>
      {/* Label at midpoint */}
      <Html position={midpoint} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1.5 py-0.5"
          style={{
            color: colors.magenta,
            background: 'rgba(10, 14, 20, 0.7)',
            border: `1px solid ${colors.magenta}55`,
          }}
        >
          CPA {cpa.rangeKm.toFixed(1)} km · {(cpa.tSec / 60).toFixed(1)} min
        </div>
      </Html>
    </group>
  )
}
