/* =====================================================================
   DATA UNDANGAN — ubah bagian ini sesuai kebutuhan
   ===================================================================== */
/* ====== 1. CONSTANTS & CONFIGURATION ====== */
const C = {
  SCRIPT_URL: "",                    // opsional; lebih mudah diisi di config.js
  music: "",                        // kosong = pakai assets/audio/Glory_of_Love.mp3
  musicVolume: 0.65,                // 0 - 1
  bgImage: "",                      // foto latar opsional, mis. "assets/latar.jpg"
  cover: [],                        // foto sampul opsional (array URL)
  couple: [
    {
      full: "Ramiz Qudamah",
      nick: "Ramiz",
      role: "Mempelai Pria",
      parents: "Putra dari Bapak Alm. Andi Munadi & Ibu Huswatun Hasanah",
      photo: ""
    },
    {
      full: "Denayu Tiara",
      nick: "Denayu",
      role: "Mempelai Wanita",
      parents: "Putri dari Bapak A & Ibu B",
      photo: ""
    }
  ],
  motive: "Kami percaya pernikahan adalah ibadah terpanjang: belajar saling menjaga, bertumbuh bersama, dan pulang ke tempat yang sama.",
  story: [
    { date: "Maret 2021", t: "Bertemu", d: "Pertemuan pertama di acara kampus, berawal dari obrolan tentang buku.", full: "Kami bertemu di sebuah acara kampus. Awalnya hanya saling menyapa, lalu obrolan tentang buku membuat waktu terasa singkat. Dari pertemuan sederhana itu, kami mulai saling mencari kabar." },
    { date: "Agustus 2022", t: "Saling mengenal", d: "Dari teman diskusi menjadi tempat berbagi cerita setiap hari.", full: "Jarak dan kesibukan sempat memisahkan, tetapi kami tetap berkabar. Obrolan ringan perlahan berubah menjadi tempat pulang untuk berbagi cerita, resah, dan rencana." },
    { date: "Januari 2025", t: "Lamaran", d: "Keluarga bertemu dan kami sepakat melangkah lebih serius.", full: "Dengan niat baik, keluarga kedua belah pihak bertemu. Dalam suasana hangat, kami sepakat melangkah ke jenjang yang lebih serius." },
    { date: "Desember 2026", t: "Pelaminan", d: "Dengan restu keluarga, kami memulai perjalanan baru.", full: "Setelah persiapan yang dijalani bersama, kami akan mengikat janji suci. Kami memohon doa agar perjalanan ini diberkahi dan dimudahkan." }
  ],
  /* only:"priority" = hanya tampil untuk tamu prioritas */
  events: [
    { name: "Akad Nikah", label: "Minggu, 13 Desember 2026", time: "08.00 – 10.00 WIB", start: "2026-12-13T08:00:00+07:00", end: "2026-12-13T10:00:00+07:00", photo: "" },
    { name: "Resepsi", label: "Minggu, 13 Desember 2026", time: "11.00 – 14.00 WIB", start: "2026-12-13T11:00:00+07:00", end: "2026-12-13T14:00:00+07:00", photo: "" }
  ],
  venueName: "Roemah Kraton",
  venueShort: "Roemah Kraton, Tebet, Jakarta Selatan",
  venue: "Jl. Tebet Barat Dalam Raya No.34, RT.14/RW.3, Tebet Barat, Kec. Tebet, Kota Jakarta Selatan, DKI Jakarta 12810",
  venuePhoto: "",                    // opsional: foto asli gedung, mis. "assets/roemah-kraton.jpg" (menggantikan ilustrasi)
  mapQuery: "Roemah Kraton, Jl. Tebet Barat Dalam Raya No.34, Jakarta Selatan",
  generalMax: 1,                    // kapasitas tamu untuk tautan umum
  demoGuests: { DEMO123: { name: "Budi Santoso", max: 3 } },
  /* Tambah kartu hadiah cukup menambah baris */
  gifts: [
    { title: "Transfer Bank", sub: "Bank BCA a.n. Rafi Pratama", value: "1234567890", btn: "Salin rekening", qr: "", logo: "" },
    { title: "E-Wallet", sub: "DANA / GoPay a.n. Nadia Safitri", value: "081234567890", btn: "Salin nomor", qr: "", logo: "" },
    { title: "Alamat Rumah", sub: "Untuk kado fisik", value: "Jl. Contoh No. 1, Jakarta", btn: "Salin alamat" }
  ],
  registry: [
    { n: "Air fryer", price: 700000, got: 0, need: 1, url: "https://contoh.com/air-fryer" },
    { n: "Mesin cuci portable", price: 689000, got: 1, need: 1, url: "https://contoh.com/mesin-cuci" },
    { n: "Set peralatan masak", price: 440000, got: 0, need: 2, url: "https://contoh.com/set-masak" }
  ],
  gallery: [],                     // mis. ["assets/foto1.jpg", "assets/foto2.jpg"]
  floralImg: ""                     // opsional: PNG/WebP transparan bunga (sudut kiri-atas), mis. "assets/sakura.png"
};

const [a, b] = C.couple;
const P = new URLSearchParams(location.search);
const KEY = P.get("k") || "";
const TO = P.get("to") || "";
const CONFIG = window.WEDDING_CONFIG || {};
const API = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(C.SCRIPT_URL || CONFIG.SCRIPT_URL || "")
  ? (C.SCRIPT_URL || CONFIG.SCRIPT_URL) : "";
const SITE_SHARE_URL = (C.SITE_URL || CONFIG.SITE_URL || location.href.split("?")[0]).trim();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

const guest = {
  name: (TO || "").trim().slice(0, 60) || "Tamu Undangan",
  max: C.generalMax || 1,
  priority: false,
  rsvp: null
};


/* ====== 2. UTILITY FUNCTIONS ====== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/**
 * Melakukan escape string agar aman disematkan ke dalam innerHTML
 * @param {*} s - String input
 * @returns {string} String aman HTML
 */
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

/**
 * Menghasilkan markup elemen SVG icon berdasarkan id sprite
 * @param {string} n - Nama ikon pada symbol sprite (i-{n})
 * @returns {string} String elemen SVG
 */
const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/**
 * Menampilkan pesan toast sementara di bagian bawah layar
 * @param {string} text - Teks pesan
 */
function toast(text) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), text.length > 40 ? 4000 : 2200);
}

/**
 * Menyalin teks ke clipboard dengan dukungan fallback execCommand
 * @param {string} text - Teks yang akan disalin
 * @returns {Promise<boolean>} Berhasil atau tidaknya proses salin
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }
}


/* ====== 3. GUEST RESOLUTION ====== */
/**
 * Verifikasi tamu prioritas via parameter ?k=KODE
 * Mengambil nama, kapasitas tamu, dan data RSVP dari Spreadsheet atau demoGuests
 */
async function resolveGuest() {
  if (!KEY) return;
  try {
    let data = null;
    if (API) {
      const res = await fetch(`${API}?action=guest&k=${encodeURIComponent(KEY)}`, { cache: "no-store" });
      data = await res.json();
    } else if (C.demoGuests[KEY]) {
      data = C.demoGuests[KEY];
    }
    if (data && data.name) {
      guest.name = String(data.name).slice(0, 80);
      guest.max = Math.max(1, +data.max || 1);
      guest.priority = true;
      guest.rsvp = data.rsvp || null;
      if (guest.rsvp) {
        try {
          const rk = "rsvp:" + KEY;
          if (!localStorage.getItem(rk)) localStorage.setItem(rk, JSON.stringify(guest.rsvp));
        } catch (_) {}
      }
    }
  } catch (e) {
    /* Jaringan bermasalah: tetap tampilkan nama dari parameter ?to= bila ada */
  }
}


/* ====== 4. CONTENT RENDERING ====== */
const coverLetters = (text, offset) => [...text].map((ch, i) =>
  `<span class="l" aria-hidden="true" style="--k:${i + offset}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`
).join("");

/**
 * Merender informasi pada layar sampul (cover)
 */
