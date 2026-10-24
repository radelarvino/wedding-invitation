/* =====================================================================
   DASHBOARD TAMU — front-end untuk Web App Apps Script
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const CONFIG = window.WEDDING_CONFIG || {};
const API = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(CONFIG.SCRIPT_URL || "") ? CONFIG.SCRIPT_URL : "";

const state = {
  pin: sessionStorage.getItem("wedding_admin_pin") || "",
  guests: [],
  attendance: [],
  wishes: [],
  stats: {},
  demo: false,
  filter: "all",
  q: "",
  attendanceQ: ""
};

/* ---------- demo ---------- */
const demoLink = (k, n) => {
  const base = new URL("index.html", location.href).href;
  return k ? base + "?k=" + encodeURIComponent(k) : base + "?to=" + encodeURIComponent(n);
};
const demoGuests = [
  { row: 2, nama: "Budi Santoso", max: 3, kode: "DEMO123", tipe: "Prioritas", wa: "6281234567890", konfirmasi: "Hadir", jumlahKonfirmasi: 3, checkin: "Hadir", waktuCheckin: "2026-12-13T08:42:00+07:00", jumlahHadir: 3, catatan: "" },
  { row: 3, nama: "Keluarga Hartono", max: 4, kode: "HRT889", tipe: "Prioritas", wa: "6281298765432", konfirmasi: "Hadir", jumlahKonfirmasi: 4, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0, catatan: "" },
  { row: 4, nama: "Siti Aminah", max: 2, kode: "STA220", tipe: "Prioritas", wa: "", konfirmasi: "Tidak dapat hadir", jumlahKonfirmasi: 0, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0, catatan: "" },
  { row: 5, nama: "Rizky Pratama", max: 2, kode: "RZK551", tipe: "Prioritas", wa: "6281355566677", konfirmasi: "Hadir", jumlahKonfirmasi: 2, checkin: "Hadir", waktuCheckin: "2026-12-13T09:15:00+07:00", jumlahHadir: 2, catatan: "" },
  { row: 6, nama: "Nadia Safitri", max: 1, kode: "NAD771", tipe: "Prioritas", wa: "6281199911122", konfirmasi: "Belum", jumlahKonfirmasi: 0, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0, catatan: "" },
  { row: 7, nama: "Keluarga Wijaya", max: 4, kode: "WJY332", tipe: "Prioritas", wa: "", konfirmasi: "Belum", jumlahKonfirmasi: 0, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0, catatan: "" },
  { row: 8, nama: "Alya Putri", max: 1, kode: "", tipe: "Umum", wa: "", konfirmasi: "Belum", jumlahKonfirmasi: 0, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0, catatan: "" },
  { row: 9, nama: "Fajar Nugroho", max: 1, kode: "", tipe: "Umum", wa: "", konfirmasi: "Hadir", jumlahKonfirmasi: 1, checkin: "Hadir", waktuCheckin: "2026-12-13T10:02:00+07:00", jumlahHadir: 1, catatan: "" }
].map(g => ({ ...g, link: demoLink(g.kode, g.nama) }));

