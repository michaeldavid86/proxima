// Loadout detail — reused inside Brief; kept as its own module per the spec's
// directory layout. Shows a compact readout of one spacecraft.
import { R_EARTH } from '../physics/constants'
import type { SpacecraftLoadout } from '../missions/types'

export default function Loadout({ loadout }: { loadout: SpacecraftLoadout }) {
  return (
    <div className="border border-mc-cyan/20 p-2 font-mono text-[11px] text-mc-text">
      <div className="text-mc-cyan">{loadout.name}</div>
      <div className="text-[10px] uppercase tracking-widest text-mc-dim">
        {loadout.side} / {loadout.regime}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-mc-dim">altitude</span>
        <span>{((loadout.coe.a - R_EARTH) / 1000).toFixed(0)} km</span>
        <span className="text-mc-dim">Isp</span>
        <span>{loadout.isp} s</span>
      </div>
    </div>
  )
}
