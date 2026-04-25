export default function AttributionLadder() {
  const rungs = [
    { label: 'Routine', color: '#35e08c', desc: 'Station-keeping, safe separation' },
    { label: 'Interest', color: '#00d4ff', desc: 'Slow patient V-bar closure' },
    { label: 'Concern', color: '#ffb800', desc: 'Close approach inside 20 km' },
    { label: 'Threat', color: '#ff4466', desc: 'Fast unannounced closure' },
  ]
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <line x1="60" y1="20" x2="60" y2="220" stroke="#6a7380" strokeWidth="2" />
      {rungs.map((r, i) => {
        const y = 30 + i * 50
        return (
          <g key={r.label}>
            <line x1="40" y1={y} x2="80" y2={y} stroke="#6a7380" />
            <rect x="90" y={y - 10} width="12" height="20" fill={r.color} />
            <text x="110" y={y} fill={r.color} fontSize="12" fontFamily="monospace">
              {r.label}
            </text>
            <text x="110" y={y + 14} fill="#6a7380" fontSize="10" fontFamily="monospace">
              {r.desc}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
