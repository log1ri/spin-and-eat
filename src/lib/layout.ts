import { clamp, DECK_H, DECK_W } from './geometry'

/** All viewport-dependent sizes — computed from the root size measured with ResizeObserver (the crate measures its own box separately) */
export function computeLayout(W: number, H: number) {
  const cw = Math.min(W, 480)
  const compact = H < 740
  const tiny = H < 640
  const deckS = clamp(Math.min((cw - 40) / DECK_W, (H * (compact ? 0.36 : 0.4)) / DECK_H), 0.6, 1.3)
  return {
    W,
    H,
    cw,
    compact,
    tiny,
    narrow: cw < 380,
    gap: compact ? 10 : 14,
    pad: compact ? 14 : 20,
    deckS,
  }
}

export type Layout = ReturnType<typeof computeLayout>
