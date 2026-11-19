import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { HeaderActions } from '@/components/HeaderActions'
import { PressButton } from '@/components/PressButton'
import { Rise } from '@/components/Rise'
import { SlotText } from '@/components/SlotText'
import { ChevronLeft, NeedleIcon, SkipBack, SkipNext } from '@/components/icons'
import { ALBUMS, metaOf } from '@/data/albums'
import { useMenus } from '@/data/queries'
import { useTurntable } from '@/hooks/useTurntable'
import { isWideCrate, visibleLength } from '@/features/crate/CrateView'
import { clamp, DECK_H, DECK_W } from '@/lib/geometry'
import type { Layout } from '@/lib/layout'
import { albumIndex, isBusy, useUi } from '@/store/ui'
import { mmss, Tracklist, trackSecs } from './Tracklist'
import { Turntable } from './Turntable'

/** 28 EQ bars (fixed heights/timings from the prototype) */
const EQ = Array.from({ length: 28 }, (_, i) => ({
  h: 7 + Math.round(9 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))),
  d: (0.45 + ((i * 37) % 50) / 100).toFixed(2) + 's',
  delay: (((i * 13) % 30) / 100).toFixed(2) + 's',
}))

/** EQ bar height when silent (px) */
const IDLE_H = 3

/** "ส้มตำไทย + ไก่ย่าง" → main dish + side dish (desktop dims the "+") */
const splitDish = (name: string) => name.split(/\s+\+\s+/) as [string, string?]

/** Widest menu name (incl. the idle question) at 100px in the real font — re-measured once webfonts load */
function useHeroWidth(menus: { name: string }[]) {
  const [fontsOk, setFontsOk] = useState(() => document.fonts?.status === 'loaded')
  useEffect(() => {
    if (!fontsOk) void document.fonts?.ready.then(() => setFontsOk(true))
  }, [fontsOk])
  return useMemo(() => {
    const ctx = document.createElement('canvas').getContext('2d')
    const names = ['วันนี้กินอะไรดี?', ...menus.map((m) => m.name)]
    if (!ctx) return Math.max(...names.map((t) => visibleLength(t))) * 50
    ctx.font = "600 100px 'IBM Plex Sans Thai', system-ui, sans-serif"
    // −0.03em tracking per glyph ≈ 3px each at 100px
    return Math.max(...names.map((t) => ctx.measureText(t).width - 3 * t.length))
  }, [menus, fontsOk])
}

