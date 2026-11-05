/* =====================================================================
   DASHBOARD TAMU — front-end untuk Web App Apps Script
   ===================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const CONFIG = window.WEDDING_CONFIG || {};
const API = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(CONFIG.SCRIPT_URL || "") ? CONFIG.SCRIPT_URL : "";

const SESSION_KEY = "wedding_admin_session";
const state = {
  token: "",
  username: "",
  name: "",
  role: "",
  guests: [],
  attendance: [],
  wishes: [],
  accounts: [],
  stats: {},
  demo: false,
  filter: "all",
  q: "",
  attendanceQ: ""
};
const isAdmin = () => state.role === "admin";
const isAuthError = err => /sesi|token|silakan masuk|login/i.test((err && err.message) || "");

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
const demoAccounts = [
  { username: "moderator1", nama: "Sari Kusuma", role: "moderator", status: "Aktif", dibuat: "2026-11-20T10:00:00+07:00", terakhir: "2026-12-13T07:45:00+07:00" },
  { username: "moderator2", nama: "Dian Pratama", role: "moderator", status: "Nonaktif", dibuat: "2026-11-21T09:30:00+07:00", terakhir: "" }
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
async function readJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch (_) { throw new Error("Respons server tidak valid. Periksa URL Apps Script."); }
}
async function apiLogin(username, password) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "login", username, password })
  });
  const json = await readJson(res);
  if (!json || json.ok === false) throw new Error((json && json.error) || "Tidak dapat masuk.");
  return json.data || {};
}
async function apiGet(type) {
  const url = new URL(API);
  url.search = new URLSearchParams({ action: "admin", token: state.token, type });
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await readJson(res);
  if (!json || json.ok === false) throw new Error((json && json.error) || "Permintaan gagal.");
  return json.data;
}
async function apiPost(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, token: state.token })
  });
  const json = await readJson(res);
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
    const requests = [
      apiGet("stats"), apiGet("guests"), apiGet("attendance"), apiGet("wishes")
    ];
    if (isAdmin()) requests.push(apiGet("accounts"));
    const [stats, guests, attendance, wishes, accounts] = await Promise.all(requests);
    state.stats = stats || deriveStats();
    state.guests = guests || [];
    state.attendance = attendance || [];
    state.wishes = wishes || [];
    state.accounts = accounts || [];
    renderAll();
  } catch (err) {
    toast(err.message || "Gagal memuat data.");
    if (isAuthError(err)) logout(true);
  } finally {
    if (!silent) setBusy(false);
  }
}
function setBusy(on) {
  $("#refreshBtn").disabled = on;
  $("#refreshBtn").classList.toggle("loading", on);
  $("#refreshBtn").innerHTML = on ? `${ic("refresh")} Memuat…` : `${ic("refresh")} Muat ulang`;
}

/* ---------- login & sesi ---------- */
function readSession() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return raw && raw.token ? raw : null;
  } catch (_) { return null; }
}
function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    token: state.token, username: state.username, name: state.name, role: state.role
  }));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
