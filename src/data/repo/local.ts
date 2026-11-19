import { seedMenus } from '../seed'
import { isCat } from '../albums'
import type { Menu, MenuPatch, MenuRepo } from './types'

const KEY = 'spin-eat-menus-v1'
const PICKS_KEY = 'spin-eat-picks-v1'

function load(): Menu[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((m): m is Menu => !!m && isCat((m as Menu).cat))
    }
  } catch {
    /* localStorage unavailable → use sample menus */
  }
  return seedMenus()
}

function save(menus: Menu[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(menus))
  } catch {
    /* ignore */
  }
}

/** Keeps the menu library on the device — used when Google Sheets env isn't set */
export class LocalMenuRepo implements MenuRepo {
  readonly kind = 'local' as const

  async list() {
    return load()
  }

  async add(input: { name: string; cat: Menu['cat'] }) {
    const menu: Menu = {
      id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: input.name.trim(),
      cat: input.cat,
      active: true,
      createdAt: new Date().toISOString(),
    }
    save([...load(), menu])
    return menu
  }

  async update(id: string, patch: MenuPatch) {
    save(load().map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async remove(id: string) {
    save(load().filter((m) => m.id !== id))
  }

  async recordPick(menu: Menu, by?: string) {
    try {
      const picks: unknown[] = JSON.parse(localStorage.getItem(PICKS_KEY) ?? '[]')
      picks.push({ menuId: menu.id, menuName: menu.name, by: by ?? null, pickedAt: new Date().toISOString() })
      localStorage.setItem(PICKS_KEY, JSON.stringify(picks.slice(-50)))
    } catch {
      /* ignore */
    }
  }
}
