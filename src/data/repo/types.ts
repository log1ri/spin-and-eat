import type { Cat } from '../albums'

export interface Menu {
  id: string
  name: string
  cat: Cat
  active: boolean
  createdAt: string | null
}

export type MenuPatch = Partial<Pick<Menu, 'name' | 'cat' | 'active'>>

export interface MenuRepo {
  readonly kind: 'sheets' | 'local'
  list(): Promise<Menu[]>
  add(input: { name: string; cat: Cat }): Promise<Menu>
  update(id: string, patch: MenuPatch): Promise<void>
  remove(id: string): Promise<void>
  recordPick(menu: Menu, by?: string): Promise<void>
}
