# Spin & Eat — Technical spec

A mobile web app for **picking what to eat with a vinyl-record theme**, shared by a group (common menu library on Google Sheets).

| To read about | File |
|---|---|
| Look, colors, type, components, motion and design rationale | [`DESIGN.md`](DESIGN.md) |
| What's done, what's open, next ideas | [`PROGRESS.md`](PROGRESS.md) |
| Install, Google Sheet setup and deploy | [`../README.md`](../README.md) |
| This file | stack, code layout, randomizer mechanics, data |

> History: the project started from the prototype `spin-and-eat-handoff/design/prototype.dc.html` (outside the repo, not committed), which had a dark-purple theme + horizontal coverflow.
> The current design has moved far from it — **don't use the prototype as a visual reference anymore**; it's only useful for where the randomizer mechanics came from.

---

## 1. Stack

- **Bun** + **Vite 8** + **React 18** (StrictMode) + **TypeScript strict**
- **Tailwind CSS v4** (`@theme`, arbitrary values, `cqw`) — general layout
  - The turntable (`styles/turntable.css`) and the cover stack / buttons on colored stages (`styles/crate.css`) use separate CSS because of fine positioning
- **Zustand** (+`persist`: last album `cat`, sound on/off) — UI state
- **TanStack Query** — menu data (cache, retry, optimistic updates)
- **Radix** (shadcn/ui style): Dialog (menu library), Select · **sonner** — toasts
- **Motion** (`motion/react`) — player entrance stagger (`components/Rise.tsx`) + tracklist ripple / sliding highlight · use `m.*` components (not `motion.*`): `<LazyMotion strict>` in `providers.tsx` loads `lib/motionFeatures.ts` (domMax) as a separate ~27KB gz chunk after first paint
- Sound is synthesized with **Web Audio** (no library)
- Deploy: **Cloudflare Pages** (static) · env: `VITE_SHEETS_API_URL`, `VITE_SHEETS_SECRET`

> `VITE_SHEETS_SECRET` ships in the client bundle — it's just a "group code" against random calls, not real security (acceptable for this app)

---

## 2. Code layout

```
apps-script/Code.gs              Google Sheets backend
index.html                       boot script paints the background for the last album before the app loads
src/
  main.tsx                       mount + (dev) reload when restored from bfcache
  app/App.tsx                    measure viewport → layout, pick crate/player screen, background + Safari bar color
  app/providers.tsx              QueryClient + Toaster
  store/ui.ts                    zustand: screen, crateIdx, chosen/flipping, cat, phase, arm, album, rec, flight, manageOpen, soundOn
  data/albums.ts                 meta for 6 records (colors, cover art, stage)
  data/seed.ts                   30 sample menus
  data/repo/{types,sheets,local,index}.ts   MenuRepo + 2 implementations (chosen by env)
  data/queries.ts                useMenus / useAddMenu / useUpdateMenu / useRemoveMenu / recordPick + localStorage cache
  lib/audio.ts                   all sound
  lib/geometry.ts                track ring radii + tonearm angles
  lib/draw.ts                    draws 8 tracks
  lib/layout.ts                  viewport scaling
  lib/color.ts                   mix() colors for the Safari bar
  hooks/watchSize.ts             re-measure on resize/pageshow/focus/visibilitychange/visualViewport
  hooks/useViewport.ts, useElementSize.ts, useReducedMotion.ts
  hooks/useTurntable.ts          player sequence: drop / switchAlbum / backToCrate / arm drag
  components/DiscFlight.tsx      record flying from sleeve to platter
  components/HeaderActions.tsx   sound + menu library buttons
  components/icons.tsx           SVG icons
  components/ui/{dialog,select}.tsx
  features/crate/                CrateView, CrateStack (vertical cover stack), useCrate (scroll/shuffle/select)
  features/player/               PlayerView, Turntable, Tracklist
  features/library/              LibraryDialog (menu library + swipe-to-delete TrackRow)
  styles/                        index.css (theme, sheet), crate.css, turntable.css
```

---

## 3. Randomizer mechanics

**Picking 8 tracks (`lib/draw.ts`):** pool = active menus in the category (or all) → drop the previous result (`lastId`, if pool > 8) → shuffle → take 8 (fewer is fine)

**Album picker (`useCrate`):**
- Shuffle album: flips 12–17 times with increasing delay, a `flick` sound each, then auto-selects
- Select album: sleeve slides out (~480ms) → measure the record's position in the sleeve → `screen: 'player'` + `flight` → `DiscFlight` flies to `.deck-vinyl` in 620ms

