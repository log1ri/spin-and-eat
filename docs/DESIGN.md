# Spin & Eat — Design (as built)

> This document describes look and behavior **as the code is now**. If it conflicts with `HANDOFF.md` (the original spec), this file wins.
> Whenever the design changes, update this file too — especially "Design decisions".

## 1. Principles

- **Mobile first (iPhone Safari is the main target)** — desktop is a fallback via a single breakpoint `≥ 880px`
- **Each album = one full-screen color**: bright, high-contrast, like a record sleeve/poster — not a glowing dark-purple theme
- **No "AI template" look**: no glow, no purple-pink gradients, no glass/blur as a main surface, no fuzzy shadows
- Buttons are thin outlines or solid single color (`--ink`) on the album color; every screen speaks the same language
- One main task per screen: pick an album → drop the needle → get a menu

## 2. Color

### 2.1 Per-album colors (`src/data/albums.ts`)

| key | Name | `stage.bg` (full screen) | `stage.ink` (text/buttons) | Record label `color` | Cover text |
|---|---|---|---|---|---|
| `all` | รวมฮิต (All hits) | `#6A1FD1` | `#FFFFFF` | `#6A1FD1` | `#2A0F2E` (`sleeveInk`) |
| `rice` | ข้าว (Rice) | `#22B357` | `#0B1F12` | `#22B357` | `#0B1F12` |
| `noodle` | เส้น (Noodles) | `#FFC21A` | `#1A1405` | `#FFC21A` | `#1A1405` |
| `soup` | ต้ม/แกง (Soup/Curry) | `#FF3DA8` | `#140A24` | `#7A1FE0` | `#FFFFFF` |
| `isan` | อีสาน/ยำ (Isan/Salad) | `#FF4D1F` | `#140A24` | `#FF4D1F` | `#FFFFFF` (`sleeveInk`) |
| `sweet` | ของหวาน (Dessert) | `#3D5AFE` | `#FFFFFF` | `#FF9A1F` | `#140A24` |

