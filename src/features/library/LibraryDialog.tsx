import { AnimatePresence, m as M } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject, type PointerEvent } from 'react'
import { PressButton } from '@/components/PressButton'
import { CheckIcon, CloseIcon, PlusIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { Dialog, DialogClose, DialogDescription, DialogSheet, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALBUMS, CATS, metaOf, type AlbumKey, type Cat } from '@/data/albums'
import { isPending, useAddMenu, useMenus, useRemoveMenu, useUpdateMenu } from '@/data/queries'
import type { Menu } from '@/data/repo'
import { useUi } from '@/store/ui'

const UNDO_MS = 5000

/** The catalog is off-white paper with dark text — color comes only from each category's cover */
const PAPER = '#F7F5F0'
const INK = '#17141C'
const paperVars = { color: INK, '--ink': INK, '--stage': PAPER, background: PAPER } as CSSProperties

const no = (i: number) => String(i + 1).padStart(2, '0')

export function LibraryDialog() {
  const open = useUi((s) => s.manageOpen)
  const set = useUi((s) => s.set)
  const redraw = useUi((s) => s.redraw)
  const { data: menus = [] } = useMenus()
  // Menus just deleted but still undoable (not actually deleted yet) → exclude from draws
  const hiddenRef = useRef<string | null>(null)

  const onOpenChange = (next: boolean) => {
    set({ manageOpen: next })
    // Library closed → draw a new record from the latest library + reset the needle (as in the prototype)
    if (!next) redraw(menus.filter((m) => m.id !== hiddenRef.current))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSheet
        className="on-stage"
        style={paperVars}
        onOpenAutoFocus={(e) => {
          // Don't pop the keyboard on mobile: focus the close button instead of the search field
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-close]')?.focus()
        }}
      >
        <Library hiddenRef={hiddenRef} />
      </DialogSheet>
    </Dialog>
  )
}

