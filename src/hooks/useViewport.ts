import { useCallback, useRef, useState } from 'react'
import { watchSize } from './watchSize'
import { computeLayout, type Layout } from '@/lib/layout'

/** Measure the root (ResizeObserver + re-measure when returning to the page) → layout for scaling the deck */
export function useViewport() {
  const [size, setSize] = useState(() => ({ W: window.innerWidth, H: window.innerHeight }))
  const stopRef = useRef<(() => void) | null>(null)

  const ref = useCallback((el: HTMLElement | null) => {
    stopRef.current?.()
    stopRef.current = null
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) setSize((s) => (Math.abs(w - s.W) > 1 || Math.abs(h - s.H) > 1 ? { W: w, H: h } : s))
    }
    measure()
    stopRef.current = watchSize(el, measure)
  }, [])

  // No useEffect cleanup: React already calls ref(null) on unmount
  // (a useEffect cleanup makes StrictMode disconnect the observer after the second mount → size stuck at the first value)

  const layout: Layout = computeLayout(size.W, size.H)
  return { ref, layout }
}