function renderCover() {
  document.title = `Undangan Pernikahan ${a.nick} & ${b.nick}`;
  const opNames = $("#opNames");
  if (opNames) {
    opNames.setAttribute("aria-label", `${a.nick} & ${b.nick}`);
    opNames.innerHTML =
      `<span class="nm">${coverLetters(a.nick, 0)}</span>` +
      `<span class="am l" aria-hidden="true" style="--k:${a.nick.length}">&amp;</span>` +
      `<span class="nm">${coverLetters(b.nick, a.nick.length + 1)}</span>`;
    opNames.classList.add("ready");
  }

  const evs = C.events.filter(e => !e.only || (e.only === "priority" && guest.priority));
  const opDate = $("#opDate");
  if (opDate) opDate.textContent = (evs[0] || C.events[0]).label;

  const opLocSpan = $("#opLoc span");
  if (opLocSpan) opLocSpan.textContent = C.venueShort || C.venue;

  const guestEl = $("#guest");
  if (guestEl) guestEl.textContent = guest.name;

  const tagEl = $("#tag");
  if (tagEl) tagEl.hidden = !guest.priority;

  const guestNote = $("#guestNote");
  if (guestNote) guestNote.textContent = guest.priority ? `Undangan berlaku untuk ${guest.max} orang` : "";

  const nickEl = $("#nick");
  if (nickEl) nickEl.textContent = `${a.nick} & ${b.nick}`;

  const creditNames = $("#creditNames");
  if (creditNames) creditNames.textContent = `${a.nick} & ${b.nick}`;

  // Gambar latar belakang opsional
  if (C.bgImage) {
    const photoEl = $("#bg .photo");
    if (photoEl) {
      photoEl.style.backgroundImage = `url("${C.bgImage}")`;
      photoEl.classList.add("on");
    }
  }

  // Slideshow foto sampul opsional
  if (C.cover && C.cover.length) {
    const slidesEl = $("#slides");
    if (slidesEl) {
      slidesEl.innerHTML = C.cover.map((src, i) =>
        `<img src="${esc(src)}" class="${i === 0 ? "on" : ""}" alt="Foto Sampul ${i + 1}">`
      ).join("");
      if (C.cover.length > 1 && !slidesEl.dataset.timer) {
        slidesEl.dataset.timer = "1";
        let cur = 0;
        setInterval(() => {
          const imgs = slidesEl.querySelectorAll("img");
          if (imgs.length < 2) return;
          imgs[cur].classList.remove("on");
          cur = (cur + 1) % imgs.length;
          imgs[cur].classList.add("on");
        }, 5000);
      }
    }
  }
}

/**
 * Memecah teks nama menjadi huruf-huruf yang muncul bergantian saat elemen terlihat
 * @param {HTMLElement} el - Elemen berisi nama
 */
function splitText(el) {
  if (!el || el.dataset.split) return;
  const text = el.textContent;
  el.dataset.split = "1";
  el.setAttribute("aria-label", text);
  el.classList.add("split");
  el.innerHTML = [...text].map((ch, i) =>
    `<span class="ch" aria-hidden="true" style="--k:${i}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`
  ).join("");
}

/**
 * Menghasilkan markup kartu mempelai
 * @param {Object} p - Data mempelai
 * @param {number} i - Indeks urutan untuk jeda animasi
 * @returns {string} HTML string
 */
function personHTML(p, i) {
  const initials = p.nick.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return `<article class="person reveal tilt" style="--d:${i * 110}ms">
    <div class="ph">
      ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.full)}" loading="lazy">` : `<div class="ph-fallback"><span>${esc(initials)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-flower"/></svg></div>`}
      <i class="ph-corner tl"></i><i class="ph-corner br"></i>
    </div>
    <p class="role">${esc(p.role || "Mempelai")}</p>
    <h3>${esc(p.full)}</h3>
    <p class="parents">${esc(p.parents)}</p>
  </article>`;
}

/**
 * Merender seluruh konten utama undangan pernikahan
 */
function renderContent() {
  renderCover();

  const pairEl = $("#pair");
  if (pairEl) {
    pairEl.innerHTML = personHTML(a, 0) + `<div class="amp reveal" style="--d:160ms" aria-hidden="true">&amp;</div>` + personHTML(b, 1);
  }

  const motiveEl = $("#motive");
  if (motiveEl) motiveEl.textContent = C.motive;

  const evs = C.events.filter(e => !e.only || (e.only === "priority" && guest.priority));
  const first = evs[0] || C.events[0];
  const dp = Object.fromEntries(new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta"
  }).formatToParts(new Date(first.start)).map(p => [p.type, p.value]));

  const evDate = $("#evDate");
  if (evDate) {
    evDate.innerHTML = `<span>${dp.weekday}</span><b>${dp.day}</b><span>${dp.month}</span><span>${dp.year}</span>`;
  }

  const evEl = $("#ev");
  if (evEl) {
    evEl.innerHTML = evs.map((e, i) => `<article class="evc card tilt reveal" style="--d:${i * 120}ms">
      <div class="evp" style="--ei:${i}">
        ${e.photo ? `<img src="${esc(e.photo)}" alt="${esc(e.name)}" loading="lazy">` : `<div class="evp-fallback"><span class="evp-mono">${esc(a.nick.charAt(0))}<i>&amp;</i>${esc(b.nick.charAt(0))}</span><span class="evp-name">${esc(e.name)}</span></div>`}
      </div>
      <div class="evb">
        <div class="ev-eyebrow"><svg class="ic" aria-hidden="true"><use href="#i-clock"/></svg> ${esc(e.time)}</div>
        <h3>${esc(e.name)}</h3>
        <p class="ev-date">${esc(e.label)}</p>
        <button class="btn ghost" type="button" data-ics="${i}">${ic("calendar")} Simpan ke kalender</button>
      </div>
    </article>`).join("");

    evEl.onclick = e => {
      const btn = e.target.closest("[data-ics]");
      if (btn) ics(evs[+btn.dataset.ics]);
    };
    initEventPointer(evEl);
  }

  startCountdown(new Date(first.start));

  const venueEl = $("#venue");
  if (venueEl) venueEl.textContent = C.venue;

  const q = encodeURIComponent(C.mapQuery || C.venue);
  const mapBtn = $("#mapBtn");
  if (mapBtn) mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${q}`;

  const venueName = $("#venueName");
  if (venueName) venueName.textContent = C.venueName || "Lokasi Acara";
  if (C.venuePhoto && $("#venuePhoto")) {
    $("#venuePhoto").innerHTML = `<img src="${esc(C.venuePhoto)}" alt="${esc(C.venueName || "Lokasi acara")}" loading="lazy">`;
  }

  const tlEl = $("#tl");
  if (tlEl) {
    tlEl.innerHTML = `<i class="tl-track" aria-hidden="true"></i><i class="tl-line" aria-hidden="true"></i>` + C.story.map((s, i) => `<article class="tl-item reveal" style="--d:${(i % 2) * 90}ms">
      <span class="tl-dot" aria-hidden="true"></span>
      <div class="tl-card">
        <small>${esc(s.date)}</small>
        <h3>${esc(s.t)}</h3>
        <p>${esc(s.d)}</p>
        ${s.full ? `<details><summary>Baca cerita lengkap ${ic("chevron-down")}</summary><p>${esc(s.full)}</p></details>` : ""}
      </div>
    </article>`).join("");
  }

  renderGifts();
  renderGallery();
  setupRsvpForm();
  initTimeline();
  initFloral();
  $$(".person h3").forEach(splitText);
  splitText($("#nick"));
}

/**
 * Merender daftar hadiah dan registry kado fisik
 */
function renderGifts() {
  const giftBox = $("#giftBox");
  if (giftBox) {
    giftBox.innerHTML = C.gifts.map((g, i) => `<article class="card gift tilt reveal" style="--d:${i * 90}ms">
      ${g.logo ? `<img class="glogo" src="${esc(g.logo)}" alt="${esc(g.title)}" loading="lazy">` : `<span class="gift-icon">${ic("gift")}</span>`}
      <b>${esc(g.title)}</b>
      <p>${esc(g.sub)}</p>
      ${g.qr ? `<img class="qr" src="${esc(g.qr)}" alt="QR ${esc(g.title)}" loading="lazy">` : ""}
      <div class="no">${esc(g.value)}</div>
      <button class="btn ghost" type="button" data-c="${i}">${ic("copy")} ${esc(g.btn)}</button>
    </article>`).join("");
  }

  const regEl = $("#reg");
  const regList = $("#regList");
  if (regEl && regList) {
    if (C.registry.length) {
      regEl.hidden = false;
      regList.innerHTML = C.registry.map((r, i) => {
        const done = r.got >= r.need;
        const link = /^https?:\/\//.test(r.url || "");
        return `<article class="card ri${done ? " done" : ""}" style="--i:${i}">
          <b>${esc(r.n)}</b>
          <div class="price">Rp ${r.price.toLocaleString("id-ID")}</div>
          <div class="bar"><i style="width:${Math.min(100, (r.got / r.need) * 100)}%"></i></div>
          <small>${done ? "Sudah terpenuhi" : `${r.got} / ${r.need} terpenuhi`}</small>
          ${!done && link ? `<a class="btn ghost" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${ic("cart")} Beli</a>` : ""}
        </article>`;
      }).join("");
    } else {
      regEl.hidden = true;
    }
  }
}

/**
 * Merender item galeri foto atau placeholder estetik jika belum ada foto
 */
let galleryCount = 0;
function renderGallery() {
  const galEl = $("#gal");
  if (!galEl) return;
  galleryCount = C.gallery.length || 5;
  const slides = [];
  for (let i = 0; i < galleryCount; i++) {
    if (C.gallery[i]) {
      slides.push(`<div class="slide" data-i="${i}" role="button" tabindex="0" aria-label="Foto ${i + 1} dari ${galleryCount}"><img src="${esc(C.gallery[i])}" alt="Foto ${i + 1}" loading="lazy" draggable="false"></div>`);
    } else {
      slides.push(`<div class="slide ph" data-i="${i}" style="--gi:${i}"><div class="ph-slide-inner"><span class="slide-mark">${esc(a.nick[0])}<em>&amp;</em>${esc(b.nick[0])}</span><small>Our Moment ${String(i + 1).padStart(2, "0")}</small></div></div>`);
    }
  }
  galEl.innerHTML = slides.join("");
}


