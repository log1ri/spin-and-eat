/**
 * Spin & Eat — Google Sheets backend (Apps Script Web App)
 *
 * Setup:
 *  1. Create a new Google Sheet → Extensions → Apps Script → paste this file
 *  2. Project Settings → Script properties → add SECRET = <the group's secret code>
 *  3. Run setup() once (creates the menus / picks tabs + sample menus)
 *  4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
 *  5. Put the resulting URL in the app's VITE_SHEETS_API_URL
 *
 * API
 *  GET  ?action=menus                 → { ok, menus: Menu[] }
 *  GET  ?action=picks&limit=20        → { ok, picks: Pick[] }   (newest first)
 *  POST (Content-Type: text/plain, body = JSON)
 *       { secret, action: 'add',    name, cat }          → { ok, menu }
 *       { secret, action: 'update', id, patch: { name?, cat?, active? } } → { ok }
 *       { secret, action: 'remove', id }                  → { ok }
 *       { secret, action: 'pick',   menuId, menuName, by? } → { ok }
 */

const SHEET_MENUS = 'menus';
const SHEET_PICKS = 'picks';
const MENU_HEADERS = ['id', 'name', 'cat', 'active', 'created_at'];
const PICK_HEADERS = ['id', 'menu_id', 'menu_name', 'picked_by', 'picked_at'];
const CATS = ['rice', 'noodle', 'soup', 'isan', 'sweet'];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('missing sheet: ' + name + ' (run setup())');
  return sh;
}

function rows_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const head = values.shift();
  return values
    .filter((r) => r[0] !== '')
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/** Rows typed directly into the sheet (no id yet) → assign an id and set active = true */
function ensureIds_() {
  const sh = sheet_(SHEET_MENUS);
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 1, last - 1, 2).getValues();
  if (!ids.some((r) => r[1] !== '' && r[0] === '')) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const rng = sh.getRange(2, 1, last - 1, 5);
    const v = rng.getValues();
    v.forEach((r) => {
      if (r[1] !== '' && r[0] === '') {
        r[0] = Utilities.getUuid();
        r[3] = true;
        if (r[4] === '') r[4] = new Date();
      }
    });
    rng.setValues(v);
  } finally {
    lock.releaseLock();
  }
}

function readMenus_() {
  ensureIds_();
  return rows_(SHEET_MENUS).map((m) => ({
    id: String(m.id),
    name: String(m.name),
    cat: String(m.cat),
    active: m.active === true || String(m.active).toUpperCase() === 'TRUE',
    createdAt: m.created_at ? new Date(m.created_at).toISOString() : null,
  }));
}

function readPicks_(limit) {
  return rows_(SHEET_PICKS)
    .map((p) => ({
      id: String(p.id),
      menuId: String(p.menu_id),
      menuName: String(p.menu_name),
      by: p.picked_by ? String(p.picked_by) : null,
      pickedAt: new Date(p.picked_at).toISOString(),
    }))
    .reverse()
    .slice(0, limit);
}

function findRow_(sh, id) {
  const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}

function validName_(name) {
  const n = String(name || '').trim();
  if (!n || n.length > 80) throw new Error('invalid name');
  return n;
}

function validCat_(cat) {
  if (CATS.indexOf(cat) < 0) throw new Error('invalid cat');
  return cat;
}

function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'menus';
    if (action === 'menus') return json_({ ok: true, menus: readMenus_() });
    if (action === 'picks') return json_({ ok: true, picks: readPicks_(Number(e.parameter.limit || 20)) });
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || body.secret !== secret) return json_({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (body.action) {
      case 'add': {
        const menu = {
          id: Utilities.getUuid(),
          name: validName_(body.name),
          cat: validCat_(body.cat),
          active: true,
          createdAt: new Date().toISOString(),
        };
        sheet_(SHEET_MENUS).appendRow([menu.id, menu.name, menu.cat, true, new Date()]);
        return json_({ ok: true, menu: menu });
      }
      case 'update': {
        const sh = sheet_(SHEET_MENUS);
        const row = findRow_(sh, body.id);
        if (row < 0) return json_({ ok: false, error: 'not found' });
        const p = body.patch || {};
        if (p.name !== undefined) sh.getRange(row, 2).setValue(validName_(p.name));
        if (p.cat !== undefined) sh.getRange(row, 3).setValue(validCat_(p.cat));
        if (p.active !== undefined) sh.getRange(row, 4).setValue(!!p.active);
        return json_({ ok: true });
      }
      case 'remove': {
        const sh = sheet_(SHEET_MENUS);
        const row = findRow_(sh, body.id);
        if (row > 0) sh.deleteRow(row);
        return json_({ ok: true });
      }
      case 'pick': {
        sheet_(SHEET_PICKS).appendRow([
          Utilities.getUuid(),
          String(body.menuId || ''),
          validName_(body.menuName),
          body.by ? String(body.by).slice(0, 40) : '',
          new Date(),
        ]);
        return json_({ ok: true });
      }
      default:
        return json_({ ok: false, error: 'unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Run once at install: create tabs + headers + sample menus */
function setup() {
  const ss = SpreadsheetApp.getActive();
  let menus = ss.getSheetByName(SHEET_MENUS);
  if (!menus) menus = ss.insertSheet(SHEET_MENUS);
  if (menus.getLastRow() === 0) {
    menus.appendRow(MENU_HEADERS);
    menus.setFrozenRows(1);
    const seed = {
      rice: ['กะเพราหมูสับไข่ดาว', 'ข้าวมันไก่', 'ข้าวผัดปู', 'ข้าวขาหมู', 'ข้าวหมูแดง', 'ข้าวไข่เจียวหมูสับ', 'ข้าวคลุกกะปิ', 'ข้าวหน้าเป็ด'],
      noodle: ['ผัดไทยกุ้งสด', 'ก๋วยเตี๋ยวเรือ', 'ผัดซีอิ๊วหมู', 'ราดหน้าหมูหมัก', 'บะหมี่เกี๊ยวหมูแดง', 'ขนมจีนน้ำยา', 'เย็นตาโฟ'],
      soup: ['ต้มยำกุ้งน้ำข้น', 'แกงเขียวหวานไก่', 'ต้มข่าไก่', 'แกงส้มชะอม', 'สุกี้น้ำ', 'พะแนงหมู'],
      isan: ['ส้มตำไทย + ไก่ย่าง', 'ลาบหมู', 'ยำวุ้นเส้น', 'คอหมูย่าง', 'น้ำตกหมู'],
      sweet: ['บัวลอยไข่หวาน', 'ข้าวเหนียวมะม่วง', 'ขนมปังเย็น', 'ทับทิมกรอบ'],
    };
    const now = new Date();
    const rows = [];
    Object.keys(seed).forEach((cat) => seed[cat].forEach((name) => rows.push([Utilities.getUuid(), name, cat, true, now])));
    menus.getRange(2, 1, rows.length, MENU_HEADERS.length).setValues(rows);
    // Make the active column a checkbox so it's easy to edit in the sheet
    menus.getRange(2, 4, 500, 1).insertCheckboxes();
    // category dropdown
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(CATS, true).build();
    menus.getRange(2, 3, 500, 1).setDataValidation(rule);
  }
  let picks = ss.getSheetByName(SHEET_PICKS);
  if (!picks) picks = ss.insertSheet(SHEET_PICKS);
  if (picks.getLastRow() === 0) {
    picks.appendRow(PICK_HEADERS);
    picks.setFrozenRows(1);
  }
}
