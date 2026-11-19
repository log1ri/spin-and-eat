import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { ALBUMS, type AlbumKey } from '@/data/albums'
import { useElementSize } from '@/hooks/useElementSize'
import { clamp } from '@/lib/geometry'

const NA = ALBUMS.length
/** Cover size before scaling + the record peeking out on the right */
const SLEEVE = 270
const DISC_PEEK = 24
/** The cover layer extends this far past the box left/right so shadows and blur fade out instead of being clipped */
const LAYER_BLEED = 140

interface Props {
  index: number
  chosen: boolean
  /** Shuffling: scroll faster and ignore input */
  flipping: boolean
  countOf: (key: AlbumKey) => number
  onGoTo: (i: number) => void
  onChoose: (i: number) => void
  onPrev: () => void
  onNext: () => void
  /** Mobile: covers above/below only peek, then fade inside the box, so they don't overlap the title or buttons */
  peek?: boolean
  /** No menus yet (first load / failed): ignore input, hide side covers */
  locked?: boolean
  /** Center record spins slowly while waiting for menus */
  loading?: boolean
  /** Coming back from the player: center cover pops in, then the neighbors fan out from behind it */
  entering?: boolean
  className?: string
}

/** Vertical cover stack: center cover sharp, covers above/below blurred and tilted behind */
export function CrateStack({
  index,
  chosen,
  flipping,
  countOf,
  onGoTo,
  onChoose,
  onPrev,
  onNext,
  peek = false,
  locked = false,
  loading = false,
  entering = false,
  className = '',
}: Props) {
  // entrance: popped = center cover at full size · fanned = neighbors slid out from behind it (CSS transitions do the motion)
  const [popped, setPopped] = useState(!entering)
  const [fanned, setFanned] = useState(!entering)
  useEffect(() => {
    if (!entering) return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPopped(true)))
    const t = window.setTimeout(() => setFanned(true), 340)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [entering])
  const { ref, size } = useElementSize<HTMLDivElement>()
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const wheelAt = useRef(0)

  // Mobile: always leave room for the neighbors to peek (enough to read their name strip) — on short screens the cover
  // shrinks instead of eating the previews
  const peekRoom = peek ? clamp(size.h * 0.14, 24, 46) : 0
  const fitH = peek ? (size.h - 2 * peekRoom) / SLEEVE : (size.h * 0.8) / SLEEVE
  const s = clamp(Math.min((size.w - 48) / (SLEEVE + DISC_PEEK), fitH), 0.5, 1.6)
  const step = peek ? SLEEVE * s * 0.9 + 14 : SLEEVE * s * 0.92 + 36
  // Fade only where the covers above/below peek — measured from the real box center (center cover stays opaque even if the measured size is stale)
  const half = (SLEEVE * s) / 2
  const mask = `linear-gradient(to bottom, transparent, #000 calc(50% - ${half}px), #000 calc(50% + ${half}px), transparent)`
  // Desktop: covers above/below must not overflow under the top-right buttons → clip vertically only (fade at top/bottom)
  // This layer is wider than the box so cover shadows/blur aren't cut in a straight line
  const fade = clamp(((size.h - SLEEVE * s) / 2) * 0.7, 0, 110)
  const edge = `linear-gradient(to bottom, transparent, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent)`
  // Both modes: the layer bleeds past the box left/right and is masked vertically only — clipping the sides cut the
  // cover shadows/blur into visible straight edges (the app root clips horizontal overflow anyway)
  const vMask = peek ? mask : edge
  const layerStyle: CSSProperties = { inset: `0 -${LAYER_BLEED}px`, maskImage: vMask, WebkitMaskImage: vMask }

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY }
    swiped.current = false
  }
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start || flipping || locked) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const vertical = Math.abs(dy) >= Math.abs(dx)
    const d = vertical ? dy : dx
    if (Math.abs(d) > 40) {
      swiped.current = true
      if (d < 0) onNext()
      else onPrev()
    }
  }
  const onWheel = (e: WheelEvent) => {
    const now = performance.now()
    if (locked) return
    if (Math.abs(e.deltaY) < 12 || now - wheelAt.current < 450) return
    wheelAt.current = now
    if (e.deltaY > 0) onNext()
    else onPrev()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (locked) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      onNext()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev()
    }
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="ลังแผ่นเสียง"
      aria-label="เลือกแผ่น ปัดขึ้น/ลง หรือใช้ปุ่มลูกศรเพื่อเลื่อน"
      className={'stack' + (flipping ? ' stack--fast' : '') + ' ' + className}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    >
      <div className="pointer-events-none absolute" style={layerStyle}>
        {size.w > 0 &&
          ALBUMS.map((a, i) => {
            let d = i - index
            if (d > NA / 2) d -= NA
            if (d < -NA / 2) d += NA
            const ad = Math.abs(d)
            const count = countOf(a.key)
            // Shift the center cover left by half the peeking record → the whole set is centered
            const x = -(DISC_PEEK / 2) * s + (ad ? 10 * s : 0)
            const y = fanned ? (ad <= 1 ? d : Math.sign(d) * 1.6) * step : 0
            const style: CSSProperties = {
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${ad && fanned ? d * 4 : 0}deg) scale(${s * (ad ? 0.9 : popped ? 1 : 0.9)})`,
              // Neighbors stay recognizable (art + name readable through a light blur) so they preview what's above/below
              filter: ad ? 'blur(2px)' : 'blur(0px)',
              opacity: ad === 0 ? (popped ? 1 : 0) : ad === 1 && !chosen && !locked && fanned ? 0.55 : 0,
              zIndex: 10 - ad,
              pointerEvents: ad <= 1 ? 'auto' : 'none',
            }
            return (
              <button
                key={a.key}
                type="button"
                className="stack-card"
                style={style}
                data-center={d === 0 || undefined}
                tabIndex={ad === 0 ? 0 : -1}
                aria-hidden={ad !== 0 || undefined}
                aria-label={`เล่นแผ่น ${a.th} ${count} เมนู`}
                onClick={() => {
                  if (swiped.current) {
                    swiped.current = false
                    return
                  }
                  if (flipping || locked) return
                  if (d === 0) onChoose(i)
                  else onGoTo(i)
                }}
              >
                <div
                  aria-hidden="true"
                  className={'cf-disc' + (loading && d === 0 ? ' cf-disc--spin' : '') + (d === 0 && (chosen || flipping) ? ' cf-disc--go' : '')}
                  style={{ left: d === 0 ? 50 : 12 }}
                >
                  <div className="cf-disc-sheen" />
                  <div className="cf-disc-label" style={{ background: a.color }} />
                </div>
                {/* Selected: sleeve slides out left, leaving the record to fly to the platter */}
                <div className={'cf-sleeve' + (chosen && d === 0 ? ' cf-sleeve--out' : '')} style={{ background: a.art, color: a.sleeveInk ?? a.ink }}>
                  <div className="cf-title">{a.title}</div>
                  <div className="cf-th">{a.th}</div>
                  <div className="cf-count" style={a.badge ? { background: a.badge, color: a.badgeInk } : undefined}>
                    {locked ? '…' : count}
                  </div>
                </div>
              </button>
            )
          })}
      </div>
    </div>
  )
}
