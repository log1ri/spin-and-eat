# Spin & Eat 🎶🍜

A mobile web app for **picking what to eat with a vinyl-record theme**. Shared by a group of friends through a common menu library on Google Sheets.

Bun · Vite · React 18 · TypeScript (strict) · Tailwind v4 · Zustand · TanStack Query · Radix (shadcn/ui) · Motion · sonner

## Getting started

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # typecheck + build → dist/
bun run preview
```

Without env vars the app uses `LocalMenuRepo` (stores the menu library in that device's `localStorage`, seeded with 30 sample menus), so you can start developing right away.

## Google Sheet setup (shared menu library)

1. Create a new Google Sheet → **Extensions → Apps Script** and paste the code from [`apps-script/Code.gs`](apps-script/Code.gs)
2. **Project Settings → Script properties** → add `SECRET` = a group code (any value you like)
3. In the editor, select the `setup` function and click **Run** once (it will ask for permissions). This creates the `menus` and `picks` tabs with sample menus
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the URL ending in `/exec` and create `.env.local`

   ```bash
   cp .env.example .env.local
   # VITE_SHEETS_API_URL=https://script.google.com/macros/s/XXXX/exec
   # VITE_SHEETS_SECRET=<the same group code as step 2>
   ```

> If you edit `Code.gs` later, you must **Deploy → Manage deployments → Edit → New version** for the existing URL to pick up the new code

**Editing the sheet directly works:** type a menu name in the `name` column and pick a `cat` (rice, noodle, soup, isan, sweet), leaving `id` blank. The app fills in `id` and sets `active` the next time it loads. Unticking the `active` checkbox pauses that menu.

**Security:** `VITE_SHEETS_SECRET` is built into the client bundle. It's just a "group code" to stop random API calls, not real security — acceptable for an app at this level.

## Deploying to Cloudflare Pages

1. Push the repo to GitHub, then in the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. Build settings
   - Framework preset: **None** (or Vite)
   - Build command: `bun run build`
   - Build output directory: `dist`
3. **Environment variables** (Production and Preview): `VITE_SHEETS_API_URL`, `VITE_SHEETS_SECRET`
4. Click Deploy (env values are baked in at build time — redeploy after changing them)

Using the CLI instead: `bun run build && bunx wrangler pages deploy dist --project-name spin-and-eat`

`public/_redirects` already provides the SPA fallback.

## Docs

| File | Contents |
|---|---|
| [`docs/DESIGN.md`](docs/DESIGN.md) | Look, colors, components, motion and design rationale (source of truth) |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | What's done, what's untested, pending ideas |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | Stack, code layout, randomizer mechanics and data |

## Layout (short)

```
apps-script/Code.gs            Google Sheets backend
src/
  app/                         root: viewport, screen switch, background/Safari bar color + providers
  store/ui.ts                  zustand: screen, album, needle state (+persist last album/sound)
  data/                        albums (meta for 6 records), repo (Sheets/Local), queries (TanStack Query)
  lib/                         audio, geometry, draw, layout, color
  hooks/                       useTurntable, watchSize, useViewport, …
  components/                  DiscFlight, HeaderActions, icons, ui/
  features/crate/              album picker (vertical cover stack + background follows the album)
  features/player/             player screen + Turntable + Tracklist
  features/library/            menu library (mobile: bottom sheet · desktop: right panel)
  styles/                      index.css + crate.css + turntable.css
```

## Behavior worth knowing

- **Randomizing happens entirely on the client**; the result is then logged to the `picks` tab fire-and-forget
- **Optimistic updates:** add/pause/delete show instantly. If the server fails (after 1 retry) the change rolls back with a toast
- **Deleting a menu** (swipe left on mobile / trash icon on desktop) hides it for 5 seconds before actually deleting. "เลิกทำ" (Undo) puts it back in place with the same id. Closing the library while waiting deletes immediately
- The latest list is cached in `localStorage` so the app shows data instantly. Data refreshes when older than 30 seconds or when the tab regains focus
  - With no cache yet (first visit / private mode) the album picker shows "กำลังหยิบแผ่น…" (fetching records…), and a "ลองใหม่" (Retry) button if loading fails
- Sound starts after the first tap (iOS restriction). The speaker button top-right mutes. With the iPhone silent switch on there is no sound
- With `prefers-reduced-motion` the record doesn't fly or spin, the EQ is static, and the needle goes straight to the track within ~1.2s

## Testing on a phone (dev)

```bash
bun run dev --host   # then open http://<machine IP>:5173 on a phone on the same Wi-Fi
```

Without `--host` the server only accepts local connections, so phones can't reach it.

## License

[MIT](LICENSE)
