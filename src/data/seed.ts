import type { Cat } from './albums'
import type { Menu } from './repo/types'

/** Sample menus — same set as setup() in apps-script/Code.gs */
export const SEED: Record<Cat, string[]> = {
  rice: ['กะเพราหมูสับไข่ดาว', 'ข้าวมันไก่', 'ข้าวผัดปู', 'ข้าวขาหมู', 'ข้าวหมูแดง', 'ข้าวไข่เจียวหมูสับ', 'ข้าวคลุกกะปิ', 'ข้าวหน้าเป็ด'],
  noodle: ['ผัดไทยกุ้งสด', 'ก๋วยเตี๋ยวเรือ', 'ผัดซีอิ๊วหมู', 'ราดหน้าหมูหมัก', 'บะหมี่เกี๊ยวหมูแดง', 'ขนมจีนน้ำยา', 'เย็นตาโฟ'],
  soup: ['ต้มยำกุ้งน้ำข้น', 'แกงเขียวหวานไก่', 'ต้มข่าไก่', 'แกงส้มชะอม', 'สุกี้น้ำ', 'พะแนงหมู'],
  isan: ['ส้มตำไทย + ไก่ย่าง', 'ลาบหมู', 'ยำวุ้นเส้น', 'คอหมูย่าง', 'น้ำตกหมู'],
  sweet: ['บัวลอยไข่หวาน', 'ข้าวเหนียวมะม่วง', 'ขนมปังเย็น', 'ทับทิมกรอบ'],
}

export function seedMenus(): Menu[] {
  const now = new Date().toISOString()
  let n = 0
  return (Object.keys(SEED) as Cat[]).flatMap((cat) =>
    SEED[cat].map((name) => ({ id: 'd' + n++, name, cat, active: true, createdAt: now })),
  )
}
