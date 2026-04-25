export default function VbarApproachDiagram() {
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <defs>
        <marker id="arrV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
      </defs>
      {/* Target */}
      <circle cx="100" cy="120" r="6" fill="#ffb800" />
      <rect x="92" y="112" width="16" height="16" fill="none" stroke="#ffb800" />
      <text x="95" y="100" fill="#ffb800" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Target
      </text>
      {/* V-bar axis */}
      <line x1="40" y1="120" x2="380" y2="120" stroke="#6a7380" strokeDasharray="2 3" />
      <text x="360" y="135" fill="#c4cdd9" fontSize="10" fontFamily="monospace">
        +V-bar
      </text>
      {/* Chaser approaching along V-bar */}
      <circle cx="320" cy="120" r="5" fill="#00d4ff" />
      <text x="325" y="110" fill="#00d4ff" fontSize="10" fontFamily="monospace">
        Chaser
      </text>
      {/* Approach vector */}
      <line x1="315" y1="120" x2="140" y2="120" stroke="#00d4ff" strokeWidth="1.5" markerEnd="url(#arrV)" />
      {/* Passive-safety arrows: showing drift apart along V-bar if unpowered */}
      <path d="M 300 105 q -20 -15 -40 -5" fill="none" stroke="#35e08c" strokeWidth="1" strokeDasharray="2 2" />
      <text x="230" y="85" fill="#35e08c" fontSize="9" fontFamily="monospace">
        unpowered drift (safe)
      </text>
      <text x="200" y="210" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        V-bar approach: passive-safe if you stop burning.
      </text>
    </svg>
  )
}