- Every component on a stage reads CSS vars `--stage` / `--ink` (set on each screen's root via the `on-stage` class)
- Cover art (`art`) uses `%` sizes in gradients so small covers (22px chip) and large covers look the same
  - Rice: rice terraces colored after a vector reference — open lime sky `#CDE07A`, dark green hill `#2E7A47`, mid green `#6BB25A`, light green `#A8D16C` (center), pale green bottom-left `#DCEBA8` (under the Thai title), green `#4F9E52` bottom-right front · front hills overlap back hills, terrace ridges are lighter bands than the hill, clipped with clipPath · no sun/misty mountains · (tried a forest-green screen `#2E7A47` to match the cover — user preferred the original bright green) · number badge `#2E7A47` (darkest cover color, same approach as the noodle cover) · dark green text
  - Soup/Curry: 4 full-width arches stacked downward (after a 70s arch poster) on dark plum `#3B0F2E` — colors run from peach at the top down to deep pink `#FAD3C0 #F6A49E #EE7590 #DB4F86`, like the glow from a hot bowl · 4 layers not 5 so the bands read as shapes and don't repeat the noodle cover's 5-stripe rhythm · the bottom layer is the backdrop for the Thai title; don't go darker (`#B8286E` was too dark per the user) · cream text `#FBE6DC` · peach number badge `#FAD3C0` with plum digits (fields `badge` + `badgeInk`) · (tried: tom yum bowl — orange-red clashes with Isan; Japanese wave pattern — repeats noodle/rice; 3×3 circle grid — busy; big Bauhaus bowl on brown — looks like a target/dull; literal bowl/bubbles/spoon — not abstract; dark indigo background — not OK; cream background — repeats noodle; lavender/mint — user's runner-up)
  - Isan/Salad: checkerboard rotated 45° (4 diamond cells per side — 5 was too dense on the large cover), each cell has a cross + 4 upright marks top/left/right/bottom — after a Thai fabric pattern poster the user sent (yellow cell + white / white cell + red) · single chili-red palette: cell `#C8202F` + `#E9606A` (`#F27A7A` too bright, fights the title) alternating with `#E0383F` + `#9E1222`, low-contrast pattern so the white text stands out · dark red number badge `#7A0E1A` · lesson: full-bleed patterns need controlled contrast or the title becomes unreadable · (tried: khit/mudmee/naga scales/woven rice basket repeats — small, dense, busy, didn't match other covers; single big shapes — giant khit/tung flag/chili-lime — didn't land; diamond grid mixing several patterns — user wanted one pattern full-bleed; yellow as in the reference — repeats noodle; single orange — blends into the screen; indigo/teal — harsh contrast, hard to read; blood red — close to the soup plum; black + orange — backup)
  - All hits: Bo Sang umbrellas seen from above, overlapping on cream `#F5EAD8` (after pins of pink/teal umbrellas) — 3 large colored umbrellas (yellow top-right, green mid-left, pink bottom-right) + 2 medium fully visible ones (orange mid-right, red bottom-center), using muted versions of the 5 category colors: noodle `#EDB93A` soup `#DB5F8C` rice `#4F9E6A` isan `#C8453F` sweet `#EE8A34` (the exact stage colors are too loud on cream) · scalloped rim between 20 ribs, ribs lighter than the canopy, light center cap · 8 faded umbrellas (outline `#EADBCB` only — `#E2C9B4` was too dark and fought the text) as background, one per cream gap between colored umbrellas (11 was "busy" per the user; 16 like the pin — busier), and they're the only thing in the top-left title / bottom-left Thai title areas · text + number badge `#2A0F2E` · record label stays purple `#6A1FD1` with white text · (tried: lucky wheel/stacked records/geometric tiles/rainbow/confetti/5-color racing stripes on dark purple — looked like clip art; plain round umbrellas without faded ones — didn't land; 6 medium umbrellas in all 5 colors — user preferred big airy umbrellas; 3 big + small orange/red cut off by the edge — didn't read as all 5 categories; bright/mid colors — backup)
  - Dessert: mango sticky rice — white coconut cream `#FFFFFF` dripping from the top edge (24%-high band + 7 round-tipped drips of different lengths) on ripe mango `#FF9A1F` · mango orange is complementary to the blue screen, so the cover pops · dark orange number badge `#A8400A` · dark text `#140A24` · don't use golden yellow `#FFB627` + cream coconut (cream + yellow belongs with the noodle cover) · (tried: giant thong yip flower/layered khanom chan/bua loi/wavy checkerboard/jelly mold — user liked the dripping cream most; giant mango slice/butterfly-pea sticky rice/scored mango/three-layer cream-mango-rice — went with the simple one; pink coconut — backup)
  - Noodles: 5-color 70s retro ribbons (inner→outer `#F6D27A #F5A623 #F07B22 #D9461E #7B2D1A`) coming down from the top, looping like a "d" and running down, on cream `#F1E3C8` — drawn as an SVG data URI with `ribbonPath()` (offset curves of a center line so bands stay evenly spaced around the curve); the second pass overlaps the first with a cream underlay so the ribbons appear to pass through each other · the number badge here is brown `#7B2D1A` (field `badge`) instead of translucent black, which looked muddy grey on cream

### 2.2 Menu library (paper catalog)

| Name | Value | Used for |
|---|---|---|
| `PAPER` | `#F7F5F0` | library sheet background |
| `INK` | `#17141C` | text, selected chip, + button, notice bar |
| field | `rgba(23,20,28,.06)` | search / add-menu fields (`.paper-field`) |
| delete | `#E5484D` | row background while swiping left |
| overlay | `rgba(10,6,20,.38)` + blur 6px (mobile) / `.26` + blur 1.5px (desktop) | behind the library sheet |

### 2.3 Other
- Turntable: off-white body `#eceaf0` (not the stage color), glossy black record with thin track rings, record label = `meta.color`
- `@theme` in `index.css` only holds fonts — all colors come from the album (`--stage` / `--ink`) or library paper (`PAPER` / `INK`) · toasts use the paper colors

## 3. Type

- `IBM Plex Sans Thai` across the app · `IBM Plex Mono` for track numbers (`01`), English cover titles, cover numbers
- Album title on the picker: very large (mobile 50/56/66px by screen height, desktop up to 150px) `tracking -0.03em`
  - Long Thai titles shrink to fit with `min(size, fit cqw)`, counting only characters that take horizontal space (not upper/lower vowels or tone marks)
  - Pulled left by the first glyph's side bearing (measured with canvas `measureText`, e.g. "เ" ~0.09em, others ~0.04em) so the glyph edge aligns with the tagline and buttons
- "Spin & Eat" header top-left 15px semibold (not mono)

## 4. Components

