import type { AlbumKey } from '@/data/albums'
import type { Menu } from '@/data/repo'

export const TRACKS_PER_RECORD = 8

/** Menus eligible for a record: active and in the album (or all) */
export const poolFor = (menus: readonly Menu[], key: AlbumKey) =>
  menus.filter((m) => m.active && (key === 'all' || m.cat === key))

/** Draw 8 tracks: drop the previous pick (if pool > 8) → shuffle → take 8 */
export function draw(pool: readonly Menu[], lastId: string | null): Menu[] {
  let p = pool.slice()
  if (p.length > TRACKS_PER_RECORD && lastId) p = p.filter((m) => m.id !== lastId)
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[p[i], p[j]] = [p[j]!, p[i]!]
  }
  return p.slice(0, TRACKS_PER_RECORD)
}
