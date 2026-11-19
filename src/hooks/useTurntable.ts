import { useEffect, useRef } from 'react'
import { ALBUMS } from '@/data/albums'
import { recordPick } from '@/data/queries'
import type { Menu } from '@/data/repo'
import { flick, needleDrop, slide, song, stopSong, tick } from '@/lib/audio'
import { draw, poolFor } from '@/lib/draw'
import { ARM_REST, bandWidth, IN, needleDist, OUT, theta } from '@/lib/geometry'
import { albumIndex, isBusy, REC_OFF_RIGHT, useUi } from '@/store/ui'
import { prefersReducedMotion } from './useReducedMotion'

const SEARCH_MS = 3600

/** Player sequence: change record → cue → search → playing */
export function useTurntable(menus: readonly Menu[]) {
  const timers = useRef<number[]>([])
  const raf = useRef(0)
  const menusRef = useRef(menus)
  menusRef.current = menus

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const stopAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    cancelAnimationFrame(raf.current)
    stopSong()
  }

  // Entering the player: the waiting record slides in from the right
  useEffect(() => {
    const { rec, set } = useUi.getState()
    if (rec.x !== 0) {
      later(() => {
        slide()
        set({ rec: { x: 0, op: 1, trans: 'transform .5s cubic-bezier(.2,.8,.2,1), opacity .35s ease' } })
      }, 40)
    }
    return () => {
      stopAll()
      // Left the player mid-sequence → arm back to rest
      const s = useUi.getState()
      if (s.phase !== 'idle') s.set({ phase: 'idle', k: null, arm: ARM_REST })
    }
  }, [])

  /** Needle wobbles to a random track · from = radius where the user dropped the needle (skips cue, wobbles from there); omitted = start at the outer edge */
  const runSearch = (from?: number) => {
    const { album, set } = useUi.getState()
    const cnt = album.length
    if (!cnt) return
    const bw = bandWidth(cnt)
    const target = Math.floor(Math.random() * cnt)
    const tr = OUT - bw * (target + 0.5)
    const reduced = prefersReducedMotion()
    const T = reduced ? 1200 : SEARCH_MS

    const r0 = from ?? OUT - 1
    const kAt = (rad: number) => Math.max(0, Math.min(cnt - 1, Math.floor((OUT - rad) / bw)))

    const search = () => {
      needleDrop()
      set({ phase: 'search', armTrans: 'none', k: kAt(r0) })
      const start = performance.now()
      let last = kAt(r0)
      const frame = (now: number) => {
        const p = Math.min(1, (now - start) / T)
        const ease = 1 - (1 - p) * (1 - p)
        const mid = r0 + (tr - r0) * ease
        const amp = reduced ? 0 : 34 * Math.pow(1 - p, 1.6)
        let rad = mid + amp * Math.sin(2 * Math.PI * 3 * p)
        rad = Math.max(IN + 1, Math.min(OUT - 1, rad))
        const k = kAt(rad)
        if (k !== last) {
          last = k
          tick()
        }
        if (p >= 1) {
          const picked = album[target]!
          set({ phase: 'playing', arm: theta(tr), k: target, lastId: picked.id })
          song(useUi.getState().cat)
          recordPick(picked)
          return
        }
        set({ arm: theta(rad), k })
        raf.current = requestAnimationFrame(frame)
      }
      raf.current = requestAnimationFrame(frame)
    }

    if (from !== undefined) return search()
    set({ phase: 'cue', k: 0, arm: theta(OUT - 1), armTrans: 'transform .45s cubic-bezier(.3,.8,.4,1)' })
    later(search, 480)
  }

  /** User grabs the arm: lift the needle (stops playback if playing) · returns false if it can't be grabbed right now */
  const grabArm = () => {
    const s = useUi.getState()
    if (isBusy(s.phase) || !s.album.length || s.rec.x !== 0 || s.rec.op !== 1) return false
    stopAll()
    s.set({ phase: 'hold', k: null, armTrans: 'none' })
    return true
  }

  const dragArm = (deg: number) => useUi.getState().set({ arm: deg })

  /** Release the arm: needle over the grooves → drop there and wobble to a random track · outside → back to rest */
  const releaseArm = (deg: number) => {
    const d = needleDist(deg)
    if (d > IN && d < OUT) {
      useUi.getState().set({ arm: deg })
      runSearch(d)
      return
    }
    useUi.getState().set({ phase: 'idle', arm: ARM_REST, armTrans: 'transform .45s cubic-bezier(.3,.8,.4,1)' })
  }

  /** Drop the needle to pick a menu / draw another record */
  const drop = () => {
    const s = useUi.getState()
    if (isBusy(s.phase)) return
    const pool = poolFor(menusRef.current, s.cat)
    if (!pool.length) return
    stopAll()
    slide(700, 0.08)
    s.set({
      phase: 'out',
      k: null,
      arm: ARM_REST,
      armTrans: 'transform .35s ease',
      rec: { x: -360, op: 0, trans: 'transform .38s cubic-bezier(.5,0,.8,.4), opacity .38s ease' },
    })
    later(() => {
      const cur = useUi.getState()
      cur.set({ album: draw(pool, cur.lastId), albumNo: cur.albumNo + 1, rec: REC_OFF_RIGHT, phase: 'in' })
      later(() => {
        slide()
        useUi.getState().set({ rec: { x: 0, op: 1, trans: 'transform .42s cubic-bezier(.2,.8,.2,1), opacity .3s ease' } })
        later(runSearch, 460)
      }, 40)
    }, 400)
  }

  /** Switch to the neighboring album right in the player: old record slides out, new one slides in by direction (next = out left, in from right) */
  const switchAlbum = (dir: 1 | -1) => {
    const s = useUi.getState()
    if (isBusy(s.phase)) return
    stopAll()
    const idx = (albumIndex(s.cat) + dir + ALBUMS.length) % ALBUMS.length
    const key = ALBUMS[idx]!.key
    slide(700, 0.08)
    s.set({
      phase: 'out',
      k: null,
      arm: ARM_REST,
      armTrans: 'transform .35s ease',
      rec: { x: -360 * dir, op: 0, trans: 'transform .38s cubic-bezier(.5,0,.8,.4), opacity .38s ease' },
    })
    later(() => {
      const cur = useUi.getState()
      cur.set({
        cat: key,
        crateIdx: idx,
        album: draw(poolFor(menusRef.current, key), cur.lastId),
        albumNo: cur.albumNo + 1,
        rec: { x: 360 * dir, op: 0, trans: 'none' },
        phase: 'in',
      })
      later(() => {
        slide()
        useUi.getState().set({ rec: { x: 0, op: 1, trans: 'transform .42s cubic-bezier(.2,.8,.2,1), opacity .3s ease' } })
        later(() => useUi.getState().set({ phase: 'idle' }), 440)
      }, 40)
    }, 400)
  }

  /** Back to the album picker (current album's cover centered) */
  // Back to the picker: the player fades out (record slides off the platter, left column drops away) for ~0.3s,
  // then the picker builds itself back up (crateEnter) — instead of the screen just swapping
  const backToCrate = () => {
    const s = useUi.getState()
    if (isBusy(s.phase) || s.leaving) return
    stopAll()
    flick()
    s.set({
      leaving: true,
      phase: 'idle',
      k: null,
      arm: ARM_REST,
      rec: { x: 360, op: 0, trans: 'transform .32s cubic-bezier(.5,0,.8,.4), opacity .3s ease' },
    })
    window.setTimeout(() => {
      useUi.getState().set({ screen: 'crate', leaving: false, crateEnter: true, flight: null, crateIdx: albumIndex(useUi.getState().cat) })
    }, prefersReducedMotion() ? 0 : 300)
  }

  return { drop, backToCrate, switchAlbum, grabArm, dragArm, releaseArm }
}
