# Spin & Eat — Progress

> Last updated: 2026-11-19 · update this file every time a task is finished

## Goal

A mobile web app for a group of friends to **pick what to eat, playfully, with a vinyl-record theme**, using a shared menu library on Google Sheets.
It must feel smooth, look good, and be instantly understandable on iPhone Safari without explanation.

## Done

**Foundation**
- Bun + Vite + React 18 + TS strict + Tailwind v4 + Zustand + TanStack Query + Radix + sonner
- `MenuRepo`: Google Sheets (Apps Script) + Local fallback · everything optimistic + rollback/toast
- Menus cached in `localStorage` → instant on the next visit

**Album picker**
- Bright full-screen color per album, huge album title, vertical cover stack (mobile: edges peek then fade), shuffle album, two-column layout on desktop
- Cover text color separated from the record label color
- Noodle cover: 5-color 70s retro ribbons looping into a "d" shape (from a 70s reference)
- Rice cover: layered rice-terrace hills filling the cover (from a vector rice-terrace reference)
- Soup cover: 4-layer arches peach→pink on plum + peach number badge (new field `badgeInk`) · Isan cover: diamond grid + 4 crosses per cell in a single chili-red palette · Sweet cover: mango sticky rice, white coconut cream dripping over ripe mango · All-hits cover: overlapping Bo Sang umbrellas on cream, umbrella colors from the 5 categories · all covers finished
- "กำลังหยิบแผ่น…" (fetching records…) state on first visit + "ต่อคลังเมนูไม่ได้ / ลองใหม่" (can't reach library / retry)
- Background color is correct from the first frame (script in `index.html`)
- Desktop: smaller arrow buttons (96→64px); top/bottom covers no longer overflow under the top-right buttons
- Huge album title aligned flush with the tagline/buttons (compensates the first glyph's side bearing)
- Layout refine (from a design review — refine, not redesign): desktop play buttons grouped with the title next to the cover; neighbor covers readable (blur 12→2px) as previews; first-run hint line; record slides out + spins on hover/press/play; shuffle icon wiggles; wordmark aligned with header buttons

**Screen transition**
- Record flies from the sleeve onto the platter continuously (shared-element flight)

**Player**
- Redesigned to match the album picker (same background, same button set)
- Off-white turntable body from the reference, skip buttons to change album left/right
- Tracklist has fake track durations like a record's back cover + total album length
- Short per-album songs (Web Audio synthesized) + song stops immediately when lifting the needle / changing albums
- Drag the tonearm onto the record → needle wobbles to a random track from where it landed · lifting it back to rest = stop
- Player refine (design review): bigger tracklist type + rows stretch to fill the height; clearer status text (button = main way, drag = bonus); tonearm nudges when idle; result name pops in at 40px with "วันนี้กิน"; tighter tracklist on mouse devices (tried mini-cover skip buttons — reverted to rings)
- Desktop player: two columns (info left, turntable ~1.7× on the right), editorial result (menu name one line up to 76px with a dimmed "+", EQ underneath, fixed rows → no layout shift during the spin; mobile result line box fixed too), keyboard shortcuts Space / ← → with a keycap hint
- Album picker: fixed-height title box → tagline/buttons no longer jump between albums
- Desktop tracklist: fixed 6-row height for every record (scrolls + bottom fade beyond 6) → buttons stay put
- Player motion (Motion lib): left column builds up on entry, tracklist rows ripple in on every draw, highlight slides after the needle, menu name rolls like a slot reel + lands with a bounce, springy press on all stage buttons (Motion whileTap)
- Back to the picker is animated: player fades out (record slides off), picker builds back up (title → arrows → buttons, center cover pops, neighbors fan out)

**Menu library**
- Paper-colored catalog, search, category chips, grouped by category, add menu
- Tap to pause, swipe left / trash to delete, 5s undo (menu returns to its place)
- Desktop: right-side panel, wrapping chips, lighter backdrop blur
- Removed the "picker name" field
- Library refine: quiet ticks + "พักอยู่" pill for paused menus, 40px rows on desktop, in-sheet notice bar for add/pause/resume/delete/undo (with เลิกทำ), rows collapse/grow, sliding chip pill, springy buttons

**Other**
- New favicon / apple-touch-icon (record + 6-color labels)
- Fixed covers coming back small/faded after returning to the app (StrictMode + observer)
- dev: no-store + reload from bfcache
- Meta tags in `index.html`: description, Open Graph/Twitter (link previews), full-screen when added to the iPhone home screen, `format-detection` so Safari doesn't turn numbers into phone links
- Cleanup: removed old dark-purple color tokens (`@theme` is fonts only), `.cta` `.btn-2` `.app-bg` `anim-glow` `DialogFullscreen` · toast now uses the library's paper colors
- Docs and code comments translated to English

## Not yet tested on a real device

- [ ] Safari bar color while the library is open (solid `.sheet-statusbar`) — does it match the dimmed area
- [ ] Swipe-to-delete smoothness on iPhone
- [ ] Dragging the tonearm with a finger on iPhone (only tested with a mouse in Chromium)
- [ ] "กำลังหยิบแผ่น…" state with a real Google Sheet (only tested with a fake sheet)
- [ ] Connect a real Google Sheet (no `.env.local` yet, so the app uses the Local repo)
- [ ] Deploy to Cloudflare Pages → then add `og:url` + `og:image` (absolute URL, 1200×630 image) in `index.html`
- [ ] Add to iPhone home screen: translucent status bar (`black-translucent`) doesn't cover content
- [ ] Motion on iPhone: tracklist ripple + sliding highlight smooth on a real phone (only tested in Chromium)
- [ ] Press feedback on iPhone: buttons now use Motion whileTap (should work); the center cover still uses CSS `:active` record slide — Safari needs a touch listener for `:active`; the stack has pointer handlers so it should fire

## Pending ideas (not requested yet)

| # | Idea | Notes |
|---|---|---|
| 8 | Shake the phone to randomize | iOS needs `DeviceMotionEvent.requestPermission()` from a tap |
| 9 | Scratch the record to re-randomize | The tonearm drag part is done |
| – | Avoid repeating what was just eaten (use `picks` history) | History is already logged |
| – | "What did we get lately" history page | Or a "recent picks" strip under the tracklist on the player (fills the gap when there are few tracks) |
| – | "Skip" button at the end of each tracklist row to drop menus you don't want before randomizing | |
| – | Curved tracklist, record speeding up/slowing down + label pattern, record flying back to the sleeve when returning to the picker | |
| – | PWA (add to home screen), share result, links to Grab/LINE MAN | |
| – | Real royalty-free song clips per album instead of the synthesized ones | Waiting for the user to pick clips (Pixabay Music / Freesound CC0); keep synth songs as fallback |

## Tech debt

- Album colors in `index.html` (boot script) duplicate `albums.ts` — color changes must be made in 2 places
- No automated tests yet (tested with throwaway Playwright scripts)