function applyRoleUI() {
  const admin = isAdmin();
  document.body.dataset.role = state.role || "";
  $("#roleBadge").hidden = !state.role;
  $("#roleBadge").textContent = admin ? "Administrator" : "Moderator";
  $("#userChip").hidden = !state.role;
  $("#userName").textContent = state.name || "Panitia";
  $("#userRole").textContent = admin ? "Administrator" : "Moderator";
  $("#userAvatar").textContent = (state.name || (admin ? "A" : "M")).charAt(0).toUpperCase();
  $("#welcomeName").textContent = state.name || (admin ? "Admin" : "Moderator");
  $("#pageSub").textContent = admin
    ? "Pantau tamu, konfirmasi, kehadiran, dan kelola akses panitia dari satu tempat."
    : "Pantau tamu, konfirmasi, dan catat kehadiran. Hubungi administrator untuk perubahan data tamu.";
  $$("[data-admin-only]").forEach(el => { el.hidden = !admin; });
  $$(".tab").forEach(t => { if (t.dataset.tab === "accounts") t.hidden = !admin; });
  if (!admin && $("#panel-accounts").classList.contains("on")) openTab("overview");
}
async function login(username, password) {
  const btn = $("#gateBtn");
  const msg = $("#gateMsg");
  btn.disabled = true;
  btn.textContent = "Memeriksa…";
  msg.textContent = "";
  if (!API) {
    const user = String(username).trim().toLowerCase();
    if (user === "admin" && password === "admin") { enterDemo("admin"); return; }
    if (user === "moderator" && password === "moderator") { enterDemo("moderator"); return; }
    msg.textContent = "Mode demo: gunakan admin / admin atau moderator / moderator.";
    btn.disabled = false;
    btn.textContent = "Masuk dashboard";
    $("#loginPass").focus();
    return;
  }
  try {
    const data = await apiLogin(username, password);
    const user = data.user || {};
    state.token = data.token || "";
    state.username = user.username || username;
    state.name = user.name || username;
    state.role = user.role === "admin" ? "admin" : "moderator";
    state.demo = false;
    saveSession();
    await enterApp();
  } catch (err) {
    state.token = "";
    clearSession();
    msg.textContent = err.message || "Tidak dapat terhubung ke Spreadsheet.";
    btn.disabled = false;
    btn.textContent = "Masuk dashboard";
    $("#loginPass").focus();
  }
}
async function enterApp() {
  $("#gate").hidden = true;
  $("#app").hidden = false;
  $("#logoutBtn").hidden = false;
  $("#modeBadge").hidden = !state.demo;
  $("#modeBadge").textContent = "Mode demo — data tidak tersimpan";
  applyRoleUI();
  openTab("overview");
  await loadAll();
}
function logout(expired) {
  if (!state.demo && state.token && API) {
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "logout", token: state.token })
    }).catch(() => {});
  }
  clearSession();
  state.token = "";
  state.username = "";
  state.name = "";
  state.role = "";
  state.demo = false;
  state.accounts = [];
  $("#app").hidden = true;
  $("#gate").hidden = false;
  $("#logoutBtn").hidden = true;
  $("#roleBadge").hidden = true;
  $("#userChip").hidden = true;
  $("#modeBadge").hidden = true;
  $("#gateForm").hidden = false;
  $("#demoBox").hidden = !!API;
  $("#loginPass").value = "";
  $("#gateMsg").textContent = expired ? "Sesi berakhir. Silakan masuk kembali." : "";
  $("#loginUser").focus();
  window.scrollTo(0, 0);
}
function enterDemo(role) {
  $("#gateBtn").disabled = false;
  $("#gateBtn").textContent = "Masuk dashboard";
  $("#gateMsg").textContent = "";
  state.demo = true;
  state.token = "";
  state.username = role === "admin" ? "demo-admin" : "demo-moderator";
  state.name = role === "admin" ? "Admin Demo" : "Moderator Demo";
  state.role = role === "admin" ? "admin" : "moderator";
  state.guests = demoGuests.map(g => ({ ...g }));
  state.attendance = demoAttendance.map(a => ({ ...a }));
  state.wishes = demoWishes.map(w => ({ ...w }));
  state.accounts = role === "admin" ? demoAccounts.map(a => ({ ...a })) : [];
  state.stats = deriveStats();
  enterApp();
  toast(`Mode demo ${role === "admin" ? "admin" : "moderator"} aktif. Data hanya tersimpan selama halaman terbuka.`);
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
  if (isAdmin()) renderAccounts();
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
function renderAccounts() {
  const list = state.accounts || [];
  const rows = list.some(a => a.role === "admin")
    ? list
    : [{ username: state.username || "admin", nama: state.name || "Administrator", role: "admin", status: "Aktif", primary: true, terakhir: "" }, ...list];
  const moderators = rows.filter(a => a.role !== "admin");
  const active = moderators.filter(a => a.status === "Aktif").length;
  $("#accountCount").textContent = `${fmtNum(moderators.length)} akun moderator · ${fmtNum(active)} aktif`;
  $("#accountList").innerHTML = rows.map(a => {
    const primary = a.role === "admin" || a.primary;
    const active = a.status !== "Nonaktif";
    const last = a.terakhir ? `Terakhir masuk ${fmtTime(a.terakhir)}` : "Belum pernah masuk";
    return `<article class="account-card">
      <div class="account-info">
        <span class="account-avatar">${esc((a.nama || a.username || "?").charAt(0).toUpperCase())}</span>
        <div class="account-copy">
          <b>${esc(a.nama || a.username)}</b>
          <small>@${esc(a.username)} · ${primary ? "Administrator" : "Moderator"}</small>
        </div>
        <span class="account-badge ${primary ? "primary" : active ? "on" : ""}">${primary ? "Admin utama" : active ? "Aktif" : "Nonaktif"}</span>
      </div>
      <p class="account-note">${primary ? "Akun utama diatur melalui ADMIN_USERNAME dan ADMIN_PASSWORD di Code.gs." : esc(last)}</p>
      ${primary ? "" : `<div class="account-actions">
        <button class="btn btn-sm btn-ghost" type="button" data-account-reset="${esc(a.username)}">${ic("key")} Reset password</button>
        <button class="btn btn-sm btn-ghost" type="button" data-account-toggle="${esc(a.username)}" data-status="${active ? "Aktif" : "Nonaktif"}">${ic(active ? "x" : "check")} ${active ? "Nonaktifkan" : "Aktifkan"}</button>
        <button class="icon-btn" type="button" data-account-delete="${esc(a.username)}" aria-label="Hapus akun ${esc(a.username)}" title="Hapus akun">${ic("trash")}</button>
      </div>`}
    </article>`;
  }).join("");
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
  if (name === "accounts" && !isAdmin()) return;
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

/* ---------- kelola akun moderator ---------- */
function findAccount(username) {
  return state.accounts.find(a => String(a.username).toLowerCase() === String(username).toLowerCase());
}
function confirmAction(title, text, yesLabel) {
  return new Promise(resolve => {
    let done = false;
    const finish = value => {
      if (done) return;
      done = true;
      resolve(value);
      modal.close();
    };
    $("#modalCard").innerHTML = `
      <button class="modal-close" type="button" data-close aria-label="Tutup">${ic("x")}</button>
      <p class="eyebrow">Konfirmasi</p>
      <h2>${esc(title)}</h2>
      <p class="modal-sub">${esc(text)}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" id="confirmNo">Batal</button>
        <button class="btn" type="button" id="confirmYes">${esc(yesLabel || "Lanjutkan")}</button>
      </div>`;
    modal.showModal();
    $("#confirmNo").onclick = () => finish(false);
    $("#confirmYes").onclick = () => finish(true);
    modal.addEventListener("close", () => finish(false), { once: true });
  });
}
function openAccountForm(account) {
  const reset = !!account;
  $("#modalCard").innerHTML = `
    <button class="modal-close" type="button" data-close aria-label="Tutup">${ic("x")}</button>
    <p class="eyebrow">Hak akses</p>
    <h2>${reset ? "Reset password" : "Buat akun moderator"}</h2>
    <p class="modal-sub">${reset ? "Buat password baru untuk akun moderator ini." : "Akun moderator dapat melihat data tamu dan mencatat kehadiran, tetapi tidak dapat menambah tamu atau mengelola akun."}</p>
    <form id="accountForm" class="modal-form">
      ${reset ? `<div class="modal-info"><span>Akun: <b>@${esc(account.username)}</b></span><span>Nama: <b>${esc(account.nama)}</b></span></div>` : `
        <div class="field"><label for="acName">Nama moderator</label><input id="acName" name="nama" maxlength="60" placeholder="cth. Sari Kusuma" required></div>
        <div class="field"><label for="acUser">Username</label><input id="acUser" name="username" maxlength="24" autocapitalize="none" spellcheck="false" placeholder="cth. sari.kusuma" required></div>`}
      <div class="field"><label for="acPass">${reset ? "Password baru" : "Password"}</label><input id="acPass" name="password" type="password" minlength="6" maxlength="64" autocomplete="new-password" placeholder="Minimal 6 karakter" required></div>
      <div class="field"><label for="acPass2">Ulangi password</label><input id="acPass2" name="password2" type="password" minlength="6" maxlength="64" autocomplete="new-password" placeholder="Ketik ulang password" required></div>
      <button class="btn" type="submit" id="acSubmit">${ic(reset ? "key" : "user-plus")} ${reset ? "Simpan password" : "Buat akun"}</button>
      <p class="form-msg" id="acMsg" role="status"></p>
    </form>`;
  modal.showModal();
  ($("#acName") || $("#acPass")).focus();
  $("#accountForm").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = $("#acSubmit");
    const msg = $("#acMsg");
    const username = reset ? account.username : form.username.value.trim().toLowerCase();
    const nama = reset ? account.nama : form.nama.value.trim();
    const password = form.password.value;
    if (!reset && !/^[a-z0-9._-]{3,24}$/.test(username)) {
      msg.textContent = "Username 3–24 karakter: huruf kecil, angka, titik, garis bawah, atau minus.";
      return;
    }
    if (!nama) { msg.textContent = "Nama moderator wajib diisi."; return; }
    if (password.length < 6) { msg.textContent = "Password minimal 6 karakter."; return; }
    if (password !== form.password2.value) { msg.textContent = "Password dan ulangi password belum sama."; return; }
    btn.disabled = true;
    btn.innerHTML = "Menyimpan…";
    try {
      if (state.demo) {
        if (reset) {
          toast(`Password demo @${username} diperbarui.`);
        } else {
          if (state.accounts.some(a => String(a.username).toLowerCase() === username)) {
            throw new Error("Username sudah dipakai. Pilih username lain.");
          }
          state.accounts.push({ username, nama, role: "moderator", status: "Aktif", dibuat: new Date().toISOString(), terakhir: "" });
          toast(`Akun moderator @${username} dibuat (mode demo).`);
        }
        renderAccounts();
        closeModal();
      } else {
        await apiPost({ action: reset ? "userreset" : "useradd", username, nama, password });
        closeModal();
        toast(reset ? `Password @${username} berhasil direset.` : `Akun moderator @${username} berhasil dibuat.`);
        await loadAll();
      }
    } catch (err) {
      msg.textContent = err.message || "Gagal menyimpan akun.";
      btn.disabled = false;
      btn.innerHTML = `${ic(reset ? "key" : "user-plus")} ${reset ? "Simpan password" : "Buat akun"}`;
      if (isAuthError(err)) logout(true);
    }
  });
}
async function toggleAccount(username) {
  const account = findAccount(username);
  if (!account) return;
  const next = account.status === "Nonaktif" ? "Aktif" : "Nonaktif";
  try {
    if (state.demo) {
      account.status = next;
      renderAccounts();
      toast(`@${username} ${next === "Aktif" ? "diaktifkan" : "dinonaktifkan"} (mode demo).`);
    } else {
      await apiPost({ action: "usertoggle", username, status: next });
      toast(`@${username} ${next === "Aktif" ? "diaktifkan" : "dinonaktifkan"}.`);
      await loadAll();
    }
  } catch (err) {
    toast(err.message || "Gagal mengubah status akun.");
    if (isAuthError(err)) logout(true);
  }
}
async function deleteAccount(username) {
  const account = findAccount(username);
  if (!account) return;
  const ok = await confirmAction("Hapus akun moderator?", `Akun @${username} (${account.nama}) akan dihapus permanen dan tidak bisa dipakai masuk lagi.`, "Hapus akun");
  if (!ok) return;
  try {
    if (state.demo) {
      state.accounts = state.accounts.filter(a => a.username !== username);
      renderAccounts();
      toast(`Akun @${username} dihapus (mode demo).`);
    } else {
      await apiPost({ action: "userdelete", username });
      toast(`Akun @${username} dihapus.`);
      await loadAll();
    }
  } catch (err) {
    toast(err.message || "Gagal menghapus akun.");
    if (isAuthError(err)) logout(true);
  }
}
$("#accountList").addEventListener("click", e => {
  if (!isAdmin()) return;
  const reset = e.target.closest("[data-account-reset]");
  if (reset) { const a = findAccount(reset.dataset.accountReset); if (a) openAccountForm(a); return; }
  const toggle = e.target.closest("[data-account-toggle]");
  if (toggle) { toggleAccount(toggle.dataset.accountToggle); return; }
  const del = e.target.closest("[data-account-delete]");
  if (del) deleteAccount(del.dataset.accountDelete);
});
$("#addAccountBtn").onclick = () => openAccountForm(null);

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
      if (isAuthError(err)) logout(true);
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
  if (!isAdmin()) { toast("Hanya administrator yang dapat menambah tamu."); return; }
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
      if (isAuthError(err)) logout(true);
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
$("#logoutBtn").onclick = () => logout(false);

