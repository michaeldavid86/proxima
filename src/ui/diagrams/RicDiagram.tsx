export default function RicDiagram() {
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <defs>
        <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
        <marker id="arr2a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffb800" />
        </marker>
      </defs>
      {/* Target at origin */}
      <circle cx="200" cy="120" r="5" fill="#ffb800" />
      <rect x="192" y="112" width="16" height="16" fill="none" stroke="#ffb800" />
      <text x="214" y="115" fill="#ffb800" fontSize="10" fontFamily="monospace">
        Target
      </text>
      {/* In-track (V-bar) axis horizontal */}
      <line x1="40" y1="120" x2="360" y2="120" stroke="#6a7380" />
      <line x1="360" y1="120" x2="350" y2="116" stroke="#6a7380" />
      <line x1="360" y1="120" x2="350" y2="124" stroke="#6a7380" />
      <text x="320" y="136" fill="#c4cdd9" fontSize="11" fontFamily="monospace">
        +In-track (V-bar)
      </text>
      {/* Radial (R-bar) axis vertical */}
      <line x1="200" y1="20" x2="200" y2="220" stroke="#6a7380" />
      <line x1="200" y1="20" x2="196" y2="30" stroke="#6a7380" />
      <line x1="200" y1="20" x2="204" y2="30" stroke="#6a7380" />
      <text x="208" y="28" fill="#c4cdd9" fontSize="11" fontFamily="monospace">
        +Radial (R-bar, out)
      </text>
      <text x="208" y="215" fill="#6a7380" fontSize="11" fontFamily="monospace">
        -Radial (toward Earth)
      </text>
      {/* Drift arrows: higher (top) drifts backward (left) */}
      <path d="M 300 60 q -30 0 -60 10" fill="none" stroke="#ffb800" strokeWidth="1.5" markerEnd="url(#arr2a)" />
      <text x="245" y="55" fill="#ffb800" fontSize="10" fontFamily="monospace">
        higher = drifts back
      </text>
      {/* Lower drifts forward */}
      <path d="M 100 180 q 30 0 60 -10" fill="none" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arr2)" />
      <text x="80" y="202" fill="#00d4ff" fontSize="10" fontFamily="monospace">
        lower = drifts forward
      </text>
      <text x="200" y="232" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        RIC: Radial / In-track / Cross-track
      </text>
    </svg>
  )
}