/* ====== 5. COUNTDOWN ====== */
let countdownTimer;

/**
 * Memulai penghitungan mundur ke tanggal hari bahagia
 * @param {Date} target - Tanggal target acara
 */
function startCountdown(target) {
  clearInterval(countdownTimer);
  const el = $("#cd");
  if (!el) return;
  el.innerHTML = ["Hari", "Jam", "Menit", "Detik"].map((label, i) =>
    `<div class="cd-cell" style="--ci:${i}"><b>00</b><span>${label}</span></div>`
  ).join("");
  const cells = [...el.querySelectorAll(".cd-cell b")];

  const tick = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    if (Date.now() >= target) {
      el.innerHTML = `<p class="cd-done">Hari bahagia telah tiba. Terima kasih atas doa Anda.</p>`;
      clearInterval(countdownTimer);
      return;
    }
    const values = [
      Math.floor(s / 86400),
      Math.floor((s % 86400) / 3600),
      Math.floor((s % 3600) / 60),
      s % 60
    ].map(v => String(v).padStart(2, "0"));

    values.forEach((v, i) => {
      if (cells[i] && cells[i].textContent !== v) {
        cells[i].textContent = v;
        if (!reduceMotion) {
          cells[i].classList.remove("tick");
          void cells[i].offsetWidth;
          cells[i].classList.add("tick");
        }
      }
    });
  };

  tick();
  countdownTimer = setInterval(tick, 1000);
}


/* ====== 6. CALENDAR (ICS) ====== */
/**
 * Mengunduh file berkas kalender iCalendar (.ics) untuk jadwal acara
 * @param {Object} e - Objek jadwal acara
 */
function ics(e) {
  const f = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Undangan Pernikahan//ID",
    "BEGIN:VEVENT", `DTSTART:${f(e.start)}`, `DTEND:${f(e.end)}`,
    `SUMMARY:${e.name} ${a.nick} & ${b.nick}`, `LOCATION:${C.venue}`,
    "DESCRIPTION:Merupakan kehormatan apabila Anda berkenan hadir.", "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${e.name}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* ====== 7. CAROUSEL / SLIDER ====== */
/**
 * Inisialisasi komponen slider/carousel berkemampuan loop, snap, dan auto-slide
 * @param {HTMLElement} stage - Elemen pembungkus .stage
 */
function initStage(stage) {
  if (!stage || stage.dataset.ready) return;
  stage.dataset.ready = "1";

  const car = stage.querySelector(".car");
  if (!car) return;

  const count = stage.parentElement ? stage.parentElement.querySelector(".count") : null;
  const [prev, next] = stage.querySelectorAll(".nav");
  const loop = "loop" in stage.dataset;
  const start = "start" in stage.dataset;
  const items = () => [...car.children];
  const total = () => (loop ? items().length / 3 : items().length);
  const isGallery = stage.classList.contains("s-gal");

  const pos = el => start
    ? el.offsetLeft - (parseFloat(getComputedStyle(car).paddingLeft) || 0)
    : el.offsetLeft + el.offsetWidth / 2 - car.clientWidth / 2;

  const current = () => {
    let best = 0;
    let bestDist = Infinity;
    items().forEach((el, i) => {
      const d = Math.abs(pos(el) - car.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  const to = (i, smooth = true) => {
    const el = items()[i];
    if (el) car.scrollTo({ left: pos(el), behavior: smooth ? "smooth" : "auto" });
  };

  car.go = d => {
    const n = items().length;
    if (n < 2) return;
    const i = current() + d;
    if (loop || start) to(Math.max(0, Math.min(n - 1, i)));
    else to((i + n) % n);
  };

  let raf = 0;
  let jumpTimer = 0;
  let touching = false;

  car.mark = () => {
    raf = 0;
    const list = items();
    if (!list.length) return;
    const active = current();
    const t = total();
    const center = car.scrollLeft + car.clientWidth / 2;

    list.forEach((el, i) => {
      el.classList.toggle("act", i === active);
      if (isGallery) {
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.max(-1.6, Math.min(1.6, (elCenter - center) / Math.max(1, el.offsetWidth)));
        el.style.setProperty("--r", `${(-d * 9).toFixed(2)}deg`);
        el.style.setProperty("--sc", `${Math.max(0.82, 1 - Math.abs(d) * 0.12).toFixed(3)}`);
        el.style.setProperty("--o", `${Math.max(0.35, 1 - Math.abs(d) * 0.32).toFixed(3)}`);
      }
    });

    if (count && t) count.textContent = `${(active % t) + 1} / ${t}`;
    stage.classList.toggle("single", t < 2);
    if (start && prev && next) {
      prev.disabled = car.scrollLeft < 4;
      next.disabled = car.scrollLeft > car.scrollWidth - car.clientWidth - 4;
    }
  };

  const recenter = () => {
    if (!loop || touching) return;
    const t = total();
    if (!t) return;
    const i = current();
    if (i >= t && i < 2 * t) return;
    car.style.scrollSnapType = "none";
    car.scrollLeft = pos(items()[(i % t) + t]);
    requestAnimationFrame(() => {
      car.style.scrollSnapType = "";
      car.mark();
    });
  };

  car.addEventListener("scroll", () => {
    raf = raf || requestAnimationFrame(car.mark);
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(recenter, 170);
  }, { passive: true });

  car.addEventListener("touchstart", () => {
    touching = true;
  }, { passive: true });

  car.addEventListener("touchend", () => {
    touching = false;
    clearTimeout(jumpTimer);
    jumpTimer = setTimeout(recenter, 260);
  }, { passive: true });

  addEventListener("resize", () => car.mark && car.mark(), { passive: true });

  stage.addEventListener("click", e => {
    const btn = e.target.closest(".nav");
    if (btn) car.go(+btn.dataset.d);
  });

  car.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") car.go(-1);
    if (e.key === "ArrowRight") car.go(1);
  });

  if (loop) to(total(), false);
  else car.scrollLeft = 0;
  car.mark();

  const pp = stage.querySelector(".pp");
  const ms = +stage.dataset.auto;
  if (ms) {
    let paused = false;
    let visible = true;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);

    if (pp) {
      pp.onclick = () => {
        paused = !paused;
        pp.innerHTML = ic(paused ? "play" : "pause");
        pp.setAttribute("aria-pressed", String(paused));
        pp.setAttribute("aria-label", paused ? "Putar geser otomatis" : "Jeda geser otomatis");
      };
    }

    /* Pewaktu satu-kali yang dipasang ulang: setiap interaksi manual (ketuk panah,
       geser, scroll, keyboard) memulai ulang hitungan, jadi slide tidak "melompat"
       sedetik setelah pengunjung menggesernya sendiri. */
    let autoTimer = 0;
    const arm = () => {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(tick, ms);
    };
    const tick = () => {
      if (!(paused || !visible || document.hidden || touching || car.matches(":hover, :focus-within"))) car.go(1);
      arm();
    };
    ["pointerdown", "wheel", "keydown", "touchstart"].forEach(ev => stage.addEventListener(ev, arm, { passive: true }));
    arm();
  }
}

/**
 * Menginisialisasi semua slider yang ada di halaman
 */
function initAllStages() {
  $$(".stage:not(.s-gal)").forEach(initStage);
  initGallery();
}

/* Daftar hadiah: buka/tutup beranimasi (panel + panah) */
const regBox = $("#reg");
const regToggle = $("#regToggle");
const regBody = $("#regBody");
const regLabel = $("#regLabel");
if (regBox && regToggle && regBody) {
  regToggle.addEventListener("click", () => {
    const open = !regBox.classList.contains("open");
    regBox.classList.toggle("open", open);
    regToggle.setAttribute("aria-expanded", String(open));
    regBody.setAttribute("aria-hidden", String(!open));
    regBody.inert = !open;
    if (regLabel) regLabel.textContent = open ? "Tutup daftar hadiah" : "Lihat daftar hadiah";
    const list = $("#regList");
    if (open && list) {
      list.scrollLeft = 0;
      requestAnimationFrame(() => list.mark && list.mark());
    }
  });
}


/* ====== 7b. GALERI "OUR MOMENT" ======
   Carousel 3D otomatis: transform + opacity saja (GPU), tanpa scroll-snap.
   Bergeser sendiri tiap AUTO_MS selama terlihat; ketuk samping untuk pindah,
   geser jari/mouse atau tombol panah untuk manual. */
function initGallery() {
  const stage = $(".s-gal");
  const car = $("#gal");
  if (!stage || !car || stage.dataset.ready) return;
  stage.dataset.ready = "1";

  const slides = [...car.children];
  const n = slides.length;
  const countEl = $("#galCount");
  const pp = stage.querySelector(".pp");
  const AUTO_MS = 10000; /* bergeser otomatis tiap 10 detik */
  let cur = 0;
  let paused = false;
  let visible = false;
  let dragging = false;
  let moved = false;
  let timer = 0;
  let startX = 0;

  stage.classList.toggle("single", n < 2);

  const layout = (instant = false) => {
    if (!n) return;
    const w = slides[0].offsetWidth;
    const step = w * 0.62;
    slides.forEach((el, i) => {
      let d = (((i - cur) % n) + n) % n;
      if (d > n / 2) d -= n;
      const a = Math.abs(d);
      const x = d === 0 ? 0 : Math.sign(d) * step * (1 + (a - 1) * 0.5);
      const scale = Math.max(0.7, 1 - a * 0.14);
      const rot = Math.max(-28, Math.min(28, -d * 14));
      const op = a === 0 ? 1 : a === 1 ? 0.75 : a === 2 ? 0.4 : 0;
      const tf = `translate3d(${x.toFixed(1)}px,0,0) rotateY(${rot}deg) scale(${scale.toFixed(3)})`;
      const wrapped = el._d !== undefined && Math.abs(d - el._d) > 1.5;
      el._d = d;

      el.style.zIndex = String(10 - a);
      el.style.pointerEvents = a <= 2 ? "auto" : "none";
      el.classList.toggle("act", d === 0);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      if (el.getAttribute("role") === "button") el.tabIndex = d === 0 ? 0 : -1;

      if (instant) {
        el.style.transition = "none";
        el.style.transform = tf;
        el.style.opacity = String(op);
      } else if (wrapped) {
        /* Slide yang "melompat" ke sisi seberang muncul memudar, tidak terbang melintasi layar */
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = tf;
        void el.offsetWidth;
        el.style.transition = "";
        requestAnimationFrame(() => { el.style.opacity = String(op); });
      } else {
        el.style.transform = tf;
        el.style.opacity = String(op);
      }
    });
    if (instant) {
      void car.offsetWidth;
      slides.forEach(el => { el.style.transition = ""; });
    }
    if (countEl) countEl.textContent = `${cur + 1} / ${n}`;
  };

  const schedule = () => {
    clearTimeout(timer);
    if (paused || reduceMotion || n < 2) return;
    timer = setTimeout(() => {
      if (visible && !document.hidden && !dragging) go(1);
      else schedule();
    }, AUTO_MS);
  };

  const go = dir => {
    if (n < 2) return;
    cur = (cur + dir + n) % n;
    layout();
    schedule();
  };

  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible) schedule();
  }, { threshold: 0.3 }).observe(stage);

  /* Geser jari / mouse */
  car.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    dragging = true;
    moved = false;
    car.classList.add("drag");
  });
  window.addEventListener("pointermove", e => {
    if (dragging && Math.abs(e.clientX - startX) > 8) moved = true;
  }, { passive: true });
  const endDrag = (e, cancelled) => {
    if (!dragging) return;
    dragging = false;
    car.classList.remove("drag");
    const dx = e.clientX - startX;
    if (!cancelled && Math.abs(dx) > 40) {
      moved = true;
      go(dx < 0 ? 1 : -1);
    } else {
      schedule();
    }
  };
  window.addEventListener("pointerup", e => endDrag(e, false));
  window.addEventListener("pointercancel", e => endDrag(e, true));

  /* Ketuk: slide tengah = perbesar foto, slide samping = pindah ke sana */
  car.addEventListener("click", e => {
    if (moved) {
      moved = false;
      return;
    }
    const slide = e.target.closest(".slide");
    if (!slide) return;
    const i = slides.indexOf(slide);
    if (i === cur) {
      if (C.gallery.length) showLightbox(+slide.dataset.i);
    } else {
      cur = i;
      layout();
      schedule();
    }
  });

  stage.addEventListener("click", e => {
    const btn = e.target.closest(".nav");
    if (btn) go(+btn.dataset.d);
  });

  stage.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if ((e.key === "Enter" || e.key === " ") && e.target.closest(".slide.act") && C.gallery.length) {
      e.preventDefault();
      showLightbox(+e.target.closest(".slide").dataset.i);
    }
  });

  if (pp) {
    pp.onclick = () => {
      paused = !paused;
      pp.innerHTML = ic(paused ? "play" : "pause");
      pp.setAttribute("aria-pressed", String(paused));
      pp.setAttribute("aria-label", paused ? "Putar geser otomatis" : "Jeda geser otomatis");
      schedule();
    };
  }

  let resizeRaf = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => layout(true));
  }, { passive: true });

  car.mark = () => layout(true);
  layout(true);
}