function Library({ hiddenRef }: { hiddenRef: MutableRefObject<string | null> }) {
  const { data: allMenus = [] } = useMenus()
  const addM = useAddMenu()
  const updateM = useUpdateMenu()
  const removeM = useRemoveMenu()

  const [filter, setFilter] = useState<AlbumKey>('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [draftCat, setDraftCat] = useState<Cat>('rice')
  // Row left swiped open (delete button visible) — only one at a time
  const [swipedId, setSwipedId] = useState<string | null>(null)
  // Undoable delete: hide for 5 seconds, then really delete → undo restores the same menu (same id/position)
  const [undo, setUndo] = useState<Menu | null>(null)
  // Feedback for every action, shown as a bar inside the sheet (above the add field) — a page-level toast sits under the
  // modal overlay, so its "เลิกทำ" button couldn't be clicked while the library is open
  const [notice, setNotice] = useState<{ key: number; text: string; undo?: () => void } | null>(null)
  const noticeT = useRef(0)
  const say = (text: string, undo?: () => void, ms = 3200) => {
    clearTimeout(noticeT.current)
    setNotice({ key: Date.now(), text, undo })
    noticeT.current = window.setTimeout(() => setNotice(null), ms)
  }
  useEffect(() => () => clearTimeout(noticeT.current), [])
  const pending = useRef<Menu | null>(null)
  const undoT = useRef(0)
  const commit = useRef(removeM.mutate)
  commit.current = removeM.mutate
  const flush = () => {
    clearTimeout(undoT.current)
    if (pending.current) commit.current(pending.current)
    pending.current = null
    hiddenRef.current = null
  }
  // Library closed while waiting → delete immediately
  useEffect(() => flush, [])

  const menus = undo ? allMenus.filter((m) => m.id !== undo.id) : allMenus

  const q = query.trim().toLowerCase()
  const pausedCount = menus.filter((m) => !m.active).length
  const isAll = filter === 'all'

  const addMenu = () => {
    const name = draft.trim()
    if (!name) return
    const cat = isAll ? draftCat : filter
    addM.add({ name: name.slice(0, 80), cat })
    say(`เพิ่ม “${name.slice(0, 80)}” ใน${metaOf(cat).th}แล้ว`)
    setDraft('')
    setQuery('')
  }

  const removeMenu = (m: Menu) => {
    flush() // the previously pending one → delete it for real now
    setSwipedId(null)
    pending.current = m
    hiddenRef.current = m.id
    setUndo(m)
    undoT.current = window.setTimeout(() => {
      flush()
      setUndo(null)
    }, UNDO_MS)
    say(`ลบ “${m.name}” แล้ว`, onUndo, UNDO_MS)
  }

  function onUndo() {
    clearTimeout(undoT.current)
    pending.current = null
    hiddenRef.current = null
    setUndo(null)
    say('เอากลับมาแล้ว')
  }

  const toggleMenu = (m: Menu) => {
    const next = !m.active
    updateM.mutate({ menu: m, patch: { active: next } })
    // latest action replaces the previous notice · undo = flip it back
    say(next ? `เปิด “${m.name}” กลับเข้าวงสุ่มแล้ว` : `พัก “${m.name}” แล้ว · จะไม่ถูกสุ่ม`, () => {
      updateM.mutate({ menu: { ...m, active: next }, patch: { active: !next } })
      setNotice(null)
    })
  }

  const groupKeys: Cat[] = isAll ? [...CATS] : [filter]
  const groups = groupKeys
    .map((c) => ({
      meta: metaOf(c),
      items: menus.filter((m) => m.cat === c && (!q || m.name.toLowerCase().includes(q))),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
      {/* Sheet grab handle (decorative) */}
      <div aria-hidden="true" className="sheet-grip mx-auto mt-2.5 h-1.5 w-10 flex-none rounded-full bg-current/15" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-px">
          <DialogTitle className="m-0 text-[22px] font-semibold">คลังเมนู</DialogTitle>
          <DialogDescription className="m-0 text-[13px] opacity-55">
            {menus.length} เมนู{pausedCount ? ` · พักไว้ ${pausedCount}` : ''}
            <span className="hint-touch"> · แตะเพื่อพัก · ปัดซ้ายเพื่อลบ</span>
            <span className="hint-mouse"> · คลิกเพื่อพัก · ชี้แล้วกดถังขยะเพื่อลบ</span>
          </DialogDescription>
        </div>
        <DialogClose asChild>
          <PressButton
            data-close
            aria-label="ปิดคลังเมนู"
            className="flex size-9 flex-none items-center justify-center rounded-full border-0 bg-current/[0.07]"
          >
            <CloseIcon size={16} />
          </PressButton>
        </DialogClose>
      </div>

      <div className="relative flex-none">
        <SearchIcon className="pointer-events-none absolute top-[13px] left-[15px] opacity-45" />
        <input
          type="search"
          aria-label="ค้นหาเมนู"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาเมนู"
          className="paper-field box-border h-11 w-full rounded-full pr-4 pl-10 text-base"
        />
      </div>

      <div
        role="group"
        aria-label="กรองตามอัลบั้ม"
        className="no-scrollbar -mx-5 flex flex-none gap-1.5 overflow-x-auto px-5 pb-0.5 [mask-image:linear-gradient(90deg,#000_calc(100%-32px),transparent)] min-[880px]:flex-wrap min-[880px]:overflow-visible min-[880px]:[mask-image:none]"
      >
        {ALBUMS.map((a) => {
          const on = filter === a.key
          const all = a.key === 'all'
          return (
            <PressButton
              key={a.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(a.key)}
              className="relative flex h-8 flex-none items-center gap-1.5 rounded-full border pr-[11px] text-[13px] whitespace-nowrap transition-colors duration-200"
              style={{
                paddingLeft: all ? 12 : 5,
                color: on ? PAPER : INK,
                borderColor: on ? 'transparent' : 'rgba(23,20,28,0.14)',
              }}
            >
              {/* one dark pill that slides to the chosen chip */}
              {on && (
                <M.span
                  layoutId="lib-chip"
                  aria-hidden="true"
                  className="absolute -inset-px rounded-full"
                  style={{ background: INK }}
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                />
              )}
              {!all && <span aria-hidden="true" className="relative size-[22px] rounded-full" style={{ background: a.art }} />}
              <span className="relative">{all ? 'ทั้งหมด' : a.th}</span>
              <span className="relative text-xs opacity-60">{all ? menus.length : menus.filter((m) => m.cat === a.key).length}</span>
            </PressButton>
          )
        })}
      </div>

      <div
        className="scroll-thin -mr-2 min-h-0 flex-1 overflow-y-auto pr-2 [mask-image:linear-gradient(180deg,transparent,#000_14px)]"
        onScroll={() => swipedId && setSwipedId(null)}
      >
        {groups.length === 0 && (
          <div className="py-8 text-center text-sm opacity-55">
            {q ? 'ไม่เจอเมนูที่ค้นหา' : 'อัลบั้มนี้ยังไม่มีเมนู ลองเพิ่มด้านล่างได้เลย'}
          </div>
        )}
        {groups.map((g, gi) => (
          // Category = one record in the catalog: cover + name, followed by its tracks
          <section key={g.meta.key} aria-label={g.meta.th} className={gi > 0 ? 'mt-7' : 'mt-2'}>
            <h3 className="m-0 mb-1.5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-11 flex-none rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
                style={{ background: g.meta.art }}
              />
              <span className="flex flex-col">
                <span className="text-[17px] leading-tight font-semibold">{g.meta.th}</span>
                <span className="text-xs font-normal opacity-50">{g.items.length} เมนู</span>
              </span>
            </h3>
            <ul className="m-0 list-none p-0">
              {/* rows collapse out on delete, grow back in on undo / when added (initial=false: no animation on open) */}
              <AnimatePresence initial={false}>
              {g.items.map((m, i) => (
                <TrackRow
                  key={m.id}
                  n={i}
                  menu={m}
                  swiped={swipedId === m.id}
                  othersSwiped={swipedId !== null && swipedId !== m.id}
                  onSwipe={(open) => setSwipedId(open ? m.id : null)}
                  onToggle={() => toggleMenu(m)}
                  onRemove={() => removeMenu(m)}
                />
              ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}

      </div>

      <div className="flex flex-none flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {notice && (
            <M.div
              key={notice.key}
              role="status"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
              className="flex min-h-[46px] items-center justify-between gap-2.5 rounded-full py-1.5 pr-1.5 pl-4 text-sm shadow-[0_8px_20px_rgba(10,6,20,0.18)]"
              style={{ background: INK, color: PAPER }}
            >
              <span className="truncate">{notice.text}</span>
              {notice.undo && (
                <PressButton
                  type="button"
                  onClick={notice.undo}
                  className="h-[34px] flex-none rounded-full border-0 bg-transparent px-3.5 text-sm font-semibold text-inherit underline underline-offset-4"
                >
                  เลิกทำ
                </PressButton>
              )}
            </M.div>
          )}
        </AnimatePresence>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addMenu()
          }}
        >
          <label htmlFor="newMenu" className="sr-only">
            เพิ่มเมนูใหม่
          </label>
          <input
            id="newMenu"
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isAll ? 'เพิ่มเมนูใหม่…' : `เพิ่มเมนูใน ${metaOf(filter).th}…`}
            enterKeyHint="done"
            className="paper-field box-border h-11 min-w-0 flex-1 rounded-full px-4 text-base"
          />
          {isAll && (
            <Select value={draftCat} onValueChange={(v) => setDraftCat(v as Cat)}>
              <SelectTrigger aria-label="อัลบั้มของเมนูใหม่" className="paper-field w-[104px] flex-none border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={paperVars}>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {metaOf(c).th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <PressButton
            type="submit"
            aria-label="เพิ่มเมนู"
            className="flex size-11 flex-none items-center justify-center rounded-full border-0"
            style={{ background: INK, color: PAPER }}
          >
            <PlusIcon />
          </PressButton>
        </form>
      </div>
    </div>
  )
}

/** Swipe distance that keeps the delete button open (px) */
const REVEAL = 84

/** Track row: tap the whole row = enable/pause the menu (ticked circle = in the draw, empty circle = paused)
 *  Delete: on mobile swipe the row left (full swipe deletes / half swipe keeps the "ลบ" button open) · desktop: hover the row for a trash icon
 *  Deletes can still be undone from the bar at the bottom
 *  Tick color is the same for every category: the same state must look the same (category color is already on the cover) */
function TrackRow(props: {
  n: number
  menu: Menu
  swiped: boolean
  othersSwiped: boolean
  onSwipe: (open: boolean) => void
  onToggle: () => void
  onRemove: () => void
}) {
  const { n, menu: m, swiped, othersSwiped, onSwipe, onToggle, onRemove } = props
  const pending = isPending(m)
  const [drag, setDrag] = useState<number | null>(null)
  const g = useRef<{ x: number; y: number; base: number; dir: 'h' | 'v' | null; w: number } | null>(null)
  const moved = useRef(false)

  const onPointerDown = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === 'mouse' || pending) return
    g.current = { x: e.clientX, y: e.clientY, base: swiped ? -REVEAL : 0, dir: null, w: e.currentTarget.offsetWidth }
    moved.current = false
  }
  const onPointerMove = (e: PointerEvent<HTMLLIElement>) => {
    const s = g.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.dir) {
      // decide whether this is a horizontal swipe (delete) or a vertical list scroll
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        s.dir = 'h'
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // pointer already released — fine
        }
      } else if (Math.abs(dy) > 8) s.dir = 'v'
    }
    if (s.dir === 'h') {
      moved.current = true
      setDrag(Math.min(0, Math.max(-s.w, s.base + dx)))
    }
  }
  const onPointerUp = () => {
    const s = g.current
    g.current = null
    if (!s || s.dir !== 'h' || drag === null) return
    setDrag(null)
    if (drag < -s.w * 0.55) onRemove()
    else onSwipe(drag < -REVEAL / 2)
  }

  const x = drag ?? (swiped ? -REVEAL : 0)
  return (
    <M.li
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
      className="group relative overflow-hidden border-b border-current/[0.08] last:border-b-0"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        g.current = null
        setDrag(null)
      }}
    >
      {/* Behind the row: red background + "ลบ" (delete) button (visible when swiping left) */}
      <div aria-hidden={!swiped} className="absolute inset-0 flex justify-end bg-[#E5484D]">
        <button
          type="button"
          tabIndex={swiped ? 0 : -1}
          onClick={onRemove}
          className="h-full border-0 bg-transparent text-[15px] font-semibold text-white"
          style={{ width: Math.max(REVEAL, -x) }}
        >
          ลบ
        </button>
      </div>
      <div
        className="relative flex items-center bg-[var(--stage)]"
        style={{
          transform: `translateX(${x}px)`,
          transition: drag === null ? 'transform .28s cubic-bezier(.22,1,.36,1)' : 'none',
        }}
      >
        <button
          type="button"
          role="switch"
          aria-checked={m.active}
          aria-label={(m.active ? 'พักเมนู ' : 'เปิดใช้เมนู ') + m.name}
          onClick={() => {
            // a tap right after a swipe doesn't count · tapping a row with its delete button open = close it
            if (moved.current) return void (moved.current = false)
            if (swiped || othersSwiped) return onSwipe(false)
            onToggle()
          }}
          disabled={pending}
          className="lib-row flex min-h-[48px] min-w-0 flex-1 items-center gap-3 border-0 bg-transparent px-1 text-left text-inherit"
        >
          <span className="w-5 flex-none font-mono text-xs opacity-40">{no(n)}</span>
          <span className="min-w-0 flex-1 truncate text-[15px] transition-opacity duration-200" style={{ opacity: m.active ? 1 : 0.4 }}>
            {m.name}
          </span>
          {pending && <span className="flex-none text-[11px] opacity-50">กำลังบันทึก…</span>}
          {!m.active && (
            <span className="flex-none rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'rgba(23,20,28,0.08)' }}>
              พักอยู่
            </span>
          )}
        </button>
        {/* Desktop: trash appears on row hover (or keyboard focus) */}
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          aria-label={'ลบ ' + m.name}
          className="row-trash flex size-8 flex-none items-center justify-center rounded-full border-0 bg-transparent text-inherit opacity-0 hover:bg-current/[0.07] focus-visible:opacity-60"
        >
          <TrashIcon />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => (swiped || othersSwiped ? onSwipe(false) : onToggle())}
          disabled={pending}
          className="flex size-10 flex-none items-center justify-center border-0 bg-transparent p-0"
        >
          <span
            className="flex size-5 items-center justify-center rounded-full transition-[background,box-shadow] duration-150"
            // "in the draw" is the normal state → a quiet soft tick, so 30 rows aren't a column of black dots;
            // paused = empty ring (+ dimmed name + "พักอยู่" pill) is what should catch the eye
            style={
              m.active
                ? { background: 'rgba(23,20,28,0.09)', color: 'rgba(23,20,28,0.75)' }
                : { boxShadow: 'inset 0 0 0 1.5px rgba(23,20,28,0.22)' }
            }
          >
            {m.active && <CheckIcon size={12} strokeWidth={3} />}
          </span>
        </button>
      </div>
    </M.li>
  )
}