| class / component | Look | Used in |
|---|---|---|
| `.ring-btn` | 1px `--ink` outline circle, transparent fill · hover (mouse only) fills | ↓ ↑ arrows on the picker, previous/next album buttons on the player |
| `.stage-cta` | solid capsule, `--ink` fill, `--stage` text | primary buttons: "เล่นแผ่น …" (play record), "วางเข็มสุ่มเมนู" (drop the needle), "ลองใหม่" (retry) |
| `.stage-btn` | 1px `--ink` outline capsule | secondary: "สุ่มแผ่น" (shuffle album), sound / library buttons in the header |
| `HeaderActions` | sound button + "คลังเมนู {n}" (menu library; label hidden below 380px) | header on every screen |
| `.paper-field` | light grey capsule on paper · focus = inset `--ink` line (no outline, it gets clipped in scrolling lists) | search, add menu |
| check button | on = soft tick (ink 9% circle, ink 75% tick — the normal state stays quiet, 30 solid black dots dominated the list) / paused = empty outline circle + dimmed name + "พักอยู่" pill · 40px hit area | every library row |
| category chip | 32px capsule, 22px round cover + name + count · selected = `INK` fill | library (mobile scrolls horizontally with faded right edge / desktop wraps) |
| Select | Radix Select capsule using the `--stage/--ink` passed in | picking a category when adding a menu |
| `DialogSheet` | Radix Dialog as a bottom sheet (mobile) / right panel (desktop) | menu library |

Disabled buttons fade; press = Motion `whileTap` spring (`PressButton`); all hover styles live in `@media (hover:hover)` so they don't stick on iPhone

## 5. Screens

### 5.1 Album picker (Crate) — `features/crate/`
- **Mobile (single column):** header (Spin & Eat + buttons) → huge album title + tagline · menu count → ↓ ↑ + `1 / 6` → cover stack → first-run hint → [สุ่มแผ่น (shuffle)][เล่นแผ่น … (play)]
- **Album title box has a fixed height** (full title size × 1.24, title sits on the bottom): long titles shrink to fit, and without the fixed box the tagline + buttons jumped ~9px when flipping between albums
- **Desktop ≥880px (two columns):** left = wordmark on top, then title + controls + hint + play buttons as **one group vertically centered beside the cover** (the action sits with the content, not pinned to the bottom) · right = header buttons + cover stack · the wordmark row is `h-9` so it shares a center line with the header buttons
- **First-run hint** "เลือกหมวด กดเล่นแผ่น แล้วดูว่าวันนี้กินอะไร" above the play buttons (13px mobile / 15px desktop, opacity .75) — the app looks like a music player, so this says once that it's for picking food; hidden after the first play (`played`, persisted)
- **Cover stack (`CrateStack`)** is vertical: center cover sharp with the record peeking out to the right (only 24px, grooves tinted 22–30% toward `--stage`, soft shadow — pure black at 44px pulled the eye from the cover; the user picked this from a 6-option sheet); covers above/below tilted ±4°, scale .9, **light blur 2px + opacity .55 so their art and name stay readable** (.7 let bright covers like the cream noodle sleeve outshine the center one) — they preview the next/previous album instead of being anonymous blobs (was blur 12px / .55)
  - Mobile (`peek`): covers above/below show only an edge, then fade with a mask anchored to the box center so they don't overlap the title or buttons · the cover layer bleeds 140px past the box left/right and is masked vertically only (clipping the sides showed the shadows/blur as straight vertical edges)
  - Desktop: covers above/below show more but are clipped vertically to the stack box (no overflow under the top-right buttons) and fade at the top/bottom edges · not clipped horizontally (the cover layer extends 140px past the box), otherwise shadows/blur get cut in a straight line
  - ↓ ↑ arrow buttons: mobile 52px (short screens 46px), desktop 64px
  - Small screens: the cover shrinks before the neighbor previews disappear — each neighbor keeps `clamp(h·.14, 24, 46)px` of peek (e.g. 393×659 → cover 245px, 320×568 → 183px)
  - Swipe up/down/left/right > 40px, mouse wheel, keyboard arrows, tap a side cover = scroll, tap the center cover = play
  - **Record feedback:** hover (mouse) the center cover → record slides out 22px and its highlight spins (2.4s/rev) · press (touch) → slides out 14px · play or shuffle → slides out + fast spin (0.9s/rev) · only the highlight layer (`.cf-disc-sheen`) rotates, never the disc box, because `DiscFlight` measures its bounding rect
  - Shuffle icon wiggles while "คุ้ยลัง…" (digging) runs
