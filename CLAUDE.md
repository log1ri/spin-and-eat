# Spin & Eat — Notes for Claude

- The user is Thai — **always reply in Thai**. Docs and code comments are in English.
- Before changing the design, read `docs/DESIGN.md` (especially "Design decisions" — don't revert anything without asking)
- Open work / ideas / untested items live in `docs/PROGRESS.md` — update it after each finished task (and DESIGN.md if the design changed)
- Stack / code layout / randomizer mechanics are in `docs/HANDOFF.md`

## Working

- Main target is **iPhone Safari**; desktop (≥880px) is a fallback
- Run the dev server with `bun run dev --host` so phones can reach it (port 5173)
- Verify with `bun run build` (typecheck + build); for UI changes, screenshot with Playwright at least at 402×874 and 1280×800
- Never send the user's email anywhere · `VITE_SHEETS_SECRET` in the bundle is fine (it's only a group code)
- Album colors live in `src/data/albums.ts` and are duplicated in the boot script in `index.html` — change both
