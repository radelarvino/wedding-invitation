/* =====================================================================
   BACKEND UNDANGAN — Google Apps Script + Spreadsheet
   ---------------------------------------------------------------------
   CARA PASANG
   1. Buat Google Sheet baru → Extensions → Apps Script → tempel file ini.
   2. Ubah SITE_URL (alamat undangan) dan ADMIN_PIN di bawah.
   3. Jalankan fungsi setup() sekali, izinkan akses. Setup juga memperbaiki
      sheet lama: header, kolom Kode, sheet Kehadiran, dan formula Ringkasan.
   4. Deploy → New deployment → Web app
      Execute as: Me · Who has access: Anyone.
      Salin URL ..../exec ke config.js (SCRIPT_URL).
   5. Isi sheet "Tamu" (Nama, Maks tamu, Tipe). Untuk tamu prioritas biarkan
      Tipe kosong/Prioritas. lalu menu Undangan → Buat / perbarui link tamu.
      Untuk tamu umum bernama, isi Tipe = Umum.
   6. Buka admin.html untuk dashboard kehadiran (PIN = ADMIN_PIN).

   Setiap kali Code.gs diubah: Deploy → Manage deployments → Edit →
   New version, agar perubahan aktif.
   ===================================================================== */
const SITE_URL = 'https://NAMA-ANDA.github.io/undangan/'; // HARUS diakhiri "/"
const ADMIN_PIN = '123456';                                // GANTI DI EDITOR APPS SCRIPT; jangan commit PIN asli
const MAX_UMUM = 1;                                        // samakan generalMax di script.js

const SHEET = {
  tamu: 'Tamu',
  rsvp: 'RSVP',
  hadir: 'Kehadiran',
  ringkas: 'Ringkasan'
};
const HEAD = {
  tamu: ['Nama', 'Maks tamu', 'Kode', 'Link', 'Tipe', 'WhatsApp', 'Konfirmasi', 'Jumlah konfirmasi', 'Check-in', 'Waktu check-in', 'Jumlah hadir', 'Catatan'],
  rsvp: ['ID', 'Waktu', 'Nama', 'Kehadiran', 'Jumlah', 'Ucapan', 'Tipe', 'Kode'],
  hadir: ['ID', 'Waktu', 'Nama', 'Kode', 'Jumlah', 'Tipe', 'Catatan'],
  ringkas: ['Ringkasan', 'Nilai']
};

/* ---------- utilitas ---------- */
const out_ = o => ContentService.createTextOutput(JSON.stringify(o))
  .setMimeType(ContentService.MimeType.JSON);
const alert_ = msg => {
  try { SpreadsheetApp.getUi().alert(msg); return; } catch (_) {}
  try { Logger.log(msg); } catch (_) {}
};
const txt_ = s => { s = String(s == null ? '' : s); return /^[=+\-@]/.test(s) ? "'" + s : s; };
const clean_ = (s, n) => txt_(String(s == null ? '' : s).trim().slice(0, n || 300));
const iso_ = d => d instanceof Date ? Utilities.formatDate(d, 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ssXXX") : (d || '');
const pin_ = () => String(ADMIN_PIN);
const isAdmin_ = p => String(p) === pin_();

function sh_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, head.length).setValues([head]);
    s.setFrozenRows(1);
  } else if (s.getLastRow() === 0) {
    s.getRange(1, 1, 1, head.length).setValues([head]);
    s.setFrozenRows(1);
  } else {
    // pastikan header lengkap (tidak menghapus data yang sudah ada)
    const cur = s.getRange(1, 1, 1, Math.max(head.length, s.getLastColumn())).getValues()[0];
    let changed = false;
    head.forEach((h, i) => { if (cur[i] !== h) { cur[i] = h; changed = true; } });
    if (changed) s.getRange(1, 1, 1, cur.length).setValues([cur]);
    s.setFrozenRows(1);
  }
  s.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#17312a').setFontColor('#f0ead8');
  return s;
}
const tamuSheet_ = () => sh_(SHEET.tamu, HEAD.tamu);
const rsvpSheet_ = () => sh_(SHEET.rsvp, HEAD.rsvp);
const hadirSheet_ = () => sh_(SHEET.hadir, HEAD.hadir);

