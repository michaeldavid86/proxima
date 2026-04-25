export default function HohmannDiagram() {
  return (
    <svg viewBox="0 0 400 240" className="w-full">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#00d4ff" />
        </marker>
      </defs>
      {/* Earth */}
      <circle cx="200" cy="120" r="22" fill="#0e2238" stroke="#1a4267" />
      <text x="200" y="125" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Earth
      </text>
      {/* Inner circular orbit */}
      <circle cx="200" cy="120" r="60" fill="none" stroke="#6a7380" strokeDasharray="2 3" />
      {/* Outer circular orbit */}
      <circle cx="200" cy="120" r="95" fill="none" stroke="#6a7380" strokeDasharray="2 3" />
      {/* Transfer ellipse: semi-major axis = (60+95)/2 = 77.5, centered between them */}
      <ellipse cx="182.5" cy="120" rx="77.5" ry="70" fill="none" stroke="#00d4ff" />
      {/* Burn 1 at periapsis (left side of inner orbit) */}
      <circle cx="140" cy="120" r="4" fill="#ffb800" />
      <line x1="140" y1="120" x2="115" y2="120" stroke="#ffb800" strokeWidth="2" markerEnd="url(#arr)" />
      <text x="90" y="112" fill="#ffb800" fontSize="10" fontFamily="monospace">
        Δv₁
      </text>
      {/* Burn 2 at apoapsis (right side of outer orbit) */}
      <circle cx="260" cy="120" r="4" fill="#ffb800" />
      <line x1="260" y1="120" x2="300" y2="120" stroke="#ffb800" strokeWidth="2" markerEnd="url(#arr)" />
      <text x="305" y="112" fill="#ffb800" fontSize="10" fontFamily="monospace">
        Δv₂
      </text>
      {/* Orbit labels */}
      <text x="200" y="32" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Higher circular orbit
      </text>
      <text x="200" y="62" fill="#6a7380" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Starting circular orbit
      </text>
      <text x="200" y="212" fill="#00d4ff" fontSize="10" fontFamily="monospace" textAnchor="middle">
        Transfer ellipse
      </text>
    </svg>
  )
}
