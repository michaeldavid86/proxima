// Render keep-in / keep-out zones into a 2D canvas (target-centered RIC view
// in ProxView). The zones are declared in target-RIC; this projects them to
// the V/R plane (drops cross-track) for top-down 2D rendering. We provide a
// stateless helper that takes a canvas context, the zones, and a mapping
// function from RIC-meters to screen-pixels, so any 2D view can render zones
// the same way.
import type { KeepZone } from '../engagement/keep-zones'

type ToScreen = (rRic: number, vRic: number) => { x: number; y: number }

export const drawKeepZones2D = (
  ctx: CanvasRenderingContext2D,
  zones: KeepZone[],
  toScreen: ToScreen,
  metersPerPixel: number,
) => {
  for (const z of zones) {
    const isKeepIn = z.type === 'keep_in'
    const fill = isKeepIn ? 'rgba(53, 224, 140, 0.10)' : 'rgba(255, 68, 102, 0.10)'
    const stroke = isKeepIn ? 'rgba(53, 224, 140, 0.55)' : 'rgba(255, 68, 102, 0.55)'
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.2
    if (z.shape.kind === 'cylinder') {
      // 2D projection of a cylinder: depends on axis orientation. For
      // simplicity (and because all current missions use V-aligned cylinders)
      // we draw a rectangle from axial −halfLength to +halfLength along the
      // axis, with width = 2 * radius perpendicular to it.
      // The axis is in 3D RIC; we project to the V/R plane by zeroing z.
      const ax = z.shape.axis[0]
      const ay = z.shape.axis[1]
      const mag2D = Math.hypot(ax, ay) || 1
      const axRic = ax / mag2D
      const ayRic = ay / mag2D
      const len = z.shape.halfLengthM
      const rad = z.shape.radiusM
      const p1: [number, number] = [axRic * len, ayRic * len]
      const p2: [number, number] = [-axRic * len, -ayRic * len]
      // Perpendicular unit vector in V/R plane.
      const px = -ayRic
      const py = axRic
      const c1 = toScreen(p1[0] + px * rad, p1[1] + py * rad)
      const c2 = toScreen(p1[0] - px * rad, p1[1] - py * rad)
      const c3 = toScreen(p2[0] - px * rad, p2[1] - py * rad)
      const c4 = toScreen(p2[0] + px * rad, p2[1] + py * rad)
      ctx.beginPath()
      ctx.moveTo(c1.x, c1.y)
      ctx.lineTo(c2.x, c2.y)
      ctx.lineTo(c3.x, c3.y)
      ctx.lineTo(c4.x, c4.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Label
      ctx.fillStyle = stroke
      ctx.font = '10px "JetBrains Mono", monospace'
      const lp = toScreen(0, 0)
      ctx.fillText(z.label, lp.x + 8, lp.y - 8)
    } else if (z.shape.kind === 'box') {
      const c = z.shape.centerRic
      const h = z.shape.halfExtentsM
      const c1 = toScreen(c[0] - h[0], c[1] - h[1])
      const c2 = toScreen(c[0] + h[0], c[1] - h[1])
      const c3 = toScreen(c[0] + h[0], c[1] + h[1])
      const c4 = toScreen(c[0] - h[0], c[1] + h[1])
      ctx.beginPath()
      ctx.moveTo(c1.x, c1.y)
      ctx.lineTo(c2.x, c2.y)
      ctx.lineTo(c3.x, c3.y)
      ctx.lineTo(c4.x, c4.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = stroke
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(z.label, toScreen(c[0], c[1]).x + 6, toScreen(c[0], c[1]).y)
    } else if (z.shape.kind === 'cone') {
      // 2D cone: triangle from apex extending along axis. Use a wedge.
      const apex = z.shape.apexRic
      const ax = z.shape.axis[0]
      const ay = z.shape.axis[1]
      const am = Math.hypot(ax, ay) || 1
      const axHat = ax / am
      const ayHat = ay / am
      const rangeM = z.shape.rangeM
      const halfAngle = (z.shape.halfAngleDeg * Math.PI) / 180
      const tip: [number, number] = [
        apex[0] + axHat * rangeM,
        apex[1] + ayHat * rangeM,
      ]
      // Perpendicular vector
      const px = -ayHat
      const py = axHat
      const spread = rangeM * Math.tan(halfAngle)
      const e1: [number, number] = [tip[0] + px * spread, tip[1] + py * spread]
      const e2: [number, number] = [tip[0] - px * spread, tip[1] - py * spread]
      const A = toScreen(apex[0], apex[1])
      const E1 = toScreen(e1[0], e1[1])
      const E2 = toScreen(e2[0], e2[1])
      ctx.beginPath()
      ctx.moveTo(A.x, A.y)
      ctx.lineTo(E1.x, E1.y)
      ctx.lineTo(E2.x, E2.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = stroke
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(z.label, A.x + 8, A.y - 6)
    }
    void metersPerPixel
  }
}
