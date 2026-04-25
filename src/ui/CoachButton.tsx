import { useState } from 'react'
import CoachModal from './CoachModal'

export default function CoachButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-3 border border-mc-cyan/60 bg-panel-fill px-4 py-3 transition-colors hover:border-mc-cyan hover:bg-mc-cyan/10"
      >
        <span className="text-xl">💬</span>
        <div className="flex flex-col items-start">
          <span className="font-mono text-sm uppercase tracking-widest text-mc-cyan">
            Debrief with Coach
          </span>
          <span className="font-mono text-[10px] text-mc-dim">
            Claude Haiku · powered by Anthropic
          </span>
        </div>
      </button>
      {open && <CoachModal onClose={() => setOpen(false)} />}
    </>
  )
}
