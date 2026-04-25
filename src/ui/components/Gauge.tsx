interface Props {
  label: string
  value: number
  max: number
  unit?: string
  format?: (v: number) => string
  tone?: 'cyan' | 'amber' | 'red' | 'green'
  warnAt?: number // fraction of max
}

export default function Gauge({
  label,
  value,
  max,
  unit = '',
  format,
  tone = 'cyan',
  warnAt,
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max))
  const toneColor =
    tone === 'amber' ? 'bg-mc-amber' : tone === 'red' ? 'bg-mc-red' : tone === 'green' ? 'bg-mc-green' : 'bg-mc-cyan'
  const warn = warnAt !== undefined && pct >= warnAt
  const barColor = warn ? 'bg-mc-red' : toneColor
  const text = format ? format(value) : value.toFixed(1)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">{label}</span>
        <span className="font-mono text-xs text-mc-text">
          {text}
          {unit && <span className="ml-1 text-mc-dim">{unit}</span>}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden bg-mc-grid">
        <div className={`h-full ${barColor}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
