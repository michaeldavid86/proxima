import type { ReactNode } from 'react'

export type ChipTone = 'cyan' | 'amber' | 'red' | 'green' | 'dim'

export default function Chip({ tone = 'cyan', children }: { tone?: ChipTone; children: ReactNode }) {
  const cls =
    tone === 'amber'
      ? 'border-mc-amber/60 text-mc-amber'
      : tone === 'red'
        ? 'border-mc-red/60 text-mc-red'
        : tone === 'green'
          ? 'border-mc-green/60 text-mc-green'
          : tone === 'dim'
            ? 'border-mc-dim/60 text-mc-dim'
            : 'border-mc-cyan/60 text-mc-cyan'
  return <span className={`chip ${cls}`}>{children}</span>
}
