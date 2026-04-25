import { useEffect } from 'react'
import { useGame } from '../game/state'
import Button from './components/Button'
import { diagramFor } from './diagrams'

export default function TeachingModal() {
  const modal = useGame((s) => s.activeTeachingModal)
  const phase = useGame((s) => s.currentPhase)
  const dismiss = useGame((s) => s.dismissTeachingModal)

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        dismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, dismiss])

  if (!modal) return null

  const Diagram = modal.diagram ? diagramFor(modal.diagram) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div
        className="w-full max-w-[720px] border border-mc-cyan/50 bg-panel-fill shadow-glow"
        style={{ animation: 'modalIn 180ms ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-mc-cyan/20 px-4 py-2">
          <div className="flex items-center gap-3">
            {phase && (
              <span className="chip border-mc-cyan/60 text-mc-cyan">{phase}</span>
            )}
            <span className="panel-title">Teaching moment</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
            Esc / Enter to continue
          </span>
        </div>
        <div className="space-y-3 p-6 text-sm leading-relaxed">
          <div className="text-2xl font-semibold text-mc-cyan">{modal.title}</div>
          <div className="text-mc-text">{modal.body}</div>
          {Diagram && (
            <div className="border border-mc-cyan/20 bg-panel-bg p-3">
              <Diagram />
            </div>
          )}
          {modal.operationalNote && (
            <div className="border border-mc-amber/50 bg-mc-amber/5 p-3 font-mono text-xs text-mc-amber">
              {modal.operationalNote}
            </div>
          )}
          {modal.citation && (
            <div className="text-[10px] text-mc-dim">Source: {modal.citation}</div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-mc-cyan/20 p-3">
          <Button onClick={dismiss} variant="warn">
            Continue ▶
          </Button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0)   }
        }
      `}</style>
    </div>
  )
}
