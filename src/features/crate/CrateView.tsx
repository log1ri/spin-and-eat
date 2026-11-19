import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { HeaderActions } from '@/components/HeaderActions'
import { ArrowDown, ArrowUp, PlayIcon, ShuffleIcon } from '@/components/icons'
import { ALBUMS, type AlbumKey, type AlbumMeta } from '@/data/albums'
import { useMenus } from '@/data/queries'
import type { Layout } from '@/lib/layout'
import { useUi } from '@/store/ui'
import { CrateStack } from './CrateStack'
import { useCrate } from './useCrate'
import { PressButton } from '@/components/PressButton'
import { Rise } from '@/components/Rise'

/** Wide enough → two-column layout (title left, covers right) */
export const isWideCrate = (L: Layout) => L.W >= 880

export function CrateView({ layout: L }: { layout: Layout }) {
  const { data, isError, refetch } = useMenus()
  const menus = data ?? []
  // No menus on the device at all (first visit / cleared data / private mode) → waiting for the sheet, or failed
  const status: 'ready' | 'loading' | 'error' = data ? 'ready' : isError ? 'error' : 'loading'
  const crateIdx = useUi((s) => s.crateIdx)
  const chosen = useUi((s) => s.chosen)
  const flipping = useUi((s) => s.flipping)
  const played = useUi((s) => s.played)
  const crate = useCrate(menus)
  // Coming back from the player → build the picker back up (read once on mount, then clear the flag)
  const [entering] = useState(() => useUi.getState().crateEnter)
  useEffect(() => {
    if (entering) useUi.getState().set({ crateEnter: false })
  }, [entering])

  const active = menus.filter((m) => m.active)
  const countOf = (key: AlbumKey) => active.filter((m) => key === 'all' || m.cat === key).length
  const cm = ALBUMS[crateIdx] ?? ALBUMS[0]!
  const busy = flipping || chosen || status !== 'ready'
  const wide = isWideCrate(L)

  const stageVars = { '--ink': cm.stage.ink, '--stage': cm.stage.bg, color: cm.stage.ink } as CSSProperties

  // h-9 = HeaderActions height → the wordmark sits on the same center line as the buttons
  const overline = <div className="flex h-9 items-center text-[15px] font-semibold whitespace-nowrap">Spin &amp; Eat</div>
  // First-run hint: the app looks like a music player, so say once what it's for (gone after the first play)
  const hint =
    !played && status === 'ready' ? (
      <p className="m-0 opacity-75" style={{ fontSize: wide ? 15 : 13 }}>
        เลือกหมวด กดเล่นแผ่น แล้วดูว่าวันนี้กินอะไร
      </p>
    ) : null
  const title = (
    <TitleBlock
      meta={cm}
      count={countOf(cm.key)}
      note={status === 'loading' ? 'กำลังหยิบแผ่น…' : status === 'error' ? 'ต่อคลังเมนูไม่ได้' : null}
      size={wide ? Math.round(Math.min(L.W * 0.085, L.H * 0.17, 150)) : L.tiny || L.narrow ? 50 : L.compact ? 56 : 66}
      wide={wide}
    />
  )
  // Short screens: smaller arrow buttons so the cover keeps its space
  const ring = wide ? 64 : L.compact ? 46 : 52
  const controls = (
    <div className="flex items-center gap-3">
      <PressButton
        type="button"
        className="ring-btn"
        style={{ width: ring, height: ring }}
        onClick={crate.next}
        disabled={busy}
        aria-label="แผ่นถัดไป"
      >
        <ArrowDown size={wide ? 22 : 20} />
      </PressButton>
      <PressButton
        type="button"
        className="ring-btn"
        style={{ width: ring, height: ring }}
        onClick={crate.prev}
        disabled={busy}
        aria-label="แผ่นก่อนหน้า"
      >
        <ArrowUp size={wide ? 22 : 20} />
      </PressButton>
      <div className="ml-3 font-medium tabular-nums" style={{ fontSize: wide ? 21 : 18 }} aria-hidden="true">
        {crateIdx + 1} <span className="mx-1 opacity-45">/</span>
        <span className="opacity-55">{ALBUMS.length}</span>
      </div>
    </div>
  )
  const stack = (
    <CrateStack
      className="z-0 min-h-0 flex-1"
      index={crateIdx}
      chosen={chosen}
      flipping={flipping}
      countOf={countOf}
      onGoTo={crate.goTo}
      onChoose={crate.choose}
      entering={entering}
      onPrev={crate.prev}
      onNext={crate.next}
      peek={!wide}
      locked={status !== 'ready'}
      loading={status === 'loading'}
    />
  )
  const footer = (
    <Footer
      busy={busy}
      flipping={flipping}
      retry={status === 'error' ? () => void refetch() : undefined}
      narrow={L.narrow}
      label={wide || L.cw >= 400 ? `เล่นแผ่น ${cm.th}` : 'เล่นแผ่นนี้'}
      onFlip={crate.flipRandom}
      onChoose={crate.chooseCenter}
    />
  )

  if (wide) {
    return (
      <div className={'on-stage grid h-full' + (chosen ? ' crate-leaving' : '') + '  grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10'} style={stageVars}>
        <div className="crate-ui relative z-10 flex min-h-0 flex-col">
          {overline}
          {/* Title, controls and the play button form one group centered next to the cover — the action sits with the content */}
          <div className="flex flex-1 flex-col justify-center gap-9 pb-9">
            <Rise skip={!entering} delay={0.08}>
              {title}
            </Rise>
            <Rise skip={!entering} delay={0.16}>
              {controls}
            </Rise>
            <Rise skip={!entering} delay={0.26} className="flex max-w-[460px] flex-col gap-3">
              {hint}
              {footer}
            </Rise>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-col">
          <div className="crate-ui relative z-20 flex justify-end">
            <HeaderActions showText />
          </div>
          {stack}
        </div>
      </div>
    )
  }

  return (
    <div className={'on-stage flex h-full flex-col' + (chosen ? ' crate-leaving' : '')} style={{ ...stageVars, gap: L.gap }}>
      <header className="crate-ui relative z-10 flex items-center justify-between gap-3">
        {overline}
        <HeaderActions showText={!L.narrow} />
      </header>
      <div className="crate-ui relative z-10 flex flex-col" style={{ gap: L.compact ? 12 : 18 }}>
        <Rise skip={!entering} delay={0.08}>
          {title}
        </Rise>
        <Rise skip={!entering} delay={0.16}>
          {controls}
        </Rise>
      </div>
      <div className="-mx-5 flex min-h-0 flex-1 flex-col">{stack}</div>
      {/* crate-ui stays on the outer div: Rise's inline opacity would override the .crate-leaving fade */}
      <div className="crate-ui relative z-10">
        <Rise skip={!entering} delay={0.26} className="flex flex-col gap-2.5">
          {hint}
          {footer}
        </Rise>
      </div>
    </div>
  )
}

