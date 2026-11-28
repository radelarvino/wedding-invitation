/* =====================================================================
   TIRAI PANGGUNG — KONTROL OVERLAY
   API publik: openCurtain() / closeCurtain()
   Tidak menyentuh script.js. Alur lama (tombol "Buka undangan" → musik →
   halaman utama) tetap berjalan setelah tirai tersingkap.
   ===================================================================== */
(function () {
  "use strict";

  var curtain = document.getElementById("curtain");
  if (!curtain) return;

  var stage = curtain.querySelector(".curtain__stage");
  var panels = Array.prototype.slice.call(curtain.querySelectorAll(".curtain__panel"));
  var strips = Array.prototype.slice.call(curtain.querySelectorAll(".ct-pleat"));
  var stageLight = document.getElementById("stageLight");
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = function () { return reduceQuery.matches; };

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var p = 0;              // 0 tertutup, 1 terbuka
  var raf = 0;
  var openTimer = 0;
  var fadeTimer = 0;
  var hideTimer = 0;
  var revealTimer = 0;
  var doneTimer = 0;
  var phase = "idle";     // idle | drag | anim | open
  var textShown = false;
  var startX = 0;
  var startY = 0;
  var startP = 0;
  var lastX = 0;
  var lastT = 0;
  var velocity = 0;
  var dragged = false;
  var pointerId = null;
  var closing = false;
  var openBoost = 0;      // momentum dari kecepatan drag

  /* ---------- Utilitas ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* Tempo konstan: kain bergerak dengan kecepatan tetap yang smooth. */
  function easeOpen(t) {
    return t;
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function cancelRaf() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = 0;
    }
    if (fadeTimer) {
      clearTimeout(fadeTimer);
      fadeTimer = 0;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = 0;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = 0;
    }
    if (doneTimer) {
      clearTimeout(doneTimer);
      doneTimer = 0;
    }
  }

  /* ---------- Ukur panel: bobot geser & fase per lipatan ---------- */
  function measure(silent) {
    vw = window.innerWidth;
    vh = window.innerHeight;
    if (curtain.hidden) return;

    panels.forEach(function (panel) {
      var isLeft = panel.classList.contains("curtain__panel--l");
      var side = isLeft ? -1 : 1;
      var panelW = panel.getBoundingClientRect().width || vw * 0.504;
      var list = Array.prototype.slice.call(panel.querySelectorAll(".ct-pleat"));
      var n = list.length;

      panel._side = side;
      panel._w = panelW;
      panel._lining = panel.querySelector(".curtain__lining");
      panel._hem = panel.querySelector(".curtain__hem");

      list.forEach(function (el, i) {
        var off = el.offsetLeft + el.offsetWidth / 2;
        el._side = side;
        // jarak lipatan ke tepi luar panel → semua kain berkumpul di tepi
        el._mx = isLeft ? off : Math.max(0, panelW - off);
        // Stagger identik: dari tengah ke luar pada kedua panel, tanpa jeda
        // tambahan, supaya kiri dan kanan bergerak bersamaan.
        var step = 0.028 + (i % 3) * 0.004;
        el._delay = (isLeft ? n - 1 - i : i) * step / 2.8;
        el._dur = 1;
        // Lipatan dekat tepi dalam ditarik lebih kuat (tempat tangan orang
        // memegang gorden); sedikit ketidakteraturan agar tidak kaku.
        el._inner = isLeft ? i / (n - 1) : (n - 1 - i) / (n - 1);
        el._jitter = ((i * 37) % 11) / 11;
        el._lift = ((i * 17) % 7) / 7;
      });
    });

    if (silent !== true) render(p);
  }

  /* ---------- Gambar satu frame ---------- */
  function render(progress) {
    p = progress;

    /* Di akhir animasi seluruh kain benar-benar keluar frame, bukan cuma
       mengumpul di tepi. */
    var exit = clamp((p - 0.62) / 0.38, 0, 1) * vw * 0.78;

    for (var i = 0; i < strips.length; i++) {
      var el = strips[i];
      var d = el._delay || 0;
      var local = d >= 0.999 ? 1 : (p - d) / (1 - d);
      local = clamp(local * (el._dur || 1), 0, 1);

      /* Gerak linier dengan tempo tetap — tidak ada akselerasi mendadak. */
      var se = local;

      /* Tepi dalam (dekat tangan) miring paling kuat; kemiringan memuncak
         awal tarikan lalu lurus lagi saat kain selesai dikumpulkan. */
      var bend = 9 * Math.sin(Math.PI * Math.sqrt(local)) *
        (0.62 + 0.55 * el._inner);

      el.style.setProperty("--ct-comp", se.toFixed(3));
      el.style.setProperty("--dx",
        (el._side * (el._mx * se * (0.42 + 0.06 * el._jitter) + exit)).toFixed(2) + "px");
      /* Kain tetap solid: jangan gepeng, cukup sedikit mengumpul lalu
         digeser keluar frame. */
      el.style.setProperty("--sc", (1 - 0.36 * se).toFixed(3));
      el.style.setProperty("--ty",
        (se * (3 + 5 * el._lift) + Math.sin(local * Math.PI * 3) * 1.6 * (1 - local)).toFixed(2) + "px");
      el.style.setProperty("--sk", (el._side * bend).toFixed(2) + "deg");
    }

    // Hem tertinggal sedikit, lining mengikuti tepi kain.
    for (var j = 0; j < panels.length; j++) {
      var pd = panels[j];
      var e = clamp((p - 0.06) / 0.86, 0, 1);
      var hemE = clamp((p - 0.16) / 0.84, 0, 1);

      if (pd._lining) {
        pd._lining.style.transform =
          "translate3d(" + (pd._side * pd._w * 0.86 * e).toFixed(2) + "px,0,0)";
      }
      if (pd._hem) {
        pd._hem.style.transform =
          "skewY(" + (pd._side * 0.8 * hemE).toFixed(2) + "deg) " +
          "scaleX(" + (1 - 0.82 * hemE).toFixed(3) + ")";
        pd._hem.style.opacity = (0.42 * Math.max(0, 1 - hemE * 2.2)).toFixed(3);
      }
    }

    var bd = 1 - clamp(p / 0.2, 0, 1);
    /* Cahaya menyala penuh sejak celah pertama dan tetap memenuhi halaman
      sampai tirai selesai keluar frame; pemudanya diatur finishOpen(). */
    var lightIn = clamp(p / 0.06, 0, 1);
    var panelOut = 1 - clamp((p - 0.9) / 0.1, 0, 1);
    var shellOpen = clamp(p / 0.34, 0, 1);

    curtain.style.setProperty("--panel-o", panelOut.toFixed(3));
    curtain.style.setProperty("--bd-o", bd.toFixed(3));
    curtain.style.setProperty("--shell-o", shellOpen.toFixed(3));
    curtain.style.setProperty("--erase", (shellOpen * 100).toFixed(1) + "%");
    curtain.style.setProperty("--mono-o", String(1 - clamp((p - 0.34) / 0.16, 0, 1)));
    if (stageLight) stageLight.style.setProperty("--light-o", lightIn.toFixed(3));
  }

  /* ---------- Teks welcome dipecah per kata untuk shape-in bertahap ---------- */
  function splitWords() {
    var targets = document.querySelectorAll(
      "#cover .cover-content .anim, #cover .guest-card label, " +
      "#cover .guest-card .guest-name, #cover .btn-open, #cover .cover-foot"
    );
    var wi = 0;

    Array.prototype.forEach.call(targets, function (el) {
      if (!el || el.dataset.words === "1") return;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      var nodes = [];
      var node;

      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.trim()) nodes.push(node);
      }

      nodes.forEach(function (textNode) {
        var parts = textNode.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();

        parts.forEach(function (part) {
          if (!part || /^\s+$/.test(part)) {
            if (part) frag.appendChild(document.createTextNode(part));
            return;
          }
          var word = document.createElement("span");
          word.className = "rv-word";
          word.style.setProperty("--wi", String(wi++));
          word.textContent = part;
          frag.appendChild(word);
        });

        textNode.parentNode.replaceChild(frag, textNode);
      });

      el.dataset.words = "1";
    });
  }

  /* ---------- Bunga sakura jatuh (dipicu setelah tirai selesai) ---------- */
  function spawnSakura() {
    var host = document.getElementById("sakuraFall");
    if (!host || reduce()) return;
    var count = vw < 480 ? 9 : 14;

    for (var i = 0; i < count; i++) {
      var bloom = document.createElement("span");
      bloom.className = "sakura-petal";
      bloom.style.left = (6 + Math.random() * 88).toFixed(2) + "%";
      bloom.style.setProperty("--dx", (Math.random() * 140 - 70).toFixed(0) + "px");
      bloom.style.setProperty("--rot", (Math.random() * 460 - 160).toFixed(0) + "deg");
      bloom.style.animationDuration = (3.4 + Math.random() * 2.4).toFixed(2) + "s";
      bloom.style.animationDelay = (Math.random() * 1.1).toFixed(2) + "s";
      bloom.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      host.appendChild(bloom);
    }
  }

  function clearSakura() {
    var host = document.getElementById("sakuraFall");
    if (host) host.innerHTML = "";
  }

  /* ---------- Buka tirai ---------- */
  function openCurtain() {
    if (phase === "open" || phase === "anim") return;

    cancelRaf();
    closing = false;
    phase = "anim";
    curtain.classList.add("is-live", "is-moving");
    curtain.classList.remove("is-idle");
    document.body.classList.add("curtain-reveal", "env-entered", "curtain-anim");

    // Ranting sakura bingkai sampul ikut mekar saat tirai tersingkap.
    try {
      if (typeof coverFlorals !== "undefined" && coverFlorals) {
        coverFlorals.forEach(function (el) { el.classList.add("in"); });
      }
      Array.prototype.forEach.call(
        document.querySelectorAll("#cover .cover-frame .floral, #cover > .floral"),
        function (el) { el.classList.add("in"); }
      );
    } catch (err) {}

    if (reduce()) {
      curtain.classList.add("is-leaving");
      document.body.classList.add("curtain-text");
      window.setTimeout(finishOpen, 320);
      return;
    }

    // Anticipation 0,2 s: kain tertarik sedikit ke tengah.
    curtain.classList.add("is-anticipating");
    openTimer = window.setTimeout(function () {
      openTimer = 0;
      if (phase !== "anim") return;
      curtain.classList.remove("is-anticipating");
      startOpening();
    }, 200);

    function startOpening() {
      var from = p;
      var started = 0;
      var duration = 3600 * (1 - openBoost);
      openBoost = 0;

      function step(now) {
        if (!started) started = now;
        var t = clamp((now - started) / duration, 0, 1);
        var eased = easeOpen(t);
        var raw = from + (1 - from) * eased;

        /* Begitu celah tampak penuh, kain langsung diselesaikan: tidak ada
           masa tunggu dengan sisa lipatan masih terlihat di tepi layar. */
        if (raw >= 0.995 || t >= 1) {
          render(1);
          finishOpen();
          return;
        }

        render(raw);
        raf = requestAnimationFrame(step);
      }

      raf = requestAnimationFrame(step);
    }
  }

  function finishOpen() {
    phase = "open";
    cancelRaf();
    render(1);
    curtain.style.pointerEvents = "none";
    curtain.setAttribute("aria-hidden", "true");
    stage.setAttribute("tabindex", "-1");

    fadeTimer = window.setTimeout(function () {
      fadeTimer = 0;
      curtain.classList.add("is-leaving");
    }, reduce() ? 0 : 60);

    hideTimer = window.setTimeout(function () {
      hideTimer = 0;
      curtain.classList.add("is-leaving");
      curtain.hidden = true;
      curtain.classList.remove("is-live", "is-moving", "is-anticipating");
      Array.prototype.forEach.call(
        document.querySelectorAll("#cover .cover-frame .floral, #cover > .floral"),
        function (el) { el.classList.add("in"); }
      );
      /* Tirai sudah keluar frame: bunga sakura mulai jatuh. Cahaya masih
        penuh dan akan menemani jeda sebelum welcome muncul. */
      spawnSakura();
    }, reduce() ? 0 : 460);

    /* Jeda 1 detik dengan halaman penuh cahaya, baru welcome shape-in. */
    revealTimer = window.setTimeout(function () {
      revealTimer = 0;
      textShown = true;
      document.body.classList.add("curtain-text");

      doneTimer = window.setTimeout(function () {
        doneTimer = 0;
        document.body.classList.add("curtain-done");
        document.body.classList.remove("curtain-reveal", "curtain-text");
        /* Cahaya baru memudar halus setelah seluruh teks masuk. */
        if (stageLight) stageLight.style.setProperty("--light-o", "0");
      }, reduce() ? 0 : 900);
    }, reduce() ? 0 : 1000);

    focusOpenButton();
  }

  function focusOpenButton() {
    var btn = document.getElementById("openBtn");
    if (!btn) return;
    try {
      btn.focus({ preventScroll: true });
    } catch (err) {}
  }

  /* ---------- Tutup / kembalikan tirai ---------- */
  function closeCurtain(instant) {
    cancelRaf();
    var wasHidden = curtain.hidden;
    curtain.hidden = false;
    if (stageLight) stageLight.style.setProperty("--light-o", "0");
    curtain.removeAttribute("aria-hidden");
    curtain.style.pointerEvents = "";
    curtain.classList.remove("is-leaving", "is-moving", "is-live", "is-anticipating");
    document.body.classList.remove(
      "curtain-reveal", "curtain-text", "curtain-done", "env-entered", "curtain-anim"
    );
    if (wasHidden) measure(true);

    textShown = false;
    clearSakura();

    Array.prototype.forEach.call(
      document.querySelectorAll("#cover .anim"),
      function (el) {
        el.style.animation = "";
        el.style.opacity = "";
        el.style.transform = "";
      }
    );

    if (instant || reduce() || p <= 0.001) {
      closing = false;
      render(0);
      curtain.classList.add("is-idle");
      phase = "idle";
      stage.setAttribute("tabindex", "0");
      return;
    }

    closing = true;
    phase = "anim";
    var from = p;
    var started = 0;
    var duration = 900;

    function step(now) {
      if (!started) started = now;
      var t = clamp((now - started) / duration, 0, 1);
      render(from * (1 - easeInOut(t)));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        closing = false;
        render(0);
        phase = "idle";
        curtain.classList.remove("is-moving", "is-live");
        curtain.classList.add("is-idle");
        document.body.classList.remove("curtain-text");
        stage.setAttribute("tabindex", "0");
      }
    }

    raf = requestAnimationFrame(step);
  }

  /* ---------- Interaksi pointer (drag / tap) ---------- */
  function onDown(e) {
    if (phase === "open" || phase === "anim" || e.button === 2) return;
    cancelRaf();
    phase = "drag";
    closing = false;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = e.clientY;
    startP = p;
    lastT = performance.now();
    velocity = 0;
    dragged = false;

    curtain.classList.add("is-live", "is-moving");
    curtain.classList.remove("is-idle");

    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function onMove(e) {
    if (phase !== "drag" || e.pointerId !== pointerId) return;

    var now = performance.now();
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;

    if (!dragged && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
      dragged = true;
      document.body.classList.add("curtain-reveal", "env-entered", "curtain-anim");
    }
    if (!dragged) return;

    var dt = Math.max(1, now - lastT);
    velocity = Math.abs(e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;

    var next = startP + Math.abs(dx) / (vw * 0.55);
    render(clamp(next, 0, 1));
  }

  function onUp(e) {
    if (phase !== "drag" || e.pointerId !== pointerId) return;
    pointerId = null;

    try { stage.releasePointerCapture(e.pointerId); } catch (err) {}

    if (!dragged) {
      openCurtain();
      return;
    }

    if (p >= 0.4 || velocity > 0.55) {
      openBoost = clamp((velocity - 0.55) / 2, 0, 0.22);
      openCurtain();
    } else {
      springBack();
    }
  }

  function springBack() {
    phase = "anim";
    var from = p;
    var started = 0;
    var duration = 620;

    function step(now) {
      if (!started) started = now;
      var t = clamp((now - started) / duration, 0, 1);
      // pegas teredam dengan sedikit overshoot negatif
      var eased = 1 - Math.pow(1 - t, 3);
      var wobble = t >= 1 ? 0 : Math.sin(t * Math.PI * 3) * (1 - t) * 0.05;
      render(Math.max(0, from * (1 - eased) - wobble));

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        render(0);
        phase = "idle";
        curtain.classList.remove("is-moving", "is-live");
        curtain.classList.add("is-idle");
        document.body.classList.remove("curtain-text", "curtain-reveal");
        textShown = false;
        closing = false;
      }
    }
    raf = requestAnimationFrame(step);
  }

  /* ---------- Pasang semua ---------- */
  splitWords();
  measure();

  curtain.classList.add("is-idle");

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);

  stage.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      openCurtain();
    }
  });

  window.addEventListener("resize", measure, { passive: true });
  reduceQuery.addEventListener("change", function () {
    if (reduce() && phase === "idle") {
      curtain.classList.remove("is-moving");
    }
  });

  window.openCurtain = openCurtain;
  window.closeCurtain = closeCurtain;
})();