function linkBase_() {
  let u = String(SITE_URL || '').trim();
  if (!u) return '';
  if (/\/[^/]*\.[a-z]{2,5}$/i.test(u)) u = u.replace(/[^/]*$/, ''); // buang nama file
  return u.replace(/\/?$/, '/');
}
function guestLink_(code, name, tipe) {
  const base = linkBase_();
  if (!base) return '';
  return String(tipe).toLowerCase() === 'umum'
    ? base + '?to=' + encodeURIComponent(name)
    : base + '?k=' + encodeURIComponent(code);
}

/* ---------- menu & setup ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Undangan')
    .addItem('Buat / perbarui link tamu', 'buatLink')
    .addItem('Siapkan / perbaiki lembar', 'setup')
    .addItem('Cek kelengkapan lembar', 'cekLembar')
    .addItem('Rapikan tampilan & rekap', 'rapikanLembar')
    .addSeparator()
    .addItem('Buka halaman dashboard', 'showDashboard')
    .addToUi();
}

function showDashboard() {
  const url = linkBase_() + 'admin.html';
  alert_('Dashboard tamu & kehadiran:\n\n' + url + '\n\nPIN awal: ' + ADMIN_PIN + '\nGanti ADMIN_PIN di Code.gs sebelum dibagikan.');
}

function setup() {
  rapikanLembar(true);
  alert_('Lembar undangan siap dan sudah dirapikan. Isi sheet "Tamu" (Nama, Maks tamu, Tipe), lalu jalankan menu Undangan → Buat / perbarui link tamu.');
}

function cekLembar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];
  ['tamu', 'rsvp', 'hadir', 'ringkas'].forEach(key => {
    const name = SHEET[key], head = HEAD[key];
    const s = ss.getSheetByName(name);
    if (!s) {
      issues.push('Sheet "' + name + '" belum ada.');
      return;
    }
    const cur = s.getRange(1, 1, 1, Math.max(head.length, s.getLastColumn())).getValues()[0];
    head.forEach((h, i) => {
      if (String(cur[i] || '') !== h) {
        issues.push(name + '!kolom ' + (i + 1) + ' harus "' + h + '" (sekarang: "' + String(cur[i] || '') + '")');
      }
    });
  });
  const sum = ss.getSheetByName(SHEET.ringkas);
  if (sum && sum.getLastRow() < 10) issues.push('Ringkasan belum berisi 9 baris rekap.');
  alert_(issues.length
    ? 'Perlu diperbaiki:\n\n' + issues.join('\n') + '\n\nJalankan menu Undangan → Siapkan / perbaiki lembar.'
    : 'Semua sheet dan header sudah sesuai. Jumlah tamu: ' + Math.max(0, tamuSheet_().getLastRow() - 1) + ' baris.');
}

function writeSummary_(sum) {
  // Selalu tulis ulang rekap supaya formula lama yang rusak ikut diperbaiki.
  sum.getRange(2, 1, 9, 2).setValues([
    ['Tamu terdaftar', '=COUNTA(Tamu!A2:A)'],
    ['Total kapasitas', '=SUM(Tamu!B2:B)'],
    ['Konfirmasi hadir', '=COUNTIF(Tamu!G2:G,"Hadir")'],
    ['Total dikonfirmasi', '=SUMIF(Tamu!G2:G,"Hadir",Tamu!H2:H)'],
    ['Tidak dapat hadir', '=COUNTIF(Tamu!G2:G,"Tidak dapat hadir")'],
    ['Sudah check-in', '=COUNTA(Kehadiran!C2:C)'],
    ['Total orang hadir', '=SUM(Kehadiran!E2:E)'],
    ['Ucapan masuk', '=COUNTIF(RSVP!F2:F,"?*")'],
    ['Diperbarui', '=NOW()']
  ]);
}

/* Atur lebar kolom, format tanggal, dan validasi agar sheet mudah diisi. */
function rapikanLembar(silent) {
  const t = tamuSheet_();
  const r = rsvpSheet_();
  const h = hadirSheet_();
  const sum = sh_(SHEET.ringkas, HEAD.ringkas);
  const maxRows = s => Math.max(1, s.getMaxRows() - 1);

  writeSummary_(sum);

  styleSheet_(t, [220, 100, 115, 320, 100, 140, 120, 155, 100, 160, 120, 220], 1);
  styleSheet_(r, [115, 155, 190, 120, 80, 380, 100, 115], 0);
  styleSheet_(h, [115, 155, 190, 110, 80, 105, 240], 0);
  styleSheet_(sum, [230, 190], 0);

  t.setTabColor('#D9BD82');
  r.setTabColor('#9DBDAC');
  h.setTabColor('#D7A69E');
  sum.setTabColor('#A4B2A9');

  // Catatan singkat di header supaya kolom tidak tertukar.
  t.getRange('A1').setNote('Isi nama tamu atau nama keluarga.');
  t.getRange('B1').setNote('Kapasitas maksimal orang untuk tamu ini.');
  t.getRange('C1').setNote('Dibuat otomatis oleh menu Undangan → Buat / perbarui link tamu.');
  t.getRange('D1').setNote('Link undangan personal, dibuat otomatis.');
  t.getRange('E1').setNote('Kosongkan atau tulis "Prioritas". Isi "Umum" untuk tamu umum bernama.');
  t.getRange('F1').setNote('Opsional. Contoh: 08123456789.');
  t.getRange('G1').setNote('Diisi otomatis dari RSVP / check-in.');
  r.getRange('A1').setNote('Diisi otomatis oleh undangan. Tidak perlu diedit.');
  h.getRange('A1').setNote('Diisi otomatis dari dashboard check-in.');
  sum.getRange('A1').setNote('Rekap otomatis. Jangan ubah isi sheet ini.');

  const tipeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Prioritas', 'Umum'], true)
    .setAllowInvalid(true)
    .build();
  t.getRange(2, 5, maxRows(t), 1).setDataValidation(tipeRule);

  // Format tanggal dan perataan kolom angka.
  t.getRange(2, 10, maxRows(t), 1).setNumberFormat('dd/MM/yyyy HH:mm');
  r.getRange(2, 2, maxRows(r), 1).setNumberFormat('dd/MM/yyyy HH:mm');
  h.getRange(2, 2, maxRows(h), 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sum.getRange('B2:B8').setHorizontalAlignment('right').setNumberFormat('#,##0');
  sum.getRange('B9').setHorizontalAlignment('right').setNumberFormat('dd/MM/yyyy HH:mm');

  t.getRange(2, 1, maxRows(t), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  t.getRange(2, 12, maxRows(t), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  r.getRange(2, 6, maxRows(r), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  h.getRange(2, 7, maxRows(h), 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  [t, r, h].forEach(s => {
    s.getRange(2, 2, maxRows(s), 1).setHorizontalAlignment('center');
  });
  t.getRange(2, 7, maxRows(t), 5).setHorizontalAlignment('center');
  r.getRange(2, 4, maxRows(r), 2).setHorizontalAlignment('center');
  h.getRange(2, 5, maxRows(h), 1).setHorizontalAlignment('center');
  if (!silent) alert_('Tampilan lembar sudah dirapikan: header, lebar kolom, format tanggal, dan pilihan Tipe.');
}

function styleSheet_(s, widths, freezeCols) {
  widths.forEach((w, i) => s.setColumnWidth(i + 1, w));
  s.setRowHeight(1, 44);
  s.getRange(1, 1, 1, widths.length)
    .setFontWeight('bold')
    .setBackground('#17312a')
    .setFontColor('#f0ead8')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  if (s.getLastRow() >= 2) {
    s.getRange(2, 1, s.getLastRow() - 1, widths.length).setVerticalAlignment('middle');
  }
  s.setFrozenRows(1);
  s.setFrozenColumns(freezeCols || 0);
}

/* ---------- link tamu ---------- */
function buatLink() {
  const s = tamuSheet_(), n = s.getLastRow();
  if (n < 2) return alert_('Belum ada nama tamu di sheet "Tamu".');
  const range = s.getRange(2, 1, n - 1, 5);
  const values = range.getValues();
  values.forEach(r => {
    const nama = String(r[0] || '').trim();
    if (!nama) return;
    const tipe = String(r[4] || '').trim() || 'Prioritas';
    const prioritas = tipe.toLowerCase() !== 'umum';
    if (prioritas) {
      if (!r[2]) r[2] = Utilities.getUuid().replace(/-/g, '').slice(0, 8);
      r[3] = guestLink_(r[2], nama, tipe);
      r[4] = 'Prioritas';
    } else {
      r[2] = '';
      r[3] = guestLink_('', nama, tipe);
      r[4] = 'Umum';
    }
  });
  range.setValues(values);
  alert_('Link tamu sudah dibuat / diperbarui. Kolom Link siap disalin.');
}

/* ---------- baca data ---------- */
function guestFromRow_(r, rowNumber) {
  return {
    row: rowNumber,
    nama: String(r[0] || '').trim(),
    max: Math.max(1, +r[1] || 1),
    kode: String(r[2] || '').trim(),
    link: String(r[3] || '').trim(),
    tipe: String(r[4] || '').trim() || 'Prioritas',
    wa: String(r[5] || '').trim(),
    konfirmasi: String(r[6] || 'Belum').trim() || 'Belum',
    jumlahKonfirmasi: +r[7] || 0,
    checkin: String(r[8] || 'Belum').trim() || 'Belum',
    waktuCheckin: iso_(r[9]),
    jumlahHadir: +r[10] || 0,
    catatan: String(r[11] || '').trim()
  };
}

function allGuests_() {
  const s = tamuSheet_(), n = s.getLastRow();
  if (n < 2) return [];
  return s.getRange(2, 1, n - 1, HEAD.tamu.length).getValues()
    .map((r, i) => guestFromRow_(r, i + 2))
    .filter(g => g.nama);
}

function findGuest_(kode) {
  if (!kode) return null;
  const s = tamuSheet_(), n = s.getLastRow();
  if (n < 2) return null;
  const values = s.getRange(2, 1, n - 1, HEAD.tamu.length).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][2] || '') === String(kode)) return guestFromRow_(values[i], i + 2);
  }
  return null;
}

function findGuestByName_(nama) {
  const key = String(nama || '').trim().toLowerCase();
  if (!key) return null;
  const s = tamuSheet_(), n = s.getLastRow();
  if (n < 2) return null;
  const values = s.getRange(2, 1, n - 1, HEAD.tamu.length).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === key) return guestFromRow_(values[i], i + 2);
  }
  return null;
}