const demoAttendance = [
  { waktu: "2026-12-13T10:02:00+07:00", nama: "Fajar Nugroho", kode: "", jumlah: 1, tipe: "Umum", catatan: "" },
  { waktu: "2026-12-13T09:15:00+07:00", nama: "Rizky Pratama", kode: "RZK551", jumlah: 2, tipe: "Prioritas", catatan: "" },
  { waktu: "2026-12-13T08:42:00+07:00", nama: "Budi Santoso", kode: "DEMO123", jumlah: 3, tipe: "Prioritas", catatan: "" }
];
const demoWishes = [
  { nama: "Fajar Nugroho", hadir: "Hadir", ucapan: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fii khair.", waktu: "2026-12-01T20:10:00+07:00" },
  { nama: "Keluarga Hartono", hadir: "Hadir", ucapan: "Selamat menempuh hidup baru. Semoga sakinah, mawaddah, warahmah.", waktu: "2026-11-30T13:22:00+07:00" },
  { nama: "Siti Aminah", hadir: "Tidak dapat hadir", ucapan: "Mohon maaf belum bisa hadir. Semoga hari bahagianya penuh berkah.", waktu: "2026-11-28T09:05:00+07:00" },
  { nama: "Rizky Pratama", hadir: "Hadir", ucapan: "Congrats Ramiz & Denayu! Sampai jumpa di hari H.", waktu: "2026-11-27T18:45:00+07:00" }
];

/* ---------- util ---------- */
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 3000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (_) { return false; }
  }
}
function fmtTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(d);
}
function fmtNum(n) { return (+n || 0).toLocaleString("id-ID"); }
function waHref(g) {
  const link = g.link || "";
  const msg = `Assalamu'alaikum ${g.nama}, kami mengundang Anda untuk hadir di pernikahan Ramiz & Denayu. Berikut tautan undangannya: ${link}`;
  let n = String(g.wa || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
function deriveStats() {
  const g = state.guests;
  const att = state.attendance;
  const confirmed = g.filter(x => x.konfirmasi === "Hadir");
  const no = g.filter(x => x.konfirmasi === "Tidak dapat hadir");
  return {
    terdaftar: g.length,
    prioritas: g.filter(x => String(x.tipe).toLowerCase() !== "umum").length,
    kapasitas: g.reduce((a, x) => a + (+x.max || 1), 0),
    konfirmasiHadir: confirmed.length,
    konfirmasiOrang: confirmed.reduce((a, x) => a + (+x.jumlahKonfirmasi || +x.max || 1), 0),
    konfirmasiTidak: no.length,
    checkin: att.length,
    totalHadir: att.reduce((a, x) => a + (+x.jumlah || 1), 0),
    ucapan: state.wishes.length
  };
}

/* ---------- API ---------- */
async function apiGet(type, pin = state.pin) {
  const url = new URL(API);
  url.search = new URLSearchParams({ action: "admin", pin, type });
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json();
  if (!json || json.ok === false) throw new Error((json && json.error) || "Permintaan gagal.");
  return json.data;
}
async function apiPost(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, pin: state.pin })
  });
  const json = await res.json();
  if (!json || json.ok === false) throw new Error((json && json.error) || "Data gagal disimpan.");
  return json;
}
async function loadAll(silent) {
  if (state.demo) {
    state.stats = deriveStats();
    renderAll();
    return;
  }
  if (!silent) setBusy(true);
  try {
    const [stats, guests, attendance, wishes] = await Promise.all([
      apiGet("stats"), apiGet("guests"), apiGet("attendance"), apiGet("wishes")
    ]);
    state.stats = stats || deriveStats();
    state.guests = guests || [];
    state.attendance = attendance || [];
    state.wishes = wishes || [];
    renderAll();
  } catch (err) {
    toast(err.message || "Gagal memuat data.");
    if (/PIN/i.test(err.message || "")) logout();
  } finally {
    if (!silent) setBusy(false);
  }
}
function setBusy(on) {
  $("#refreshBtn").disabled = on;
  $("#refreshBtn").classList.toggle("loading", on);
  $("#refreshBtn").innerHTML = on ? `${ic("refresh")} Memuat…` : `${ic("refresh")} Muat ulang`;
}