/* ====== 7c. TIMELINE "THE JOURNEY" ======
   Garis terisi mengikuti scroll: tumbuh ke bawah saat turun, menyusut saat
   naik. Titik menyala ketika garis mencapainya. Posisi dihitung dari elemen
   titik sebenarnya, jadi sejajar di semua ukuran layar. */
const TL = { el: null, track: null, line: null, items: [], offs: [], lit: [], top: 0, len: 1, active: false, raf: 0, lastP: -1 };

function layoutTimeline() {
  const t = TL;
  if (!t.el) return;
  t.items = [...t.el.querySelectorAll(".tl-item")];
  if (!t.items.length) return;
  const ys = t.items.map(it => it.offsetTop + it.querySelector(".tl-dot").offsetTop);
  t.top = ys[0];
  t.len = Math.max(1, ys[ys.length - 1] - ys[0]);
  t.offs = ys.map(y => y - ys[0]);
  [t.track, t.line].forEach(el => {
    el.style.top = t.top + "px";
    el.style.height = t.len + "px";
  });
}

function updateTimeline() {
  const t = TL;
  t.raf = 0;
  if (!t.el || !t.items.length) return;
  const y = innerHeight * 0.62 - (t.el.getBoundingClientRect().top + t.top);
  const p = Math.min(1, Math.max(0, y / t.len));
  if (Math.abs(p - t.lastP) > 0.0005) {
    t.line.style.transform = `scaleY(${p.toFixed(4)})`;
    t.lastP = p;
  }
  t.items.forEach((it, i) => {
    const on = y >= t.offs[i];
    if (on !== t.lit[i]) {
      t.lit[i] = on;
      it.classList.toggle("lit", on);
    }
  });
}

function initTimeline() {
  const el = $("#tl");
  if (!el || TL.el === el) return;
  TL.el = el;
  TL.track = el.querySelector(".tl-track");
  TL.line = el.querySelector(".tl-line");
  TL.lit = [];
  TL.lastP = -1;
  if (!TL.track || !TL.line) return;

  const queue = () => { if (!TL.raf) TL.raf = requestAnimationFrame(updateTimeline); };

  layoutTimeline();
  queue();

  new IntersectionObserver(es => {
    TL.active = es[0].isIntersecting;
    queue(); /* satu pembaruan terakhir saat keluar layar agar garis berakhir di posisi yang benar */
  }, { rootMargin: "160px 0px" }).observe(el);

  addEventListener("scroll", () => { if (TL.active) queue(); }, { passive: true });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { layoutTimeline(); queue(); }).observe(el);
  } else {
    addEventListener("resize", () => { layoutTimeline(); queue(); }, { passive: true });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutTimeline(); queue(); });
}


