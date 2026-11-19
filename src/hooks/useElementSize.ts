import { useCallback, useRef, useState } from 'react'
import { watchSize } from './watchSize'

/** Measure an element (ResizeObserver + re-measure when returning to the page) */
export function useElementSize<T extends HTMLElement>() {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const stopRef = useRef<(() => void) | null>(null)

  const ref = useCallback((el: T | null) => {
    stopRef.current?.()
    stopRef.current = null
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      setSize((s) => (Math.abs(w - s.w) > 1 || Math.abs(h - s.h) > 1 ? { w, h } : s))
    }
    measure()
    stopRef.current = watchSize(el, measure)
  }, [])

  // No useEffect cleanup: React already calls ref(null) on unmount
  // (a useEffect cleanup makes StrictMode disconnect the observer after the second mount → size stuck at the first value)
  return { ref, size }
}