function findRsvp_(id) {
  const s = rsvpSheet_(), n = s.getLastRow();
  if (n < 2) return null;
  const v = s.getRange(2, 1, n - 1, HEAD.rsvp.length).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]) === String(id)) {
      return {
        row: i + 2,
        id: String(v[i][0]),
        nama: String(v[i][2] || ''),
        hadir: String(v[i][3] || ''),
        jumlah: +v[i][4] || 0,
        ucapan: String(v[i][5] || ''),
        tipe: String(v[i][6] || ''),
        kode: String(v[i][7] || '')
      };
    }
  }
  return null;
}

function findAttendance_(id) {
  const s = hadirSheet_(), n = s.getLastRow();
  if (n < 2) return null;
  const v = s.getRange(2, 1, n - 1, HEAD.hadir.length).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]) === String(id)) {
      return { row: i + 2, id: String(v[i][0]), nama: String(v[i][2] || ''), kode: String(v[i][3] || ''), jumlah: +v[i][4] || 0, tipe: String(v[i][5] || ''), catatan: String(v[i][6] || '') };
    }
  }
  return null;
}

function wishes_() {
  const s = rsvpSheet_(), n = s.getLastRow();
  if (n < 2) return [];
  return s.getRange(2, 1, n - 1, HEAD.rsvp.length).getValues()
    .filter(r => String(r[5] || '').trim())
    .map(r => ({ nama: String(r[2] || 'Tamu'), hadir: String(r[3] || ''), ucapan: String(r[5] || ''), waktu: iso_(r[1]) }))
    .reverse()
    .slice(0, 40);
}

