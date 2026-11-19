import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Cat } from './albums'
import { repo, type Menu, type MenuPatch } from './repo'

export const menusKey = ['menus'] as const
const CACHE_KEY = 'spin-eat-cache-v1'

export function createQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 2 },
      mutations: { retry: 1 },
    },
  })
  // Keep the latest list on the device → the next launch shows it instantly, then syncs
  qc.getQueryCache().subscribe((e) => {
    if (e.type !== 'updated' || e.query.queryKey[0] !== menusKey[0]) return
    const data = e.query.state.data as Menu[] | undefined
    if (!data) return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.filter((m) => !isPending(m))))
    } catch {
      /* ignore */
    }
  })
  return qc
}

function readCache(): Menu[] | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const data: unknown = raw ? JSON.parse(raw) : null
    return Array.isArray(data) && data.length ? (data as Menu[]) : undefined
  } catch {
    return undefined
  }
}

/** Menus just added and still waiting for a real id from the server */
export const isPending = (m: Menu) => m.id.startsWith('tmp-')

export function useMenus() {
  return useQuery({
    queryKey: menusKey,
    queryFn: () => repo.list(),
    initialData: readCache,
    initialDataUpdatedAt: 0, // cache is always stale → fetch right after rendering
  })
}

/** Shared optimistic update: snapshot → patch cache → on failure rollback + toast */
function useOptimistic<V, R>(opts: {
  mutationFn: (vars: V) => Promise<R>
  apply: (menus: Menu[], vars: V) => Menu[]
  onSuccess?: (menus: Menu[], result: R, vars: V) => Menu[]
  error: (vars: V) => string
}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: opts.mutationFn,
    onMutate: async (vars: V) => {
      await qc.cancelQueries({ queryKey: menusKey })
      const prev = qc.getQueryData<Menu[]>(menusKey)
      qc.setQueryData<Menu[]>(menusKey, (cur) => opts.apply(cur ?? [], vars))
      return { prev }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(menusKey, ctx.prev)
      toast.error(opts.error(vars), { description: 'เชื่อมต่อคลังเมนูไม่ได้ ลองใหม่อีกครั้ง' })
    },
    onSuccess: (result, vars) => {
      const fn = opts.onSuccess
      if (fn) qc.setQueryData<Menu[]>(menusKey, (cur) => fn(cur ?? [], result, vars))
    },
    onSettled: () => {
      // sync with the sheet only when no other mutation is pending (prevents list flicker)
      if (qc.isMutating() <= 1) void qc.invalidateQueries({ queryKey: menusKey })
    },
  })
}

interface AddVars {
  name: string
  cat: Cat
  tmpId: string
  /** Used when undoing a delete: restore to the original position + state */
  index?: number
  active?: boolean
}

export function useAddMenu() {
  const m = useOptimistic<AddVars, Menu>({
    mutationFn: async ({ name, cat, active }) => {
      const menu = await repo.add({ name, cat })
      if (active === false) {
        await repo.update(menu.id, { active: false })
        return { ...menu, active: false }
      }
      return menu
    },
    apply: (menus, v) => {
      const item: Menu = { id: v.tmpId, name: v.name, cat: v.cat, active: v.active ?? true, createdAt: new Date().toISOString() }
      const next = menus.slice()
      next.splice(v.index ?? next.length, 0, item)
      return next
    },
    onSuccess: (menus, menu, v) => menus.map((x) => (x.id === v.tmpId ? menu : x)),
    error: (v) => `เพิ่ม “${v.name}” ไม่สำเร็จ`,
  })
  return {
    ...m,
    add: (input: Omit<AddVars, 'tmpId'>) => m.mutate({ ...input, tmpId: 'tmp-' + Math.random().toString(36).slice(2) }),
  }
}

export function useUpdateMenu() {
  return useOptimistic<{ menu: Menu; patch: MenuPatch }, void>({
    mutationFn: ({ menu, patch }) => repo.update(menu.id, patch),
    apply: (menus, { menu, patch }) => menus.map((x) => (x.id === menu.id ? { ...x, ...patch } : x)),
    error: ({ menu }) => `แก้ “${menu.name}” ไม่สำเร็จ`,
  })
}

export function useRemoveMenu() {
  return useOptimistic<Menu, void>({
    mutationFn: (menu) => repo.remove(menu.id),
    apply: (menus, menu) => menus.filter((x) => x.id !== menu.id),
    error: (menu) => `ลบ “${menu.name}” ไม่สำเร็จ`,
  })
}

/** Log the pick to the sheet fire-and-forget — failures don't bother the user */
export function recordPick(menu: Menu, by?: string) {
  if (isPending(menu)) return
  repo.recordPick(menu, by?.trim() || undefined).catch((err: unknown) => {
    console.warn('recordPick failed', err)
  })
}