/* ---------- login ---------- */
async function login(pin, silent) {
  const btn = $("#gateBtn");
  const msg = $("#gateMsg");
  if (!API) return;
  btn.disabled = true;
  btn.textContent = "Memeriksa…";
  msg.textContent = "";
  try {
    const stats = await apiGet("stats", pin);
    state.pin = pin;
    state.stats = stats || {};
    sessionStorage.setItem("wedding_admin_pin", pin);
    btn.disabled = false;
    btn.textContent = "Masuk dashboard";
    await enterApp();
  } catch (err) {
    state.pin = "";
    sessionStorage.removeItem("wedding_admin_pin");
    msg.textContent = /PIN/i.test(err.message || "") ? "PIN tidak sesuai. Silakan coba lagi." : (err.message || "Tidak dapat terhubung ke Spreadsheet.");
    btn.disabled = false;
    btn.textContent = "Masuk dashboard";
    if (silent) $("#pin").focus();
  }
}
async function enterApp() {
  $("#gate").hidden = true;
  $("#app").hidden = false;
  $("#logoutBtn").hidden = false;
  $("#modeBadge").hidden = !state.demo;
  $("#modeBadge").textContent = "Mode demo — data tidak tersimpan";
  await loadAll();
  renderAll();
}
function logout() {
  sessionStorage.removeItem("wedding_admin_pin");
  state.pin = "";
  state.demo = false;
  $("#app").hidden = true;
  $("#gate").hidden = false;
  $("#logoutBtn").hidden = true;
  $("#modeBadge").hidden = true;
  $("#gateForm").hidden = false;
  $("#demoBox").hidden = !!API;
  $("#pin").value = "";
  $("#pin").focus();
  window.scrollTo(0, 0);
}
function enterDemo() {
  state.demo = true;
  state.guests = demoGuests.map(g => ({ ...g }));
  state.attendance = demoAttendance.map(a => ({ ...a }));
  state.wishes = demoWishes.map(w => ({ ...w }));
  state.stats = deriveStats();
  enterApp();
  toast("Mode demo aktif. Data hanya tersimpan selama halaman terbuka.");
}

/* ---------- render ---------- */
function renderAll() {
  renderStats();
  renderProgress();
  renderStatusSummary();
  renderRecent();
  renderGuests();
  renderAttendance();
  renderWishes();
}