function stats_() {
  const guests = allGuests_();
  const hadir = hadirSheet_(), hn = hadir.getLastRow();
  const att = hn < 2 ? [] : hadir.getRange(2, 1, hn - 1, HEAD.hadir.length).getValues();
  const confirmHadir = guests.filter(g => g.konfirmasi === 'Hadir');
  const confirmTidak = guests.filter(g => g.konfirmasi === 'Tidak dapat hadir');
  const rsvp = rsvpSheet_(), rn = rsvp.getLastRow();
  const ucapan = rn < 2 ? 0 : rsvp.getRange(2, 1, rn - 1, HEAD.rsvp.length).getValues()
    .filter(r => String(r[5] || '').trim()).length;
  return {
    terdaftar: guests.length,
    prioritas: guests.filter(g => g.tipe.toLowerCase() !== 'umum').length,
    kapasitas: guests.reduce((a, g) => a + g.max, 0),
    konfirmasiHadir: confirmHadir.length,
    konfirmasiOrang: confirmHadir.reduce((a, g) => a + (g.jumlahKonfirmasi || g.max), 0),
    konfirmasiTidak: confirmTidak.length,
    checkin: att.length,
    totalHadir: att.reduce((a, r) => a + (+r[4] || 1), 0),
    ucapan: ucapan
  };
}