/** Number of characters that take horizontal space (excluding upper/lower vowels and tone marks) */
export const visibleLength = (s: string) => s.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length

const TITLE_FONT = "600 100px 'IBM Plex Sans Thai'"
const leadCache = new Map<string, number>()
/** Left side bearing of the first glyph (em) — at huge sizes the title visibly misaligns with the tagline/buttons below, so pull it back by this much */
function inkLead(text: string): number {
  const hit = leadCache.get(text)
  if (hit !== undefined) return hit
  if (typeof document === 'undefined' || !document.fonts?.check(TITLE_FONT, text)) return 0.04
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return 0.04
  ctx.font = TITLE_FONT
  const lead = Math.max(0, -ctx.measureText(text).actualBoundingBoxLeft) / 100
  leadCache.set(text, lead)
  return lead
}

function TitleBlock(props: { meta: AlbumMeta; count: number; note: string | null; size: number; wide: boolean }) {
  const { meta, count, note, size, wide } = props
  // fonts finish loading later → measure again
  const [, setFontsReady] = useState(false)
  useEffect(() => {
    void document.fonts?.ready.then(() => setFontsReady(true))
  }, [])
  // Thai glyphs are ~0.62em wide → shrink long titles to fit the box (cqw = % of box width)
  const fit = Math.floor(96 / (visibleLength(meta.th) * 0.62))
  return (
    <div className="flex min-w-0 flex-col" style={{ containerType: 'inline-size' }} aria-live="polite">
      {/* Fixed-height box sized for the full title size, title sits on its bottom: short/long titles get different
          font sizes, and without this the tagline + buttons below jumped up/down when flipping albums */}
      <div className="flex items-end" style={{ height: Math.round(size * 1.24) }}>
        <h1
          key={meta.key}
          className="crate-title m-0 min-w-0 truncate font-semibold tracking-[-0.03em]"
          style={{ fontSize: `min(${size}px, ${fit}cqw)`, lineHeight: 1.18, paddingTop: size * 0.06, marginLeft: `${-inkLead(meta.th)}em` }}
        >
          {meta.th}
        </h1>
      </div>
      <p className="m-0 opacity-80" style={{ fontSize: wide ? 17 : 14 }}>
        {meta.tag} · {note ?? `${count} เมนู`}
      </p>
    </div>
  )
}

function Footer(props: {
  busy: boolean
  flipping: boolean
  narrow: boolean
  label: string
  /** Menus failed to load → primary button becomes "ลองใหม่" (retry) */
  retry?: () => void
  onFlip: () => void
  onChoose: () => void
}): ReactNode {
  return (
    <div className="flex gap-2.5">
      <PressButton
        type="button"
        onClick={props.onFlip}
        disabled={props.busy}
        className="stage-btn flex h-[50px] flex-none items-center justify-center gap-2 rounded-full text-[15px] font-medium"
        style={{ width: props.narrow ? 108 : 132 }}
      >
        <span className={props.flipping ? 'shuffle-spin' : undefined}>
          <ShuffleIcon />
        </span>
        <span>{props.flipping ? 'คุ้ยลัง…' : 'สุ่มแผ่น'}</span>
      </PressButton>
      <PressButton
        type="button"
        onClick={props.retry ?? props.onChoose}
        disabled={props.busy && !props.retry}
        className="stage-cta flex h-[50px] min-w-0 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full text-base font-semibold whitespace-nowrap"
      >
        {!props.retry && <PlayIcon />}
        <span className="truncate">{props.retry ? 'ลองใหม่' : props.label}</span>
      </PressButton>
    </div>
  )
}
