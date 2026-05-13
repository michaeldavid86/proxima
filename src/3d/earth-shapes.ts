// High-fidelity continent polygons used to draw a recognizable Earth without
// shipping any binary texture files.
//
// Coordinates are [longitude, latitude] in degrees, with longitude in
// -180..+180 and latitude in -90..+90. These polygons are hand-tuned for
// recognizable silhouettes at the global scale — Florida, the Horn of
// Africa, India, the Iberian peninsula, Cape Horn, the Baltic, Kamchatka,
// the Bering Strait, the Indonesian arc, etc. are all visible.
// Not geographically precise, but unmistakably "Earth" at favicon-to-globe
// scales.
export type LonLat = [number, number]

// North America: from Alaska east along the Arctic coast, down Greenland-
// adjacent Atlantic coast through Maine, Cape Cod, Florida, the Gulf of
// Mexico, around Yucatan, Baja, up the Pacific coast through California,
// the Pacific Northwest, into Alaska, across the Aleutian-Bering area.
export const NORTH_AMERICA: LonLat[] = [
  [-168, 65], [-164, 71], [-152, 70], [-143, 70], [-126, 70], [-110, 69],
  [-95, 71], [-83, 73], [-78, 73], [-75, 78], [-68, 82], [-58, 83],
  [-55, 80], [-60, 74], [-62, 65], [-70, 60], [-75, 53], [-65, 47],
  [-58, 45], [-66, 44], [-70, 42], [-74, 39], [-77, 35], [-81, 31],
  [-80, 25], [-83, 25], [-83, 30], [-86, 30], [-87, 29], [-89, 30],
  [-94, 29], [-97, 28], [-97, 26], [-90, 21], [-87, 21], [-88, 18],
  [-92, 16], [-95, 16], [-100, 18], [-106, 22], [-110, 23], [-112, 28],
  [-115, 31], [-118, 34], [-120, 35], [-122, 38], [-124, 41], [-124, 47],
  [-123, 49], [-128, 53], [-135, 57], [-140, 60], [-145, 60], [-153, 60],
  [-160, 56], [-165, 55], [-168, 60], [-168, 65],
]

// South America: cone shape from the Caribbean coast around Cape Horn.
export const SOUTH_AMERICA: LonLat[] = [
  [-78, 12], [-72, 11], [-68, 11], [-62, 10], [-55, 6], [-52, 5],
  [-50, 0], [-44, -2], [-38, -8], [-35, -10], [-37, -17], [-39, -22],
  [-43, -23], [-45, -25], [-48, -28], [-58, -34], [-62, -38], [-65, -42],
  [-67, -45], [-65, -48], [-70, -52], [-68, -55], [-72, -54], [-74, -51],
  [-74, -45], [-73, -40], [-74, -34], [-71, -30], [-71, -20], [-79, -8],
  [-81, -5], [-79, 0], [-77, 5], [-78, 12],
]

// Europe: Iberia, France, Italy boot, Greece, Balkans, Russia north, Norway/
// Sweden, UK is separate.
export const EUROPE: LonLat[] = [
  [-9, 36], [-6, 36], [-1, 37], [2, 36], [5, 43], [3, 43], [-2, 43],
  [-2, 48], [0, 50], [3, 51], [7, 53], [9, 54], [12, 54], [15, 56],
  [21, 56], [24, 60], [27, 64], [30, 66], [33, 68], [40, 67], [42, 64],
  [40, 58], [40, 50], [40, 47], [40, 44], [42, 42], [36, 38], [28, 41],
  [23, 35], [18, 40], [12, 38], [10, 44], [13, 45], [8, 44], [3, 43],
  [-9, 36],
]

// Africa: Mediterranean coast → Horn → south to Cape → west coast back to
// Morocco. Includes the distinctive Mediterranean cuts, Gulf of Guinea, and
// Cape Town point.
export const AFRICA: LonLat[] = [
  [-10, 35], [0, 36], [10, 37], [20, 32], [32, 31], [33, 27], [35, 22],
  [38, 17], [42, 14], [44, 12], [50, 12], [51, 8], [48, 5], [42, 3],
  [42, -1], [40, -10], [40, -16], [35, -22], [32, -27], [30, -32], [25, -34],
  [22, -34], [18, -35], [15, -32], [13, -27], [11, -20], [9, -15], [9, -5],
  [9, 0], [5, 3], [-1, 5], [-5, 5], [-10, 6], [-13, 9], [-17, 12],
  [-17, 16], [-17, 20], [-13, 26], [-10, 30], [-10, 35],
]

// Asia: vast — from Ural mountains east through Siberia, Kamchatka, China
// coast, Indonesian arc, India peninsula, Arabian peninsula, back to Caucasus.
export const ASIA: LonLat[] = [
  // Eurasia border (continuing from Europe)
  [42, 64], [50, 68], [60, 70], [70, 70], [80, 72], [95, 74], [110, 74],
  [125, 73], [135, 71], [142, 67], [160, 67], [165, 60], [160, 55],
  [155, 49], [142, 53], [140, 45], [138, 38], [127, 35], [121, 31],
  [122, 28], [110, 21], [108, 20], [108, 12], [105, 10], [104, 8],
  // Malay peninsula
  [104, 1], [100, 5], [99, 13], [96, 16], [94, 19],
  // Bay of Bengal / India
  [89, 22], [88, 22], [82, 17], [80, 12], [77, 8], [75, 10], [73, 15],
  [70, 22], [68, 23], [64, 25], [60, 25], [56, 25],
  // Arabian peninsula + Red Sea
  [54, 22], [52, 18], [48, 14], [45, 12], [43, 13], [40, 18], [36, 25],
  [34, 28], [35, 32], [38, 36],
  // Caspian / Caucasus
  [40, 41], [42, 42], [44, 44], [47, 47], [50, 50], [55, 53], [60, 56],
  [50, 60], [45, 62], [42, 64],
]

