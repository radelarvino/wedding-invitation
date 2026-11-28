/* =====================================================================
   INTRO SINEMATIK — PINTU GANDA (TIRAI)
   Satu pintu kontrol: openInvitation() / closeInvitation().
   Bergantung pada script.js (startMusic, enterInvitation, returnToCover,
   renderContent) yang dimuat lebih dulu sebagai script klasik.
   ===================================================================== */
(function () {
  "use strict";

  var intro = document.getElementById("intro");
  if (!intro) return;

  var body = document.body;
  var seal = document.getElementById("introSeal");
  var openBtn = document.getElementById("introOpen");
  var skipBtn = document.getElementById("introSkip");
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = function () { return reduceQuery.matches; };

  var opened = false;   // undangan sudah terbuka
  var busy = false;     // transisi sedang berjalan
  var doneTimer = 0;

  /* Sembunyikan sampul lama; intro yang mengambil alih. */
  body.classList.add("intro-mode");

  /* Selaraskan nama tamu dari logika ?to=&k= yang sudah ada. */
  function mirrorGuest() {
    var source = document.getElementById("guest");
    var target = document.getElementById("introGuest");
    if (!source || !target) return;
    var value = (source.textContent || "").trim();
    if (value) target.textContent = value;
  }

  mirrorGuest();
  if (document.getElementById("guest") && "MutationObserver" in window) {
    var mo = new MutationObserver(mirrorGuest);
    mo.observe(document.getElementById("guest"), {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  function callGlobal(name) {
    try {
      if (typeof window[name] === "function") return window[name]();
    } catch (err) {
      /* Intro tetap berjalan walau pembantu lama gagal. */
    }
  }

  function focusSeal() {
    try {
      if (seal) seal.focus({ preventScroll: true });
    } catch (err) {
      /* fokus opsional */
    }
  }

  /**
   * Membuka undangan: segel retak, pintu terbuka, halaman utama menyusul.
   * @param {boolean} [fast] lewati animasi (tombol "Lewati")
   */
  function openInvitation(fast) {
    if (opened || busy) return;
    busy = true;

    var quick = !!fast || reduce();

    callGlobal("startMusic"); // dipicu gestur pengguna
    intro.classList.add("is-opening");
    if (fast) intro.classList.add("is-skip");
    intro.setAttribute("aria-busy", "true");

    window.setTimeout(function () {
      intro.classList.add("is-revealing");
      callGlobal("enterInvitation"); // body.open → main muncul dari balik pintu
    }, quick ? 60 : 1300);

    window.clearTimeout(doneTimer);
    doneTimer = window.setTimeout(function () {
      intro.classList.add("is-done");
      intro.setAttribute("aria-hidden", "true");
      intro.style.display = "none";
      body.classList.remove("intro-mode");
      body.classList.add("intro-entered");
      opened = true;
      busy = false;
    }, quick ? 460 : 2700);
  }

  /**
   * Kembali ke sampul: pintu menutup rapat, segel turun kembali.
   * Dipanggil dari gulir-naik di puncak halaman (menggantikan returnToCover).
   */
  function closeInvitation() {
    if (!opened || busy) return;
    busy = true;

    var base = window.__introBaseReturn;

    intro.style.display = "";
    intro.removeAttribute("aria-hidden");
    intro.removeAttribute("aria-busy");
    intro.classList.remove("is-done", "is-opening", "is-skip", "is-revealing");
    body.classList.add("intro-mode");
    body.classList.remove("intro-entered");

    if (typeof base === "function") base();

    /* Paksa reflow agar animasi penutupan dimulai dari keadaan terbuka. */
    void intro.offsetWidth;
    intro.classList.add("is-closing");

    window.clearTimeout(doneTimer);
    doneTimer = window.setTimeout(function () {
      intro.classList.remove("is-closing");
      opened = false;
      busy = false;
      focusSeal();
    }, reduce() ? 320 : 1200);
  }

  /* Ekspos API tunggal. */
  window.openInvitation = openInvitation;
  window.closeInvitation = closeInvitation;

  /* returnToCover asli menyimpan bookkeeping (musik, reveal, scroll).
     Simpan lalu ganti dengan versi intro. */
  if (typeof window.returnToCover === "function") {
    window.__introBaseReturn = window.returnToCover;
    window.returnToCover = closeInvitation;
  }

  /* Interaksi */
  if (seal) seal.addEventListener("click", function () { openInvitation(false); });
  if (openBtn) openBtn.addEventListener("click", function () { openInvitation(false); });
  if (skipBtn) skipBtn.addEventListener("click", function () { openInvitation(true); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !opened) openInvitation(false);
  });

  /* Fokus awal di segel agar keyboard langsung bisa membuka. */
  requestAnimationFrame(focusSeal);
})();
