import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/state'
import Panel from './components/Panel'

export default function NarrationPanel() {
  const activeNarration = useGame((s) => s.activeNarration)
  const currentPhase = useGame((s) => s.currentPhase)
  const [visibleKey, setVisibleKey] = useState(0)
  const lastBlockRef = useRef(activeNarration)

  // Crossfade when narration content changes.
  useEffect(() => {
    if (activeNarration && activeNarration !== lastBlockRef.current) {
      lastBlockRef.current = activeNarration
      setVisibleKey((k) => k + 1)
    }
  }, [activeNarration])

  if (!activeNarration) {
    return (
      <Panel title="Narration">
        <div className="p-3 text-xs text-mc-dim">
          Awaiting playback. Press ▶ to begin the vignette.
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Narration">
      <div
        key={visibleKey}
        className="flex flex-col gap-2 p-3 text-xs leading-relaxed"
        style={{ animation: 'narrFade 150ms ease-in' }}
      >
        {currentPhase && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-mc-cyan">
            {currentPhase}
          </div>
        )}
        <div className="font-mono text-sm text-mc-cyan">{activeNarration.title}</div>
        <div className="text-mc-text">{activeNarration.body}</div>
        {activeNarration.operationalNote && (
          <div className="mt-1 border border-mc-amber/50 bg-mc-amber/5 p-2 font-mono text-[11px] text-mc-amber">
            {activeNarration.operationalNote}
          </div>
        )}
        {activeNarration.citation && (
          <div className="text-[10px] text-mc-dim">{activeNarration.citation}</div>
        )}
      </div>
      <style>{`
        @keyframes narrFade {
          from { opacity: 0.0 }
          to { opacity: 1 }
        }
      `}</style>
    </Panel>
  )
}
