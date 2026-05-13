// Generate an equirectangular Earth texture into an HTMLCanvasElement. Used
// directly by the 3D <Earth3D> material and by the 2D MapView to draw a
// recognizable Earth without shipping any binary image assets.
//
// The output is 1024x512 (2:1 aspect, longitude 0..360 across X, latitude
// +90..-90 across Y). Colors and continent shapes are intentionally
// stylized for legibility at orbital scales, not geographic accuracy.
import { CONTINENTS, type LonLat } from './earth-shapes'

const W = 1024
const H = 512

// Convert lon/lat degrees to pixel (x, y) on the equirectangular canvas.
// Longitude: -180..+180 mapped to 0..W (with -180 wrapping to 0).
// Latitude: +90..-90 mapped to 0..H.
const projectLonLat = (lon: number, lat: number): [number, number] => {
  const x = ((lon + 180) / 360) * W
  const y = ((90 - lat) / 180) * H
  return [x, y]
}

const fillPolygon = (ctx: CanvasRenderingContext2D, pts: LonLat[]) => {
  if (pts.length === 0) return
  ctx.beginPath()
  const [x0, y0] = projectLonLat(pts[0][0], pts[0][1])
  ctx.moveTo(x0, y0)
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = projectLonLat(pts[i][0], pts[i][1])
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

// Build the texture once and memoize. Module-level so re-renders don't
// regenerate the canvas (which would defeat the GPU texture cache).
let cached: HTMLCanvasElement | null = null

export const buildEarthCanvas = (): HTMLCanvasElement => {
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Ocean: vertical gradient from polar teal-blue to equatorial deep blue
  // and back, suggesting bathymetric darkening.
  const ocean = ctx.createLinearGradient(0, 0, 0, H)
  ocean.addColorStop(0.0, '#0a2238')
  ocean.addColorStop(0.18, '#0e2a4e')
  ocean.addColorStop(0.5, '#103a6e')
  ocean.addColorStop(0.82, '#0e2a4e')
  ocean.addColorStop(1.0, '#0a2238')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, W, H)

  // Subtle ocean-current shimmer (faint horizontal noise bands)
  ctx.fillStyle = 'rgba(50, 120, 180, 0.04)'
  for (let i = 0; i < 12; i++) {
    const y = (Math.random() * H) | 0
    const h = 12 + Math.random() * 24
    ctx.fillRect(0, y, W, h)
  }

  // Continents — primary fill
  ctx.fillStyle = '#3d5a3a' // muted green
  for (const poly of CONTINENTS) fillPolygon(ctx, poly)

  // Continents — desert tones overlay (Sahara, Arabia, central Australia, US southwest)
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = 'rgba(120, 95, 55, 0.55)'
  // Sahara / Arabia band ~25°N to 15°N, lon -10° to 55°
  const desertBands: { lon0: number; lon1: number; lat0: number; lat1: number }[] = [
    { lon0: -10, lon1: 55, lat0: 28, lat1: 14 },
    { lon0: 110, lon1: 145, lat0: -20, lat1: -32 }, // Australian outback
    { lon0: -115, lon1: -100, lat0: 38, lat1: 28 }, // US southwest
    { lon0: 60, lon1: 90, lat0: 45, lat1: 35 }, // Central Asia
    { lon0: 12, lon1: 30, lat0: -18, lat1: -28 }, // Kalahari
  ]
  for (const b of desertBands) {
    const [x0, y0] = projectLonLat(b.lon0, b.lat0)
    const [x1, y1] = projectLonLat(b.lon1, b.lat1)
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
  }
  // Forest highlights (Amazon, Congo, Siberia)
  ctx.fillStyle = 'rgba(40, 80, 45, 0.45)'
  const forestBands: { lon0: number; lon1: number; lat0: number; lat1: number }[] = [
    { lon0: -75, lon1: -55, lat0: 5, lat1: -10 }, // Amazon
    { lon0: 12, lon1: 30, lat0: 5, lat1: -5 }, // Congo
    { lon0: 60, lon1: 130, lat0: 65, lat1: 55 }, // Siberia
  ]
  for (const b of forestBands) {
    const [x0, y0] = projectLonLat(b.lon0, b.lat0)
    const [x1, y1] = projectLonLat(b.lon1, b.lat1)
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
  }
  ctx.globalCompositeOperation = 'source-over'

  // Polar ice caps (top and bottom strips, semi-transparent white)
  const polarGrad = ctx.createLinearGradient(0, 0, 0, H)
  polarGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
  polarGrad.addColorStop(0.08, 'rgba(255, 255, 255, 0.18)')
  polarGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0)')
  polarGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0)')
  polarGrad.addColorStop(0.92, 'rgba(255, 255, 255, 0.18)')
  polarGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)')
  ctx.fillStyle = polarGrad
  ctx.fillRect(0, 0, W, H)

  // Wispy cloud streaks (low opacity, biased toward mid-latitudes)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)'
  for (let i = 0; i < 60; i++) {
    const cx = Math.random() * W
    const cy = H * 0.5 + (Math.random() - 0.5) * H * 0.7
    const rx = 30 + Math.random() * 80
    const ry = 4 + Math.random() * 8
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
    ctx.fill()
  }

  cached = canvas
  return canvas
}
