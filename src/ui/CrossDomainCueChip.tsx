// Small inline chip that surfaces a Cross-Domain Cue. Hovering reveals the
// analogy tooltip. Used on mission briefs and the Learning Track engagement
// section.
import { useState } from 'react'
import type { CrossDomainCue, Domain } from '../cross-domain/cues'

const DOMAIN_LABEL: Record<Domain, string> = {
  air: 'Air',
  cyber: 'Cyber',
  ew: 'EW',
  land: 'Land',
}

const DOMAIN_COLOR: Record<Domain, string> = {
  air: 'border-mc-cyan/60 text-mc-cyan',
  cyber: 'border-mc-amber/60 text-mc-amber',
  ew: 'border-mc-red/60 text-mc-red',
  land: 'border-mc-green/60 text-mc-green',
}

export default function CrossDomainCueChip({ cue }: { cue: CrossDomainCue }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <span
        className={`chip cursor-help ${DOMAIN_COLOR[cue.domain]}`}
        aria-describedby={`cdc-${cue.id}`}
      >
        ↔ {DOMAIN_LABEL[cue.domain]}: {cue.spaceConcept}
      </span>
      {open && (
        <div
          id={`cdc-${cue.id}`}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1 w-72 border border-mc-cyan/40 bg-panel-fill p-2 text-[10px] leading-snug text-mc-text shadow-glow"
        >
          <div className="mb-1 font-mono uppercase tracking-widest text-mc-amber">
            Cross-Domain Cue · {DOMAIN_LABEL[cue.domain]}
          </div>
          <div>{cue.analogy}</div>
          {cue.citation && (
            <div className="mt-1 text-[9px] text-mc-dim">Source: {cue.citation}</div>
          )}
        </div>
      )}
    </div>
  )
}
