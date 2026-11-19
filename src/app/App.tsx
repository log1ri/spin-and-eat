import { useEffect } from 'react'
import { ALBUMS, metaOf } from '@/data/albums'
import { DiscFlight } from '@/components/DiscFlight'
import { CrateView, isWideCrate } from '@/features/crate/CrateView'
import { LibraryDialog } from '@/features/library/LibraryDialog'
import { PlayerView } from '@/features/player/PlayerView'
import { useViewport } from '@/hooks/useViewport'
import { installAudioUnlock, setSoundEnabled } from '@/lib/audio'
import { mix } from '@/lib/color'
import { useUi } from '@/store/ui'

/** Overlay color under the menu library (= .sheet-overlay rgba(10,6,20,.38)) */
const SHEET_DIM = '#0A0614'

export function App() {
  const { ref, layout } = useViewport()
  const screen = useUi((s) => s.screen)
  const crateIdx = useUi((s) => s.crateIdx)
  const cat = useUi((s) => s.cat)
  const manageOpen = useUi((s) => s.manageOpen)

  useEffect(() => {
    setSoundEnabled(useUi.getState().soundOn)
    installAudioUnlock()
  }, [])

  const onCrate = screen === 'crate'
  const wide = isWideCrate(layout)
  // Full-screen background is the album color (picker = the album centered in the crate, player = the album playing)
  const stage = (onCrate ? (ALBUMS[crateIdx] ?? ALBUMS[0]!) : metaOf(cat)).stage
  // Library open → the page behind dims under the overlay → darken the Safari bar to match
  const chrome = manageOpen ? mix(stage.bg, SHEET_DIM, 0.62) : stage.bg

  // Make the mobile browser's status/URL bar the same color as the background
  useEffect(() => {
    document.documentElement.style.backgroundColor = chrome
    document.body.style.backgroundColor = chrome
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chrome)
    // The library overlay's top strip uses this color, opaque → Safari samples the solid color for the status bar (translucent colors come out wrong)
    document.documentElement.style.setProperty('--chrome', chrome)
  }, [chrome])

  return (
    <div ref={ref} className="relative h-dvh w-full overflow-hidden text-white">
      <div aria-hidden="true" className="stage-bg" style={{ backgroundColor: stage.bg }} />
      <div className="absolute inset-0 flex justify-center">
        <div
          className={
            'safe-pad box-border flex min-w-0 flex-auto flex-col ' + (wide ? 'max-w-[1240px] px-12' : 'max-w-[480px] px-5')
          }
          style={{ ['--pad' as string]: (wide ? 40 : layout.pad) + 'px' }}
        >
          {onCrate ? <CrateView layout={layout} /> : <PlayerView layout={layout} />}
        </div>
      </div>
      <DiscFlight />
      <LibraryDialog />
    </div>
  )
}
