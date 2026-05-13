// Yellow sun-direction arrow and a colored arc subtending the CATS angle,
// drawn at the target origin in 3D. Only visible when the camera is close to
// the target (proximity preset).
import { Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'
import { useGame } from '../game/state'
import { computeCatsAngle, sunDirectionEci } from '../engagement/cats'
import { mToUnits } from './units'
import { eciToThreeUnits } from './Orbit3D'

const ARROW_LEN_M = 30_000

export default function CatsAngleIndicator3D() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const simTime = useGame((s) => s.simTimeSec)
  const preset = useGame((s) => s.scalePreset)

  const data = useMemo(() => {
    if (!mission || preset !== 'proximity') return null
    const tgt = spacecraft[mission.targetId]
    const chase = spacecraft[activeAssetId ?? mission.playerId]
    if (!tgt || !chase) return null
    const cats = computeCatsAngle(tgt, chase, simTime)
    const sunDir = sunDirectionEci(simTime)
    // Convert ECI directions to Three.js axis convention.
    const sunThree = new THREE.Vector3(sunDir[0], sunDir[2], -sunDir[1]).normalize()
    // rho direction unit vector from target to chase.
    const rho = cats.rhoVecEci
    const rhoMag = Math.hypot(rho[0], rho[1], rho[2]) || 1
    const rhoUnit = new THREE.Vector3(
      rho[0] / rhoMag,
      rho[2] / rhoMag,
      -rho[1] / rhoMag,
    ).normalize()
    const tgtThree = eciToThreeUnits(tgt.rEci as [number, number, number])
    const len = mToUnits(ARROW_LEN_M)
    return {
      tgtThree,
      sunTip: [
        tgtThree[0] + sunThree.x * len,
        tgtThree[1] + sunThree.y * len,
        tgtThree[2] + sunThree.z * len,
      ] as [number, number, number],
      rhoTip: [
        tgtThree[0] + rhoUnit.x * len,
        tgtThree[1] + rhoUnit.y * len,
        tgtThree[2] + rhoUnit.z * len,
      ] as [number, number, number],
      angleDeg: cats.angleDeg,
      favorability: cats.favorability,
    }
  }, [mission, spacecraft, activeAssetId, simTime, preset])

  if (!data) return null

  const arcColor =
    data.favorability === 'favorable'
      ? '#35e08c'
      : data.favorability === 'marginal'
        ? '#ffb800'
        : '#ff4466'

  return (
    <group>
      {/* Sun direction arrow */}
      <Line
        points={[data.tgtThree, data.sunTip]}
        color={new THREE.Color('#ffcc33')}
        lineWidth={2}
      />
      <Html position={data.sunTip} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color: '#ffcc33', textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          ☉ Sun
        </div>
      </Html>
      {/* rho direction (target -> chase) */}
      <Line
        points={[data.tgtThree, data.rhoTip]}
        color={new THREE.Color(arcColor)}
        lineWidth={2}
        dashed
        dashSize={0.025}
        gapSize={0.02}
      />
      <Html position={data.rhoTip} center zIndexRange={[1, 1]} style={{ pointerEvents: 'none' }}>
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1"
          style={{ color: arcColor, textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        >
          ρ → chase
        </div>
      </Html>
      {/* Angle label between them */}
      <Html
        position={[
          (data.sunTip[0] + data.rhoTip[0]) / 2 + data.tgtThree[0] * 0.0,
          (data.sunTip[1] + data.rhoTip[1]) / 2,
          (data.sunTip[2] + data.rhoTip[2]) / 2,
        ]}
        center
        zIndexRange={[1, 1]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="font-mono text-[10px] whitespace-nowrap px-1.5 py-0.5"
          style={{
            color: arcColor,
            background: 'rgba(10, 14, 20, 0.7)',
            border: `1px solid ${arcColor}55`,
          }}
        >
          CATS {data.angleDeg.toFixed(0)}°
        </div>
      </Html>
    </group>
  )
}
