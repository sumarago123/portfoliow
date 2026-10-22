/* =========================================================
   Angelo Sumarago — Portfolio (light + dark themes)
   Vanilla JS, no dependencies
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const isDark = function () { return root.getAttribute("data-theme") === "dark"; };
  const isVisible = function (el) { return el && el.getClientRects().length > 0; };

  /* =======================================================
     THEME TOGGLE
     ======================================================= */
  const themeBtn = document.getElementById("themeToggle");
  const cssLight = document.getElementById("cssLight");
  const cssDark = document.getElementById("cssDark");
  const themeColor = document.getElementById("themeColor");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    cssLight.media = theme === "light" ? "all" : "not all";
    cssDark.media = theme === "dark" ? "all" : "not all";
    themeColor.content = theme === "dark" ? "#07070c" : "#f4efe4";
    themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    try { localStorage.setItem("as-theme", theme); } catch (e) {}
    onThemeChange();
  }

  themeBtn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");

  themeBtn.addEventListener("click", function () {
    const next = isDark() ? "light" : "dark";

    // no View Transitions support (or reduced motion): switch instantly
    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // circular reveal spreading out from the toggle button
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const t = document.startViewTransition(function () { applyTheme(next); });
    t.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
        { duration: 750, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  });

  /* =======================================================
     NAV
     ======================================================= */
  const navToggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  function setMenu(open) {
    links.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  navToggle.addEventListener("click", function () { setMenu(!links.classList.contains("is-open")); });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // active link (only sections visible in the current theme count)
  const navAnchors = Array.prototype.slice.call(links.querySelectorAll("a"));
  function updateActive() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    navAnchors.forEach(function (a) {
      const sec = document.querySelector(a.getAttribute("href"));
      if (isVisible(sec) && sec.offsetTop <= y) current = sec.id;
    });
    navAnchors.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + current); });
  }
  window.addEventListener("scroll", updateActive, { passive: true });

  /* =======================================================
     TYPED ROLES
     ======================================================= */
  const typedEl = document.getElementById("typed");
  const roles = ["Web Developer", "Web3 Developer", "Aspiring IT Technician", "Aspiring Business Analyst"];
  if (typedEl && !reduceMotion) {
    let r = 0, c = roles[0].length, deleting = true;
    setTimeout(function tick() {
      if (deleting) {
        typedEl.textContent = roles[r].slice(0, --c);
        if (c === 0) { deleting = false; r = (r + 1) % roles.length; return setTimeout(tick, 350); }
        return setTimeout(tick, 40);
      }
      typedEl.textContent = roles[r].slice(0, ++c);
      if (c === roles[r].length) { deleting = true; return setTimeout(tick, 1800); }
      setTimeout(tick, 75);
    }, 2000);
  }

  /* =======================================================
     REVEAL ON SCROLL (+ count-up stats)
     ======================================================= */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const to = parseInt(el.dataset.to, 10) || 0;
    if (reduceMotion) { el.textContent = to; return; }
    const dur = 1100, start = performance.now();
    (function step(now) {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    // hidden (other-theme) elements never intersect, so they reveal when their theme is shown
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-visible");
        el.querySelectorAll(".count").forEach(countUp);
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ""; }, 1000);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    document.querySelectorAll(".count").forEach(countUp);
  }

  /* =======================================================
     HERO PHOTO — hover removes the gradient (CSS);
     tap toggles it on touch screens
     ======================================================= */
  document.querySelectorAll(".hero__visual").forEach(function (visual) {
    visual.addEventListener("click", function () { visual.classList.toggle("is-revealed"); });
  });

  // dark: NFT card tilts toward the cursor
  const nft = document.getElementById("nft");
  if (nft && finePointer && !reduceMotion) {
    const holder = nft.parentElement;
    holder.addEventListener("pointermove", function (e) {
      const r = holder.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      nft.style.transform = "rotateY(" + px * 14 + "deg) rotateX(" + -py * 14 + "deg)";
    });
    holder.addEventListener("pointerleave", function () { nft.style.transform = ""; });
  }

  /* light: cursor-follow blob */
  const blob = document.querySelector(".cursor-blob");
  if (blob && finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      if (isDark()) return;
      blob.style.transform = "translate(" + (e.clientX - 130) + "px," + (e.clientY - 130) + "px)";
    }, { passive: true });
  }

  /* =======================================================
     DARK: block hashes (decorative, derived from each block's text)
     ======================================================= */
  function hashHex(str, seed) {
    let out = "";
    for (let pass = 0; pass < 8; pass++) {
      let h = 2166136261 ^ (seed + pass * 7919);
      for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
      out += (h >>> 0).toString(16).padStart(8, "0");
    }
    return "0x" + out;
  }
  let prev = "genesis";
  Array.prototype.slice.call(document.querySelectorAll(".block")).reverse().forEach(function (block, i) {
    const h = hashHex(prev + block.textContent, i);
    const el = block.querySelector(".hash");
    if (el) el.textContent = h;
    prev = h;
  });

  /* =======================================================
     DARK: candlestick chart behind the hero (decorative)
     ======================================================= */
  const canvas = document.getElementById("chart");
  let drawChart = function () {};
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const CANDLE_W = 14, GAP = 8;
    let candles = [], last = 100, w = 0, h = 0;

    const makeCandle = function () {
      const open = last;
      const close = Math.max(20, open + (Math.random() - 0.42) * 8); // slight upward drift
      const high = Math.max(open, close) + Math.random() * 4;
      const low = Math.min(open, close) - Math.random() * 4;
      last = close;
      return { open: open, close: close, high: high, low: low };
    };

    const resize = function () {
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return; // hidden in light theme
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const need = Math.ceil(w / (CANDLE_W + GAP)) + 2;
      while (candles.length < need) candles.push(makeCandle());
      drawChart();
    };

    drawChart = function () {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const visible = candles.slice(-Math.ceil(w / (CANDLE_W + GAP)));
      let min = Infinity, max = -Infinity;
      visible.forEach(function (c) { min = Math.min(min, c.low); max = Math.max(max, c.high); });
      const pad = 10, range = (max - min) || 1;
      const y = function (v) { return h - pad - ((v - min) / range) * (h - pad * 2); };
      visible.forEach(function (c, i) {
        const x = i * (CANDLE_W + GAP) + GAP;
        ctx.strokeStyle = ctx.fillStyle = c.close >= c.open ? "#2bff9a" : "#ff4fa3";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + CANDLE_W / 2, y(c.high));
        ctx.lineTo(x + CANDLE_W / 2, y(c.low));
        ctx.stroke();
        ctx.fillRect(x, y(Math.max(c.open, c.close)), CANDLE_W, Math.max(2, Math.abs(y(c.open) - y(c.close))));
      });
    };

    // ResizeObserver also fires when the canvas goes from hidden to shown on theme switch
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize);
    resize();

    if (!reduceMotion) {
      setInterval(function () {
        if (document.hidden || !isDark()) return;
        candles.push(makeCandle());
        if (candles.length > 400) candles = candles.slice(-200);
        drawChart();
      }, 1200);
    }
  }

  /* =======================================================
     DARK: escrow transaction loop (WhiteMarket preview)
     ======================================================= */
  const escrowState = document.getElementById("escrowState");
  const txLog = document.getElementById("txLog");
  if (escrowState && txLog) {
    const contract = escrowState.parentElement;
    const steps = [
      { state: "LOCKED", log: "> buyer deposited funds → escrow" },
      { state: "LOCKED", log: "> seller shipped item…" },
      { state: "LOCKED", log: "> buyer confirmed delivery ✓" },
      { state: "RELEASED", log: "> funds released → seller ✓" }
    ];
    let s = 0;
    const show = function () {
      escrowState.textContent = steps[s].state;
      contract.classList.toggle("is-released", steps[s].state === "RELEASED");
      txLog.textContent = steps[s].log;
      s = (s + 1) % steps.length;
    };
    show();
    if (!reduceMotion) setInterval(function () { if (isDark()) show(); }, 2200);
  }

  /* =======================================================
     COPY EMAIL
     ======================================================= */
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast() {
    toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-show"); }, 2000);
  }

  document.querySelectorAll(".js-copy").forEach(function (btn) {
    const hint = btn.querySelector(".js-copy-hint");
    const original = hint ? hint.textContent : "";
    btn.addEventListener("click", function () {
      const email = btn.dataset.email;
      const done = function () {
        if (hint) {
          hint.textContent = "Copied ✓";
          setTimeout(function () { hint.textContent = original; }, 2000);
        }
        showToast();
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(done, function () { window.location.href = "mailto:" + email; });
      } else {
        // fallback for file:// or older browsers
        const ta = document.createElement("textarea");
        ta.value = email; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (err) { window.location.href = "mailto:" + email; }
        document.body.removeChild(ta);
      }
    });
  });

  /* =======================================================
     MISC
     ======================================================= */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  function onThemeChange() {
    updateActive();
    drawChart();
  }
  updateActive();
})();