function renderStats() {
  const s = state.stats;
  const cards = [
    { icon: "users", label: "Tamu terdaftar", value: fmtNum(s.terdaftar), sub: `${fmtNum(s.prioritas)} prioritas · ${fmtNum(s.terdaftar - s.prioritas)} umum` },
    { icon: "heart", label: "Konfirmasi hadir", value: fmtNum(s.konfirmasiHadir), sub: `${fmtNum(s.konfirmasiOrang)} orang diperkirakan hadir` },
    { icon: "user-check", label: "Sudah check-in", value: fmtNum(s.checkin), sub: `${fmtNum(s.totalHadir)} orang tercatat hadir` },
    { icon: "message", label: "Ucapan masuk", value: fmtNum(s.ucapan), sub: `${fmtNum(s.konfirmasiTidak)} tamu berhalangan` }
  ];
  $("#stats").innerHTML = cards.map((c, i) => `<article class="stat-card" style="--i:${i}">
    <span class="stat-icon">${ic(c.icon)}</span>
    <span class="stat-label">${c.label}</span>
    <strong class="stat-value">${c.value}</strong>
    <span class="stat-sub">${c.sub}</span>
  </article>`).join("");
}
function renderProgress() {
  const s = state.stats;
  const capacity = Math.max(1, +s.kapasitas || 0);
  const pct = Math.min(100, Math.round((+s.totalHadir || 0) / capacity * 100));
  $("#progressFill").style.width = pct + "%";
  $("#progressLabel").textContent = pct + "%";
  $("#progressNote").textContent = `${fmtNum(s.totalHadir)} dari ${fmtNum(s.kapasitas)} kapasitas orang sudah tercatat hadir. ${fmtNum(s.checkin)} buku tamu terisi.`;
}
function renderStatusSummary() {
  const total = Math.max(1, state.guests.length);
  const hadir = state.guests.filter(g => g.konfirmasi === "Hadir").length;
  const tidak = state.guests.filter(g => g.konfirmasi === "Tidak dapat hadir").length;
  const belum = Math.max(0, state.guests.length - hadir - tidak);
  const rows = [
    { label: "Hadir", value: hadir, color: "var(--moss)" },
    { label: "Belum konfirmasi", value: belum, color: "var(--gold)" },
    { label: "Tidak dapat hadir", value: tidak, color: "var(--blush)" }
  ];
  $("#statusSummary").innerHTML = rows.map(r => `<div class="status-row">
    <div class="status-row-top"><span><i style="background:${r.color}"></i>${r.label}</span><b>${fmtNum(r.value)}</b></div>
    <div class="mini-bar"><i style="width:${Math.round(r.value / total * 100)}%;background:${r.color}"></i></div>
  </div>`).join("");
}
function renderRecent() {
  const list = state.attendance.slice(0, 5);
  $("#recentAttendance").innerHTML = list.length ? list.map(a => `<div class="tl-row">
    <span class="tl-dot"></span>
    <div class="tl-main"><b>${esc(a.nama)}</b><small>${fmtTime(a.waktu)} · ${esc(a.tipe || "Tamu")}</small></div>
    <span class="count-badge">${fmtNum(a.jumlah)} orang</span>
  </div>`).join("") : `<div class="empty"><span>${ic("user-check")}</span><p>Belum ada check-in. Kehadiran yang dicatat akan muncul di sini.</p></div>`;
}
function renderGuests() {
  const q = state.q.toLowerCase();
  let list = state.guests.filter(g => {
    const f = state.filter;
    if (f === "priority" && String(g.tipe).toLowerCase() === "umum") return false;
    if (f === "general" && String(g.tipe).toLowerCase() !== "umum") return false;
    if (f === "checked" && g.checkin !== "Hadir") return false;
    if (f === "pending" && g.checkin === "Hadir") return false;
    if (!q) return true;
    return [g.nama, g.kode, g.wa].some(v => String(v || "").toLowerCase().includes(q));
  });
  $("#guestCount").textContent = `${fmtNum(list.length)} dari ${fmtNum(state.guests.length)} tamu ditampilkan`;
  if (!list.length) {
    $("#guestList").innerHTML = `<div class="empty wide"><span>${ic("search")}</span><p>Tidak ada tamu yang cocok dengan pencarian atau filter ini.</p></div>`;
    return;
  }
  $("#guestList").innerHTML = list.map(g => {
    const checked = g.checkin === "Hadir";
    const confirmClass = g.konfirmasi === "Hadir" ? "ok" : g.konfirmasi === "Tidak dapat hadir" ? "no" : "wait";
    const confirmLabel = g.konfirmasi === "Hadir" ? "Hadir" : g.konfirmasi === "Tidak dapat hadir" ? "Berhalangan" : "Belum konfirmasi";
    const countLabel = checked ? "Hadir" : "Jumlah";
    const countValue = checked ? (g.jumlahHadir ? fmtNum(g.jumlahHadir) + " orang" : "—") : (g.jumlahKonfirmasi ? fmtNum(g.jumlahKonfirmasi) + " orang" : "—");
    return `<article class="guest-card${checked ? " is-checked" : ""}" data-row="${g.row}">
      <div class="guest-top">
        <span class="guest-avatar">${esc((g.nama || "?").charAt(0).toUpperCase())}</span>
        <div class="guest-id">
          <b>${esc(g.nama)}</b>
          <small>${esc(g.tipe || "Prioritas")} · maks. ${fmtNum(g.max)} orang${g.kode ? ` · <span class="code">${esc(g.kode)}</span>` : ""}</small>
        </div>
        <span class="pill ${checked ? "ok" : "wait"}">${checked ? "Sudah hadir" : "Belum hadir"}</span>
      </div>
      <div class="guest-meta">
        <div><small>Konfirmasi</small><span class="pill ${confirmClass}">${confirmLabel}</span></div>
        <div><small>${countLabel}</small><span>${countValue}</span></div>
        <div><small>Check-in</small><span>${g.waktuCheckin ? fmtTime(g.waktuCheckin) : "—"}</span></div>
      </div>
      <div class="guest-actions">
        <button class="btn btn-sm${checked ? " btn-ghost" : ""}" type="button" data-check="${g.row}">${ic("check")} ${checked ? "Ubah hadir" : "Tandai hadir"}</button>
        <button class="icon-btn" type="button" data-copy="${g.row}" aria-label="Salin link undangan" title="Salin link">${ic("copy")}</button>
        <a class="icon-btn" href="${esc(waHref(g))}" target="_blank" rel="noopener" aria-label="Kirim WhatsApp" title="Kirim WhatsApp">${ic("wa")}</a>
      </div>
    </article>`;
  }).join("");
}
function renderAttendance() {
  const q = state.attendanceQ.toLowerCase();
  const list = state.attendance.filter(a => !q || [a.nama, a.kode, a.tipe].some(v => String(v || "").toLowerCase().includes(q)));
  if (!list.length) {
    $("#attendanceList").innerHTML = `<div class="empty wide"><span>${ic("clock")}</span><p>${state.attendance.length ? "Tidak ada data yang cocok." : "Belum ada tamu yang check-in."}</p></div>`;
    return;
  }
  $("#attendanceList").innerHTML = list.map(a => `<div class="log-row">
    <span class="log-icon">${ic("user-check")}</span>
    <div class="log-main"><b>${esc(a.nama)}</b><small>${fmtTime(a.waktu)}${a.kode ? " · " + esc(a.kode) : ""}${a.catatan ? " · " + esc(a.catatan) : ""}</small></div>
    <div class="log-side"><span class="pill ok">${fmtNum(a.jumlah)} orang</span><small>${esc(a.tipe || "Tamu")}</small></div>
  </div>`).join("");
}
function renderWishes() {
  if (!state.wishes.length) {
    $("#wishList").innerHTML = `<div class="empty wide"><span>${ic("message")}</span><p>Belum ada ucapan yang masuk.</p></div>`;
    return;
  }
  $("#wishList").innerHTML = state.wishes.map(w => `<article class="wish-card">
    <div class="wish-head">
      <span class="guest-avatar small">${esc((w.nama || "?").charAt(0).toUpperCase())}</span>
      <div><b>${esc(w.nama)}</b><small>${fmtTime(w.waktu)}</small></div>
      ${w.hadir === "Hadir" ? `<span class="pill ok">Hadir</span>` : ""}
    </div>
    <p>${esc(w.ucapan)}</p>
  </article>`).join("");
}

