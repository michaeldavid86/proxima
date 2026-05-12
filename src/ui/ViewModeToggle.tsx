// 2D / 3D view toggle. Chip-style selector docked top-right inside the canvas.
// State change is purely visual; sim time, planned maneuvers, telemetry, and
// log all persist across the toggle.
import { useGame, type ViewMode3D } from '../game/state'

const MODES: { id: ViewMode3D; label: string; hint: string }[] = [
  { id: '2d', label: '2D', hint: 'Top-down map view (default)' },
  { id: '3d', label: '3D', hint: 'Interactive 3D scene with full orbital geometry' },
]

export default function ViewModeToggle() {
  const mode = useGame((s) => s.viewMode3D)
  const setMode = useGame((s) => s.setViewMode3D)
  return (
    <div className="pointer-events-auto flex items-center gap-1 border border-mc-cyan/30 bg-panel-fill px-1 py-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          title={m.hint}
          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border transition-colors ${
            mode === m.id
              ? 'border-mc-cyan bg-mc-cyan/10 text-mc-cyan'
              : 'border-transparent text-mc-dim hover:text-mc-cyan'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
