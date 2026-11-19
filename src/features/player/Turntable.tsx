import { useRef, type PointerEvent } from 'react'
import type { AlbumMeta } from '@/data/albums'
import type { Menu } from '@/data/repo'
import { angleTo, ARM_MAX, ARM_REST, bandWidth, clamp, DECK_H, DECK_W, OUT } from '@/lib/geometry'
import type { Phase, Rec } from '@/store/ui'

interface Props {
  scale: number
  meta: AlbumMeta
  album: Menu[]
  k: number | null
  phase: Phase
  arm: number
  armTrans: string
  rec: Rec
  /** Can the arm be dragged right now (cursor only — onArmGrab makes the real decision) */
  armMovable?: boolean
  onArmGrab?: () => boolean
  onArmDrag?: (deg: number) => void
  onArmRelease?: (deg: number) => void
}

export function Turntable({ scale, meta, album, k, phase, arm, armTrans, rec, armMovable, onArmGrab, onArmDrag, onArmRelease }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  /** Active drag: offset = finger angle at grab − arm angle (grab anywhere on the arm without it jumping) */
  const drag = useRef<{ id: number; offset: number; deg: number } | null>(null)
  const angleAt = (e: PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect()
    return angleTo((e.clientX - r.left) / scale, (e.clientY - r.top) / scale)
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current || (e.pointerType === 'mouse' && e.button !== 0) || !onArmGrab?.()) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, offset: angleAt(e) - arm, deg: arm }
  }
  const onMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    d.deg = clamp(angleAt(e) - d.offset, ARM_REST, ARM_MAX)
    onArmDrag?.(d.deg)
  }
  const onUp = (e: PointerEvent, cancel = false) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    onArmRelease?.(cancel ? ARM_REST : d.deg)
  }

  const n = album.length
  const BW = bandWidth(n)
  const searching = phase === 'cue' || phase === 'search'
  const playing = phase === 'playing'
  const hasBand = n > 0 && k !== null && (searching || playing)
  const cur = hasBand && k !== null ? album[k] : undefined

  // track rings: n+1 dividers from OUT in to IN
  const rings = Array.from({ length: n + 1 }, (_, i) => OUT - i * BW)
  const bandR = hasBand && k !== null ? OUT - k * BW : OUT
  const idle = phase === 'idle' || phase === 'hold'

  return (
    <div ref={boxRef} className="deck-box" style={{ width: Math.round(DECK_W * scale), height: Math.round(DECK_H * scale) }}>
      <div
        className="deck"
        role="img"
        aria-label={cur && playing ? `เครื่องเล่นแผ่นเสียง กำลังเล่น ${cur.name}` : `เครื่องเล่นแผ่นเสียง แผ่น ${meta.th}`}
        style={{ transform: `scale(${scale.toFixed(4)})` }}
      >
        <div className="deck-rec" style={{ transform: `translateX(${rec.x}px)`, opacity: rec.op, transition: rec.trans }}>
          <div className={'deck-platter' + (searching || playing ? ' anim-spin' : '')}>
            <div className="deck-mat" />
            <div className="deck-vinyl">
              {rings.map((r, i) => (
                <div key={i} className="deck-ring" style={{ left: 130 - r, top: 130 - r, width: r * 2, height: r * 2 }} />
              ))}
              <div
                className="deck-label"
                style={{ background: meta.color, color: meta.ink }}
              >
                <div className="deck-label-text">{playing && cur ? cur.name : meta.th}</div>
                <div className="deck-label-hole" />
              </div>
            </div>
          </div>
          <div className="deck-glare" />
          {hasBand && (
            <div
              className="deck-band"
              style={{
                left: Math.round(41 + 130 - bandR),
                top: Math.round(16 + 130 - bandR),
                width: Math.round(bandR * 2),
                height: Math.round(bandR * 2),
                border: `${Math.max(3, Math.round(BW))}px solid rgba(255,255,255,${playing ? 0.3 : 0.16})`,
              }}
            />
          )}
        </div>

        <div className="deck-arm-base" />
        <div className="deck-arm-rest" />
        <div
          className={'deck-arm' + (phase === 'hold' ? ' deck-arm--lifted' : '') + (phase === 'idle' && armMovable ? ' deck-arm--hint' : '')}
          style={{ transform: `rotate(${arm}deg)`, transition: armTrans }}
        >
          <div className="deck-arm-weight" />
          <div className="deck-arm-tube" />
          <div className="deck-arm-pivot" />
          <div className="deck-arm-head" />
          {/* Arm drag hit area — larger than the real arm so it's easy to grab on mobile · keyboard/screen readers use the "วางเข็มสุ่มเมนู" (drop needle) button instead */}
          <div
            aria-hidden="true"
            className={'deck-arm-grab' + (armMovable || phase === 'hold' ? ' deck-arm-grab--on' : '')}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={(e) => onUp(e)}
            onPointerCancel={(e) => onUp(e, true)}
          />
        </div>
        <div aria-hidden="true" className="deck-knob deck-knob--speed">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M7 7V1.5M7 7l-4.8 2.8M7 7l4.8 2.8" />
          </svg>
        </div>
        <div aria-hidden="true" className={'deck-knob deck-knob--start' + (idle ? '' : ' deck-knob--on')} />
      </div>
    </div>
  )
}