**Player (`useTurntable`) — phase: `idle → out → in → cue → search → playing`** (+ `hold` while dragging the arm)
1. `drop`: old record exits left 380ms → draw 8 new tracks (`albumNo` +1) → new record enters from the right 420ms
2. **cue:** arm moves to the outer edge .45s → `needleDrop`
3. **search 3.6s** (reduced motion 1.2s): `rad = mid + amp·sin(2π·3p)`, `mid = r0 + (target-r0)·ease(p)` (`r0 = OUT-1`, or where the arm was dropped), `amp = 34·(1-p)^1.6` → crossing a track ring plays `tick`, the tracklist highlights along
4. **playing:** `song(cat)` + menu name appears → `recordPick(menu)` fire-and-forget
- `switchAlbum(±1)`: switch to the neighboring album inside the player (exit ∓360px, enter from ±360px) without dropping the needle
- Arm drag: `grabArm` → `dragArm(deg)` → `releaseArm(deg)` — released over the grooves runs `runSearch(from)`, otherwise the arm returns to rest

**Geometry (`lib/geometry.ts`):** `OUT=126, IN=54`, `BW=(OUT-IN)/n`, track k at radius `OUT - BW·(k+.5)`
Arm angle: `px=147, py=112, L=190` → `theta(d) = asin((px²+py²+L²-d²)/(2L·√(px²+py²))) - atan2(py,px)` (degrees), rest `ARM_REST = 5°` · deck `342×292`
Inverse for dragging: `angleTo(x, y)` (pointer → arm angle), `needleDist(deg)` (arm angle → needle distance from the spindle)

---

## 4. Responsive (`lib/layout.ts`)

- root `h-dvh`, mobile content column `max-w-[480px]`, edges use `env(safe-area-inset-*)`
- `cw = min(W,480)`, `compact = H<740`, `tiny = H<640`, `narrow = cw<380`
- `deckS = clamp(min((cw-40)/342, H·(compact?.36:.4)/292), .6, 1.3)`
- The cover stack measures its own box: `s = clamp(min((w-48)/(270+44), fitH), .5, 1.6)` — desktop `fitH = h·.8/270`; mobile `fitH = (h - 2·peek)/270` with `peek = clamp(h·.14, 24, 46)` so neighbor covers always show their name strip (short screens shrink the cover instead)
- Short screens (`compact`): arrow buttons 46px instead of 52; `tiny` (H<640) uses the 50px album title
- **≥ 880px** = desktop mode (`isWideCrate`, used by both screens): two-column album picker, two-column player (info left, turntable right with its own larger `deckS`), menu library as a 440px right panel
- Tested sizes: 320×568, 360×640, 360×740, 375×667 (SE), 393×659 (iPhone 15 Safari with toolbars), 402×874, 1280×800, 1440×900, 1920×1000

---

## 5. Data (Google Sheets)

**Tab `menus`:** `id | name | cat | active | created_at` (cat ∈ rice, noodle, soup, isan, sweet)
**Tab `picks`:** `id | menu_id | menu_name | picked_by | picked_at` (the app no longer sends `picked_by`)
Group members can edit the sheet directly (new rows without an id get one automatically)

API: see the header of `apps-script/Code.gs` · GET `?action=menus` · **POST uses `Content-Type: text/plain`** (avoids the CORS preflight) with a JSON body

```ts
interface MenuRepo {
  list(): Promise<Menu[]>
  add(input: { name: string; cat: Cat }): Promise<Menu>
  update(id: string, patch: Partial<Pick<Menu, 'name' | 'cat' | 'active'>>): Promise<void>
  remove(id: string): Promise<void>
  recordPick(menu: Menu, by?: string): Promise<void>
}
```

- `SheetsMenuRepo` when `VITE_SHEETS_API_URL` is set, otherwise `LocalMenuRepo` (localStorage + sample menus)
- TanStack Query: `staleTime` 30s, refetch on focus, retry 2 · every mutation is optimistic + rollback + toast
- Menus are cached in localStorage (`spin-eat-cache-v1`) as `initialData` → the app shows data instantly, then syncs
  - No cache (first visit / private mode) → the album picker shows the waiting / failed state (see DESIGN 5.1)
- Deleting in the library waits 5 seconds before calling `remove` (undo works without re-adding)

---

## 6. Definition of done (current status)

- [x] `bun install && bun run dev` works out of the box without env
- [x] Works at every size in section 4 with nothing overflowing/overlapping; bottom buttons stay on screen
- [x] Add/pause/delete/undo work (optimistic)
- [ ] Sync with a real Google Sheet — not connected yet
- [x] Sound works after first tap, mute button, respects `prefers-reduced-motion`
- [x] Real buttons, aria-labels on icon buttons, keyboard usable
- [x] `bun run build` passes, README covers Google Sheet setup + deploy
- [ ] Fully tested on a real iPhone (see PROGRESS)

**Later:** realtime so everyone sees the record spin together (Supabase), budget/prices, avoid repeats across days
