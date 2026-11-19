/** Mix hex colors the same way as CSS color-mix(in srgb, a p, b) */
export function mix(a: string, b: string, p: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * p + ch(b, i) * (1 - p)))
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('')
}
