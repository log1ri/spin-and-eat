/**
 * Call measure whenever the element's size might have changed
 *
 * ResizeObserver alone isn't enough on iOS Safari: while backgrounded, Safari shrinks the page (for the tab thumbnail)
 * and on return sometimes doesn't fire ResizeObserver again → stuck small, so also re-measure on return/rotation
 */
export function watchSize(el: HTMLElement, measure: () => void) {
  const ro = new ResizeObserver(measure)
  ro.observe(el)

  const timers: number[] = []
  let raf = 0
  // Size may not be settled when the event fires (Safari bars still animating) → re-measure twice more
  const remeasure = () => {
    measure()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(measure)
    timers.push(window.setTimeout(measure, 350))
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') remeasure()
  }
  window.addEventListener('resize', remeasure)
  window.addEventListener('pageshow', remeasure)
  window.addEventListener('focus', remeasure)
  window.visualViewport?.addEventListener('resize', remeasure)
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    ro.disconnect()
    cancelAnimationFrame(raf)
    timers.forEach(clearTimeout)
    window.removeEventListener('resize', remeasure)
    window.removeEventListener('pageshow', remeasure)
    window.removeEventListener('focus', remeasure)
    window.visualViewport?.removeEventListener('resize', remeasure)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
