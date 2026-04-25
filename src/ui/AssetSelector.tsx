// AssetSelector — top-bar chip row for multi-asset missions.
// Shows every friendly asset with range-to-target and remaining delta-V.
// Clicking a chip sets it as the active asset. Keyboard: A (first), B (second).
import { useEffect } from 'react'
import { useGame } from '../game/state'
import { norm, sub } from '../physics/vec'
import { budgetFromMass } from '../game/operational-life'
import { assetColor } from '../theme/colors'

export default function AssetSelector() {
  const mission = useGame((s) => s.mission)
  const spacecraft = useGame((s) => s.spacecraft)
  const activeAssetId = useGame((s) => s.activeAssetId)
  const setActiveAsset = useGame((s) => s.setActiveAsset)
  const perAssetDvUsed = useGame((s) => s.perAssetDvUsed)
  const mode = useGame((s) => s.mode)

  useEffect(() => {
    if (!mission?.assets) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'KeyA' && mission.assets?.[0]) setActiveAsset(mission.assets[0])
      else if (e.code === 'KeyB' && mission.assets?.[1]) setActiveAsset(mission.assets[1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mission, setActiveAsset])

  if (!mission?.assets || mission.assets.length < 2) return null
  const target = spacecraft[mission.targetId]

  return (
    <div className="flex items-center gap-2 border-b border-mc-cyan/20 bg-panel-bg/60 px-4 py-2">
      <span className="panel-title mr-2">Assets</span>
      {mission.assets.map((id, idx) => {
        const ship = spacecraft[id]
        if (!ship) return null
        const loadout = mission.spacecraft.find((s) => s.id === id)!
        const budget = budgetFromMass(loadout.dryMass, loadout.propellantMass, loadout.isp)
        const dvUsed = perAssetDvUsed[id] ?? 0
        const dvRem = Math.max(0, budget - dvUsed)
        const rKm = target ? norm(sub(ship.rEci, target.rEci)) / 1000 : 0
        const active = id === activeAssetId
        const color = assetColor(idx)
        return (
          <button
            key={id}
            onClick={() => setActiveAsset(id)}
            disabled={mode === 'watch'}
            className={`flex items-center gap-3 border px-3 py-1 font-mono text-[11px] transition-colors ${
              active
                ? 'bg-mc-cyan/10 shadow-glow'
                : 'border-mc-cyan/20 hover:bg-mc-cyan/5'
            }`}
            style={{ borderColor: active ? color : undefined }}
          >
            <span className="flex items-center gap-1" style={{ color }}>
              {active && <span className="text-[10px]">★</span>}
              {ship.name}
            </span>
            <span className="text-mc-dim">
              Δv <span className="text-mc-text">{dvRem.toFixed(0)}</span> m/s
            </span>
            <span className="text-mc-dim">
              rng <span className="text-mc-text">{rKm.toFixed(0)}</span> km
            </span>
            {idx < 2 && (
              <span className="font-mono text-[9px] text-mc-dim">[{idx === 0 ? 'A' : 'B'}]</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
