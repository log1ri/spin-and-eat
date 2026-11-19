export const CATS = ['rice', 'noodle', 'soup', 'isan', 'sweet'] as const
export type Cat = (typeof CATS)[number]
export type AlbumKey = 'all' | Cat

export interface AlbumMeta {
  key: AlbumKey
  th: string
  title: string
  tag: string
  /** Record label color */
  color: string
  hiColor: string
  ink: string
  /** Cover text color, if different from the label ink (ink) */
  sleeveInk?: string
  /** Cover number badge fill, if not the usual translucent black */
  badge?: string
  /** Badge digit color, if not white */
  badgeInk?: string
  /** Cover art — uses % sizes so small and large covers look the same */
  art: string
  /** Full-screen background + text color for this album (used on both the picker and the player) */
  stage: { bg: string; ink: string }
}

/** Noodle cover: 5-color retro ribbons coming down from the top, looping like a "d", then running down (noodles twirled on a fork) */
const NOODLE_STRIPES = ['#F6D27A', '#F5A623', '#F07B22', '#D9461E', '#7B2D1A'] // inside of the curve → outside
const NOODLE_BG = '#F1E3C8'

type Seg = { line: number } | { arc: number; turn: number } // turn: degrees, + = turn right (on screen)
/**
 * Draw an offset of the center line (straights + arcs), turtle-style
 * d = offset to the left of the heading — right turns radius +d, left turns radius -d → perfectly parallel bands
 */
function ribbonPath(x: number, y: number, deg: number, segs: readonly Seg[], d: number): string {
  let a = (deg * Math.PI) / 180
  const f = (n: number) => +n.toFixed(2)
  x += d * Math.sin(a)
  y -= d * Math.cos(a)
  let out = `M${f(x)} ${f(y)}`
  for (const s of segs) {
    if ('line' in s) {
      x += s.line * Math.cos(a)
      y += s.line * Math.sin(a)
      out += `L${f(x)} ${f(y)}`
      continue
    }
    const right = s.turn > 0
    const r = s.arc + (right ? d : -d)
    // Center is on the turning side; split into ≤180° pieces (an SVG arc can't draw a full circle in one go)
    let left = Math.abs(s.turn)
    while (left > 0) {
      const step = Math.min(180, left)
      left -= step
      const sign = right ? 1 : -1
      const cx = x - sign * r * Math.sin(a)
      const cy = y + sign * r * Math.cos(a)
      a += (sign * step * Math.PI) / 180
      x = cx + sign * r * Math.sin(a)
      y = cy - sign * r * Math.cos(a)
      out += `A${f(r)} ${f(r)} 0 0 ${right ? 1 : 0} ${f(x)} ${f(y)}`
    }
  }
  return out
}

