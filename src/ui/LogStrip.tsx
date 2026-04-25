import { useGame } from '../game/state'
import { fmtClock } from '../game/events'

export default function LogStrip() {
  const log = useGame((s) => s.log)
  const recent = log.slice(-6).reverse()
  return (
    <div className="flex h-20 w-full overflow-hidden border-t border-mc-cyan/20 bg-panel-fill">
      <div className="flex h-full flex-col gap-0.5 overflow-y-auto p-2 font-mono text-[11px] leading-snug">
        {recent.map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-mc-dim">{fmtClock(e.t)}</span>
            <span
              className={
                e.tone === 'warn'
                  ? 'text-mc-amber'
                  : e.tone === 'danger'
                    ? 'text-mc-red'
                    : e.tone === 'success'
                      ? 'text-mc-green'
                      : 'text-mc-text'
              }
            >
              {e.text}
            </span>
          </div>
        ))}
        {recent.length === 0 && <div className="text-mc-dim">&mdash;</div>}
      </div>
    </div>
  )
}
