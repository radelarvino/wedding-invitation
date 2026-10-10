/* ===== Backend undangan (Google Apps Script) =====
   Cara pasang:
   1. Buat Google Sheet baru > Extensions > Apps Script > tempel kode ini.
   2. Ubah SITE_URL di bawah menjadi alamat undangan Anda.
   3. Jalankan fungsi "setup" sekali (izinkan akses), lalu Deploy > New deployment > Web app
      (Execute as: Me, Who has access: Anyone). Salin URL ...../exec ke C.SCRIPT_URL di script.js.
   Tamu prioritas: isi sheet "Tamu" (kolom Nama & Maks tamu), lalu menu Undangan > Buat kode & link tamu.
   Kolom Link berisi tautan yang tinggal disebar. Setelah mengubah kode ini, deploy ulang (New version). */
const SITE_URL = 'https://NAMA-ANDA.github.io/undangan/';
const MAX_UMUM = 1;   // samakan dengan generalMax di script.js

const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const txt = s => { s = String(s || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; };   // cegah formula injection
function sh(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); }
  return s;
}
const rsvp = () => sh('RSVP', ['ID', 'Waktu', 'Nama', 'Kehadiran', 'Jumlah', 'Ucapan', 'Tipe']);
const tamu = () => sh('Tamu', ['Nama', 'Maks tamu', 'Kode', 'Link']);

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Undangan')
    .addItem('Buat kode & link tamu', 'buatLink').addItem('Siapkan lembar', 'setup').addToUi();
}
function setup() {
  rsvp(); tamu();
  const r = sh('Ringkasan', ['Ringkasan', 'Nilai']);
  if (r.getLastRow() < 2) r.getRange(2, 1, 4, 2).setValues([
    ['Tamu hadir (orang)', '=SUMIF(RSVP!D:D,"Hadir",RSVP!E:E)'],
    ['Konfirmasi hadir', '=COUNTIF(RSVP!D:D,"Hadir")'],
    ['Tidak dapat hadir', '=COUNTIF(RSVP!D:D,"Tidak dapat hadir")'],
    ['Jumlah ucapan', '=COUNTIF(RSVP!F2:F,"?*")']]);
}
function buatLink() {
  const s = tamu(), n = s.getLastRow();
  if (n < 2) return;
  const g = s.getRange(2, 1, n - 1, 4), v = g.getValues();
  v.forEach(r => {
    if (r[0] && !r[2]) r[2] = Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    r[3] = r[2] ? SITE_URL + '?k=' + r[2] : '';
  });
  g.setValues(v);
}

function findGuest(k) {
  if (!k) return null;
  const s = tamu(), n = s.getLastRow();
  if (n < 2) return null;
  const r = s.getRange(2, 1, n - 1, 3).getValues().find(x => x[2] && String(x[2]) === String(k));
  return r ? { name: String(r[0]), max: Math.max(1, +r[1] || 1) } : null;
}
function find(id) {
  const s = rsvp(), n = s.getLastRow();
  if (n < 2) return null;
  const v = s.getRange(2, 1, n - 1, 6).getValues();
  for (let i = 0; i < v.length; i++)
    if (v[i][0] === id) return { row: i + 2, nama: v[i][2], hadir: v[i][3], jumlah: v[i][4], ucapan: v[i][5] };
  return null;
}

/* GET: ?action=guest&k=KODE -> nama tamu prioritas (+ konfirmasi sebelumnya) | tanpa parameter -> daftar ucapan terbaru dulu */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'guest') {
    const g = findGuest(p.k);
    if (!g) return out({});
    const r = find('k:' + p.k);
    return out({ name: g.name, max: g.max, rsvp: r && { nama: r.nama, hadir: r.hadir, jumlah: r.jumlah, ucapan: r.ucapan } });
  }
  const v = rsvp().getDataRange().getValues().slice(1).reverse();
  return out(v.map(r => ({ nama: r[2], ucapan: r[5] })).filter(w => w.ucapan));
}

/* POST: satu baris per tamu. Id = kode prioritas ("k:") atau id perangkat ("d:"); kirim ulang = menimpa baris (edit) */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents), g = findGuest(d.k);
    if (d.k && !g) return out({ ok: false });
    const dev = String(d.d || '').slice(0, 64);
    if (!g && !dev) return out({ ok: false });
    const id = g ? 'k:' + d.k : 'd:' + dev;
    const hadir = d.hadir === 'Hadir' ? 'Hadir' : 'Tidak dapat hadir';
    const max = g ? g.max : MAX_UMUM;
    const jml = hadir === 'Hadir' ? Math.min(max, Math.max(1, +d.jumlah || 1)) : 0;
    const row = [id, new Date(), txt(g ? g.name : String(d.nama || '').slice(0, 60)), hadir, jml,
                 txt(String(d.ucapan || '').slice(0, 300)), g ? 'Prioritas' : 'Umum'];
    const f = find(id), s = rsvp();
    if (f) s.getRange(f.row, 1, 1, 7).setValues([row]); else s.appendRow(row);
    return out({ ok: true });
  } finally { lock.releaseLock(); }
}
