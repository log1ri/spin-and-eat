import { LocalMenuRepo } from './local'
import { SheetsMenuRepo } from './sheets'
import type { MenuRepo } from './types'

const url = import.meta.env.VITE_SHEETS_API_URL?.trim()
const secret = import.meta.env.VITE_SHEETS_SECRET?.trim() ?? ''

export const repo: MenuRepo = url ? new SheetsMenuRepo(url, secret) : new LocalMenuRepo()

export type { Menu, MenuPatch, MenuRepo } from './types'