/* ---------- GET ---------- */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = p.action || 'wishes';

    if (action === 'ping') return out_({ ok: true, time: new Date().toISOString() });

    if (action === 'guest') {
      const g = findGuest_(p.k);
      if (!g) return out_({});
      const r = findRsvp_('k:' + p.k);
      return out_({
        name: g.nama,
        max: g.max,
        tipe: g.tipe,
        rsvp: r ? { nama: r.nama, hadir: r.hadir, jumlah: r.jumlah, ucapan: r.ucapan } : null
      });
    }

    if (action === 'wishes') return out_(wishes_());

    if (action === 'admin') {
      if (!isAdmin_(p.pin)) return out_({ ok: false, error: 'PIN tidak sesuai.' });
      const type = p.type || 'stats';
      if (type === 'guests') return out_({ ok: true, data: allGuests_() });
      if (type === 'attendance') {
        const s = hadirSheet_(), n = s.getLastRow();
        const rows = n < 2 ? [] : s.getRange(2, 1, n - 1, HEAD.hadir.length).getValues().map(r => ({
          waktu: iso_(r[1]), nama: String(r[2] || ''), kode: String(r[3] || ''),
          jumlah: +r[4] || 1, tipe: String(r[5] || ''), catatan: String(r[6] || '')
        })).reverse();
        return out_({ ok: true, data: rows });
      }
      if (type === 'rsvp') {
        const s = rsvpSheet_(), n = s.getLastRow();
        const rows = n < 2 ? [] : s.getRange(2, 1, n - 1, HEAD.rsvp.length).getValues().map(r => ({
          waktu: iso_(r[1]), nama: String(r[2] || ''), hadir: String(r[3] || ''),
          jumlah: +r[4] || 0, ucapan: String(r[5] || ''), tipe: String(r[6] || ''), kode: String(r[7] || '')
        })).reverse();
        return out_({ ok: true, data: rows });
      }
      if (type === 'wishes') return out_({ ok: true, data: wishes_() });
      return out_({ ok: true, data: stats_() });
    }

    return out_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ---------- POST ---------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = d.action || 'rsvp';
    if (action === 'rsvp') return rsvp_(d);
    if (action === 'checkin') return checkin_(d);
    if (action === 'addguest') return addguest_(d);
    return out_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function rsvp_(d) {
  let g = null;
  if (d.k) {
    g = findGuest_(d.k);
    if (!g) return out_({ ok: false, error: 'Kode undangan tidak valid.' });
  }
  const dev = String(d.d || '').slice(0, 64);
  if (!g && !dev) return out_({ ok: false, error: 'Identitas tamu tidak lengkap.' });

  const id = g ? 'k:' + d.k : 'd:' + dev;
  const hadir = d.hadir === 'Hadir' ? 'Hadir' : 'Tidak dapat hadir';
  const max = g ? g.max : MAX_UMUM;
  const jml = hadir === 'Hadir' ? Math.min(max, Math.max(1, +d.jumlah || 1)) : 0;
  const nama = g ? g.nama : clean_(d.nama, 60);
  if (!nama) return out_({ ok: false, error: 'Nama wajib diisi.' });

  const row = [id, new Date(), nama, hadir, jml, clean_(d.ucapan, 300), g ? 'Prioritas' : 'Umum', g ? String(d.k) : ''];
  const found = findRsvp_(id);
  const s = rsvpSheet_();
  if (found) s.getRange(found.row, 1, 1, HEAD.rsvp.length).setValues([row]);
  else s.appendRow(row);

  if (g) {
    // simpan status konfirmasi di baris tamu prioritas
    tamuSheet_().getRange(g.row, 7, 1, 2).setValues([[hadir, jml]]);
  }
  return out_({ ok: true, id: id, nama: nama });
}

