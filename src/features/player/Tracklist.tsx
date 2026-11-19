import { m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { EASE_OUT } from '@/components/Rise'
import { metaOf, type AlbumMeta } from '@/data/albums'
import type { Menu } from '@/data/repo'

interface Props {
  meta: AlbumMeta
  album: Menu[]
  albumNo: number
  /** Delay before the first draw's rows come in (s) — lets the player build up top → bottom on entry */
  enterDelay?: number
  /** Desktop: the list box is always this many rows tall (fixed-height rows) — every record has the same height,
   *  so the buttons below never move; longer records scroll */
  fixedRows?: number
  /** Highlighted track (null = none) */
  active: number | null
  playing: boolean
}

const no = (i: number) => String(i + 1).padStart(2, '0')

/** Fake track length (seconds) like a record's back cover — derived from the menu id, so a menu always gets the same time · 2:30–4:59 */
export function trackSecs(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return 150 + ((h >>> 0) % 150)
}
export const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

export const FIXED_ROW_H = 32

export function Tracklist({ meta, album, albumNo, active, playing, enterDelay = 0, fixedRows }: Props) {
  // fade the bottom edge while more rows are hidden below (fixed-height list only)
  const [moreBelow, setMoreBelow] = useState(false)
  const checkMore = () => {
    const l = listRef.current
    setMoreBelow(!!fixedRows && !!l && l.scrollTop + l.clientHeight < l.scrollHeight - 2)
  }
  // only the first record waits for the screen entrance; later draws ripple in right away
  const firstNo = useRef(albumNo)
  const base = albumNo === firstNo.current ? enterDelay : 0.05
  const showCats = meta.key === 'all'
  const listRef = useRef<HTMLOListElement>(null)
  const total = album.reduce((t, d) => t + trackSecs(d.id), 0)

  // The row under the needle must always be visible (on short screens the list scrolls)
  useEffect(() => {
    const list = listRef.current
    const row = active === null ? null : (list?.children[active] as HTMLElement | undefined)
    if (!list || !row) return
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight
  }, [active])

  // new record → start at the first track
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
    checkMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumNo, album.length, fixedRows])

  return (
    <section
      aria-label="รายการเมนูบนแผ่น"
      className="flex min-h-0 flex-auto flex-col gap-1 overflow-hidden pt-1"
    >
      <m.div
        className="flex justify-between gap-2 px-1 text-[13px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.5, delay: enterDelay }}
      >
        <span className="truncate">รายการบนแผ่น · ชุดที่ {albumNo}</span>
        <span className="flex-none">
          {album.length} แทร็ก{album.length > 0 && <span aria-hidden="true"> · {mmss(total)}</span>}
        </span>
      </m.div>
      {album.length === 0 && <div className="px-2.5 py-[18px] text-sm opacity-65">แผ่นนี้ยังไม่มีเมนู ลองเพิ่มในคลังเมนูดูนะ</div>}
      <m.ol
        ref={listRef}
        layoutScroll
        onScroll={checkMore}
        className={'scroll-thin relative m-0 flex min-h-0 list-none flex-col overflow-y-auto p-0 ' + (fixedRows ? 'flex-none' : 'flex-auto')}
        style={{
          height: fixedRows ? fixedRows * FIXED_ROW_H : undefined,
          maskImage: moreBelow ? 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent)' : undefined,
          WebkitMaskImage: moreBelow ? 'linear-gradient(to bottom, #000 calc(100% - 28px), transparent)' : undefined,
        }}
      >
        {album.map((d, i) => {
          const on = active === i
          const nowPlaying = on && playing
          return (
            // keyed by record no. → a new draw remounts the rows and they ripple in again, top to bottom
            <m.li
              key={albumNo + ':' + d.id + i}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: base + i * 0.045 }}
              aria-current={nowPlaying ? 'true' : undefined}
              // Phone: rows share the free height (30–46px) so the list fills the space above the buttons; below 30px it scrolls · desktop: fixed 32px rows
              className={
                'track-row relative flex items-center ' +
                (fixedRows ? 'flex-none ' : 'min-h-[30px] max-h-[46px] flex-[1_0_30px] ') +
                'gap-3 rounded-[10px] px-3 text-[15px] transition-colors duration-200'
              }
              style={{
                height: fixedRows ? FIXED_ROW_H : undefined,
                color: nowPlaying ? 'var(--stage)' : undefined,
                fontWeight: on ? 600 : 400,
              }}
            >
              {/* One highlight that slides from row to row after the needle (shared layoutId) instead of rows blinking
                  on/off · faint while searching, solid ink bar when it lands */}
              {on && (
                <m.span
                  layoutId="track-hl"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[10px]"
                  initial={false}
                  animate={{ backgroundColor: playing ? 'var(--ink)' : 'color-mix(in srgb, var(--ink) 14%, transparent)' }}
                  transition={{ layout: { type: 'spring', stiffness: 520, damping: 38 }, backgroundColor: { duration: 0.25 } }}
                />
              )}
              <span
                className="relative w-6 font-mono text-[13px]"
                style={{ opacity: on ? 1 : 0.55 }}
              >
                {no(i)}
              </span>
              <span className="relative flex-1 truncate">{d.name}</span>
              {nowPlaying && (
                <span aria-label="กำลังเล่น" role="img" className="relative flex h-3 items-end gap-0.5">
                  {[0.7, 0.5, 0.9].map((dur, j) => (
                    <span
                      key={j}
                      className="anim-eqb h-3 w-[3px] origin-bottom bg-current"
                      style={{ animationDuration: dur + 's', animationDelay: j * 0.1 + 's' }}
                    />
                  ))}
                </span>
              )}
              {showCats && <span className="relative text-xs opacity-60">{metaOf(d.cat).th}</span>}
              <span aria-hidden="true" className="relative w-9 text-right font-mono text-[13px] tabular-nums" style={{ opacity: on ? 0.9 : 0.55 }}>
                {mmss(trackSecs(d.id))}
              </span>
            </m.li>
          )
        })}
      </m.ol>
    </section>
  )
}