const noodleArt = (() => {
  const w = 3.6 // band width
  const pitch = 5 // band center spacing (gap = pitch - w)
  const n = NOODLE_STRIPES.length
  const R = 19 // loop radius (center line)
  const x0 = 70 // vertical run x — clears NOODLE GROOVE on the left and the number badge bottom-right
  const y0 = 50
  // Down from the top → loop right 360° → down · split into 2 passes; the second overlaps the first (with a cream underlay) so the ribbons look like they pass through each other
  // The first pass runs 10° past the joint and the underlay starts after it → no hairline seam
  const first: Seg[] = [{ line: y0 + 2 }, { arc: R, turn: 280 }]
  const second: Seg[] = [{ arc: R, turn: 90 }, { line: 102 - y0 }]
  // Second pass starts at the top of the loop, heading right (0°)
  const sx = x0 - R
  const sy = y0 - R
  const stripes = (x: number, y: number, deg: number, segs: Seg[]) =>
    NOODLE_STRIPES.map((c, i) => `<path d="${ribbonPath(x, y, deg, segs, (i - (n - 1) / 2) * pitch)}" stroke="${c}"/>`).join('')
  const width = (n - 1) * pitch + w
  const ua = (10 * Math.PI) / 180
  const underSegs: Seg[] = [{ arc: R, turn: 80 }, { line: 102 - y0 }]
  const underPath = ribbonPath(x0 - R + R * Math.sin(ua), y0 - R * Math.cos(ua), 10, underSegs, 0)
  const under = `<path d="${underPath}" stroke="${NOODLE_BG}" stroke-width="${width + 2 * (pitch - w)}"/>`
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<g fill="none" stroke-width="${w}">${stripes(x0, -2, 90, first)}${under}${stripes(sx, sy, 0, second)}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${NOODLE_BG}`
})()

/**
 * Rice cover: rice-terrace hills layered far to near — front hills hide back hills, each hill has ridges following its crest
 * Colors from the reference: lime sky, dark→light green hills, ridges lighter than the hill · dark green text (top-left = sky, bottom-left = light green hill)
 */
const RICE_SKY = '#CDE07A'
const riceArt = (() => {
  interface Hill {
    /** Hill crest (path starting with M ...) — the hill fills from the crest down to the bottom edge */
    top: string
    /** Right/bottom end of the crest, for closing the shape */
    close: string
    fill: string
    line: string
    /** Ridge spacing, count (must reach the hill's bottom — extra is fine, clipPath trims it), shift slant (dx per row) */
    step: number
    count: number
    dx?: number
  }
  // Colors from the vector rice-terrace reference: lime sky, dark/mid/light green hills, ridges lighter than the hill
  const hills: Hill[] = [
    // far right hill
    { top: 'M-2 34C30 30 55 14 102 10', close: 'V102H-2Z', fill: '#2E7A47', line: '#4F9E52', step: 3.2, count: 9 },
    // middle hill
    { top: 'M-2 42C25 32 52 30 102 50', close: 'V102H-2Z', fill: '#6BB25A', line: '#9CCB6E', step: 3.4, count: 7 },
    // light green hill (the cover's focal point)
    { top: 'M-2 62C30 60 60 40 102 32', close: 'V102H-2Z', fill: '#A8D16C', line: '#CDE38E', step: 3.6, count: 18 },
    // bottom-left hill (under the Thai title)
    { top: 'M-2 76C25 70 50 74 74 102', close: 'H-2Z', fill: '#DCEBA8', line: '#C2DC88', step: 4, count: 8, dx: -3 },
    // front bottom-right hill
    { top: 'M40 102C55 84 78 72 102 70', close: 'V102Z', fill: '#4F9E52', line: '#86C262', step: 4, count: 10, dx: 3 },
  ]
  let defs = ''
  let body = ''
  hills.forEach((h, i) => {
    const shape = h.top + h.close
    defs += `<clipPath id="h${i}"><path d="${shape}"/></clipPath>`
    const lines = Array.from(
      { length: h.count },
      (_, k) => `<path d="${h.top}" transform="translate(${(h.dx ?? 0) * (k + 1)} ${h.step * (k + 1)})"/>`,
    ).join('')
    body +=
      `<path d="${shape}" fill="${h.fill}"/>` +
      `<g clip-path="url(#h${i})" fill="none" stroke="${h.line}" stroke-width="1.3" stroke-linecap="round">${lines}</g>`
  })
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<defs>${defs}</defs><rect width="100" height="100" fill="${RICE_SKY}"/>${body}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${RICE_SKY}`
})()

/**
 * Soup/curry cover: 4 stacked arches stepping down (after a 70s arch poster) on dark plum
 * Reversed gradient, peach at the top → deep pink at the bottom, like the glow from a hot bowl · 4 layers (not 5) so bands are thick and don't repeat the noodle cover's 5-stripe rhythm
 * The bottom layer backs the Thai title (cream text) — don't make it much darker; the user said it was too dark
 */
const SOUP_BG = '#3B0F2E'
const SOUP_ARCHES = ['#FAD3C0', '#F6A49E', '#EE7590', '#DB4F86']
const soupArt = (() => {
  const rx = 58
  const ry = 40
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<rect width="100" height="100" fill="${SOUP_BG}"/>` +
    SOUP_ARCHES.map((c, i) => {
      const y = 18 + i * 15 + ry
      return `<path d="M${50 - rx} 101V${y}A${rx} ${ry} 0 0 1 ${50 + rx} ${y}V101Z" fill="${c}"/>`
    }).join('') +
    '</svg>'
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${SOUP_BG}`
})()

/**
 * Isan/salad cover: checkerboard rotated 45° (diamond cells), each cell has a cross + 4 upright marks top/left/right/bottom
 * (after the Thai fabric poster the user picked) · single chili-red palette, low-contrast pattern so the white text stands out
 * Don't use yellow/cream (repeats the noodle cover) and keep the pattern low-contrast (or the title becomes unreadable)
 */