// Indian subcontinent peninsula — distinctive triangle pointing south.
export const INDIA: LonLat[] = [
  [70, 22], [73, 22], [76, 18], [78, 13], [80, 9], [78, 8], [76, 8],
  [73, 12], [70, 17], [70, 22],
]

// Southeast Asian archipelago + Borneo + Sumatra + Java (rough)
export const INDONESIA: LonLat[] = [
  [95, 5], [107, 0], [120, 0], [128, 0], [130, -5], [120, -8], [110, -8],
  [101, -3], [95, 5],
]

// Australia: distinctive boomerang outline.
export const AUSTRALIA: LonLat[] = [
  [113, -22], [116, -20], [120, -19], [124, -16], [129, -15], [132, -12],
  [137, -12], [142, -10], [146, -12], [149, -19], [153, -25], [153, -32],
  [150, -37], [146, -39], [142, -38], [137, -36], [130, -34], [121, -33],
  [115, -34], [113, -28], [113, -22],
]

export const NEW_ZEALAND_N: LonLat[] = [
  [172, -34], [176, -37], [178, -40], [175, -41], [173, -38], [172, -34],
]
export const NEW_ZEALAND_S: LonLat[] = [
  [167, -41], [173, -42], [174, -46], [170, -47], [166, -45], [167, -41],
]

// Greenland — recognizable elongated shape.
export const GREENLAND: LonLat[] = [
  [-55, 83], [-37, 83], [-25, 81], [-21, 76], [-21, 70], [-25, 65],
  [-37, 60], [-44, 60], [-50, 62], [-53, 65], [-50, 70], [-52, 75],
  [-55, 78], [-55, 83],
]

// Antarctica
export const ANTARCTICA: LonLat[] = [
  [-180, -66], [-150, -75], [-110, -73], [-80, -73], [-70, -75],
  [-60, -65], [-40, -68], [-15, -70], [10, -71], [40, -68], [60, -68],
  [80, -65], [110, -67], [140, -66], [160, -77], [175, -78],
  [180, -85], [-180, -85], [-180, -66],
]

export const MADAGASCAR: LonLat[] = [
  [43, -12], [50, -16], [50, -22], [47, -26], [44, -25], [43, -20], [43, -12],
]

export const JAPAN_HONSHU: LonLat[] = [
  [131, 34], [136, 35], [139, 35], [141, 38], [142, 41], [140, 43],
  [137, 36], [133, 34], [131, 34],
]
export const JAPAN_HOKKAIDO: LonLat[] = [
  [140, 42], [144, 44], [145, 45], [141, 45], [139, 43], [140, 42],
]

// British Isles
export const UK: LonLat[] = [
  [-5, 50], [0, 51], [1, 52], [-1, 55], [-3, 58], [-5, 58], [-6, 55],
  [-5, 50],
]
export const IRELAND: LonLat[] = [
  [-10, 52], [-6, 54], [-6, 55], [-10, 55], [-10, 52],
]

export const ICELAND: LonLat[] = [
  [-24, 64], [-19, 66], [-14, 66], [-14, 64], [-19, 63], [-24, 64],
]

// Mountain ranges — rendered as darker linear features for visual depth.
export const HIMALAYAS: LonLat[] = [
  [70, 36], [78, 35], [88, 28], [95, 28], [88, 30], [80, 32], [73, 35],
  [70, 36],
]
export const ANDES: LonLat[] = [
  [-78, 0], [-76, -10], [-72, -18], [-70, -25], [-70, -35], [-72, -40],
  [-71, -40], [-69, -35], [-69, -25], [-71, -18], [-75, -10], [-77, 0],
  [-78, 0],
]
export const ROCKIES: LonLat[] = [
  [-118, 35], [-112, 36], [-110, 45], [-115, 52], [-122, 55], [-124, 53],
  [-119, 47], [-115, 40], [-117, 35], [-118, 35],
]

export const CONTINENTS: LonLat[][] = [
  NORTH_AMERICA,
  SOUTH_AMERICA,
  EUROPE,
  AFRICA,
  ASIA,
  INDIA,
  INDONESIA,
  AUSTRALIA,
  GREENLAND,
  ANTARCTICA,
  MADAGASCAR,
  JAPAN_HONSHU,
  JAPAN_HOKKAIDO,
  NEW_ZEALAND_N,
  NEW_ZEALAND_S,
  UK,
  IRELAND,
  ICELAND,
]

// Mountain ridges are rendered separately to draw them in a slightly darker
// tone on top of the continent fill, suggesting elevation.
export const MOUNTAIN_RIDGES: LonLat[][] = [
  HIMALAYAS,
  ANDES,
  ROCKIES,
]
