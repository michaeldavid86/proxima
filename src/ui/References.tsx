// References modal — public sources used throughout the trainer.
import Button from './components/Button'

interface Section {
  heading: string
  items: { label: string; detail?: string; url?: string }[]
}

const sections: Section[] = [
  {
    heading: 'Orbital mechanics',
    items: [
      { label: 'Vallado — Fundamentals of Astrodynamics and Applications, 4th ed.' },
      { label: 'Curtis — Orbital Mechanics for Engineering Students, 3rd ed.' },
      {
        label: 'Clohessy & Wiltshire (1960)',
        detail: 'Terminal Guidance System for Satellite Rendezvous, J. Aerospace Sci.',
      },
      {
        label: 'NASA NTRS',
        detail: 'Reference Equations of Motion for Automatic Rendezvous (1993)',
        url: 'https://ntrs.nasa.gov/',
      },
    ],
  },
  {
    heading: 'Doctrine',
    items: [
      {
        label: 'U.S. Space Force — Space Warfighting: A Framework for Planners (April 2025)',
        url: 'https://www.spaceforce.mil/',
      },
      { label: 'U.S. Space Force Doctrine Document 1' },
    ],
  },
  {
    heading: 'Mission context',
    items: [
      {
        label: 'Secure World Foundation — U.S. Military and Intelligence RPO Fact Sheet',
        url: 'https://swfound.org/resource-library/',
      },
      { label: 'CSIS — Space Threat Assessment (annual)', url: 'https://aerospace.csis.org/space-threat-assessment/' },
      {
        label: 'Aerospace Corporation — Getting in Your Space',
        detail: 'Learning from past RPO events',
      },
      { label: 'SpaceNews, Breaking Defense — GSSAP / Luch-Olymp / SJ-21 / Meadowlands coverage' },
    ],
  },
  {
    heading: 'Link budget / EW',
    items: [
      {
        label: 'ITU-R recommendations on antenna pattern modeling (e.g. ITU-R S.672)',
        url: 'https://www.itu.int/rec/R-REC-S/en',
      },
      {
        label: 'Friis (1946) — A Note on a Simple Transmission Formula, Proc. IRE',
      },
    ],
  },
]

export default function References({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto border border-mc-cyan/40 bg-panel-fill p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">Public sources</div>
            <div className="text-xl text-mc-cyan">References</div>
          </div>
          <Button onClick={onClose}>Close</Button>
        </header>
        <div className="space-y-4 text-sm leading-relaxed text-mc-text">
          {sections.map((s) => (
            <div key={s.heading}>
              <div className="panel-title mb-1">{s.heading}</div>
              <ul className="space-y-1 text-xs">
                {s.items.map((it) => (
                  <li key={it.label} className="flex flex-wrap items-baseline gap-x-2">
                    {it.url ? (
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-mc-cyan underline decoration-mc-cyan/40 underline-offset-2 hover:text-mc-amber"
                      >
                        {it.label}
                      </a>
                    ) : (
                      <span className="text-mc-text">{it.label}</span>
                    )}
                    {it.detail && <span className="text-mc-dim">— {it.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
