// Generate Earth textures used by both the 3D scene and the 2D MapView.
//
// Two outputs:
//   1. An equirectangular Earth canvas (1024x512) — used by Earth3D as the
//      sphere material's `map`.
//   2. An orthographic Earth-disk canvas (256x256, transparent outside the
//      disk) — used by MapView 2D to draw a recognizable globe instead of
//      stylized blobs.
//
// Both are built once at module load and cached. Zero binary assets shipped.
import { CONTINENTS, MOUNTAIN_RIDGES, type LonLat } from './earth-shapes'

// --- Equirectangular texture ---

const EQ_W = 1024
const EQ_H = 512

const projectLonLatEq = (lon: number, lat: number): [number, number] => {
  // -180..+180 longitude → 0..W; +90..-90 latitude → 0..H
  const x = ((lon + 180) / 360) * EQ_W
  const y = ((90 - lat) / 180) * EQ_H
  return [x, y]
}

const fillPolyEq = (ctx: CanvasRenderingContext2D, pts: LonLat[]) => {
  if (pts.length === 0) return
  ctx.beginPath()
  const [x0, y0] = projectLonLatEq(pts[0][0], pts[0][1])
  ctx.moveTo(x0, y0)
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = projectLonLatEq(pts[i][0], pts[i][1])
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

let cachedEq: HTMLCanvasElement | null = null

export const buildEarthCanvas = (): HTMLCanvasElement => {
  if (cachedEq) return cachedEq
  const canvas = document.createElement('canvas')
  canvas.width = EQ_W
  canvas.height = EQ_H
  const ctx = canvas.getContext('2d')!

  // Ocean base — vertical gradient suggesting bathymetric darkening at the
  // equator and lighter tones at the poles.
  const ocean = ctx.createLinearGradient(0, 0, 0, EQ_H)
  ocean.addColorStop(0.0, '#0a2238')
  ocean.addColorStop(0.18, '#0e2a4e')
  ocean.addColorStop(0.5, '#103a6e')
  ocean.addColorStop(0.82, '#0e2a4e')
  ocean.addColorStop(1.0, '#0a2238')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, EQ_W, EQ_H)

  // Continent fill — primary land green/tan.
  ctx.fillStyle = '#3f5e3a'
  for (const poly of CONTINENTS) fillPolyEq(ctx, poly)

  // Climate overlays clipped to the land we just drew.
  ctx.globalCompositeOperation = 'source-atop'

  // Desert bands (Sahara, Arabia, central Australia, US southwest, Gobi).
  ctx.fillStyle = 'rgba(170, 130, 75, 0.6)'
  const deserts: { lon0: number; lon1: number; lat0: number; lat1: number }[] = [
    { lon0: -10, lon1: 35, lat0: 30, lat1: 14 }, // Sahara
    { lon0: 35, lon1: 55, lat0: 30, lat1: 14 }, // Arabia
    { lon0: 60, lon1: 90, lat0: 45, lat1: 35 }, // Central Asia (Gobi adjacent)
    { lon0: -118, lon1: -98, lat0: 38, lat1: 27 }, // US southwest
    { lon0: 115, lon1: 145, lat0: -18, lat1: -32 }, // Australian outback
    { lon0: 12, lon1: 25, lat0: -18, lat1: -30 }, // Kalahari
    { lon0: -75, lon1: -65, lat0: -18, lat1: -28 }, // Atacama (small)
  ]
  for (const b of deserts) {
    const [x0, y0] = projectLonLatEq(b.lon0, b.lat0)
    const [x1, y1] = projectLonLatEq(b.lon1, b.lat1)
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
  }

  // Forest highlights (Amazon, Congo, Siberian taiga, Southeast Asia).
  ctx.fillStyle = 'rgba(35, 70, 40, 0.55)'
  const forests: { lon0: number; lon1: number; lat0: number; lat1: number }[] = [
    { lon0: -75, lon1: -55, lat0: 5, lat1: -10 }, // Amazon
    { lon0: 12, lon1: 30, lat0: 5, lat1: -5 }, // Congo basin
    { lon0: 60, lon1: 130, lat0: 65, lat1: 55 }, // Siberia
    { lon0: 95, lon1: 130, lat0: 10, lat1: -5 }, // SE Asia / Borneo / Sumatra
    { lon0: -130, lon1: -120, lat0: 60, lat1: 50 }, // Pacific NW
  ]
  for (const b of forests) {
    const [x0, y0] = projectLonLatEq(b.lon0, b.lat0)
    const [x1, y1] = projectLonLatEq(b.lon1, b.lat1)
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
  }

  // Mountain ridges as slightly darker overlay polygons (still clipped to land).
  ctx.fillStyle = 'rgba(80, 60, 45, 0.55)'
  for (const ridge of MOUNTAIN_RIDGES) fillPolyEq(ctx, ridge)

  ctx.globalCompositeOperation = 'source-over'

  // Polar ice — wider, more detailed bands. Antarctica's ice is already
  // included via the ANTARCTICA polygon as green; overlay white on top.
  const polar = ctx.createLinearGradient(0, 0, 0, EQ_H)
  polar.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
  polar.addColorStop(0.07, 'rgba(255, 255, 255, 0.55)')
  polar.addColorStop(0.13, 'rgba(255, 255, 255, 0.1)')
  polar.addColorStop(0.17, 'rgba(255, 255, 255, 0)')
  polar.addColorStop(0.83, 'rgba(255, 255, 255, 0)')
  polar.addColorStop(0.87, 'rgba(255, 255, 255, 0.15)')
  polar.addColorStop(0.92, 'rgba(255, 255, 255, 0.6)')
  polar.addColorStop(1, 'rgba(255, 255, 255, 0.9)')
  ctx.fillStyle = polar
  ctx.fillRect(0, 0, EQ_W, EQ_H)

  // Cloud wisps — biased to mid-latitudes, organic shapes.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)'
  for (let i = 0; i < 80; i++) {
    const cx = Math.random() * EQ_W
    const lat = (Math.random() - 0.5) * 120 // wider distribution
    const cy = ((90 - lat) / 180) * EQ_H
    const rx = 25 + Math.random() * 100
    const ry = 5 + Math.random() * 10
    const rot = Math.random() * 0.4 - 0.2
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  cachedEq = canvas
  return canvas
}

// --- Orthographic disk projection for the 2D MapView ---
//
// Pre-renders the front-hemisphere of Earth into a 256x256 disk with a fixed
// "default view" centered on (0°N, 20°E), so Europe/Africa and the Americas
// are both partially visible. We use this as a static image in MapView and
// just scale it to the Earth-circle size at draw time. This gives a real
// globe appearance without re-running the projection every frame.

const DISK_SIZE = 384

let cachedDisk: HTMLCanvasElement | null = null

// Default center of the orthographic projection. Adjust to taste; this view
// shows the Atlantic with North America on the left and Africa on the right.
const VIEW_LON_CENTER_RAD = (-20 * Math.PI) / 180
const VIEW_LAT_CENTER_RAD = (15 * Math.PI) / 180

export const buildEarthDiskCanvas = (): HTMLCanvasElement => {
  if (cachedDisk) return cachedDisk

  // Source equirectangular pixels.
  const eq = buildEarthCanvas()
  const eqCtx = eq.getContext('2d')!
  const eqImg = eqCtx.getImageData(0, 0, EQ_W, EQ_H)
  const eqData = eqImg.data

  const out = document.createElement('canvas')
  out.width = DISK_SIZE
  out.height = DISK_SIZE
  const outCtx = out.getContext('2d')!
  const outImg = outCtx.createImageData(DISK_SIZE, DISK_SIZE)
  const outData = outImg.data

  const half = DISK_SIZE / 2
  const cosLat0 = Math.cos(VIEW_LAT_CENTER_RAD)
  const sinLat0 = Math.sin(VIEW_LAT_CENTER_RAD)

  for (let py = 0; py < DISK_SIZE; py++) {
    for (let px = 0; px < DISK_SIZE; px++) {
      // Normalize to (-1, 1)
      const nx = (px - half) / half
      const ny = (py - half) / half
      const rho2 = nx * nx + ny * ny
      const idxOut = (py * DISK_SIZE + px) * 4
      if (rho2 > 1) {
        // Outside the disk — leave fully transparent.
        outData[idxOut + 3] = 0
        continue
      }
      // Inverse orthographic projection (Snyder's formulas).
      const rho = Math.sqrt(rho2)
      const c = Math.asin(rho)
      const sinC = Math.sin(c)
      const cosC = Math.cos(c)
      // ny is screen-down-positive; geographic latitude needs ny-up-positive.
      const yUp = -ny
      let lat: number
      let lon: number
      if (rho === 0) {
        lat = VIEW_LAT_CENTER_RAD
        lon = VIEW_LON_CENTER_RAD
      } else {
        lat = Math.asin(cosC * sinLat0 + (yUp * sinC * cosLat0) / rho)
        lon =
          VIEW_LON_CENTER_RAD +
          Math.atan2(nx * sinC, rho * cosLat0 * cosC - yUp * sinLat0 * sinC)
      }
      // Wrap longitude into -π..+π.
      while (lon > Math.PI) lon -= 2 * Math.PI
      while (lon < -Math.PI) lon += 2 * Math.PI

      // Sample equirectangular image at (lon, lat).
      const lonDeg = (lon * 180) / Math.PI
      const latDeg = (lat * 180) / Math.PI
      const sx = Math.max(0, Math.min(EQ_W - 1, ((lonDeg + 180) / 360) * EQ_W))
      const sy = Math.max(0, Math.min(EQ_H - 1, ((90 - latDeg) / 180) * EQ_H))
      const idxIn = ((sy | 0) * EQ_W + (sx | 0)) * 4
      outData[idxOut + 0] = eqData[idxIn + 0]
      outData[idxOut + 1] = eqData[idxIn + 1]
      outData[idxOut + 2] = eqData[idxIn + 2]
      outData[idxOut + 3] = 255

      // Spherical shading: darken pixels far from the sun direction. Sun
      // assumed to come from upper-left at about (-0.5, 0.5, 0.7) in disk
      // coords. The orthographic projection naturally provides z = sqrt(1-rho²).
      const z = Math.sqrt(1 - rho2)
      const sunDir = [-0.45, 0.45, 0.77]
      const lightFactor =
        Math.max(0.2, nx * sunDir[0] - ny * sunDir[1] + z * sunDir[2])
      outData[idxOut + 0] = Math.min(255, outData[idxOut + 0] * lightFactor)
      outData[idxOut + 1] = Math.min(255, outData[idxOut + 1] * lightFactor)
      outData[idxOut + 2] = Math.min(255, outData[idxOut + 2] * lightFactor)
    }
  }

  outCtx.putImageData(outImg, 0, 0)
  cachedDisk = out
  return out
}