- The whole background follows the centered album (transition .7s), including the Safari bar
- **Waiting for menus (first visit, no cache):** center record spins slowly (`.cf-disc--spin` with a specular highlight so the spin is visible) · tagline becomes "กำลังหยิบแผ่น…" (fetching records…) · cover number "…" · buttons/swipe disabled · side covers hidden
- **Failed to load:** stops spinning · "ต่อคลังเมนูไม่ได้" (can't reach the library) · primary button becomes "ลองใหม่" (retry, refetch)

### 5.2 Player — `features/player/`
- Background is the playing album's `stage.bg` (same as the picker, continuous)
- **Desktop ≥880px (two columns):** header across the top · left = hero (label row "วันนี้กิน" 18px + `TRACK 02/05 · 2:30` mono (idle: how to start) · menu name on ONE line, one size for the whole library = `min(76px, 9% of H, fit for the widest name measured with canvas in the real font)`, the " + " of combo dishes dimmed (opacity .55, regular weight) · EQ always under the name · every row fixed height → nothing moves while the needle flicks through names and no reserved empty line — tried: 2-line names (the "+" landed at the start of line 2, reserved 2nd line left a hole), side dish as a smaller line/inline/chip, EQ in the label row, a category line (repeated the header); the user picked the plain one-line name) + tracklist (always 6 rows × 32px tall, whatever the record — 4-track records leave room below, 7–8 tracks scroll with a fade on the bottom edge while more rows are hidden, so the buttons never move between records) + buttons + keyboard hint · right = turntable scaled to fill (`clamp(min((H-200)/292, (min(W,1240)-208)·.54/342), 1, 2)` → ~1.6× at 1280×800) · 112px gap between the columns (56px felt cramped) · same arrangement as the album picker (text left, covers right) so the record flies a short way sleeve → platter (compared deck-left and buttons-under-deck variants — the user picked this one)
- **Motion (both layouts, `motion/react`):** entry builds up top → bottom while the record lands — status + name `Rise` 0.12s (fade + 14px rise, no blur — animating filter is heavy on older phones, 0.6s, ease `[.22,1,.36,1]`), tracklist header 0.32s, rows ripple in from the right (18px → 0, 45ms apart, like the record entering from the right), buttons 0.6s · every new draw remounts the rows (keyed by record no.) so they ripple in again · ONE highlight slides from row to row after the needle (shared `layoutId`, spring 520/38), faint while searching → solid ink when it lands · **back to the picker:** player fades out for 0.3s (record slides off the platter to the right, left column + turntable body fade and drop 10px — `.player-leaving`), then the picker builds back up only on this return (`crateEnter`): title 0.08s → arrows 0.16s → buttons 0.26s (`Rise`), center cover pops in from 0.9×, neighbors fan out from behind it at 0.34s (CSS transitions on the stack) · menu name rolls like a slot reel while the needle searches (`SlotText`: new name pushes the old one up, spring 620/36, clipped box) and bounces (scale 1→1.07→1) when it lands — replaces the CSS result-pop · every stage button is a `PressButton` (Motion `whileTap` spring: rings/small 0.9, pills 0.965) — works on iPhone where CSS `:active` doesn't, so the CSS `:active` scale rules are gone · `MotionConfig reducedMotion="user"` keeps only fades
- **Keyboard:** Space = drop the needle / another record, ← → = change album (ignored while typing, with the library open, or when a button has focus — it would click twice) · desktop shows a hint with `.kbd` keycaps under the buttons
- Header: `‹ เปลี่ยนแผ่น` (change record — back to the picker) + HeaderActions
- **Turntable**: off-white body, glossy black record, slim tonearm (headshell in `--stage`), speed knob + start button (center light while playing), the track ring under the needle gets a thin white edge (no glow)
- **Dragging the tonearm**: grab anywhere along the arm (36px-wide hit area); the arm rotates around its pivot following the finger, the shadow grows as if lifted · release over the grooves → needle lands there, then wobbles to a random track (the landing spot is only the starting point, the result is purely random — the user chose this over "you get what you land on"); uses the record already on the platter, doesn't change records · release outside the grooves → returns to rest · the needle can be lifted while playing (song stops) · phase `hold` while dragging (other buttons disabled) · keyboard users use the drop-needle button instead
- Title area: status (14px — idle "กดปุ่มวางเข็มเพื่อสุ่มเมนู หรือลากแขนเข็มเองก็ได้" (the button is the main way, dragging is the bonus) / "ปล่อยเข็มบนร่องแผ่น แล้วเข็มจะสุ่มเมนูให้" / searching "กำลังสุ่ม… เข็มอยู่ที่แทร็ก 3 จาก 8" / result "วันนี้กิน · แทร็ก 3 จาก 8" in semibold) + huge menu name (empty = "วันนี้กินอะไรดี?"; 32px, 75% while searching as names flick past; **result 40px with a `result-pop` scale/blur-in** — the picked menu is the reason the user is here, so it's revealed, not just highlighted in the list) + white EQ while playing
- **Arm affordance:** while idle the tonearm nudges toward the record (5°, 3 times, `arm-nudge` via the individual `rotate` property so it composes with the inline transform) to show it can be dragged
- **Tracklist**: names 15px, numbers/times 13px mono; rows share the free height (30–46px, `flex: 1 0 30px`) so the list fills the space down to the buttons on tall screens and scrolls on short ones · mouse devices (`hover: hover and pointer: fine`) cap rows at 34px / 14px — the touch sizes looked oversized on a monitor · header (13px) "รายการบนแผ่น · ชุดที่ N" (on this record · set N) / "8 แทร็ก · 29:43" (8 tracks · total) · every row has a fake duration (mono, 2:30–4:59 derived from the menu id — the same menu always has the same time) like a record's back cover, and so the right column isn't empty on single-category albums · the all-hits album shows the category before the time · playing row = `--ink` fill with `--stage` text · rows the needle passes = `--ink` 14%
- Footer: [⏮ previous album] [วางเข็มสุ่มเมนู (drop needle) / สุ่มอีกแผ่น (another record)] [next album ⏭] — outline ring buttons with a `title` tooltip naming the album (tried the neighbor's mini cover as the button — the user preferred the plain rings)

### 5.3 Menu library — `features/library/LibraryDialog.tsx`
- **Mobile:** paper sheet slides up from the bottom, 28px top corners, grab handle, top gap `max(safe-area, 6dvh)`
- **Desktop ≥880px:** full-height right panel, 440px wide, square corners, slides in from the right, no handle
- Header: "คลังเมนู" (menu library) + "30 เมนู · พักไว้ 2 · แตะเพื่อพัก · ปัดซ้ายเพื่อลบ" (30 menus · 2 paused · tap to pause · swipe left to delete) (desktop: "คลิกเพื่อพัก · ชี้แล้วกดถังขยะเพื่อลบ" — click to pause · hover and click trash to delete) + close button (first focus)
- Search → category chips → list grouped by category (group header = 44px cover + name + count) → add-menu bar at the bottom (name field + category Select + round + button)
- **Row:** `01` + name (paused = faded .4 + the word "พัก" (paused)) + check button at the far right · tapping the whole row toggles paused/active
- **Delete:**
  - Mobile: swipe left halfway = red "ลบ" (delete) button appears · swipe past 55% = delete immediately · while a delete button is open, tapping another row / scrolling just closes it (doesn't toggle pause)
  - Desktop: hovering a row reveals the trash icon (opacity 0 → .6)
  - After delete: hidden for 5 seconds with a "เลิกทำ" (undo) notice → no tap = really deleted · tap = back in place with the same id · closing the library while waiting = deleted immediately
  - **Notice bar** (inside the sheet, above the add field) for every action: add "เพิ่ม … ใน<หมวด>แล้ว", pause "พัก … แล้ว · จะไม่ถูกสุ่ม" / resume (both with เลิกทำ), delete (เลิกทำ, 5s), undo "เอากลับมาแล้ว" · springs in, latest replaces the previous, 3.2s · NOT a sonner toast: page toasts sit under the modal overlay and their buttons can't be clicked while the library is open (sonner stays for sync errors)
  - Motion: rows collapse out on delete / grow back on undo / grow in when added (height auto, 0.32s, no animation on open) · the selected chip's dark pill slides between chips (`layoutId`) · close / + / chips use `PressButton`
  - Rows 48px on touch, 40px on mouse devices (`.lib-row`)
- Closing the library → redraws the player's record from the latest library (excluding menus pending deletion)

## 6. Motion

| What | Values |
|---|---|
| Pick album: sleeve slides out + record flies from the sleeve onto the platter (`DiscFlight`, FLIP with Web Animations) | sleeve ~480ms → flight 620ms, platter record appears at 460ms |
| Album title change (`title-in`) | blur 14px → sharp + slide up 0.7s |
| Change album in the player (skip) | old record exits ∓360px → new record enters from ±360px |
| Drop the needle: cue → search → playing | cue .45s, search 3.6s (needle wobbles across track rings with ticks) |
| Menu library | in .36s `cubic-bezier(.22,1,.36,1)` / out .22s ease-in; desktop uses `translateX(100%)` instead |
| Background color change | .7s `cubic-bezier(.22,1,.36,1)` |
| `prefers-reduced-motion` | no record flight, record doesn't spin, static EQ, search shortened to 1.2s, library doesn't slide |

Sound (Web Audio, `lib/audio.ts`): `slide` record slide, `flick` cover flip, `needleDrop`, `tick` crossing a track, `song(key)` when a menu is picked — starts after the first tap (iOS)
- Per-album songs, 3–5s, fully synthesized in code (no audio files/music API — licensing, needs network, iOS autoplay): all hits original lo-fi · rice pentatonic marimba · noodles 70s funk with saw bass + chord stabs + hi-hat · soup/curry slow pad chords + long melody · Isan khaen (drone + vibrato) + fast lai melody + ching/chap/drum · dessert music box · loudness per song RMS ~0.02–0.027 so they match · songs go through their own bus; `stopSong()` fades out immediately when the needle lifts / the album changes / leaving the screen

## 7. iPhone Safari specifics

- **Safari bar color** = `meta theme-color` + `html/body` background (set in `App.tsx` per album) · while the library is open use `mix(stage.bg, '#0A0614', .62)` to match the dimmed area, plus a solid `.sheet-statusbar` strip (color `--chrome`) under the clock bar, because Safari doesn't read colors from translucent layers
- **Color on launch**: a short script in `index.html` reads the last album from `localStorage` and paints the background/theme-color before the app loads (color values duplicate `albums.ts`; change both)
- **Returning after a long time in another app**: viewport is re-measured every time (`hooks/watchSize.ts`: resize, pageshow, focus, visibilitychange, visualViewport) — don't add a `useEffect` cleanup that disconnects the observer (StrictMode makes the observer detach)
- dev: `Cache-Control: no-store` + reload when restored from bfcache so you never see a stale page
- Edges always use `env(safe-area-inset-*)`, heights use `dvh`
- Meta tags: `format-detection telephone=no` (track times aren't turned into phone links), `apple-mobile-web-app-capable` + `black-translucent` status bar for home-screen launches

## 8. Design decisions (don't revert without discussing first)

| Decision | Because |
|---|---|
| Bright background per album instead of glowing dark purple | the old look felt AI-made and colors looked washed out / dropped on iPhone |
| Vertical cover stack instead of horizontal coverflow | the record flies from the sleeve (right) to the platter, which needs to feel continuous, and portrait phones have more vertical room |
| Neutral paper library, not glass | tried dark glass, bright glass, pastel — every variant clashed with the album colors |
| Same black check button for every category | category colors made "on/paused" inconsistent (UX) |
| No "Edit" button — delete by swipe/trash | an edit mode is too prominent and adds steps |
| Delayed delete (5s) instead of delete-then-re-add | re-adding moves the menu to the end of its category and gives it a new id in the sheet |
| Desktop library is a full-height right panel with square corners | a bottom sheet on a wide screen looks like mobile and covers the main view |
| No full-screen loading page | there's a local cache, so the 2nd visit is instant — the waiting state lives in the album picker |
| No "picker name" field | nothing in the app displays it; rarely used |
| Player motion uses the `motion` library (only for the left column) | a sliding shared highlight (`layoutId`) is hard in plain CSS; everything else stays CSS keyframes |
| Desktop player = two columns, info left / turntable right | the phone column floated in a sea of color with a small turntable; mirroring the picker keeps the app consistent and the record flight short |
| Sleeve record peeks 24px and is tinted with the stage color | pure black on the bright stage was the strongest contrast on the screen and stole focus from the cover; the record must stay visible since it's the signature |
| Tonearm drop position only sets the start, result stays random | the user chose "needle wobbles to find a track" over "you get what you land on" |