/* ---------- interaksi daftar ---------- */
function findGuestByRow(row) {
  return state.guests.find(g => String(g.row) === String(row));
}

$("#guestList").addEventListener("click", async e => {
  const check = e.target.closest("[data-check]");
  if (check) {
    const g = findGuestByRow(check.dataset.check);
    if (g) openCheckin(g);
    return;
  }
  const copy = e.target.closest("[data-copy]");
  if (copy) {
    const g = findGuestByRow(copy.dataset.copy);
    if (!g) return;
    if (!g.link) return toast("Link belum dibuat. Jalankan menu Undangan → Buat / perbarui link tamu.");
    const ok = await copyText(g.link);
    toast(ok ? "Link undangan tersalin" : "Gagal menyalin link");
  }
});

$("#guestSearch").addEventListener("input", e => { state.q = e.target.value; renderGuests(); });
$("#attendanceSearch").addEventListener("input", e => { state.attendanceQ = e.target.value; renderAttendance(); });
$("#guestFilters").addEventListener("click", e => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  $$("#guestFilters .chip").forEach(c => c.classList.toggle("on", c === chip));
  renderGuests();
});

/* ---------- tabs ---------- */
function openTab(name) {
  $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.tab === name));
  $$(".panel").forEach(p => p.classList.toggle("on", p.id === "panel-" + name));
}
$$(".tab").forEach(t => t.addEventListener("click", () => openTab(t.dataset.tab)));
document.addEventListener("click", e => {
  const go = e.target.closest("[data-goto]");
  if (go) openTab(go.dataset.goto);
});

/* ---------- modal ---------- */
const modal = $("#modal");
function closeModal() { modal.close(); }
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
modal.addEventListener("close", () => { $("#modalCard").innerHTML = ""; });