/* ====== 8. RSVP & WISHES ====== */
const demoWishes = [
  { nama: "Keluarga Besar", hadir: "Hadir", ucapan: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fii khair." },
  { nama: "Sahabat Kampus", hadir: "Hadir", ucapan: "Selamat menempuh hidup baru, semoga sakinah, mawaddah, warahmah." }
];
const emptyWish = [{ nama: "Belum ada ucapan", hadir: "", ucapan: "Jadilah yang pertama mengirim doa dan ucapan." }];
let wishes = [];
let myWish = null;

/**
 * Menghasilkan markup kartu ucapan
 * @param {Object} w - Objek data ucapan
 * @returns {string} HTML string
 */
function wishCard(w) {
  const name = String(w.nama || "Tamu").trim();
  const initial = name.charAt(0).toUpperCase() || "?";
  return `<article class="card wish">
    <div class="wish-top">
      <span class="avatar" aria-hidden="true">${esc(initial)}</span>
      <div class="wish-who">
        <b>${esc(name)}</b>
        ${w.hadir === "Hadir" ? `<span class="wish-badge">Hadir</span>` : ""}
      </div>
    </div>
    <p>${esc(w.ucapan)}</p>
  </article>`;
}

/**
 * Menampilkan daftar ucapan ke elemen #wishes
 */
function drawWishes() {
  const wishesEl = $("#wishes");
  if (!wishesEl) return;
  const list = API
    ? (wishes.length ? wishes : emptyWish)
    : (wishes.length ? [...wishes, ...demoWishes] : demoWishes);
  wishesEl.innerHTML = list.map(wishCard).join("");
  wishesEl.mark && wishesEl.mark();
}

/**
 * Memuat ucapan terbaru dari server atau Spreadsheet
 */
async function loadWishes() {
  if (API) {
    try {
      const res = await fetch(`${API}?action=wishes&t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) wishes = data.filter(w => w && w.ucapan).slice(0, 30);
    } catch (e) {}
  }
  drawWishes();
}

const RK = "rsvp:" + (KEY || "umum");
const DID = (() => {
  try {
    let d = localStorage.getItem("did");
    if (!d) {
      d = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem("did", d);
    }
    return d;
  } catch (e) {
    return "x" + Math.random().toString(36).slice(2);
  }
})();

const savedRsvp = () => {
  try {
    return JSON.parse(localStorage.getItem(RK));
  } catch (e) {
    return null;
  }
};

/**
 * Menyiapkan form konfirmasi RSVP dan kapasitas tamu
 */
function setupRsvpForm() {
  const n = $("#n");
  if (n) {
    n.value = guest.name === "Tamu Undangan" ? "" : guest.name;
    n.readOnly = guest.priority;
  }
  const max = Math.max(1, +guest.max || 1);
  const j = $("#j");
  if (j) {
    j.innerHTML = Array.from({ length: max }, (_, i) =>
      `<option value="${i + 1}">${i + 1} orang</option>`
    ).join("");
  }
  const jl = $("#jl");
  if (jl) jl.textContent = `Jumlah tamu (maks. ${max})`;

  const rsvpHint = $("#rsvpHint");
  if (rsvpHint) {
    rsvpHint.textContent = guest.priority
      ? `Undangan ini berlaku untuk maksimal ${max} orang. Mohon konfirmasi kehadiran Anda.`
      : "Mohon konfirmasi kehadiran sebelum hari acara.";
  }
  restoreRsvp();
}

/**
 * Menampilkan ringkasan jika tamu sudah pernah mengirim RSVP
 */
function restoreRsvp() {
  const r = savedRsvp();
  const sum = $("#sum");
  const rsvpCta = $("#rsvpCta");
  const rsvpForm = $("#rsvpForm");
  const sumTxt = $("#sumTxt");
  const sbtn = $("#sbtn");

  if (sum) sum.hidden = !r;
  if (rsvpCta) rsvpCta.hidden = !!r;
  if (rsvpForm) rsvpForm.hidden = true;

  if (r && sumTxt && sbtn) {
    const who = r.hadir === "Hadir"
      ? `Terima kasih, ${r.nama}. Kami mencatat konfirmasi kehadiran Anda untuk ${r.jumlah} orang.`
      : `Terima kasih atas kabarnya, ${r.nama}. Kami mendoakan yang terbaik untuk Anda.`;
    sumTxt.textContent = who;
    sbtn.innerHTML = ic("check") + " Kirim konfirmasi";
  }
}

const rsvpOpenBtn = $("#rsvpOpen");
if (rsvpOpenBtn) {
  rsvpOpenBtn.onclick = () => {
    const rsvpCta = $("#rsvpCta");
    const rsvpForm = $("#rsvpForm");
    const n = $("#n");
    if (rsvpCta) rsvpCta.hidden = true;
    if (rsvpForm) rsvpForm.hidden = false;
    if (n) n.focus();
  };
}

const editBtn = $("#edit");
if (editBtn) {
  editBtn.onclick = () => {
    const r = savedRsvp() || {};
    const n = $("#n");
    const k = $("#k");
    const u = $("#u");
    const j = $("#j");
    const sbtn = $("#sbtn");
    const sum = $("#sum");
    const rsvpForm = $("#rsvpForm");

    if (n) n.value = r.nama || n.value;
    if (k) k.value = r.hadir || "Hadir";
    if (u) u.value = r.ucapan || "";
    if (j && r.jumlah) j.value = String(r.jumlah);
    if (j && k) j.disabled = k.value !== "Hadir";
    if (sbtn) sbtn.innerHTML = ic("check") + " Simpan perubahan";
    if (sum) sum.hidden = true;
    if (rsvpForm) rsvpForm.hidden = false;
  };
}

const kSelect = $("#k");
if (kSelect) {
  kSelect.onchange = e => {
    const j = $("#j");
    if (j) j.disabled = e.target.value !== "Hadir";
  };
}

const rsvpForm = $("#rsvpForm");
if (rsvpForm) {
  rsvpForm.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("#sbtn");
    const n = $("#n");
    const k = $("#k");
    const j = $("#j");
    const u = $("#u");
    const msg = $("#msg");

    const nama = n ? n.value.trim() : "";
    if (!nama) {
      if (n) n.focus();
      return;
    }
    const hadir = k ? k.value : "Hadir";
    const data = {
      action: "rsvp",
      nama,
      hadir,
      jumlah: hadir === "Hadir" && j ? +j.value : 0,
      ucapan: u ? u.value.trim() : "",
      k: KEY || "",
      d: DID
    };

    if (btn) {
      btn.disabled = true;
      var oldHTML = btn.innerHTML;
      btn.innerHTML = ic("send") + " Mengirim…";
    }
    if (msg) {
      msg.textContent = "";
      msg.className = "";
    }

    try {
      if (API) {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({ ok: true }));
        if (json && json.ok === false) throw new Error(json.error || "Data ditolak server.");
      }
      try {
        localStorage.setItem(RK, JSON.stringify(data));
      } catch (_) {}

      wishes = wishes.filter(w => w !== myWish);
      myWish = data.ucapan ? data : null;
      if (myWish) wishes.unshift(myWish);
      drawWishes();
      if (API) await loadWishes();
      restoreRsvp();

      if (msg) msg.textContent = API ? "" : "Mode demo: konfirmasi tersimpan di perangkat ini saja.";
      if (API) toast("Konfirmasi berhasil dikirim. Terima kasih!");
      else toast("Mode demo: data belum tersimpan ke Spreadsheet.");
    } catch (err) {
      if (msg) {
        msg.textContent = "Gagal mengirim. Periksa koneksi lalu coba lagi.";
        msg.classList.add("error");
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHTML;
      }
      return;
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldHTML;
    }
  });
}


/* ====== 9. LIGHTBOX ====== */
let lightboxIndex = 0;
const lb = $("#lb");

/**
 * Menampilkan gambar dalam modal lightbox layar penuh
 * @param {number} i - Indeks foto pada galeri
 */
function showLightbox(i) {
  if (!C.gallery.length || !lb) return;
  lightboxIndex = (i + C.gallery.length) % C.gallery.length;
  const img = lb.querySelector("img");
  if (img) {
    img.src = C.gallery[lightboxIndex];
    img.alt = `Foto ${lightboxIndex + 1}`;
  }
  lb.classList.add("show");
  document.body.classList.add("lb-open");
}

/**
 * Menutup modal lightbox
 */
function closeLightbox() {
  if (!lb) return;
  lb.classList.remove("show");
  document.body.classList.remove("lb-open");
}

if ($("#lbx")) $("#lbx").onclick = closeLightbox;
if ($("#lbp")) $("#lbp").onclick = () => showLightbox(lightboxIndex - 1);
if ($("#lbn")) $("#lbn").onclick = () => showLightbox(lightboxIndex + 1);

if (lb) {
  lb.addEventListener("click", e => {
    if (e.target === lb) closeLightbox();
  });
}

addEventListener("keydown", e => {
  if (!lb || !lb.classList.contains("show")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
  if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
});


/* ====== 10. SHARE & COPY ====== */
// Delegasi klik tombol salin rekening/nomor hadiah
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-c]");
  if (!btn) return;
  const gift = C.gifts[+btn.dataset.c];
  if (gift) {
    copyText(gift.value).then(ok => toast(ok ? "Tersalin ke clipboard" : "Gagal menyalin, salin manual"));
  }
});

const copyVenueBtn = $("#copyVenue");
if (copyVenueBtn) {
  copyVenueBtn.onclick = () => {
    copyText(C.venue).then(ok => toast(ok ? "Alamat tersalin" : "Gagal menyalin, salin manual"));
  };
}

const shareBtn = $("#shareBtn");
if (shareBtn) {
  shareBtn.onclick = async () => {
    const data = {
      title: document.title,
      text: `Undangan pernikahan ${a.nick} & ${b.nick}`,
      url: SITE_SHARE_URL
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    const ok = await copyText(SITE_SHARE_URL);
    toast(ok ? "Tautan undangan tersalin" : "Gagal menyalin tautan");
  };
}

const topBtn = $("#topBtn");
if (topBtn) {
  topBtn.onclick = () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}


/* ====== 11. AUDIO / MUSIC ====== */
const bgm = $("#bgm");
const audioBtn = $("#audioBtn");
const VOLUME = Math.min(1, Math.max(0, C.musicVolume ?? 0.7));

if (C.music && bgm) bgm.src = C.music;
if (bgm) {
  bgm.loop = true;
  bgm.volume = 0;
}

let wantMusic = true;
let resumeOnShow = false;
let fadeTimer;

const setAudioUI = playing => {
  if (!audioBtn) return;
  audioBtn.innerHTML = ic(playing ? "pause" : "music");
  audioBtn.classList.toggle("playing", playing);
  audioBtn.setAttribute("aria-pressed", String(playing));
};

if (bgm) {
  bgm.addEventListener("play", () => setAudioUI(true));
  bgm.addEventListener("pause", () => setAudioUI(false));
  bgm.addEventListener("error", () => toast("File musik tidak ditemukan: " + (bgm.getAttribute("src") || "")));
}

/**
 * Memudarkan (fade) volume latar musik secara halus
 * @param {number} target - Nilai volume tujuan (0 - 1)
 * @param {number} ms - Durasi transisi fade dalam milidetik
 * @param {Function} [done] - Callback setelah fade selesai
 */
function fadeVolume(target, ms = 1400, done) {
  if (!bgm) return;
  clearInterval(fadeTimer);
  const start = bgm.volume;
  const t0 = performance.now();
  fadeTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    bgm.volume = start + (target - start) * k;
    if (k >= 1) {
      clearInterval(fadeTimer);
      done && done();
    }
  }, 50);
}

/**
 * Memulai pemutaran audio dengan fade in volume
 * @returns {Promise<boolean>} Status berhasil diputar
 */
async function playMusic() {
  if (!bgm) return false;
  try {
    await bgm.play();
    fadeVolume(VOLUME);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Memasang pendengar gestur pertama pengguna untuk membuka proteksi autoplay browser
 */
function unlockMusicOnGesture() {
  const events = ["pointerdown", "touchend", "keydown"];
  const handler = () => {
    events.forEach(x => removeEventListener(x, handler));
    if (wantMusic && bgm && bgm.paused) playMusic();
  };
  events.forEach(x => addEventListener(x, handler, { passive: true }));
}

/**
 * Memulai musik jika diizinkan dan audio belum berjalan
 */
function startMusic() {
  if (!bgm || !wantMusic || !bgm.paused) return;
  playMusic().then(ok => {
    if (!ok) {
      toast("Ketuk layar untuk memutar musik");
      unlockMusicOnGesture();
    }
  });
}

if (audioBtn) {
  audioBtn.onclick = () => {
    if (!bgm) return;
    if (bgm.paused) {
      wantMusic = true;
      playMusic().then(ok => ok || toast("Musik tidak dapat diputar"));
    } else {
      wantMusic = false;
      fadeVolume(0, 350, () => bgm.pause());
    }
  };
}

document.addEventListener("visibilitychange", () => {
  if (!bgm) return;
  if (document.hidden) {
    if (!bgm.paused) {
      resumeOnShow = true;
      bgm.pause();
    }
  } else if (resumeOnShow) {
    resumeOnShow = false;
    if (wantMusic) bgm.play().catch(() => {});
  }
});


/* ====== 12. ANIMATIONS (REVEAL, TILT) ====== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

let revealStarted = false;

/**
 * Mendaftarkan elemen .reveal ke IntersectionObserver
 * @param {HTMLElement|Document} scope - Lingkup pencarian elemen reveal
 */
function observeReveals(scope = document) {
  if (!revealStarted) return;
  scope.querySelectorAll(".reveal:not(.is-in)").forEach(el => revealObserver.observe(el));
}

/**
 * Mengaktifkan pengamatan reveal elemen saat undangan dibuka
 */
function startReveals() {
  revealStarted = true;
  observeReveals();
}

/**
 * Inisialisasi efek 3D tilt interaktif dengan akselerasi GPU (requestAnimationFrame).
 * Dijalankan pada kursor desktop halus, dan dilewati untuk .gift agar kartu hadiah tetap stabil.
 * @param {HTMLElement|Document} scope - Lingkup pencarian elemen tilt
 */
function initTilt(scope = document) {
  return; /* dinonaktifkan: efeknya tertimpa gaya reveal dan hanya menambah beban CPU */
  if (!finePointer || reduceMotion) return;
  const tiltElements = scope.querySelectorAll(".tilt:not([data-tilt]):not(.gift)");

  tiltElements.forEach(el => {
    el.dataset.tilt = "1";
    let rect = null;
    let tiltRaf = 0;

    el.addEventListener("pointerenter", () => {
      rect = el.getBoundingClientRect();
    }, { passive: true });

    el.addEventListener("pointermove", e => {
      if (!rect) rect = el.getBoundingClientRect();
      if (tiltRaf) return;

      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-y * 12).toFixed(2);
        const ry = (x * 12).toFixed(2);
        const mx = ((x + 0.5) * 100).toFixed(1) + "%";
        const my = ((y + 0.5) * 100).toFixed(1) + "%";

        el.style.setProperty("--rx", `${rx}deg`);
        el.style.setProperty("--ry", `${ry}deg`);
        el.style.setProperty("--ty", "-6px");
        el.style.setProperty("--tz", "16px");
        el.style.setProperty("--mx", mx);
        el.style.setProperty("--my", my);
      });
    }, { passive: true });

    el.addEventListener("pointerleave", () => {
      if (tiltRaf) {
        cancelAnimationFrame(tiltRaf);
        tiltRaf = 0;
      }
      rect = null;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--ty", "0px");
      el.style.setProperty("--tz", "0px");
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "0%");
    }, { passive: true });
  });
}

/* ====== 12a. ANIMASI POINTER — KARTU AKAD NIKAH & RESEPSI ======
   Kartu diam di tempat; hanya cahaya lembut + garis tepi yang menyala
   mengikuti titik pointer. Berlaku untuk mouse, pena, dan sentuhan (saat ditekan).
   Efek baru aktif setelah animasi "reveal" kartu selesai (kelas .pt-ready),
   supaya tidak bertabrakan dengan transform reveal. Hanya mengubah variabel
   CSS lewat requestAnimationFrame, sehingga ringan. */
function initEventPointer(scope = document) {
  if (reduceMotion) return;
  scope.querySelectorAll(".evc").forEach(card => {
    if (card.dataset.pfx) return;
    card.dataset.pfx = "1";

    let rect = null;
    let last = null;
    let raf = 0;

    const arm = () => {
      if (card.classList.contains("is-in")) card.classList.add("pt-ready");
    };
    card.addEventListener("transitionend", e => {
      if (e.target === card && e.propertyName === "transform") arm();
    });

    const paint = () => {
      raf = 0;
      if (!last) return;
      if (!rect) rect = card.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (last.clientX - rect.left) / (rect.width || 1)));
      const y = Math.min(1, Math.max(0, (last.clientY - rect.top) / (rect.height || 1)));
      const s = card.style;
      s.setProperty("--mx", (x * 100).toFixed(1) + "%");
      s.setProperty("--my", (y * 100).toFixed(1) + "%");
    };

    const reset = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = null;
      rect = null;
      card.classList.remove("pt-on", "pt-press");
      ["--mx", "--my"].forEach(k => card.style.removeProperty(k));
    };

    card.addEventListener("pointerenter", e => {
      arm();
      if (!card.classList.contains("pt-ready")) return;
      rect = card.getBoundingClientRect();
      last = e;
      card.classList.add("pt-on");
      raf = raf || requestAnimationFrame(paint);
    }, { passive: true });

    card.addEventListener("pointermove", e => {
      if (!card.classList.contains("pt-on")) return;
      last = e;
      raf = raf || requestAnimationFrame(paint);
    }, { passive: true });

    card.addEventListener("pointerdown", e => {
      arm();
      if (!card.classList.contains("pt-ready")) return;
      if (!card.classList.contains("pt-on")) {
        rect = card.getBoundingClientRect();
        card.classList.add("pt-on");
      }
      last = e;
      card.classList.add("pt-press");
      raf = raf || requestAnimationFrame(paint);
    }, { passive: true });

    const release = e => {
      card.classList.remove("pt-press");
      /* Sentuhan tidak punya "hover": setelah jari diangkat, kembalikan kartu */
      if (e.pointerType && e.pointerType !== "mouse") setTimeout(reset, 380);
    };
    card.addEventListener("pointerup", release, { passive: true });
    card.addEventListener("pointercancel", () => reset(), { passive: true });
    card.addEventListener("pointerleave", () => reset(), { passive: true });

    /* Posisi kartu berubah saat scroll: ukur ulang pada gerakan berikutnya */
    addEventListener("scroll", () => { rect = null; }, { passive: true });
    addEventListener("resize", () => { rect = null; }, { passive: true });
  });
}

/* ====== 12b. AKSEN BUNGA SAKURA ======
   Ranting sakura menempel di sudut elemen. Muncul (mekar) saat elemen pertama
   kali terlihat, lalu bergoyang pelan seperti tertiup angin selama elemen ada
   di layar. Di luar layar animasi dijeda agar hemat baterai. */
const FLORAL_ART = `<svg viewBox="0 0 240 240" aria-hidden="true" focusable="false"><g class="wind">
<circle class="halo" cx="118" cy="62" r="78" fill="url(#flHalo)"/>
<path d="M-8 14C40 12 84 28 126 66S190 128 214 186" fill="none" stroke="#8a6b6f" stroke-width="2.6" stroke-linecap="round"/>
<g transform="translate(104 50)"><path class="lf" style="--bd:0s" d="M0 0c6-8 16-10 24-6-5 8-15 10-24 6z" fill="#9db9d3"/></g><g transform="translate(160 106)"><path class="lf" style="--bd:-1.1s" d="M0 0c8-5 18-3 23 3-8 6-18 5-23-3z" fill="#9db9d3"/></g><g transform="translate(196 150)"><path class="lf" style="--bd:-2.2s" d="M0 0c4-8 12-12 20-9-2 9-11 13-20 9z" fill="#9db9d3"/></g>
<g class="tw tw1" style="transform-origin:58px 20px"><path d="M58 20C74 4 98 0 120 12" fill="none" stroke="#8a6b6f" stroke-width="1.8" stroke-linecap="round"/>
<g transform="translate(119 12)"><g class="br" style="--bd:0s"><use href="#fl-bloom" transform="rotate(20) scale(.85)"/></g></g>
<ellipse cx="138" cy="24" rx="2.3" ry="3.6" fill="#ee9ab5" transform="rotate(-30 138 24)"/></g>
<g transform="translate(86 34)"><g class="br" style="--bd:-1.3s"><use href="#fl-bloom" transform="rotate(40) scale(.8)"/></g></g>
<g transform="translate(127 67)"><g class="br" style="--bd:-2.6s"><use href="#fl-bloom" transform="rotate(8) scale(1.05)"/></g></g>
<g class="tw tw2" style="transform-origin:136px 76px"><path d="M136 74C158 66 178 72 192 88" fill="none" stroke="#8a6b6f" stroke-width="1.8" stroke-linecap="round"/>
<g transform="translate(191 88)"><g class="br" style="--bd:-0.7s"><use href="#fl-bloom" transform="rotate(-10) scale(.85)"/></g></g>
<ellipse cx="170" cy="62" rx="2.3" ry="3.6" fill="#ee9ab5" transform="rotate(20 170 62)"/></g>
<g transform="translate(214 186)"><g class="br" style="--bd:-1.9s"><use href="#fl-bloom" transform="rotate(30) scale(.8)"/></g></g>
</g></svg>`;

/* Ranting bingkai sampul: dua batang menyusuri sisi atas dan sisi kiri bingkai
   (bergelombang melintasi garis), dengan kuntum, daun, dan tunas di sepanjang batang.
   Titik (0,0) = sudut bingkai; sudut lain didapat dengan pencerminan (CSS). */
const bloomG = (x, y, r, s, d) => `<g transform="translate(${x} ${y})"><g class="br" style="--bd:${d}s"><use href="#fl-bloom" transform="rotate(${r}) scale(${s})"/></g></g>`;
const leafG = (x, y, r, d) => `<g transform="translate(${x} ${y}) rotate(${r})"><path class="lf" style="--bd:${d}s" d="M0 0c6-8 16-10 24-6-5 8-15 10-24 6z" fill="#9db9d3"/></g>`;
const budG = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="3.6" fill="#ee9ab5" transform="rotate(${r} ${x} ${y})"/>`;
const COVER_ART = `<svg viewBox="0 0 260 260" aria-hidden="true" focusable="false"><g class="wind">
<circle class="halo" cx="46" cy="46" r="96" fill="url(#flHalo)" style="transform-origin:46px 46px"/>
<g class="tw tw1" style="transform-origin:0px 0px">
<path d="M-6 -4C34 -12 62 16 104 6S170 -10 214 10" fill="none" stroke="#8a6b6f" stroke-width="2.2" stroke-linecap="round"/>
<path d="M104 6C116 -8 132 -14 150 -9" fill="none" stroke="#8a6b6f" stroke-width="1.5" stroke-linecap="round"/>
<path d="M170 -4C180 -14 192 -18 204 -15" fill="none" stroke="#8a6b6f" stroke-width="1.3" stroke-linecap="round"/>
${leafG(56, 8, -22, 0)}${leafG(126, -4, 24, -1.2)}${leafG(180, -6, -16, -0.6)}
${bloomG(78, 13, 30, 0.9, -1.4)}${bloomG(152, -9, -20, 0.78, -2.6)}${bloomG(214, 10, 15, 0.62, -0.8)}${bloomG(206, -15, 40, 0.5, -3.2)}
${budG(122, -15, -30)}${budG(36, -9, 20)}${budG(190, 6, 10)}
</g>
<g class="tw tw2" style="transform-origin:0px 0px">
<path d="M-4 -6C-12 34 16 62 6 104S-10 170 10 214" fill="none" stroke="#8a6b6f" stroke-width="2.2" stroke-linecap="round"/>
<path d="M6 104C-8 116 -14 132 -9 150" fill="none" stroke="#8a6b6f" stroke-width="1.5" stroke-linecap="round"/>
<path d="M-4 170C-14 180 -18 192 -15 204" fill="none" stroke="#8a6b6f" stroke-width="1.3" stroke-linecap="round"/>
${leafG(8, 56, 112, -0.4)}${leafG(-4, 126, 66, -1.8)}${leafG(-6, 180, 106, -2.4)}
${bloomG(13, 78, -30, 0.9, -2.1)}${bloomG(-9, 152, 20, 0.78, -0.5)}${bloomG(10, 214, -15, 0.62, -1.7)}${bloomG(-15, 206, -40, 0.5, -2.9)}
${budG(-15, 122, 60)}${budG(-9, 36, 70)}${budG(6, 190, 80)}
</g>
${bloomG(10, 10, 12, 1.25, 0)}${bloomG(38, 0, -8, 0.7, -2)}${bloomG(0, 38, 8, 0.7, -3.4)}
</g></svg>`;

/* Ranting di bagian isi undangan baru "mekar" setelah pengunjung benar-benar
   menggulir dan ranting itu sendiri terlihat di layar (bukan sekadar bagian
   induknya mulai tampak). Ranting di sampul mekar saat sampul tampil. */
let floralScrolled = false;
const floralPending = [];

function bloomVisibleFlorals() {
  if (!floralScrolled || !document.body.classList.contains("open")) return;
  floralPending.forEach(f => { if (f.visible) f.el.classList.add("in"); });
}

addEventListener("scroll", () => {
  if (!floralScrolled && scrollY > 24) {
    floralScrolled = true;
    bloomVisibleFlorals();
  }
}, { passive: true });

function initFloral() {
  const spots = [[".cover-frame", "tl tr bl br"], ["#pair > .person:nth-of-type(1) .ph", "tl"], ["#pair > .person:nth-of-type(2) .ph", "tr"], ["#ev .evc:nth-of-type(1)", "tl bl"], ["#ev .evc:nth-of-type(2)", "tr br"], [".s-event", "tl tr"], [".s-closing", "bl br"]];
  spots.forEach(([sel, pos]) => {
    const host = $(sel);
    if (!host || host.dataset.fl) return;
    host.dataset.fl = "1";
    const isCover = sel === ".cover-frame";
    const items = pos.split(" ").map(p => {
      const el = document.createElement("span");
      el.className = `floral ${p}`;
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = `<span class="fl-in">${C.floralImg
        ? `<img src="${esc(C.floralImg)}" alt="" draggable="false">`
        : (isCover ? COVER_ART : FLORAL_ART)}</span>`;
      host.appendChild(el);
      return el;
    });

    /* Goyangan angin: hanya saat bagian induknya ada di layar */
    new IntersectionObserver(es => {
      const on = es[0].isIntersecting;
      items.forEach(el => el.classList.toggle("run", on && !reduceMotion));
      if (isCover && on) items.forEach(el => el.classList.add("in"));
    }, { threshold: 0.12 }).observe(host);

    if (isCover) return;

    /* Mekar: tiap ranting dipantau sendiri, harus terlihat cukup jauh di dalam layar */
    items.forEach(el => {
      const f = { el, visible: false };
      floralPending.push(f);
      new IntersectionObserver(es => {
        f.visible = es[0].isIntersecting;
        bloomVisibleFlorals();
      }, { threshold: 0.5, rootMargin: el.classList.contains("bl") || el.classList.contains("br") ? "0px" : "0px 0px -12% 0px" }).observe(el);
    });
  });
}


/* ====== 12c. KELOPAK SAKURA BERJATUHAN ======
   Satu kanvas ringan: kelopak bergoyang pelan mengikuti angin, berputar dan
   "terbalik" seperti kelopak sungguhan. Sprite digambar sekali lalu dipakai
   ulang, jumlahnya menyesuaikan lebar layar, dan berhenti saat tab tersembunyi. */
function initPetals() {
  const cv = $("#petals");
  if (!cv || reduceMotion) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const DPR = Math.min(devicePixelRatio || 1, 1.75);
  let W = innerWidth, H = innerHeight;
  const resize = () => {
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  const PAL = [["#fff8fb", "#f8cddb", "#ee9ab5"], ["#fffafb", "#fbd9e4", "#f1a9c0"], ["#fff2f6", "#f3b4c8", "#e58aab"]];
  const sprites = PAL.map(([c0, c1, c2]) => {
    const s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d");
    g.translate(32, 58);
    g.scale(2.8, 2.8);
    const path = new Path2D("M0 0C-5 -5 -8.5 -13 -4.8 -17.5C-3.2 -19 -1.1 -18.2 0 -16C1.1 -18.2 3.2 -19 4.8 -17.5C8.5 -13 5 -5 0 0Z");
    const grad = g.createLinearGradient(0, 0, 0, -19);
    grad.addColorStop(0, c2);
    grad.addColorStop(0.45, c1);
    grad.addColorStop(1, c0);
    g.fillStyle = grad;
    g.fill(path);
    g.lineWidth = 0.35;
    g.strokeStyle = "rgba(217,107,144,.35)";
    g.stroke(path);
    g.beginPath();
    g.moveTo(0, -1.5);
    g.lineTo(0, -12);
    g.strokeStyle = "rgba(217,107,144,.28)";
    g.stroke();
    return s;
  });

  const lowEnd = (navigator.hardwareConcurrency || 8) <= 4;
  const N = Math.round(Math.min(26, Math.max(12, innerWidth / 62)) * (lowEnd ? 0.7 : 1));
  const make = fresh => {
    const z = Math.random();
    return {
      x: Math.random() * (W + 120) - 60,
      y: fresh ? -40 - Math.random() * H * 0.25 : Math.random() * H,
      s: (11 + Math.random() * 11) * (0.62 + z * 0.62),
      vy: (22 + Math.random() * 22) * (0.7 + z * 0.55),
      sw: 18 + Math.random() * 34,
      sf: 0.35 + Math.random() * 0.5,
      ph: Math.random() * 6.283,
      r: Math.random() * 6.283,
      rs: (Math.random() - 0.5) * 0.9,
      ff: 0.7 + Math.random() * 1.2,
      fp: Math.random() * 6.283,
      a: (0.55 + Math.random() * 0.4) * (0.65 + z * 0.35),
      z,
      spr: sprites[(Math.random() * sprites.length) | 0]
    };
  };
  const ps = Array.from({ length: N }, () => make(false));

  let t = 0;
  let last = 0;
  let fade = 0;
  const frame = now => {
    requestAnimationFrame(frame);
    if (document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    t += dt;
    fade = Math.min(1, fade + dt / 2.5);
    const gust = Math.max(0, Math.sin(t * 0.27) * Math.sin(t * 0.11 + 1.3));
    const wind = 8 + Math.sin(t * 0.17) * 12 + Math.sin(t * 0.43) * 5 + gust * 46;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.y += (p.vy + Math.sin(t * 1.3 + p.ph) * 6) * dt;
      p.x += (wind * (0.45 + p.z * 0.55) + Math.cos(t * p.sf + p.ph) * p.sw * p.sf) * dt;
      p.r += p.rs * dt;
      if (p.y > H + 40 || p.x < -90 || p.x > W + 90) { ps[i] = make(true); continue; }

      const flip = Math.cos(t * p.ff + p.fp);
      const edge = Math.min(1, (p.y + 40) / 90, (H + 40 - p.y) / 140);
      ctx.globalAlpha = p.a * fade * Math.max(0, edge) * (0.72 + 0.28 * Math.abs(flip));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r + Math.sin(t * p.sf + p.ph) * 0.55);
      ctx.scale(0.3 + 0.7 * Math.abs(flip), 1);
      ctx.drawImage(p.spr, -p.s / 2, -p.s * 0.9, p.s, p.s * 1.12);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };
  requestAnimationFrame(frame);
}
initPetals();


/* ====== 13. COVER & NAVIGATION ====== */
let coverHideTimer;
let coverOutTimer;
let startedAt = 0;

/**
 * Mengecek apakah halaman undangan sedang dalam status terbuka
 * @returns {boolean} Status terbuka
 */
const isOpen = () => document.body.classList.contains("open");

const openBtn = $("#openBtn");
if (openBtn) {
  openBtn.onclick = () => {
    if (isOpen()) return;
    document.body.classList.remove("locked");
    document.body.classList.add("open");

    const cover = $("#cover");
    if (cover) {
      cover.classList.remove("returning");
      cover.classList.add("leave");
      clearTimeout(coverOutTimer);
      clearTimeout(coverHideTimer);
      // Langsung picu keluarnya cover dalam 3D secara instan dan halus
      requestAnimationFrame(() => {
        cover.classList.add("out");
      });
      coverHideTimer = setTimeout(() => {
        cover.style.display = "none";
      }, 900);
    }

    startMusic();
    window.scrollTo(0, 0);
    startedAt = Date.now();
    startReveals();
    observeReveals();
    initTilt();
    setTimeout(() => $$(".car").forEach(c => c.mark && c.mark()), 550);
  };
}

const pill = $("#pill");
const pillBtn = $("#pillBtn");
if (pillBtn && pill) {
  pillBtn.onclick = () => pill.classList.toggle("min");
}

document.addEventListener("click", e => {
  const p = $("#pill");
  if (!p) return;
  if (!p.contains(e.target) || e.target.closest("a")) {
    p.classList.add("min");
  }
  const anchor = e.target.closest("a[href^='#']");
  if (anchor) {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$("#pill a").forEach(link => link.classList.toggle("on", link.hash === "#" + entry.target.id));
  });
}, { rootMargin: "-42% 0px -48% 0px", threshold: 0 });

$$("main section").forEach(s => sectionObserver.observe(s));


/* ====== 14. HERO SCROLL RETURN ====== */
let upScrollCount = 0;
let lastUpScrollTime = 0;

window.addEventListener("wheel", e => {
  if (!isOpen()) return;
  if (window.scrollY > 60) {
    upScrollCount = 0;
    return;
  }

  if (e.deltaY < 0) {
    const now = Date.now();
    if (now - lastUpScrollTime < 1000) {
      upScrollCount++;
    } else {
      upScrollCount = 1;
    }
    lastUpScrollTime = now;

    if (upScrollCount >= 4) {
      returnToCover();
      upScrollCount = 0;
    }
  } else {
    upScrollCount = 0;
  }
}, { passive: true });

// Touch: tarik ke bawah saat di bagian paling atas halaman
let heroTouchStartY = 0;
window.addEventListener("touchstart", e => {
  if (!isOpen() || window.scrollY > 60) return;
  heroTouchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener("touchmove", e => {
  if (!isOpen() || window.scrollY > 60 || heroTouchStartY === 0) return;
  const dy = e.touches[0].clientY - heroTouchStartY;
  if (dy > 120) {
    returnToCover();
    heroTouchStartY = 0;
  }
}, { passive: true });

/**
 * Menutup kembali undangan dan menampilkan layar sampul (cover).
 * Dipicu saat pengguna menggulir ke atas berulang kali dari puncak halaman hero.
 */
function returnToCover() {
  const cover = $("#cover");
  if (!cover) return;

  // Hapus timer penutupan cover yang sedang berjalan
  clearTimeout(coverHideTimer);
  clearTimeout(coverOutTimer);

  // Kembalikan visibilitas cover
  cover.style.display = "";
  cover.classList.remove("out", "leave");

  // Tambahkan kelas animasi kembali
  cover.classList.add("returning");

  // Kunci scroll body dan hapus status open
  document.body.classList.add("locked");
  document.body.classList.remove("open");

  // Redupkan musik jika sedang berputar
  if (bgm && !bgm.paused) {
    fadeVolume(0, 500, () => bgm.pause());
  }

  // Gulir ke puncak layar
  window.scrollTo(0, 0);

  // Animasi ulang konten cover
  cover.querySelectorAll(".anim").forEach(el => {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  });

  // Bersihkan kelas returning setelah animasi selesai
  setTimeout(() => {
    cover.classList.remove("returning");
  }, 900);

  // Reset pengamatan reveal agar dapat beranimasi ulang saat cover dibuka kembali
  revealObserver.disconnect();
  $$(".reveal.is-in").forEach(el => {
    el.classList.remove("is-in");
  });
  revealStarted = false;
}


/* ====== 15. PROGRESS BAR ====== */
const progressBar = $("#progress i");
let progressRaf = 0;

/**
 * Memperbarui posisi indikator progress scroll di bagian atas layar
 */
function updateProgress() {
  progressRaf = 0;
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const value = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${value})`;
  const progEl = $("#progress");
  if (progEl) progEl.classList.toggle("show", isOpen() && h.scrollTop > 20);
}

addEventListener("scroll", () => {
  progressRaf = progressRaf || requestAnimationFrame(updateProgress);
}, { passive: true });


/* ====== 16. INITIALIZATION ====== */
resolveGuest()
  .then(() => {
    renderContent();
    initAllStages();
    initTilt();
    return loadWishes();
  })
  .then(() => {
    observeReveals();
  })
  .catch(err => {
    console.error("Inisialisasi undangan:", err);
    renderContent();
    initAllStages();
  });