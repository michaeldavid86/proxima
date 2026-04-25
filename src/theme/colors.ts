// Mission-control palette, also referenced from canvas rendering.
export const colors = {
  bg: '#0a0e14',
  panelBg: 'rgba(10, 14, 20, 0.85)',
  grid: '#141a24',
  gridStrong: '#1a2230',
  text: '#c4cdd9',
  dim: '#6a7380',
  cyan: '#00d4ff',
  cyanDim: '#0891a8',
  amber: '#ffb800',
  red: '#ff4466',
  green: '#35e08c',
  magenta: '#ff5cdc',
  earth: '#0e2238',
  earthRim: '#1a4267',
  friendly: '#00d4ff',
  // v1.2 second friendly asset (Mission 4 Bravo): distinct from primary cyan
  // but recognizably on the blue team.
  friendlyAlt: '#6ba6ff',
  adversary: '#ff4466',
  neutral: '#6a7380',
} as const

// Per-asset color lookup for multi-asset missions. Index 0 -> primary cyan,
// index 1 -> secondary blue. Falls back to friendly cyan for higher indices.
export const assetColor = (index: number): string => {
  if (index === 0) return colors.friendly
  if (index === 1) return colors.friendlyAlt
  return colors.friendly
}
