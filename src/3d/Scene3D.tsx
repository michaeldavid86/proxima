// Top-level R3F Canvas wrapper. Hosts Earth, orbits, spacecraft, and camera
// controls. Designed to coexist with the existing 2D views; mounted as an
// alternate to MapView / ProxView based on the v1.3 ViewModeToggle.
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import { R_EARTH } from '../physics/constants'
import { stateToCoe } from '../physics/orbital-elements'
import { useGame } from '../game/state'
import Earth3D from './Earth3D'
import Starfield3D from './Starfield3D'
import Orbit3D from './Orbit3D'
import Spacecraft3D from './Spacecraft3D'
import ManeuverPreview3D from './ManeuverPreview3D'
import CameraController from './CameraController'
import RicFrame3D from './RicFrame3D'
import CpaMarker3D from './CpaMarker3D'
import { mToUnits } from './units'
import { colors, assetColor } from '../theme/colors'

export default function Scene3D() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const controllerId = activeAssetId ?? mission?.playerId ?? ''

  // Initial camera distance scales with the largest orbit in the mission so we
  // always frame the regime on mount.
  const initialCamDistanceUnits = useMemo(() => {
    if (!mission) return 2.5
    const maxA = Math.max(...mission.spacecraft.map((s) => s.coe.a))
    return mToUnits(maxA) * 2.5
  }, [mission])

  // Resolve each ship's COE live from its current ECI state vector. This is
  // what the 2D MapView does too: there is no separate "render COE" in state;
  // we compute it on the fly so the 3D layer never duplicates physics math.
  const shipsRender = useMemo(() => {
    if (!mission) return []
    return Object.values(spacecraft).map((s) => ({
      ship: s,
      coe: stateToCoe({ r: s.rEci, v: s.vEci }),
      isTarget: mission.targetId === s.id,
      isController: controllerId === s.id,
      assetIdx: mission.assets ? mission.assets.indexOf(s.id) : -1,
    }))
  }, [mission, spacecraft, controllerId])

  const orbitColorFor = (
    side: 'blue' | 'red' | 'neutral',
    isTarget: boolean,
    assetIdx: number,
  ): string => {
    if (assetIdx >= 0) return assetColor(assetIdx)
    if (side === 'blue') return colors.friendly
    if (side === 'red') return colors.adversary
    return isTarget ? colors.amber : colors.neutral
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [initialCamDistanceUnits, initialCamDistanceUnits * 0.5, initialCamDistanceUnits],
          fov: 45,
          near: 0.01,
          far: 1000,
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0a0e14']} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[40, 10, 20]} intensity={1.05} color="#ffffff" />
        <Starfield3D />
        <Earth3D />
        {shipsRender.map(({ ship, coe, isTarget, assetIdx }) => (
          <Orbit3D
            key={`orbit-${ship.id}`}
            coe={coe}
            color={orbitColorFor(ship.side, isTarget, assetIdx)}
            lineWidth={isTarget ? 1.6 : 1.3}
            opacity={isTarget ? 0.9 : 0.7}
          />
        ))}
        {shipsRender.map(({ ship, isTarget, isController, assetIdx }) => (
          <Spacecraft3D
            key={`sc-${ship.id}`}
            ship={ship}
            isTarget={isTarget}
            isController={isController}
            assetIdx={assetIdx >= 0 ? assetIdx : null}
          />
        ))}
        <ManeuverPreview3D />
        <CpaMarker3D />
        <RicFrame3D />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={mToUnits(R_EARTH) * 1.05}
          maxDistance={50}
        />
        <CameraController />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mc-dim">
        <span>3D</span>
        <span className="text-mc-cyan">ECI</span>
        <span>drag to orbit · scroll to zoom</span>
      </div>
    </div>
  )
}
