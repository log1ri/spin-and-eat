import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ALBUMS, type AlbumKey } from '@/data/albums'
import type { Menu } from '@/data/repo'
import { draw, poolFor } from '@/lib/draw'
import { ARM_REST } from '@/lib/geometry'

export type Screen = 'crate' | 'player'
/** idle → out → in (record change) → cue → search → playing · hold = the user is dragging the tonearm */
export type Phase = 'idle' | 'out' | 'in' | 'cue' | 'search' | 'playing' | 'hold'

export interface Rec {
  x: number
  op: number
  trans: string
}

export const REC_OFF_RIGHT: Rec = { x: 360, op: 0, trans: 'none' }
export const REC_ON: Rec = { x: 0, op: 1, trans: 'none' }
/** Platter record hidden, waiting for the record flying in from the sleeve to land */
export const REC_HIDDEN: Rec = { x: 0, op: 0, trans: 'none' }

/** Record flying from the sleeve to the platter: on-screen position/size of the sleeve record at departure */
export interface Flight {
  x: number
  y: number
  size: number
  color: string
  /** Stage color of the album — the sleeve record is tinted with it (.cf-disc reads --stage) */
  stage: string
}

interface UiState {
  screen: Screen
  /** Cover at the center of the stack */
  crateIdx: number
  /** Record is sliding out of its sleeve */
  chosen: boolean
  flipping: boolean
  /** Album selected for playing (persisted) */
  cat: AlbumKey

  phase: Phase
  arm: number
  armTrans: string
  /** Track under the needle */
  k: number | null
  album: Menu[]
  albumNo: number
  lastId: string | null
  rec: Rec
  flight: Flight | null

  manageOpen: boolean
  soundOn: boolean
  /** Has played a record at least once (persisted) — hides the first-run hint */
  played: boolean
  /** Player is fading out on its way back to the album picker (~0.3s) */
  leaving: boolean
  /** Album picker was just re-entered from the player → it builds itself back up (CrateView clears it) */
  crateEnter: boolean

  set: (patch: Partial<UiState>) => void
  /** Draw a new record from the current library + reset the needle (e.g. after closing the library) */
  redraw: (menus: readonly Menu[]) => void
}

export const isBusy = (p: Phase) => p === 'out' || p === 'in' || p === 'cue' || p === 'search' || p === 'hold'
export const albumIndex = (key: AlbumKey) => Math.max(0, ALBUMS.findIndex((a) => a.key === key))

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      screen: 'crate',
      crateIdx: 0,
      chosen: false,
      flipping: false,
      cat: 'all',

      phase: 'idle',
      arm: ARM_REST,
      armTrans: 'transform .6s ease',
      k: null,
      album: [],
      albumNo: 1,
      lastId: null,
      rec: REC_ON,
      flight: null,

      manageOpen: false,
      soundOn: true,
      played: false,
      leaving: false,
      crateEnter: false,

      set: (patch) => set(patch),
      redraw: (menus) => {
        const { cat, lastId } = get()
        set({ album: draw(poolFor(menus, cat), lastId), phase: 'idle', k: null, arm: ARM_REST, armTrans: 'transform .6s ease' })
      },
    }),
    {
      name: 'spin-eat-ui-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cat: s.cat, soundOn: s.soundOn, played: s.played }),
      // On launch, the last album's cover is centered in the stack
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UiState>
        const cat = ALBUMS.some((a) => a.key === p.cat) ? (p.cat as AlbumKey) : current.cat
        return { ...current, ...p, cat, crateIdx: albumIndex(cat) }
      },
    },
  ),
)
