// Target-centered RIC (Radial / In-track / Cross-track) axis triad and
// reference grid plane. Renders in the 3D scene when scalePreset is
// 'proximity', giving the operator a clear sense of where +R, +I, +H point
// relative to the target. Mirrors the V-bar / R-bar labels in ProxView 2D.
import { useMemo } from 'react'
import { Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/state'
import { colors } from '../theme/colors'
import { mToUnits } from './units'
import { ricBasisOf } from '../physics/frames'
import { eciToThreeUnits } from './Orbit3D'

const AXIS_LEN_M = 30_000 // 30 km — large enough to read at proximity zoom

export default function RicFrame3D() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const preset = useGame((s) => s.scalePreset)

  const data = useMemo(() => {
    if (!mission) return null
    if (preset !== 'proximity') return null
    const tgt = spacecraft[mission.targetId]
    if (!tgt) return null

    const basis = ricBasisOf(tgt.rEci, tgt.vEci)
    const origin = eciToThreeUnits(tgt.rEci)

    // Each axis: from origin to origin + AXIS_LEN_M * unit_in_eci.
    // Apply the same ECI -> Three.js swap as eciToThreeUnits.
    const eciToThreeVec = (e: [number, number, number]): [number, number, number] => [
      e[0],
      e[2],
      -e[1],
    ]
    const lenUnits = mToUnits(AXIS_LEN_M)
    const rTip = origin.map(
      (v, i) => v + eciToThreeVec(basis.xHat)[i] * lenUnits,
    ) as [number, number, number]
    const iTip = origin.map(
      (v, i) => v + eciToThreeVec(basis.yHat)[i] * lenUnits,
    ) as [number, number, number]
    const hTip = origin.map(
      (v, i) => v + eciToThreeVec(basis.zHat)[i] * lenUnits,
    ) as [number, number, number]
    return { origin, rTip, iTip, hTip }
  }, [mission, spacecraft, preset])

  if (!data) return null
  const { origin, rTip, iTip, hTip } = data

  return (
    <group>
      {/* +R (radial out): magenta */}
      <Line points={[origin, rTip]} color={new THREE.Color(colors.magenta)} lineWidth={2} />
      <Html position={rTip} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color: colors.magenta, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          +R
        </div>
      </Html>
      {/* +I (in-track / V-bar): cyan */}
      <Line points={[origin, iTip]} color={new THREE.Color(colors.cyan)} lineWidth={2} />
      <Html position={iTip} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color: colors.cyan, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          +I (V-bar)
        </div>
      </Html>
      {/* +H (cross-track): green */}
      <Line points={[origin, hTip]} color={new THREE.Color(colors.green)} lineWidth={2} />
      <Html position={hTip} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color: colors.green, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          +H
        </div>
      </Html>
    </group>
  )
}
