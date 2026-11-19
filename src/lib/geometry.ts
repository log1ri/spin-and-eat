/** Turntable geometry (deck px, before scaling) */
export const OUT = 126
export const IN = 54
export const ARM_REST = 5
export const DECK_W = 342
export const DECK_H = 292

/** Track ring width */
export const bandWidth = (n: number) => (n ? (OUT - IN) / n : 9)

/** Center radius of track k */
export const trackRadius = (k: number, n: number) => OUT - bandWidth(n) * (k + 0.5)

/** Tonearm angle (degrees) that puts the needle d px from the spindle */
export function theta(d: number) {
  const px = 147
  const py = 112
  const L = 190
  const pc2 = px * px + py * py
  const pc = Math.sqrt(pc2)
  const phi = Math.atan2(py, px)
  const x = Math.max(-1, Math.min(1, (pc2 + L * L - d * d) / (2 * L * pc)))
  return ((Math.asin(x) - phi) * 180) / Math.PI
}

/** Tonearm pivot · spindle · pivot-to-needle length — must match .deck-arm / .deck-vinyl in turntable.css */
const PIVOT = { x: 318, y: 34 }
const SPINDLE = { x: 171, y: 146 }
const ARM_L = 190

/** Needle distance from the spindle when the arm is at deg degrees (inverse of theta) */
export function needleDist(deg: number) {
  const a = (deg * Math.PI) / 180
  return Math.hypot(PIVOT.x - ARM_L * Math.sin(a) - SPINDLE.x, PIVOT.y + ARM_L * Math.cos(a) - SPINDLE.y)
}

/** Arm angle (degrees) pointing from the pivot to (x, y) on the deck — 0 points straight down, clockwise is positive */
export const angleTo = (x: number, y: number) => (Math.atan2(PIVOT.x - x, y - PIVOT.y) * 180) / Math.PI

/** Deepest arm angle while dragging — the needle stops just at the innermost groove (releasing here still counts as on the record) */
export const ARM_MAX = theta(IN + 2)

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
