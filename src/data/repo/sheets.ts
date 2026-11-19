import { isCat } from '../albums'
import type { Menu, MenuPatch, MenuRepo } from './types'

interface ApiOk {
  ok: true
}
interface ApiErr {
  ok: false
  error: string
}
type Api<T> = (ApiOk & T) | ApiErr

const TIMEOUT_MS = 15000

/** Google Sheets via an Apps Script Web App (see apps-script/Code.gs) */
export class SheetsMenuRepo implements MenuRepo {
  readonly kind = 'sheets' as const

  constructor(
    private readonly url: string,
    private readonly secret: string,
  ) {}

  private async request<T>(init?: RequestInit, query = ''): Promise<ApiOk & T> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(this.url + query, { ...init, signal: ctrl.signal, redirect: 'follow' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = (await res.json()) as Api<T>
      if (!data.ok) throw new Error(data.error || 'request failed')
      return data
    } finally {
      clearTimeout(timer)
    }
  }

  /** POST as text/plain → a simple request with no CORS preflight */
  private post<T>(body: Record<string, unknown>) {
    return this.request<T>({
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, secret: this.secret }),
    })
  }

  async list() {
    const data = await this.request<{ menus: unknown[] }>(undefined, '?action=menus')
    return data.menus.map(toMenu).filter((m): m is Menu => m !== null)
  }

  async add(input: { name: string; cat: Menu['cat'] }) {
    const data = await this.post<{ menu: unknown }>({ action: 'add', name: input.name.trim(), cat: input.cat })
    const menu = toMenu(data.menu)
    if (!menu) throw new Error('bad response')
    return menu
  }

  async update(id: string, patch: MenuPatch) {
    await this.post({ action: 'update', id, patch })
  }

  async remove(id: string) {
    await this.post({ action: 'remove', id })
  }

  async recordPick(menu: Menu, by?: string) {
    await this.post({ action: 'pick', menuId: menu.id, menuName: menu.name, by: by || undefined })
  }
}

function toMenu(raw: unknown): Menu | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = String(r.name ?? '').trim()
  const cat = String(r.cat ?? '').trim()
  if (!r.id || !name || !isCat(cat)) return null
  return {
    id: String(r.id),
    name,
    cat,
    active: r.active === true || String(r.active).toUpperCase() === 'TRUE',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : null,
  }
}
