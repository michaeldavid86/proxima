// Minimal 3-vector helpers. We use plain tuples so Zustand + JSON persist cleanly.
export type Vec3 = [number, number, number]

export const vec = (x: number, y: number, z: number): Vec3 => [x, y, z]
export const zero3 = (): Vec3 => [0, 0, 0]

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const neg = (a: Vec3): Vec3 => [-a[0], -a[1], -a[2]]

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export const norm = (a: Vec3): number => Math.sqrt(dot(a, a))

export const normalize = (a: Vec3): Vec3 => {
  const n = norm(a)
  if (n === 0) return [0, 0, 0]
  return [a[0] / n, a[1] / n, a[2] / n]
}

export const clone = (a: Vec3): Vec3 => [a[0], a[1], a[2]]
