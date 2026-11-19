import { m } from 'motion/react'
import type { ReactNode } from 'react'

/** Shared entrance curve — fast start, long soft settle  */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Fades + rises its children in once (no blur — animating filter is heavy on older phones), on mount. `delay` in seconds — used to stagger the player's left column
 *  so it builds up top → bottom while the record lands on the platter */
export function Rise(props: { delay?: number; y?: number; className?: string; children: ReactNode; skip?: boolean }) {
  const { delay = 0, y = 14, className, children, skip = false } = props
  return (
    <m.div
      className={className}
      // skip → render in place, no entrance (e.g. the picker on a normal visit, only animated when coming back)
      initial={skip ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  )
}
