import { AnimatePresence, m } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE_OUT } from './Rise'

// module-level targets: same object every render, so a re-render never replays the landing bounce
const ENTER = { y: '75%', opacity: 0 }
const SHOW = { y: '0%', opacity: 1, scale: 1 }
const LAND = { y: '0%', opacity: 1, scale: [1, 1.07, 1] }
const LEAVE = { y: '-75%', opacity: 0 }
const MOVE = {
  y: { type: 'spring', stiffness: 620, damping: 36 },
  opacity: { duration: 0.14 },
  scale: { duration: 0.5, ease: EASE_OUT },
} as const

/** Text that rolls like a slot reel / split-flap sign: each new `text` pushes the old one up and out.
 *  `landed` = the final result → a little bounce on the name that stayed. Box clips the rolling lines. */
export function SlotText(props: {
  text: string
  landed: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties
  origin?: string
}) {
  const { text, landed, children, className, style, origin = 'left center' } = props
  return (
    <div className={'relative overflow-hidden ' + (className ?? '')} style={style}>
      <AnimatePresence initial={false} mode="popLayout">
        <m.div
          key={text}
          className="truncate"
          style={{ transformOrigin: origin }}
          initial={ENTER}
          animate={landed ? LAND : SHOW}
          exit={LEAVE}
          transition={MOVE}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
