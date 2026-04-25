export default function LinkBudgetDiagram() {
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <defs>
        <marker id="arrLB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
        <marker id="arrLBR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff4466" />
        </marker>
      </defs>
      {/* Earth ground station */}
      <rect x="40" y="190" width="40" height="20" fill="#1a4267" />
      <line x1="60" y1="190" x2="60" y2="170" stroke="#6a7380" />
      <text x="40" y="225" fill="#6a7380" fontSize="10" fontFamily="monospace">
        Ground
      </text>
      {/* Satellite (victim) */}
      <rect x="280" y="40" width="30" height="15" fill="#0e2238" stroke="#00d4ff" />
      <text x="320" y="52" fill="#00d4ff" fontSize="10" fontFamily="monospace">
        Player SV
      </text>
      {/* Jammer */}
      <rect x="190" y="120" width="20" height="12" fill="#0e2238" stroke="#ff4466" />
      <text x="215" y="132" fill="#ff4466" fontSize="10" fontFamily="monospace">
        Jammer
      </text>
      {/* Signal arrow */}
      <line x1="60" y1="170" x2="280" y2="55" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arrLB)" />
      <text x="140" y="105" fill="#00d4ff" fontSize="10" fontFamily="monospace">
        S: wanted signal
      </text>
      {/* Jam arrow */}
      <line x1="210" y1="125" x2="288" y2="58" stroke="#ff4466" strokeWidth="1.5" markerEnd="url(#arrLBR)" />
      <text x="225" y="105" fill="#ff4466" fontSize="10" fontFamily="monospace">
        J
      </text>
      {/* Formula */}
      <text x="20" y="20" fill="#c4cdd9" fontSize="11" fontFamily="monospace">
        J/S = (Pj + Gj) - (Ps + Gs) + 20 log(Rs/Rj)
      </text>
    </svg>
  )
}
