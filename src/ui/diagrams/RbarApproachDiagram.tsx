export default function RbarApproachDiagram() {
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <defs>
        <marker id="arrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
      </defs>
      <circle cx="200" cy="70" r="6" fill="#ffb800" />
      <rect x="192" y="62" width="16" height="16" fill="none" stroke="#ffb800" />
      <text x="220" y="70" fill="#ffb800" fontSize="10" fontFamily="monospace">
        Target
      </text>
      <line x1="200" y1="30" x2="200" y2="220" stroke="#6a7380" strokeDasharray="2 3" />
      <text x="208" y="35" fill="#c4cdd9" fontSize="10" fontFamily="monospace">
        +R-bar
      </text>
      <circle cx="200" cy="200" r="5" fill="#00d4ff" />
      <text x="212" y="205" fill="#00d4ff" fontSize="10" fontFamily="monospace">
        Chaser
      </text>
      <line x1="200" y1="195" x2="200" y2="90" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arrR)" />
      <text x="200" y="232" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        R-bar approach: tight corridor, passive drift is NOT safe.
      </text>
    </svg>
  )
}
