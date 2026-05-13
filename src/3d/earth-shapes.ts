// Rough continent silhouettes used to draw a recognizable Earth without
// shipping any binary texture files.
//
// Coordinates are [longitude, latitude] in degrees. Longitudes use the
// convention -180..+180 with 0 at the prime meridian (Greenwich).
// These polygons are deliberately coarse — recognizable as "Earth" at
// favicon-to-globe scale, not geographically precise.
export type LonLat = [number, number]

export const NORTH_AMERICA: LonLat[] = [
  [-168, 65], [-156, 71], [-130, 70], [-95, 75], [-80, 80], [-62, 82],
  [-55, 70], [-70, 50], [-80, 45], [-77, 30], [-95, 25], [-105, 22],
  [-117, 32], [-125, 40], [-135, 56], [-155, 60], [-168, 65],
]

export const SOUTH_AMERICA: LonLat[] = [
  [-80, 12], [-65, 10], [-55, 5], [-50, -5], [-40, -10], [-35, -23],
  [-50, -35], [-60, -45], [-71, -53], [-72, -45], [-73, -30],
  [-79, -10], [-80, 0], [-80, 12],
]

export const EUROPE: LonLat[] = [
  [-9, 36], [-2, 38], [10, 38], [18, 40], [28, 41], [40, 47], [40, 55],
  [30, 65], [20, 68], [5, 60], [-5, 50], [-9, 43], [-9, 36],
]

export const AFRICA: LonLat[] = [
  [-15, 35], [-5, 35], [10, 36], [25, 32], [33, 31], [35, 22], [42, 14],
  [50, 12], [50, 0], [40, -10], [38, -20], [30, -30], [22, -34],
  [12, -25], [10, -10], [0, 0], [-5, 10], [-15, 22], [-15, 35],
]

export const ASIA: LonLat[] = [
  [30, 68], [50, 72], [75, 78], [100, 78], [130, 75], [160, 70],
  [175, 65], [165, 55], [145, 50], [140, 35], [125, 22], [110, 8],
  [100, 5], [92, 12], [82, 8], [70, 25], [55, 30], [45, 35], [40, 50],
  [30, 60], [30, 68],
]

export const AUSTRALIA: LonLat[] = [
  [113, -22], [125, -13], [136, -12], [145, -10], [153, -25],
  [150, -35], [140, -38], [125, -34], [115, -34], [113, -22],
]

export const GREENLAND: LonLat[] = [
  [-55, 83], [-25, 83], [-20, 75], [-30, 65], [-50, 60], [-55, 70], [-55, 83],
]

export const ANTARCTICA: LonLat[] = [
  [-180, -68], [-90, -65], [-30, -66], [30, -69], [90, -68],
  [150, -67], [180, -68], [180, -88], [-180, -88], [-180, -68],
]

export const MADAGASCAR: LonLat[] = [
  [43, -12], [50, -16], [49, -25], [45, -25], [43, -12],
]

export const NEW_ZEALAND: LonLat[] = [
  [172, -34], [178, -41], [171, -47], [167, -45], [172, -34],
]

export const JAPAN: LonLat[] = [
  [130, 31], [141, 38], [145, 44], [141, 45], [132, 34], [130, 31],
]

export const UK: LonLat[] = [
  [-6, 50], [2, 53], [-1, 58], [-6, 56], [-6, 50],
]

export const ICELAND: LonLat[] = [
  [-24, 64], [-13, 66], [-15, 64], [-24, 64],
]

export const CONTINENTS: LonLat[][] = [
  NORTH_AMERICA,
  SOUTH_AMERICA,
  EUROPE,
  AFRICA,
  ASIA,
  AUSTRALIA,
  GREENLAND,
  ANTARCTICA,
  MADAGASCAR,
  NEW_ZEALAND,
  JAPAN,
  UK,
  ICELAND,
]
