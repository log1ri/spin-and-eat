import { useEffect, useRef } from 'react'
import { ALBUMS } from '@/data/albums'
import type { Menu } from '@/data/repo'
import { flick, slide } from '@/lib/audio'
import { draw, poolFor } from '@/lib/draw'
import { ARM_REST } from '@/lib/geometry'
import { prefersReducedMotion } from '@/hooks/useReducedMotion'
import { REC_HIDDEN, REC_ON, useUi } from '@/store/ui'

const NA = ALBUMS.length

/** Album picker behavior: scroll, shuffle, select */
export function useCrate(menus: readonly Menu[]) {
  const timers = useRef<number[]>([])
  const menusRef = useRef(menus)
  menusRef.current = menus

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const goTo = (i: number) => {
    const s = useUi.getState()
    if (s.chosen) return
    const idx = ((i % NA) + NA) % NA
    if (idx === s.crateIdx) return
    flick()
    s.set({ crateIdx: idx })
  }

  const choose = (idx: number) => {
    const s = useUi.getState()
    if (s.chosen) return
    const key = ALBUMS[idx]!.key
    slide(600, 0.08)
    s.set({ chosen: true, crateIdx: idx, played: true })
    // Sleeve slides out leaving the record ~480ms → go to the player, then that record flies onto the platter (DiscFlight)
    later(() => {
      const cur = useUi.getState()
      const r = document.querySelector('.stack-card[data-center] .cf-disc')?.getBoundingClientRect()
      const flight =
        r && r.width > 0 && !prefersReducedMotion() ? { x: r.left, y: r.top, size: r.width, color: ALBUMS[idx]!.color, stage: ALBUMS[idx]!.stage.bg } : null
      cur.set({
        screen: 'player',
        chosen: false,
        cat: key,
        album: draw(poolFor(menusRef.current, key), cur.lastId),
        albumNo: cur.albumNo + 1,
        phase: 'idle',
        k: null,
        arm: ARM_REST,
        armTrans: 'none',
        rec: flight ? REC_HIDDEN : REC_ON,
        flight,
      })
    }, 480)
  }

  const flipRandom = () => {
    const s = useUi.getState()
    if (s.flipping || s.chosen) return
    const steps = 12 + Math.floor(Math.random() * NA)
    let i = 0
    s.set({ flipping: true })
    const step = () => {
      i++
      flick()
      const cur = useUi.getState()
      cur.set({ crateIdx: (cur.crateIdx + 1) % NA })
      if (i < steps) {
        const p = i / steps
        later(step, 70 + p * p * 300)
      } else {
        cur.set({ flipping: false })
        later(() => choose(useUi.getState().crateIdx), 650)
      }
    }
    step()
  }

  const guard = (fn: () => void) => () => {
    if (!useUi.getState().flipping) fn()
  }

  return {
    goTo,
    choose,
    flipRandom,
    prev: guard(() => goTo(useUi.getState().crateIdx - 1)),
    next: guard(() => goTo(useUi.getState().crateIdx + 1)),
    chooseCenter: guard(() => choose(useUi.getState().crateIdx)),
  }
}