function openCheckin(g) {
  const isEdit = !!g && g.checkin === "Hadir";
  $("#modalCard").innerHTML = `
    <button class="modal-close" type="button" data-close aria-label="Tutup">${ic("x")}</button>
    <p class="eyebrow">${isEdit ? "Perbarui kehadiran" : "Check-in tamu"}</p>
    <h2>${g ? esc(g.nama) : "Tamu baru"}</h2>
    <p class="modal-sub">${g ? `${esc(g.tipe)} · kapasitas ${fmtNum(g.max)} orang` : "Catat tamu yang datang tanpa berada di daftar prioritas."}</p>
    <form id="checkinForm" class="modal-form">
      ${g ? "" : `<hr class="form-divider">
      <div class="field"><label for="ciName">Nama tamu</label><input id="ciName" name="nama" required maxlength="60" placeholder="Nama lengkap"></div>`}
      <div class="row">
        <div class="field"><label for="ciCount">Jumlah orang</label><input id="ciCount" name="jumlah" type="number" min="1" max="30" value="${g ? Math.max(1, isEdit ? (g.jumlahHadir || 1) : (g.jumlahKonfirmasi || g.max || 1)) : 1}" required></div>
        <div class="field"><label for="ciNote">Catatan</label><input id="ciNote" name="catatan" maxlength="60" placeholder="Opsional" value="${g ? esc(g.catatan || "") : ""}"></div>
      </div>
      ${g ? `<div class="modal-info"><span>Konfirmasi: <b>${esc(g.konfirmasi || "Belum")}</b></span><span>Kode: <b>${esc(g.kode || "—")}</b></span></div>` : ""}
      <button class="btn" type="submit" id="ciSubmit">${ic("check")} ${isEdit ? "Simpan perubahan" : "Simpan kehadiran"}</button>
      <p class="form-msg" id="ciMsg" role="status"></p>
    </form>`;
  modal.showModal();
  const input = $("#ciName");
  if (input) input.focus(); else $("#ciCount").focus();

  $("#checkinForm").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = $("#ciSubmit");
    const jumlah = Math.max(1, Math.min(30, +form.jumlah.value || 1));
    const nama = g ? g.nama : (form.nama ? form.nama.value.trim() : "");
    if (!nama) return;
    btn.disabled = true;
    btn.innerHTML = "Menyimpan…";
    try {
      if (state.demo) {
        demoCheckin(g, nama, jumlah, form.catatan.value.trim());
        state.stats = deriveStats();
        renderAll();
        closeModal();
        toast(`${nama} berhasil dicatat hadir.`);
      } else {
        await apiPost({ action: "checkin", kode: g ? g.kode : "", nama, jumlah, catatan: form.catatan.value.trim() });
        closeModal();
        toast(`${nama} berhasil dicatat hadir.`);
        await loadAll();
      }
    } catch (err) {
      $("#ciMsg").textContent = err.message || "Gagal menyimpan. Coba lagi.";
      btn.disabled = false;
      btn.innerHTML = `${ic("check")} ${isEdit ? "Simpan perubahan" : "Simpan kehadiran"}`;
    }
  });
}

function demoCheckin(g, nama, jumlah, catatan) {
  if (g) {
    g.checkin = "Hadir";
    g.waktuCheckin = new Date().toISOString();
    g.jumlahHadir = jumlah;
    if (catatan) g.catatan = catatan;
  }
  const key = g ? (g.kode || g.nama) : nama;
  const found = state.attendance.find(a => (a.kode || a.nama) === key);
  const rec = { waktu: new Date().toISOString(), nama, kode: g ? g.kode : "", jumlah, tipe: g ? g.tipe : "Tamu tambahan", catatan };
  if (found) Object.assign(found, rec);
  else state.attendance.unshift(rec);
}