/* ---------- tautan pengajuan moderator ---------- */
function initRequestLink() {
  const adminName = CONFIG.ADMIN_NAME || "Admin";
  let number = String(CONFIG.ADMIN_WA || "").replace(/\D/g, "");
  if (number.startsWith("0")) number = "62" + number.slice(1);
  const text = `Halo ${adminName}, saya ingin mengajukan akun moderator untuk Dashboard Undangan Ramiz & Denayu.\n\nNama lengkap: \nUsername yang diinginkan: \nNomor WhatsApp: \n\nTerima kasih.`;
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  $("#requestModBtn").href = href;
}

/* ---------- mulai ---------- */
$("#gateForm").addEventListener("submit", e => {
  e.preventDefault();
  const username = $("#loginUser").value.trim();
  const password = $("#loginPass").value;
  if (username && password) login(username, password);
});
function fillDemo(role) {
  $("#loginUser").value = role;
  $("#loginPass").value = role;
  $("#gateMsg").textContent = "";
  $("#gateBtn").focus();
}
$("#fillAdminBtn").onclick = () => fillDemo("admin");
$("#fillModBtn").onclick = () => fillDemo("moderator");

(async () => {
  initRequestLink();
  if (!API) {
    $("#demoBox").hidden = false;
    $("#modeBadge").hidden = true;
    $("#loginUser").focus();
    return;
  }
  $("#demoBox").hidden = true;
  const saved = readSession();
  if (saved) {
    state.token = saved.token;
    state.username = saved.username || "";
    state.name = saved.name || "";
    state.role = saved.role || "";
    await enterApp();
  } else {
    $("#loginUser").focus();
  }
})();