const ISAN_A = { bg: '#C8202F', plus: '#E9606A' }
const ISAN_B = { bg: '#E0383F', plus: '#9E1222' }
const isanArt = (() => {
  const n = 4
  const S = 100 / n
  const h = S / Math.SQRT2 // half-diagonal of a diamond cell
  const r = 0.23 * S * Math.SQRT2 // cross distance from the cell center
  const l = S * 0.3 // arm length
  const t = S * 0.1 // arm thickness
  const f = (v: number) => +v.toFixed(2)
  const plus = (x: number, y: number) =>
    `M${f(x - l / 2)} ${f(y - t / 2)}h${f(l)}v${f(t)}h${f(-l)}zM${f(x - t / 2)} ${f(y - l / 2)}h${f(t)}v${f(l)}h${f(-t)}z`
  let cellsB = ''
  let plusA = ''
  let plusB = ''
  for (let i = -4; i < n + 4; i++)
    for (let j = -4; j < n + 4; j++) {
      // cell center before rotation → rotate 45° around the cover center
      const u = (i + 0.5) * S - 50
      const v = (j + 0.5) * S - 50
      const cx = 50 + (u - v) * Math.SQRT1_2
      const cy = 50 + (u + v) * Math.SQRT1_2
      if (cx < -h || cx > 100 + h || cy < -h || cy > 100 + h) continue
      const isA = (i + j) % 2 === 0
      if (!isA) cellsB += `M${f(cx)} ${f(cy - h)}L${f(cx + h)} ${f(cy)}L${f(cx)} ${f(cy + h)}L${f(cx - h)} ${f(cy)}Z`
      const p = plus(cx, cy - r) + plus(cx + r, cy) + plus(cx, cy + r) + plus(cx - r, cy)
      if (isA) plusA += p
      else plusB += p
    }
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<rect width="100" height="100" fill="${ISAN_A.bg}"/><path d="${cellsB}" fill="${ISAN_B.bg}"/>` +
    `<path d="${plusA}" fill="${ISAN_A.plus}"/><path d="${plusB}" fill="${ISAN_B.plus}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${ISAN_A.bg}`
})()

/**
 * Dessert cover: mango sticky rice — white coconut cream dripping from the top edge over ripe mango
 * Mango orange, not golden yellow/cream coconut (cream + yellow belongs with the noodle cover), and not so red it leans toward the Isan cover
 */
const SWEET = { bg: '#FF9A1F', cream: '#FFFFFF' }
const sweetArt = (() => {
  const top = 24 // coconut cream band height
  const w = 5 // half drip width
  const drops = [[8, 34], [22, 52], [36, 30], [50, 62], [64, 40], [78, 56], [92, 32]] as const // [x, drip tip y]
  let d = `M-1 -1H101V${top}`
  for (let i = drops.length - 1; i >= 0; i--) {
    const [x, y] = drops[i]!
    d += `L${x + w} ${top}V${y}A${w} ${w} 0 0 1 ${x - w} ${y}V${top}`
  }
  d += `L-1 ${top}Z`
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<rect width="100" height="100" fill="${SWEET.bg}"/><path d="${d}" fill="${SWEET.cream}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${SWEET.bg}`
})()

/**
 * All-hits cover: Bo Sang umbrellas seen from above, overlapping on cream (after pins of pink/teal umbrellas)
 * 5 colored umbrellas = the 5 category colors — 3 large (noodle, rice, soup) + 2 medium fully visible (dessert, Isan) (muted to suit the cream) + faded umbrellas (outline only) as background
 * The title area top-left (x<55 y<14) and Thai title bottom-left (x<45 y>78) only hold faded umbrellas, so text stays legible
 */