function openAddGuest() {
  $("#modalCard").innerHTML = `
    <button class="modal-close" type="button" data-close aria-label="Tutup">${ic("x")}</button>
    <p class="eyebrow">Tamu baru</p>
    <h2>Tambah tamu</h2>
    <p class="modal-sub">Tamu prioritas akan mendapat kode unik dan link undangan personal.</p>
    <form id="addGuestForm" class="modal-form">
      <div class="field"><label for="agName">Nama tamu / keluarga</label><input id="agName" name="nama" required maxlength="80" placeholder="cth. Keluarga Hartono"></div>
      <div class="row">
        <div class="field"><label for="agMax">Kapasitas</label><input id="agMax" name="max" type="number" min="1" max="20" value="2" required></div>
        <div class="field"><label for="agType">Tipe</label><select id="agType" name="tipe"><option value="prioritas">Prioritas</option><option value="umum">Umum</option></select></div>
      </div>
      <div class="field"><label for="agWa">Nomor WhatsApp <small>(opsional)</small></label><input id="agWa" name="wa" inputmode="tel" maxlength="20" placeholder="08xxxxxxxxxx"></div>
      <div class="field"><label for="agNote">Catatan <small>(opsional)</small></label><input id="agNote" name="catatan" maxlength="80" placeholder="cth. teman kantor"></div>
      <button class="btn" type="submit" id="agSubmit">${ic("plus")} Simpan tamu</button>
      <p class="form-msg" id="agMsg" role="status"></p>
    </form>`;
  modal.showModal();
  $("#agName").focus();
  $("#addGuestForm").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = $("#agSubmit");
    const data = {
      nama: form.nama.value.trim(),
      max: Math.max(1, Math.min(20, +form.max.value || 1)),
      tipe: form.tipe.value,
      wa: form.wa.value.trim(),
      catatan: form.catatan.value.trim()
    };
    if (!data.nama) return;
    btn.disabled = true;
    btn.innerHTML = "Menyimpan…";
    try {
      if (state.demo) {
        const row = Math.max(0, ...state.guests.map(g => +g.row || 0)) + 1;
        const kode = data.tipe === "prioritas" ? Math.random().toString(36).slice(2, 8).toUpperCase() : "";
        state.guests.push({
          row, nama: data.nama, max: data.max, kode, tipe: data.tipe === "prioritas" ? "Prioritas" : "Umum",
          wa: data.wa, konfirmasi: "Belum", jumlahKonfirmasi: 0, checkin: "Belum", waktuCheckin: "", jumlahHadir: 0,
          catatan: data.catatan, link: demoLink(kode, data.nama)
        });
        state.stats = deriveStats();
        renderAll();
        closeModal();
        toast("Tamu ditambahkan (mode demo).");
      } else {
        const result = await apiPost({ action: "addguest", ...data });
        closeModal();
        toast(`${result.guest ? result.guest.nama : data.nama} ditambahkan.`);
        await loadAll();
      }
    } catch (err) {
      $("#agMsg").textContent = err.message || "Gagal menambah tamu.";
      btn.disabled = false;
      btn.innerHTML = `${ic("plus")} Simpan tamu`;
    }
  });
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-close]")) closeModal();
});

/* ---------- tombol global ---------- */
$("#addGuestBtn").onclick = openAddGuest;
$("#walkinBtn").onclick = () => openCheckin(null);
$("#refreshBtn").onclick = async () => {
  if (state.demo) { state.stats = deriveStats(); renderAll(); toast("Data demo dimuat ulang."); return; }
  await loadAll();
  toast("Data terbaru dimuat.");
};
$("#logoutBtn").onclick = logout;

/* ---------- mulai ---------- */
$("#gateForm").addEventListener("submit", e => {
  e.preventDefault();
  const pin = $("#pin").value.trim();
  if (pin) login(pin, false);
});
$("#demoBtn").onclick = enterDemo;

(async () => {
  if (!API) {
    $("#gateForm").hidden = true;
    $("#demoBox").hidden = false;
    $("#modeBadge").hidden = true;
    return;
  }
  if (state.pin) {
    $("#pin").value = state.pin;
    await login(state.pin, true);
  }
})();
