import { useMenus } from '@/data/queries'
import { setSoundEnabled } from '@/lib/audio'
import { isBusy, useUi } from '@/store/ui'
import { ListIcon, SoundOffIcon, SoundOnIcon } from './icons'
import { PressButton } from '@/components/PressButton'

/** Top-right buttons: sound on/off + menu library {n} — outline capsules on the album color */
export function HeaderActions({ showText }: { showText: boolean }) {
  const { data } = useMenus()
  const menus = data ?? []
  const soundOn = useUi((s) => s.soundOn)
  const blocked = useUi((s) => isBusy(s.phase) || s.flipping || s.chosen)
  const set = useUi((s) => s.set)
  const activeCount = menus.filter((m) => m.active).length

  const btn = 'stage-btn rounded-full'

  const toggleSound = () => {
    setSoundEnabled(!soundOn)
    set({ soundOn: !soundOn })
  }

  return (
    <div className="flex flex-none items-center gap-2">
      <PressButton
        type="button"
        onClick={toggleSound}
        aria-label={soundOn ? 'ปิดเสียง' : 'เปิดเสียง'}
        aria-pressed={!soundOn}
        className={btn + ' flex size-9 items-center justify-center'}
      >
        {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
      </PressButton>
      <PressButton
        type="button"
        onClick={() => set({ manageOpen: true })}
        disabled={blocked}
        aria-label={`เปิดคลังเมนู (${activeCount} เมนูที่เปิดอยู่)`}
        className={btn + ' flex h-9 items-center gap-1.5 px-[13px] text-[13px] font-medium'}
      >
        <ListIcon />
        {showText && <span>คลังเมนู</span>}
        {data && <span className="opacity-60">{activeCount}</span>}
      </PressButton>
    </div>
  )
}