function checkin_(d) {
  if (!isAdmin_(d.pin)) return out_({ ok: false, error: 'PIN tidak sesuai.' });
  const kode = String(d.kode || '').trim();
  const namaInput = clean_(d.nama, 60);
  let g = kode ? findGuest_(kode) : null;
  if (!g && namaInput) g = findGuestByName_(namaInput);
  if (!g && !namaInput) return out_({ ok: false, error: 'Pilih tamu atau isi nama.' });

  const nama = g ? g.nama : namaInput;
  const tipe = g ? (g.tipe || 'Prioritas') : 'Tamu tambahan';
  const id = g ? (g.kode ? 'k:' + g.kode : 'n:' + nama.toLowerCase()) : 'n:' + nama.toLowerCase();
  const jumlah = Math.max(1, Math.min(30, +d.jumlah || (g ? g.max : 1) || 1));
  const catatan = clean_(d.catatan, 200);
  const now = new Date();

  const found = findAttendance_(id);
  const row = [id, now, nama, g ? (g.kode || '') : '', jumlah, tipe, catatan];
  const s = hadirSheet_();
  if (found) s.getRange(found.row, 1, 1, HEAD.hadir.length).setValues([row]);
  else s.appendRow(row);

  if (g) {
    const t = tamuSheet_();
    t.getRange(g.row, 7).setValue('Hadir');
    // Jangan menimpa jumlah konfirmasi yang sudah ada; isi hanya bila tamu belum pernah RSVP.
    if (!g.jumlahKonfirmasi) t.getRange(g.row, 8).setValue(jumlah);
    t.getRange(g.row, 9, 1, 3).setValues([['Hadir', now, jumlah]]);
  }
  return out_({ ok: true, nama: nama, jumlah: jumlah, tipe: tipe });
}

function addguest_(d) {
  if (!isAdmin_(d.pin)) return out_({ ok: false, error: 'PIN tidak sesuai.' });
  const nama = clean_(d.nama, 80);
  if (!nama) return out_({ ok: false, error: 'Nama wajib diisi.' });
  const tipe = String(d.tipe || '').toLowerCase() === 'umum' ? 'Umum' : 'Prioritas';
  const max = Math.max(1, Math.min(20, +d.max || 1));
  const code = tipe === 'Prioritas' ? Utilities.getUuid().replace(/-/g, '').slice(0, 8) : '';
  const row = [nama, max, code, guestLink_(code, nama, tipe), tipe, clean_(d.wa, 30), 'Belum', 0, 'Belum', '', 0, clean_(d.catatan, 200)];
  tamuSheet_().appendRow(row);
  return out_({ ok: true, guest: { nama: nama, max: max, kode: code, link: row[3], tipe: tipe } });
}
