// Scale preset chip selector for the 3D view. Cycles between regime-level,
// close (around the active asset), proximity (close to the target), and free
// (user-controlled with OrbitControls).
import { useGame, type ScalePreset } from '../game/state'

const PRESETS: { id: ScalePreset; label: string; hint: string }[] = [
  { id: 'regime', label: 'Regime', hint: 'Frame the full orbital regime (Earth + farthest orbit)' },
  { id: 'close', label: 'Close', hint: 'Frame within ~500 km of the active asset' },
  { id: 'proximity', label: 'Prox', hint: 'Frame within ~50 km of the target' },
  { id: 'free', label: 'Free', hint: 'User-controlled camera (drag to orbit, scroll to zoom)' },
]

export default function ScalePresetSelector() {
  const preset = useGame((s) => s.scalePreset)
  const setPreset = useGame((s) => s.setScalePreset)
  return (
    <div className="pointer-events-auto flex items-center gap-1 border border-mc-cyan/30 bg-panel-fill px-1 py-1">
      <span className="px-1 font-mono text-[9px] uppercase tracking-widest text-mc-dim">Scale</span>
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => setPreset(p.id)}
          title={p.hint}
          className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border transition-colors ${
            preset === p.id
              ? 'border-mc-cyan bg-mc-cyan/10 text-mc-cyan'
              : 'border-transparent text-mc-dim hover:text-mc-cyan'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
