import { useLayoutEffect, useRef } from 'react'
import { useUi } from '@/store/ui'

/** Sleeve record size (.cf-disc) before scaling */
const D = 244

/** Record flying from the album picker onto the player's platter — the real platter record stays hidden until this one lands */
export function DiscFlight() {
  const flight = useUi((s) => s.flight)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!flight || !el) return
    const { set } = useUi.getState()
    const land = () => set({ rec: { x: 0, op: 1, trans: 'opacity .25s ease' } })
    const to = document.querySelector('.deck-vinyl')?.getBoundingClientRect()
    if (!to) {
      land()
      set({ flight: null })
      return
    }
    const dx = to.left + to.width / 2 - (flight.x + flight.size / 2)
    const dy = to.top + to.height / 2 - (flight.y + flight.size / 2)
    const fly = el.animate(
      [
        { transform: `scale(${flight.size / D})` },
        { transform: `translate(${dx}px, ${dy}px) scale(${to.width / D})` },
      ],
      { duration: 620, easing: 'cubic-bezier(.5,0,.15,1)', fill: 'forwards' },
    )
    // The real record fades in under the landing one, then the flying record fades out → seamless swap
    const t = window.setTimeout(land, 460)
    let fade: Animation | undefined
    fly.onfinish = () => {
      fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })
      fade.onfinish = () => useUi.getState().set({ flight: null })
    }
    return () => {
      clearTimeout(t)
      fly.cancel()
      fade?.cancel()
    }
  }, [flight])

  if (!flight) return null
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="cf-disc flight-disc"
      style={{
        left: flight.x + flight.size / 2 - D / 2,
        top: flight.y + flight.size / 2 - D / 2,
        transform: `scale(${flight.size / D})`,
        ['--stage' as string]: flight.stage,
      }}
    >
      <div className="cf-disc-label" style={{ background: flight.color }} />
    </div>
  )
}