export function PlayerView({ layout: L }: { layout: Layout }) {
  const { data: menus = [] } = useMenus()
  const cat = useUi((s) => s.cat)
  const phase = useUi((s) => s.phase)
  const k = useUi((s) => s.k)
  const album = useUi((s) => s.album)
  const albumNo = useUi((s) => s.albumNo)
  const arm = useUi((s) => s.arm)
  const armTrans = useUi((s) => s.armTrans)
  const rec = useUi((s) => s.rec)
  const { drop, backToCrate, switchAlbum, grabArm, dragArm, releaseArm } = useTurntable(menus)

  const meta = metaOf(cat)
  const n = album.length
  const leaving = useUi((s) => s.leaving)
  const busy = isBusy(phase) || leaving
  const searching = phase === 'cue' || phase === 'search'
  const playing = phase === 'playing'
  const swapping = phase === 'out' || phase === 'in'
  const hasBand = n > 0 && k !== null && (searching || playing)
  const cur = hasBand && k !== null ? album[k] : undefined

  const ai = albumIndex(cat)
  const prevMeta = ALBUMS[(ai + ALBUMS.length - 1) % ALBUMS.length]!
  const nextMeta = ALBUMS[(ai + 1) % ALBUMS.length]!

  const holding = phase === 'hold'
  const npStatus = swapping
    ? 'กำลังเปลี่ยนแผ่น'
    : holding
      ? 'ปล่อยเข็มบนร่องแผ่น แล้วเข็มจะสุ่มเมนูให้'
      : hasBand && k !== null
      ? searching
        ? `กำลังสุ่ม… เข็มอยู่ที่แทร็ก ${k + 1} จาก ${n}`
        : `วันนี้กิน · แทร็ก ${k + 1} จาก ${n}`
      : n === 0
        ? 'แผ่นเปล่า'
        : // the button is the main way; dragging the arm is the bonus for people who want the turntable feel
          'กดปุ่มวางเข็มเพื่อสุ่มเมนู หรือลากแขนเข็มเองก็ได้'
  const npTitle = cur ? cur.name : swapping ? 'กำลังเปลี่ยนแผ่น…' : n === 0 ? 'แผ่นนี้ยังไม่มีเมนู' : 'วันนี้กินอะไรดี?'
  const btnLabel = swapping ? 'กำลังเปลี่ยนแผ่น…' : holding ? 'ปล่อยเข็มบนแผ่น…' : searching ? 'เข็มกำลังหาแทร็ก…' : playing ? 'สุ่มอีกแผ่น' : 'วางเข็มสุ่มเมนู'

  const stageVars = { '--ink': meta.stage.ink, '--stage': meta.stage.bg, color: meta.stage.ink } as CSSProperties
  const ring = L.compact ? 48 : 52

  // Desktop: two columns (turntable + info) instead of the phone column floating in the middle of the screen
  const wide = isWideCrate(L)
  const deckS = wide
    ? clamp(Math.min((L.H - 200) / DECK_H, ((Math.min(L.W, 1240) - 96 - 112) * 0.54) / DECK_W), 1, 2)
    : L.deckS

  // Keyboard: Space = drop the needle, ← → = change album (skipped while typing, in the library, or on a focused button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || useUi.getState().manageOpen || useUi.getState().leaving) return
      const t = e.target as HTMLElement | null
      if (t && (t.closest('input, textarea, select, button, [contenteditable="true"]') || t.isContentEditable)) return
      if (e.key === ' ') {
        e.preventDefault()
        drop()
      } else if (e.key === 'ArrowLeft') switchAlbum(-1)
      else if (e.key === 'ArrowRight') switchAlbum(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const header = (
      <header className="flex items-center justify-between gap-3" style={{ marginBottom: wide ? 0 : L.pad - L.gap }}>
        <PressButton
          type="button"
          onClick={backToCrate}
          disabled={busy}
          aria-label={`เปลี่ยนแผ่น แผ่นปัจจุบัน ${meta.th}`}
          className="flex min-w-0 items-center gap-3 border-0 bg-transparent p-0 text-left text-inherit"
        >
          <span
            aria-hidden="true"
            className="size-12 flex-none rounded-[5px] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_14px_rgba(0,0,0,0.45)]"
            style={{ background: meta.art }}
          />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="flex items-center gap-0.5 text-xs opacity-70">
              <ChevronLeft size={12} strokeWidth={2.5} />
              <span>เปลี่ยนแผ่น</span>
            </span>
            <span className="truncate text-[19px] leading-[1.25] font-semibold">{meta.th}</span>
          </span>
        </PressButton>
        <HeaderActions showText={!L.narrow} />
      </header>
  )

  const deck = (
      <Turntable
        scale={deckS}
        meta={meta}
        album={album}
        k={k}
        phase={phase}
        arm={arm}
        armTrans={armTrans}
        rec={rec}
        armMovable={n > 0 && (phase === 'idle' || playing)}
        onArmGrab={grabArm}
        onArmDrag={dragArm}
        onArmRelease={releaseArm}
      />
  )

  const titleSize = wide ? (playing && cur ? 56 : 44) : playing && cur ? (L.compact ? 32 : 40) : L.compact ? 26 : 32
  const nowPlaying = (
      // The picked menu = the star of the screen
      <div className={'flex flex-col gap-1.5 ' + (wide ? 'items-start text-left' : 'items-center text-center')}>
        <div className={(wide ? 'text-[15px]' : 'text-sm') + (playing && cur ? ' font-semibold' : ' opacity-80')}>{npStatus}</div>
        <SlotText
          text={npTitle}
          landed={!!(playing && cur)}
          origin={wide ? 'left center' : 'center'}
          // Result = the reason the user is here: bigger + a bounce when it lands; names roll like a slot reel while the needle searches
          className="w-full max-w-full font-semibold tracking-[-0.02em]"
          style={{
            fontSize: titleSize,
            // line box sized for the bigger result text → the list below doesn't jump when the result pops in
            lineHeight: `${Math.round((L.compact ? 32 : 40) * 1.25)}px`,
            opacity: cur || (!swapping && n > 0) ? (searching ? 0.75 : 1) : 0.55,
          }}
        >
          {playing && cur ? <span className="sr-only">ได้เมนู </span> : null}
          {npTitle}
        </SlotText>
        <div aria-hidden="true" className="flex h-4 w-[160px] items-end gap-[3px]">
          {EQ.map((b, i) => (
            // outer layer: collapse/expand via transition (silent ↔ playing) · inner layer: bounces while playing
            <div
              key={i}
              className="eq-bar flex-1 origin-bottom"
              // silent: every bar is the same height (IDLE_H px), a flat line
              style={{ height: b.h, transform: `scaleY(${playing ? 1 : IDLE_H / b.h})`, opacity: playing ? 0.9 : 0.3 }}
            >
              <div
                className={'h-full origin-bottom rounded-[2px] bg-current' + (playing ? ' anim-eqbar' : '')}
                style={{ animationDuration: b.d, animationDelay: b.delay }}
              />
            </div>
          ))}
        </div>
      </div>
  )

  // Desktop hero = label row · main dish (ONE line) · subline (side dish / category / hint). Every row has a fixed
  // height and the name has ONE size for the whole library (fit to its widest main dish, measured in the real font),
  // so nothing moves while the needle flicks through names and there's no reserved empty line
  const got = playing && cur
  const heroW100 = useHeroWidth(menus)
  const heroSize = `min(76px, ${Math.round(L.H * 0.09)}px, ${(9700 / heroW100).toFixed(2)}cqw)`
  const eq = (w: number) => (
    <div aria-hidden="true" className="flex h-5 items-end gap-[3px]" style={{ width: w }}>
      {EQ.map((b, i) => (
        <div
          key={i}
          className="eq-bar flex-1 origin-bottom"
          style={{ height: b.h + 3, transform: `scaleY(${playing ? 1 : IDLE_H / (b.h + 3)})`, opacity: playing ? 0.9 : 0.3 }}
        >
          <div
            className={'h-full origin-bottom rounded-[2px] bg-current' + (playing ? ' anim-eqbar' : '')}
            style={{ animationDuration: b.d, animationDelay: b.delay }}
          />
        </div>
      ))}
    </div>
  )
  const heroLabel = (
    <div className="flex h-7 items-center gap-4">
      {got ? (
        <div className="flex items-baseline gap-2.5">
          <span className="text-[18px] font-semibold">วันนี้กิน</span>
          <span className="font-mono text-[13px] opacity-70">
            TRACK {String((k ?? 0) + 1).padStart(2, '0')}/{String(n).padStart(2, '0')} · {mmss(trackSecs(cur.id))}
          </span>
        </div>
      ) : (
        <div className="text-[15px] opacity-80">{npStatus}</div>
      )}
    </div>
  )
  const [heroMain, heroSide] = splitDish(npTitle)
  const heroName = (
    <div
      aria-live="polite"
      className="flex flex-col"
      style={{
        fontSize: heroSize,
        opacity: cur || (!swapping && n > 0) ? (searching ? 0.75 : 1) : 0.55,
      }}
    >
      <SlotText text={npTitle} landed={!!got} className="font-semibold tracking-[-0.03em]" style={{ lineHeight: 1.2, paddingTop: '0.04em' }}>
        {got ? <span className="sr-only">ได้เมนู </span> : null}
        {heroSide ? (
          <>
            {heroMain} <span className="font-normal opacity-55">+</span> {heroSide}
          </>
        ) : (
          heroMain
        )}
      </SlotText>
      {/* EQ under the name — fixed height so nothing below moves */}
      <div className="flex h-[0.62em] items-center">
        <div className="flex-none">{eq(220)}</div>
      </div>
    </div>
  )
  const heroWide = (
    <div className="flex flex-col gap-2" style={{ containerType: 'inline-size' }}>
      {heroLabel}
      {heroName}
    </div>
  )

  const tracklist = <Tracklist meta={meta} album={album} albumNo={albumNo} active={hasBand ? k : null} playing={playing} enterDelay={0.32} fixedRows={wide ? 6 : undefined} />

  const footer = (
      // ‹ previous album · drop needle · next album ›
      <div className="flex flex-none items-center gap-2.5">
        <PressButton
          type="button"
          className="ring-btn"
          style={{ width: ring, height: ring }}
          onClick={() => switchAlbum(-1)}
          disabled={busy}
          aria-label={`แผ่นก่อนหน้า: ${prevMeta.th}`}
          title={`แผ่นก่อนหน้า: ${prevMeta.th}`}
        >
          <SkipBack size={18} />
        </PressButton>
        <PressButton
          type="button"
          onClick={drop}
          disabled={busy || n === 0}
          className="stage-cta flex min-w-0 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full text-base font-semibold whitespace-nowrap"
          style={{ height: ring }}
        >
          <NeedleIcon />
          <span className="truncate">{btnLabel}</span>
        </PressButton>
        <PressButton
          type="button"
          className="ring-btn"
          style={{ width: ring, height: ring }}
          onClick={() => switchAlbum(1)}
          disabled={busy}
          aria-label={`แผ่นถัดไป: ${nextMeta.th}`}
          title={`แผ่นถัดไป: ${nextMeta.th}`}
        >
          <SkipNext size={18} />
        </PressButton>
      </div>
  )
  const keysHint = (
    <div aria-hidden="true" className="text-[13px] opacity-60">
      <kbd className="kbd">Space</kbd> วางเข็ม · <kbd className="kbd kbd--arrow">←</kbd> <kbd className="kbd kbd--arrow">→</kbd> เปลี่ยนแผ่น
    </div>
  )

  if (wide) {
    const info = (
      // Entrance: builds up top → bottom (status · name · list rows · buttons) while the record lands on the platter
      <div className="player-fade flex min-h-0 min-w-0 flex-col justify-center gap-7">
        <Rise delay={0.12}>{heroWide}</Rise>
        <div className="flex flex-col">{tracklist}</div>
        <Rise delay={0.6} className="flex flex-col gap-3">
          {footer}
          {keysHint}
        </Rise>
      </div>
    )
    // Info left, turntable right — same arrangement as the album picker (title left, covers right), so the record
    // flies a short way from the sleeve to the platter instead of across the screen
    const deckCol = <div className="flex min-h-0 flex-col items-center justify-center">{deck}</div>
    return (
      <div className={'player-enter on-stage flex h-full flex-col gap-6' + (leaving ? ' player-leaving' : '')} style={stageVars}>
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-28">
          {info}
          {deckCol}
        </div>
      </div>
    )
  }

  return (
    <div className={'player-enter on-stage flex h-full flex-col' + (leaving ? ' player-leaving' : '')} style={{ ...stageVars, gap: L.gap }}>
      {header}
      {deck}
      {/* player-fade wraps Rise (not on it): Rise's inline opacity would override the leaving fade */}
      <div className="player-fade">
        <Rise delay={0.12}>{nowPlaying}</Rise>
      </div>
      <div className="player-fade flex min-h-0 flex-auto flex-col">{tracklist}</div>
      <div className="player-fade mt-auto">
        <Rise delay={0.6}>{footer}</Rise>
      </div>
    </div>
  )
}