const ALL_BG = '#F5EAD8'
const ALL_GHOST = '#EADBCB'
/** Umbrella colors per category: noodle, soup, rice, isan, sweet */
const ALL_UMBRELLA = ['#EDB93A', '#DB5F8C', '#4F9E6A', '#C8453F', '#EE8A34'] as const
const allArt = (() => {
  const ribs = 20
  const f = (n: number) => +n.toFixed(2)
  const mix = (a: string, b: string, t: number) => {
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
    const B = rgb(b)
    return '#' + rgb(a).map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, '0')).join('')
  }
  const at = (x: number, y: number, r: number, a: number) => `${f(x + r * Math.cos(a))} ${f(y + r * Math.sin(a))}`
  // Rim scallops inward between ribs, like cloth/paper sagging between the frame
  const rim = (x: number, y: number, r: number, rot: number) => {
    let d = `M${at(x, y, r, rot)}`
    for (let k = 1; k <= ribs; k++) {
      const a = rot + (k / ribs) * Math.PI * 2
      d += `Q${at(x, y, r * 0.93, a - Math.PI / ribs)} ${at(x, y, r, a)}`
    }
    return d + 'Z'
  }
  const spokes = (x: number, y: number, r: number, rot: number, r0: number) => {
    let d = ''
    for (let k = 0; k < ribs; k++) {
      const a = rot + (k / ribs) * Math.PI * 2
      d += `M${at(x, y, r0, a)}L${at(x, y, r, a)}`
    }
    return d
  }
  // [x, y, r, category color] · -1 = faded umbrella · drawn in order (later ones overlap earlier ones)
  const umbrellas: readonly (readonly [number, number, number, number])[] = [
    [8, 8, 15, -1], [36, 4, 11, -1], [26, 92, 19, -1], [-4, 64, 14, -1], [46, 70, 10, -1], [86, 100, 12, -1],
    // Fill cream gaps between colored umbrellas (user circled: between green-yellow, and right of orange down to pink)
    [58, 26, 12, -1], [96, 60, 11, -1], // one per gap only — the user said 5 was too busy
    [84, 12, 25, 0], [30, 46, 23, 2], [74, 52, 17, 4], [98, 86, 21, 1], [58, 88, 15, 3],
  ]
  const body = umbrellas
    .map(([x, y, r, ci]) => {
      const rot = (x * 7 + y * 3) / 50 // rotate each umbrella's ribs so they don't line up
      if (ci < 0)
        return `<g fill="none" stroke="${ALL_GHOST}" stroke-width="0.35"><path d="${rim(x, y, r, rot)}"/><path d="${spokes(x, y, r, rot, r * 0.1)}"/><circle cx="${x}" cy="${y}" r="${f(r * 0.1)}"/></g>`
      const c = ALL_UMBRELLA[ci]!
      const line = mix(c, '#FFFFFF', 0.4)
      return (
        `<path d="${rim(x, y, r, rot)}" fill="${c}"/>` +
        `<path d="${spokes(x, y, r * 0.97, rot, r * 0.14)}" stroke="${line}" stroke-width="${f(Math.max(0.3, r * 0.018))}"/>` +
        `<circle cx="${x}" cy="${y}" r="${f(r * 0.3)}" fill="none" stroke="${line}" stroke-width="${f(r * 0.012)}"/>` +
        `<circle cx="${x}" cy="${y}" r="${f(r * 0.14)}" fill="${mix(c, '#FFFFFF', 0.75)}"/>` +
        `<circle cx="${x}" cy="${y}" r="${f(r * 0.05)}" fill="${mix(c, '#000000', 0.4)}"/>`
      )
    })
    .join('')
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
    `<rect width="100" height="100" fill="${ALL_BG}"/>${body}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat, ${ALL_BG}`
})()

export const ALBUMS: readonly AlbumMeta[] = [
  {
    key: 'all', th: 'รวมฮิต', title: 'GREATEST HITS', tag: 'ทุกเมนูในคลัง สุ่มรวมมิตร',
    color: '#6A1FD1', hiColor: '#8F52F2', ink: '#FFFFFF', sleeveInk: '#2A0F2E',
    badge: '#2A0F2E',
    art: allArt,
    stage: { bg: '#6A1FD1', ink: '#FFFFFF' },
  },
  {
    key: 'rice', th: 'ข้าว', title: 'RICE & RHYTHM', tag: 'ข้าวจานเดียว อิ่มชัวร์',
    color: '#22B357', hiColor: '#5BD785', ink: '#0B1F12',
    badge: '#2E7A47',
    art: riceArt,
    stage: { bg: '#22B357', ink: '#0B1F12' },
  },
  {
    key: 'noodle', th: 'เส้น', title: 'NOODLE GROOVE', tag: 'เส้นน้ำ เส้นแห้ง ผัดก็ได้',
    color: '#FFC21A', hiColor: '#FFE07A', ink: '#1A1405',
    badge: '#7B2D1A',
    art: noodleArt,
    stage: { bg: '#FFC21A', ink: '#1A1405' },
  },
  {
    key: 'soup', th: 'ต้ม/แกง', title: 'SOUP SYMPHONY', tag: 'ซดน้ำร้อน ๆ คล่องคอ',
    color: '#7A1FE0', hiColor: '#A866FF', ink: '#FFFFFF', sleeveInk: '#FBE6DC',
    badge: '#FAD3C0', badgeInk: '#3B0F2E',
    art: soupArt,
    stage: { bg: '#FF3DA8', ink: '#140A24' },
  },
  {
    key: 'isan', th: 'อีสาน/ยำ', title: 'ISAN BEAT', tag: 'แซ่บ จัดจ้าน ถึงเครื่อง',
    color: '#FF4D1F', hiColor: '#FF8A5C', ink: '#140A24', sleeveInk: '#FFFFFF',
    badge: '#7A0E1A',
    art: isanArt,
    stage: { bg: '#FF4D1F', ink: '#140A24' },
  },
  {
    key: 'sweet', th: 'ของหวาน', title: 'SWEET BALLAD', tag: 'ปิดท้ายหวาน ๆ',
    color: '#FF9A1F', hiColor: '#FFC266', ink: '#140A24',
    badge: '#A8400A',
    art: sweetArt,
    stage: { bg: '#3D5AFE', ink: '#FFFFFF' },
  },
]

export const metaOf = (key: AlbumKey): AlbumMeta => ALBUMS.find((a) => a.key === key) ?? ALBUMS[0]!

export const isCat = (v: unknown): v is Cat => typeof v === 'string' && (CATS as readonly string[]).includes(v)
