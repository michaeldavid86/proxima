// Render one orbit as a parametric line in 3D ECI space.
// Pure presentation — no physics math. Samples the orbit by stepping true
// anomaly and rotating perifocal -> ECI using the same math as physics/orbital-elements.
import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { COE } from '../physics/orbital-elements'
import { coeToState } from '../physics/orbital-elements'
import { mToUnits } from './units'

interface Props {
  coe: COE
  color: string
  lineWidth?: number
  dashed?: boolean
  opacity?: number
  segments?: number
}

export default function Orbit3D({
  coe,
  color,
  lineWidth = 1.4,
  dashed = false,
  opacity = 0.7,
  segments = 128,
}: Props) {
  const points = useMemo<[number, number, number][]>(() => {
    if (!Number.isFinite(coe.a) || coe.e >= 1) return []
    const out: [number, number, number][] = []
    for (let i = 0; i <= segments; i++) {
      const nu = (i / segments) * 2 * Math.PI
      const sv = coeToState({ ...coe, nu })
      out.push([mToUnits(sv.r[0]), mToUnits(sv.r[2]), -mToUnits(sv.r[1])])
      // Note: we map (x, y, z)_ECI -> (x, z, -y)_three so Earth's spin axis
      // (Z in ECI) becomes Three.js's +Y (up), which is the conventional
      // orientation for our default camera.
    }
    return out
  }, [coe, segments])

  if (points.length === 0) return null

  return (
    <Line
      points={points}
      color={new THREE.Color(color)}
      lineWidth={lineWidth}
      dashed={dashed}
      dashSize={dashed ? 0.04 : undefined}
      gapSize={dashed ? 0.03 : undefined}
      transparent={opacity < 1}
      opacity={opacity}
    />
  )
}

// Helper for components that want to convert an ECI position into the same
// coordinate convention used by Orbit3D.
export const eciToThreeUnits = (rEci: [number, number, number]): [number, number, number] => [
  mToUnits(rEci[0]),
  mToUnits(rEci[2]),
  -mToUnits(rEci[1]),
]
