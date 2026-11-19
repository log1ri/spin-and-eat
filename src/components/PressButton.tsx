import { m, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'

/** Springy press: the button dips while held and bounces back on release.
 *  Motion's whileTap runs on pointer events, so it works on iPhone Safari too — CSS :active there is unreliable.
 *  Round buttons dip more than wide pills (a wide pill shrinking 8% reads as a jump) */
const TAP = { type: 'spring', stiffness: 700, damping: 28, mass: 0.6 } as const

export const PressButton = forwardRef<HTMLButtonElement, HTMLMotionProps<'button'>>(function PressButton(props, ref) {
  const cls = typeof props.className === 'string' ? props.className : ''
  const depth = cls.includes('ring-btn') || /\bsize-(9|10|11|12)\b/.test(cls) ? 0.9 : cls.includes('h-9') ? 0.95 : 0.965
  return <m.button ref={ref} whileTap={props.disabled ? undefined : { scale: depth }} transition={TAP} {...props} />
})
