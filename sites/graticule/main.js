/* Graticule: interactions and procedural instrument canvases. No libraries. */
(function () {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const $ = (s, r) => (r || doc).querySelector(s);
  const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
  const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reduceMQ.matches;

  const COL = {
    yellow: "#FFD23F", cyan: "#3FD3E6", magenta: "#F062C8", blue: "#5B8CFF",
    green: "#56D67E", orange: "#FF8B3D", teal: "#2EC4A6", red: "#FF5D5D",
    violet: "#A07BFF", lime: "#B7E34C", pink: "#FF7AA8", sky: "#6CB8FF"
  };
  const MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";

  const debounce = (fn, ms) => {
    let id = 0;
    return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---------- App catalogue (drives the details dialog) ---------- */
  const ALL = ["Win", "Mac", "Linux", "Web"];
  const DESK = ["Win", "Mac", "Linux"];
  const APPS = {
    trace: { name: "Trace", code: "OSC", cat: "Oscilloscope", cls: "c-yellow", status: "stable", plat: ALL,
      desc: "A four-channel scope front end with deep memory, math channels and protocol triggers.",
      feats: ["Pan 50 million points without decimation artifacts", "FFT, integral and custom math channels", "Trigger on edges, pulse widths or decoded bytes"] },
    probe: { name: "Probe", code: "LA", cat: "Logic analyzer", cls: "c-cyan", status: "stable", plat: ALL,
      desc: "Capture up to 32 digital lines and decode UART, SPI, I²C, CAN and 40 more protocols.",
      feats: ["Up to 32 channels at your hardware's full sample rate", "45 protocol decoders that stack on each other", "Export decoded frames to CSV or JSON"] },
    plot: { name: "Plot", code: "FRA", cat: "Frequency response", cls: "c-magenta", status: "beta", plat: DESK,
      desc: "Sweep a control loop or filter and read gain and phase margin off a proper Bode plot.",
      feats: ["Automatic sweeps with any signal generator", "Gain and phase margin marked right on the plot", "Overlay runs to compare compensation tweaks"] },
    spectra: { name: "Spectra", code: "SA", cat: "Spectrum analyzer", cls: "c-blue", status: "beta", plat: DESK,
      desc: "Real-time FFT, waterfall and max-hold, from audio up to whatever your front end can see.",
      feats: ["Real-time FFT with waterfall and max-hold", "Channel power, occupied bandwidth and harmonic markers", "Works with scopes, SDR dongles and sound cards"] },
    layer: { name: "Layer", code: "PCB", cat: "Gerber and board viewer", cls: "c-green", status: "stable", plat: ALL,
      desc: "Open Gerbers, drill files and ODB++ to inspect every layer and light up any net.",
      feats: ["Gerber X2, Excellon and ODB++ import", "Click any pad to light up its whole net", "Measure clearances and export a fab-check PDF"] },
    spice: { name: "Spice", code: "SIM", cat: "Circuit simulator", cls: "c-orange", status: "nightly", plat: DESK,
      desc: "Draw a schematic or paste a netlist and simulate it without leaving the bench.",
      feats: ["Transient, AC and noise analyses", "Behavioral sources and parameter sweeps", "Send results straight to Trace and Plot"] },
    wire: { name: "Wire", code: "UART", cat: "Serial terminal", cls: "c-teal", status: "stable", plat: ALL,
      desc: "A serial, I²C and SPI console with timestamps, macros and a hex view that stays out of your way.",
      feats: ["Works with the common USB serial, I²C and SPI adapters", "Timestamps, macros and a split hex view", "Logs every session to plain text automatically"] },
    flash: { name: "Flash", code: "DFU", cat: "Firmware flasher", cls: "c-red", status: "beta", plat: ALL,
      desc: "Program and verify microcontrollers over SWD, JTAG, USB DFU or a serial bootloader.",
      feats: ["SWD, JTAG, USB DFU and serial bootloaders", "Erase, program, verify and protect in one step", "Batch-program a tray of boards from a script"] },
    parts: { name: "Parts", code: "BOM", cat: "BOM and inventory", cls: "c-violet", status: "nightly", plat: ALL,
      desc: "Keep your bill of materials, stock drawers and reorder list in one searchable place.",
      feats: ["Import BOMs exported from any layout tool", "Track stock by drawer, reel and location", "Flag parts headed for end of life before you order"] },
    watt: { name: "Watt", code: "PWR", cat: "Power profiler", cls: "c-lime", status: "nightly", plat: DESK,
      desc: "Measure sleep current down to 100 nA and see exactly what each radio packet costs.",
      feats: ["100 nA to 1 A in one continuous range", "Charge per event and battery-life estimates", "Current synced with Trace and Probe captures"] },
    heat: { name: "Heat", code: "IR", cat: "Thermal camera viewer", cls: "c-pink", status: "nightly", plat: DESK,
      desc: "Live view from USB thermal cameras, with hotspot tracking for finding the part that runs hot.",
      feats: ["Live view from common USB thermal cameras", "Hotspot tracking with temperature alarms", "Overlay thermal frames on a photo of the board"] },
    bench: { name: "Bench", code: "SCPI", cat: "Instrument control", cls: "c-sky", status: "nightly", plat: DESK,
      desc: "Talk to any instrument from one console, then turn what you typed into a repeatable test.",
      feats: ["SCPI console with autocomplete for 140+ instruments", "Record a manual test and replay it as a script", "The Python API every Graticule app shares"] }
  };
  const STATUS = { stable: "Stable", beta: "Beta", nightly: "Nightly" };

  const currentTheme = () => (root.getAttribute("data-theme") === "light" ? "light" : "dark");

  /* ---------- Theme ---------- */
  const themeBtn = $(".theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  let onThemeChange = () => {};
  function syncTheme() {
    const t = currentTheme();
    if (themeBtn) themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (themeMeta) themeMeta.setAttribute("content", t === "dark" ? "#0C0D0F" : "#F3F2ED");
  }
  syncTheme();
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const t = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", t);
      try { localStorage.setItem("graticule-theme", t); } catch (e) { /* storage unavailable */ }
      syncTheme();
      onThemeChange();
    });
  }

  /* ---------- Mobile menu ---------- */
  const header = $(".site-header");
  const menuBtn = $(".menu-toggle");
  const menu = $("#mobile-menu");
  const menuUse = $(".menu-use");
  function menuFocusables() { return [menuBtn].concat($$("a, button", menu)); }
  function openMenu() {
    menu.style.setProperty("--menu-top", Math.max(0, header.getBoundingClientRect().bottom) + "px");
    menu.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
    menuUse.setAttribute("href", "#i-close");
    root.classList.add("menu-open");
    const first = $("a", menu);
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    menuUse.setAttribute("href", "#i-menu");
    root.classList.remove("menu-open");
    if (returnFocus) menuBtn.focus();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu(true)));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(false); });
    doc.addEventListener("keydown", (e) => {
      if (menu.hidden) return;
      if (e.key === "Escape") { closeMenu(true); return; }
      if (e.key !== "Tab") return;
      const f = menuFocusables();
      const i = f.indexOf(doc.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) closeMenu(false); });
  }

  /* ---------- Dialogs ---------- */
  const appDlg = $("#app-dialog");
  function fillApp(id) {
    const a = APPS[id];
    if (!a) return false;
    $("#dlg-tile").className = "tile tile-lg " + a.cls;
    $("#dlg-use").setAttribute("href", "#g-" + id);
    $("#dlg-cat").textContent = a.cat;
    $("#dlg-name").textContent = a.name;
    const code = $("#dlg-code");
    code.textContent = a.code;
    code.className = "code " + a.cls;
    $("#dlg-desc").textContent = a.desc;
    const feats = $("#dlg-feats");
    feats.replaceChildren(...a.feats.map((f) => { const li = doc.createElement("li"); li.textContent = f; return li; }));
    const tags = $("#dlg-tags");
    const st = doc.createElement("li");
    st.className = "tag tag-status tag-" + a.status;
    st.textContent = STATUS[a.status];
    tags.replaceChildren(st, ...a.plat.map((p) => { const li = doc.createElement("li"); li.className = "tag"; li.textContent = p; return li; }));
    return true;
  }
  doc.addEventListener("click", (e) => {
    const appBtn = e.target.closest("[data-app]");
    if (appBtn && appDlg && fillApp(appBtn.getAttribute("data-app"))) { appDlg.showModal(); return; }
    const opener = e.target.closest("[data-open]");
    if (opener) {
      const d = doc.getElementById(opener.getAttribute("data-open"));
      if (d && typeof d.showModal === "function") {
        if (menu && !menu.hidden) closeMenu(false);
        d.showModal();
      }
    }
  });
  $$("dialog.dlg").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  /* ---------- Share row ---------- */
  const shareUrl = /^https?:/.test(location.protocol) ? location.href.split("#")[0] : "https://cam-carrillo.github.io/portfolio/sites/graticule/";
  const shareText = "Graticule: open-source software for the electronics bench";
  const E = encodeURIComponent;
  const intents = {
    x: "https://x.com/intent/post?text=" + E(shareText) + "&url=" + E(shareUrl),
    reddit: "https://www.reddit.com/submit?url=" + E(shareUrl) + "&title=" + E(shareText),
    bluesky: "https://bsky.app/intent/compose?text=" + E(shareText + " " + shareUrl),
    linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + E(shareUrl)
  };
  $$("[data-share]").forEach((a) => { const k = a.getAttribute("data-share"); if (intents[k]) a.href = intents[k]; });

  const copyBtn = $(".share-copy");
  const copyText = $(".copy-text");
  const copyUse = $(".copy-use");
  const shareStatus = $(".share-status");
  let copyTimer = 0;
  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back */ }
    }
    const ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.className = "visually-hidden";
    doc.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const ok = await copyToClipboard(shareUrl);
      copyText.textContent = ok ? "Copied" : "Copy failed";
      copyUse.setAttribute("href", ok ? "#i-check" : "#i-copy");
      shareStatus.textContent = ok ? "Link copied to the clipboard." : "Couldn't copy the link.";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyText.textContent = "Copy link"; copyUse.setAttribute("href", "#i-copy"); shareStatus.textContent = ""; }, 2000);
    });
  }

  /* ---------- Right rail: scroll-spy and ruler ---------- */
  const railItems = $$(".rail-list li");
  const sections = $$("main [data-rail]");
  const railVert = $(".rail-vert");
  const marker = $(".ruler-marker");
  const readout = $(".ruler-read");
  const scale = $(".ruler-scale");
  if (scale) {
    for (let i = 0; i <= 10; i++) {
      const s = doc.createElement("span");
      s.className = "ruler-num";
      s.textContent = String(i * 10);
      s.style.top = (i * 10) + "%";
      scale.appendChild(s);
    }
  }
  const rulerNums = scale ? $$(".ruler-num", scale) : [];
  const rail = $(".rail");
  let curIdx = -1;
  let railQueued = false;
  function updateRail() {
    railQueued = false;
    if (rail && header) rail.style.setProperty("--rail-top", Math.max(0, Math.round(header.getBoundingClientRect().bottom)) + "px");
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (marker) {
      marker.style.setProperty("--p", p.toFixed(4));
      readout.textContent = String(Math.round(p * 100)).padStart(3, "0") + "%";
      // Hide the tick number the readout is passing so the two never overlap.
      rulerNums.forEach((n, i) => n.classList.toggle("is-near", Math.abs(p * 100 - i * 10) < 4));
    }
    const probeY = window.innerHeight * 0.38;
    let idx = 0;
    for (let i = 0; i < sections.length; i++) if (sections[i].getBoundingClientRect().top <= probeY) idx = i;
    if (idx !== curIdx) {
      curIdx = idx;
      railItems.forEach((li, i) => {
        li.className = i < idx ? "is-past" : i === idx ? "is-current" : i === idx + 1 ? "is-future is-next" : "is-future";
      });
      if (railVert && sections[idx]) railVert.textContent = sections[idx].getAttribute("data-rail");
    }
  }
  window.addEventListener("scroll", () => { if (!railQueued) { railQueued = true; requestAnimationFrame(updateRail); } }, { passive: true });
  window.addEventListener("resize", debounce(updateRail, 100));
  updateRail();

  /* ---------- Hero: four-channel phosphor scope ---------- */
  const UART_BITS = (() => {
    const bits = [];
    for (const ch of "BENCH 0.9.2 OK") {
      bits.push(1, 1, 1, 0);
      const b = ch.charCodeAt(0);
      for (let i = 0; i < 8; i++) bits.push((b >> i) & 1);
      bits.push(1);
    }
    for (let i = 0; i < 10; i++) bits.push(1);
    return bits;
  })();

  function heroScope(canvas) {
    const ctx = canvas.getContext("2d");
    let w = 1, h = 1, raf = 0, last = 0, running = false, inView = true;
    let colors = [], mode = "lighter";
    const chans = [
      { y: 0.25, a: 0.075, f: (u, t) => Math.sin(u * Math.PI * 2 * 2.6 - t * 1.25) * (0.82 + 0.18 * Math.sin(t * 0.45)) },
      { y: 0.44, a: 0.05, f: (u, t) => {
        const ph = (((u * 4.2 - t * 0.32) % 1) + 1) % 1;
        const lvl = ph < 0.5 ? 1 : -1;
        const s = (ph % 0.5) * 2;
        return lvl * (1 + Math.exp(-s * 14) * Math.cos(s * 70) * 0.35) * 0.85;
      } },
      { y: 0.65, a: 0.085, f: (u, t) => {
        const ph = (((u * 2.1 - t * 0.21) % 1) + 1) % 1;
        return Math.exp(-ph * 5.5) * Math.sin(ph * Math.PI * 2 * 7.5);
      } },
      { y: 0.84, a: 0.04, f: (u, t) => {
        const n = UART_BITS.length;
        const i = ((Math.floor(u * 70 + t * 5) % n) + n) % n;
        return UART_BITS[i] ? 0.9 : -0.9;
      } }
    ];
    function readColors() {
      const light = currentTheme() === "light";
      colors = light ? ["#B08600", "#0B8EA0", "#B02F88", "#2A55E0"] : [COL.yellow, COL.cyan, COL.magenta, COL.blue];
      // Normal compositing: additive blending saturates flat stretches of a trace to white.
      mode = "source-over";
    }
    // On phones the text spans the full width, so channel 4 drops below the badge row.
    const chanY = (c) => (c === 3 && w < 760 ? 0.95 : chans[c].y) * h;
    function draw(t, still) {
      if (still) {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, w, h);
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = currentTheme() === "light" ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.2)";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = mode;
      const step = w > 1000 ? 3 : 2;
      for (let c = 0; c < chans.length; c++) {
        const ch = chans[c];
        const cy = chanY(c);
        const amp = ch.a * h;
        ctx.beginPath();
        for (let x = 0; x <= w + step; x += step) {
          const y = cy - ch.f(x / w, t) * amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors[c];
        ctx.globalAlpha = 0.09;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      // Channel offset markers on the left edge, like a scope's. Drawn opaque so they
      // keep their color instead of piling up under additive blending.
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      for (let c = 0; c < chans.length; c++) {
        const cy = chanY(c);
        ctx.fillStyle = colors[c];
        ctx.beginPath();
        ctx.moveTo(0, cy - 7); ctx.lineTo(14, cy - 7); ctx.lineTo(20, cy); ctx.lineTo(14, cy + 7); ctx.lineTo(0, cy + 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#0C0D0F";
        ctx.font = "700 10px " + MONO;
        ctx.textBaseline = "middle";
        ctx.fillText(String(c + 1), 5, cy + 0.5);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(2.4, true);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 15) return;
      last = now;
      draw(now / 1000, false);
    }
    function start() { if (running || reduced || !inView || doc.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    readColors();
    resize();
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) start(); else stop(); }).observe(canvas);
    doc.addEventListener("visibilitychange", () => { if (doc.hidden) stop(); else start(); });
    window.addEventListener("resize", debounce(resize, 150));
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!running) draw(2.4, true); });
    start();
    return {
      recolor() { readColors(); ctx.clearRect(0, 0, w, h); if (!running) draw(2.4, true); },
      setReduced() { if (reduced) { stop(); draw(2.4, true); } else start(); }
    };
  }
  const heroCanvas = $(".hero-canvas");
  const hero = heroCanvas ? heroScope(heroCanvas) : null;

  /* Floating instrument tiles follow the pointer a little. */
  const heroEl = $(".hero");
  const floatLayer = $(".hero-float");
  if (heroEl && floatLayer && window.matchMedia("(pointer: fine)").matches) {
    let mx = 0, my = 0, queued = false;
    heroEl.addEventListener("pointermove", (e) => {
      if (reduced) return;
      const r = heroEl.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!queued) {
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          floatLayer.style.setProperty("--mx", mx.toFixed(3));
          floatLayer.style.setProperty("--my", my.toFixed(3));
        });
      }
    });
    heroEl.addEventListener("pointerleave", () => {
      floatLayer.style.setProperty("--mx", "0");
      floatLayer.style.setProperty("--my", "0");
    });
  }

  /* ---------- Lineup: procedural app screenshots ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function chrome(c, w, h, o) {
    c.fillStyle = "#0A0B0E";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#14161A";
    c.fillRect(0, 0, w, 20);
    c.fillRect(0, h - 16, w, 16);
    c.fillStyle = "#2B2E34";
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(10 + i * 9, 10, 2.6, 0, Math.PI * 2); c.fill(); }
    c.textBaseline = "middle";
    c.font = "500 8.5px " + MONO;
    c.fillStyle = "#8A8E96";
    c.fillText(o.title, 40, 10.5);
    const label = o.chip || "RUN";
    c.font = "700 8px " + MONO;
    const tw = c.measureText(label).width + 10;
    c.fillStyle = o.accent;
    rr(c, w - tw - 8, 4.5, tw, 11, 2.5);
    c.fill();
    c.fillStyle = "#0B0C0E";
    c.fillText(label, w - tw - 3, 10.5);
    c.font = "500 8px " + MONO;
    c.fillStyle = "#7C8088";
    c.fillText(o.status, 8, h - 7.5);
    c.strokeStyle = "rgba(255,255,255,.06)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, 20.5); c.lineTo(w, 20.5);
    c.moveTo(0, h - 16.5); c.lineTo(w, h - 16.5);
    c.stroke();
    return { x: 8, y: 27, w: w - 16, h: h - 27 - 22 };
  }
  function graticule(c, a, nx, ny) {
    c.strokeStyle = "rgba(255,255,255,.07)";
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i <= nx; i++) { const x = Math.round(a.x + (a.w * i) / nx) + 0.5; c.moveTo(x, a.y); c.lineTo(x, a.y + a.h); }
    for (let j = 0; j <= ny; j++) { const y = Math.round(a.y + (a.h * j) / ny) + 0.5; c.moveTo(a.x, y); c.lineTo(a.x + a.w, y); }
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,.16)";
    c.beginPath();
    const cx = Math.round(a.x + a.w / 2) + 0.5;
    const cy = Math.round(a.y + a.h / 2) + 0.5;
    for (let i = 0; i <= nx * 5; i++) { const x = a.x + (a.w * i) / (nx * 5); c.moveTo(x, cy - 2); c.lineTo(x, cy + 2); }
    for (let j = 0; j <= ny * 5; j++) { const y = a.y + (a.h * j) / (ny * 5); c.moveTo(cx - 2, y); c.lineTo(cx + 2, y); }
    c.stroke();
  }
  function glow(c, col, width) {
    c.strokeStyle = col;
    c.globalAlpha = 0.2;
    c.lineWidth = (width || 1.3) * 3.4;
    c.stroke();
    c.globalAlpha = 1;
    c.lineWidth = width || 1.3;
    c.stroke();
  }
  function chMarker(c, x, y, col, label) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y - 5); c.lineTo(x + 9, y - 5); c.lineTo(x + 13, y); c.lineTo(x + 9, y + 5); c.lineTo(x, y + 5);
    c.closePath();
    c.fill();
    c.fillStyle = "#0B0C0E";
    c.font = "700 7.5px " + MONO;
    c.textBaseline = "middle";
    c.fillText(label, x + 3, y + 0.5);
  }
  function readoutBox(c, x, y, lines, col) {
    c.font = "500 8px " + MONO;
    let wmax = 0;
    lines.forEach((l) => { wmax = Math.max(wmax, c.measureText(l).width); });
    c.fillStyle = "rgba(10,11,14,.86)";
    rr(c, x - wmax - 12, y, wmax + 12, lines.length * 10 + 6, 3);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,.08)";
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = col;
    c.textBaseline = "top";
    lines.forEach((l, i) => c.fillText(l, x - wmax - 6, y + 4 + i * 10));
  }
  function clipTo(c, a) { c.save(); c.beginPath(); c.rect(a.x, a.y, a.w, a.h); c.clip(); }
  const fmtHz = (f) => (f < 1e3 ? f.toFixed(0) + " Hz" : f < 1e6 ? (f / 1e3).toFixed(f < 1e4 ? 2 : 1) + " kHz" : (f / 1e6).toFixed(2) + " MHz");

  const UART = (() => {
    const bits = [];
    const frames = [];
    for (const ch of "GRATICULE OK\r\n") {
      bits.push(1, 1, 1);
      frames.push({ start: bits.length, byte: ch.charCodeAt(0) });
      bits.push(0);
      for (let i = 0; i < 8; i++) bits.push((ch.charCodeAt(0) >> i) & 1);
      bits.push(1);
    }
    for (let i = 0; i < 8; i++) bits.push(1);
    return { bits, frames };
  })();

  const WIRE = [
    ["tx", "> AT+VER?"], ["rx", "< GR-LINK fw 2.3.1  OK"], ["tx", "> i2c scan"], ["rx", "< found 0x29 0x48 0x6A"],
    ["tx", "> i2c rd 0x48 0x00 2"], ["rx", "< 0C 9A  (24.6 °C)"], ["tx", "> spi xfer 9F 00 00 00"], ["rx", "< FF EF 40 18  (flash id)"],
    ["tx", "> gpio set PA5 1"], ["rx", "< PA5 = 1  OK"], ["sys", "# logging to session_0412.txt"]
  ];

  const PCB = {
    traces: [
      [[0.53, 0.44], [0.62, 0.44], [0.68, 0.38], [0.9, 0.38]],
      [[0.53, 0.52], [0.64, 0.52], [0.66, 0.54], [0.9, 0.54]],
      [[0.53, 0.6], [0.6, 0.6], [0.66, 0.66], [0.66, 0.8], [0.72, 0.86]],
      [[0.31, 0.44], [0.22, 0.44], [0.16, 0.38], [0.16, 0.2]],
      [[0.31, 0.52], [0.1, 0.52]],
      [[0.31, 0.6], [0.24, 0.6], [0.2, 0.64], [0.2, 0.82]],
      [[0.38, 0.32], [0.38, 0.22], [0.44, 0.16], [0.62, 0.16]],
      [[0.46, 0.32], [0.46, 0.26], [0.5, 0.22], [0.72, 0.22], [0.76, 0.26]],
      [[0.42, 0.68], [0.42, 0.84], [0.48, 0.9], [0.56, 0.9]]
    ],
    bottom: [
      [[0.2, 0.82], [0.5, 0.82], [0.56, 0.76], [0.66, 0.76]],
      [[0.62, 0.16], [0.8, 0.16], [0.86, 0.22], [0.86, 0.3]]
    ],
    vias: [[0.2, 0.82], [0.62, 0.16], [0.66, 0.76], [0.86, 0.3], [0.16, 0.2]],
    pads: [[0.9, 0.3], [0.9, 0.38], [0.9, 0.46], [0.9, 0.54], [0.9, 0.62], [0.72, 0.86], [0.56, 0.9], [0.76, 0.26], [0.1, 0.52]]
  };

  const VIZ = {
    trace(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Trace · 4 ch", accent: COL.yellow, status: "CH1 1 V/div  CH2 2 V/div  200 µs/div  ↑1.2 V" });
      graticule(c, a, 10, 8);
      const cy1 = a.y + a.h * 0.36, A1 = a.h * 0.2;
      const cy2 = a.y + a.h * 0.76, A2 = a.h * 0.11;
      clipTo(c, a);
      c.beginPath();
      for (let x = 0; x <= a.w; x += 1.5) {
        const v = Math.sin((x / a.w) * Math.PI * 2 * 2.5 - t * 2.2) + (hash(Math.floor(x) + Math.floor(t * 30)) - 0.5) * 0.07;
        const y = cy1 - v * A1;
        if (x === 0) c.moveTo(a.x + x, y); else c.lineTo(a.x + x, y);
      }
      glow(c, COL.yellow);
      c.beginPath();
      for (let x = 0; x <= a.w; x += 1) {
        const ph = ((((x / a.w) * 5 - t * 0.55) % 1) + 1) % 1;
        const lvl = ph < 0.5 ? 1 : -1;
        const s = (ph % 0.5) * 2;
        const v = lvl * (1 + Math.exp(-s * 16) * Math.cos(s * 90) * 0.3);
        const y = cy2 - v * A2;
        if (x === 0) c.moveTo(a.x + x, y); else c.lineTo(a.x + x, y);
      }
      glow(c, COL.cyan);
      c.restore();
      chMarker(c, a.x, cy1, COL.yellow, "1");
      chMarker(c, a.x, cy2, COL.cyan, "2");
      c.fillStyle = COL.yellow;
      c.beginPath();
      const ty = cy1 - A1 * 0.35;
      c.moveTo(a.x + a.w, ty); c.lineTo(a.x + a.w - 6, ty - 4); c.lineTo(a.x + a.w - 6, ty + 4);
      c.closePath();
      c.fill();
      readoutBox(c, a.x + a.w - 10, a.y + 4, ["f    1.000 kHz", "Vpp  " + (3.27 + hash(Math.floor(t * 3)) * 0.03).toFixed(2) + " V"], COL.yellow);
    },

    probe(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Probe · 6 ch", accent: COL.cyan, status: "8 MS/s  UART 115200 8N1  312 frames" });
      const labelW = 20;
      const x0 = a.x + labelW;
      const span = a.w - labelW;
      const ppb = 6.5;
      const n = UART.bits.length;
      const off = (t * 30) % (n * ppb);
      const rows = [];
      const uartH = a.h * 0.34;
      rows.push({ top: a.y, h: uartH });
      const rh = (a.h - uartH) / 5;
      for (let i = 0; i < 5; i++) rows.push({ top: a.y + uartH + i * rh, h: rh });
      const cols = [COL.cyan, COL.yellow, COL.magenta, COL.green, COL.orange, COL.violet];
      const sample = (r, x) => {
        if (r === 0) { const i = ((Math.floor(x / ppb) % n) + n) % n; return UART.bits[i]; }
        const burst = (((x % 150) + 150) % 150);
        const inBurst = burst > 20 && burst < 110;
        if (r === 2) return inBurst ? 0 : 1;
        if (r === 1) return inBurst ? (Math.floor(burst / 5) % 2) : 0;
        if (r === 3) return inBurst ? (hash(Math.floor(x / 10) + 3) > 0.5 ? 1 : 0) : 0;
        if (r === 4) return inBurst ? (hash(Math.floor(x / 10) + 77) > 0.45 ? 1 : 0) : 1;
        return Math.floor(x / 88) % 2;
      };
      c.strokeStyle = "rgba(255,255,255,.05)";
      c.lineWidth = 1;
      c.beginPath();
      rows.forEach((r) => { c.moveTo(a.x, Math.round(r.top) + 0.5); c.lineTo(a.x + a.w, Math.round(r.top) + 0.5); });
      c.stroke();
      rows.forEach((row, r) => {
        const hi = r === 0 ? row.top + row.h * 0.5 : row.top + row.h * 0.24;
        const lo = row.top + row.h * 0.82;
        c.fillStyle = cols[r];
        c.font = "600 7.5px " + MONO;
        c.textBaseline = "middle";
        c.fillText("D" + r, a.x, (hi + lo) / 2);
        c.save();
        c.beginPath();
        c.rect(x0, row.top, span, row.h);
        c.clip();
        c.beginPath();
        let prev = -1;
        const scroll = r === 0 ? off : t * 30;
        for (let x = 0; x <= span; x += 1) {
          const lvl = sample(r, x + scroll);
          const y = lvl ? hi : lo;
          if (prev === -1) c.moveTo(x0 + x, y);
          else if (lvl !== prev) { c.lineTo(x0 + x, prev ? hi : lo); c.lineTo(x0 + x, y); }
          else c.lineTo(x0 + x, y);
          prev = lvl;
        }
        c.strokeStyle = cols[r];
        c.lineWidth = 1.2;
        c.stroke();
        if (r === 0) {
          c.font = "600 7.5px " + MONO;
          c.textBaseline = "middle";
          UART.frames.forEach((f) => {
            for (let k = -1; k <= 1; k++) {
              const fx = x0 + f.start * ppb - off + k * n * ppb;
              if (fx < x0 - 70 || fx > x0 + span) continue;
              const bw = 10 * ppb - 2;
              c.fillStyle = "rgba(63,211,230,.15)";
              rr(c, fx + 1, row.top + 3, bw, row.h * 0.32, 2.5);
              c.fill();
              c.strokeStyle = "rgba(63,211,230,.55)";
              c.stroke();
              const chr = f.byte >= 32 && f.byte < 127 ? " '" + String.fromCharCode(f.byte) + "'" : "";
              c.fillStyle = "#BFF4FA";
              c.fillText("0x" + f.byte.toString(16).toUpperCase().padStart(2, "0") + chr, fx + 5, row.top + 3 + row.h * 0.16);
            }
          });
        }
        c.restore();
      });
    },

    spectra(c, w, h, t, st) {
      const a = chrome(c, w, h, { title: "Spectra · FFT", accent: COL.blue, status: "RBW 100 kHz  Span 80 MHz  Ref −10 dBm" });
      graticule(c, a, 10, 8);
      const N = Math.max(8, Math.floor(a.w / 2));
      if (!st.max || st.max.length !== N) st.max = new Float32Array(N);
      const pk = (u, c0, wd, amp) => { const d = (u - c0) / wd; return amp / (1 + d * d); };
      const frame = Math.floor(t * 12);
      const vals = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        let v = 0.1 + hash(i * 3.1 + frame) * 0.07 + hash(i * 7.7 + frame * 1.3) * 0.04;
        v += pk(u, 0.22, 0.012, 0.5 + 0.06 * Math.sin(t * 2)) + pk(u, 0.46, 0.008, 0.76) + pk(u, 0.66, 0.011, 0.4 + 0.07 * Math.sin(t * 1.3 + 1)) + pk(u, 0.88, 0.006, 0.24);
        vals[i] = Math.min(0.98, v);
        st.max[i] = Math.max(st.max[i] * 0.996, vals[i]);
      }
      const X = (i) => a.x + (i / (N - 1)) * a.w;
      const Y = (v) => a.y + a.h - v * a.h * 0.92;
      clipTo(c, a);
      c.beginPath();
      c.moveTo(a.x, a.y + a.h);
      for (let i = 0; i < N; i++) c.lineTo(X(i), Y(vals[i]));
      c.lineTo(a.x + a.w, a.y + a.h);
      c.closePath();
      const g = c.createLinearGradient(0, a.y, 0, a.y + a.h);
      g.addColorStop(0, "rgba(91,140,255,.5)");
      g.addColorStop(1, "rgba(91,140,255,0)");
      c.fillStyle = g;
      c.fill();
      c.beginPath();
      for (let i = 0; i < N; i++) { if (i === 0) c.moveTo(X(i), Y(vals[i])); else c.lineTo(X(i), Y(vals[i])); }
      glow(c, COL.blue, 1.1);
      c.beginPath();
      for (let i = 0; i < N; i++) { if (i === 0) c.moveTo(X(i), Y(st.max[i])); else c.lineTo(X(i), Y(st.max[i])); }
      c.strokeStyle = "rgba(255,255,255,.3)";
      c.lineWidth = 0.8;
      c.stroke();
      c.restore();
      const mi = Math.round(0.46 * (N - 1));
      const mx = X(mi), my = Y(vals[mi]) - 6;
      c.fillStyle = COL.yellow;
      c.beginPath();
      c.moveTo(mx, my); c.lineTo(mx - 4, my - 5); c.lineTo(mx + 4, my - 5);
      c.closePath();
      c.fill();
      readoutBox(c, a.x + a.w - 6, a.y + 4, ["MKR  2.442 GHz", "     " + (-18.6 + (hash(frame) - 0.5) * 0.6).toFixed(1) + " dBm"], COL.yellow);
    },

    plot(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Plot · Bode", accent: COL.magenta, status: "10 Hz – 1 MHz  200 pts  PM 48°" });
      c.lineWidth = 1;
      for (let d = 0; d <= 5; d++) {
        for (let k = 1; k < 10; k++) {
          if (d === 5 && k > 1) break;
          const x = Math.round(a.x + (a.w * (d + Math.log10(k))) / 5) + 0.5;
          c.strokeStyle = k === 1 ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.045)";
          c.beginPath(); c.moveTo(x, a.y); c.lineTo(x, a.y + a.h); c.stroke();
        }
      }
      c.strokeStyle = "rgba(255,255,255,.07)";
      c.beginPath();
      for (let j = 0; j <= 6; j++) { const y = Math.round(a.y + (a.h * j) / 6) + 0.5; c.moveTo(a.x, y); c.lineTo(a.x + a.w, y); }
      c.stroke();
      const Q = 2.2, U0 = 0.62;
      const ratio = (u) => Math.pow(10, (u - U0) * 5);
      const mag = (u) => { const r = ratio(u); return -10 * Math.log10((1 - r * r) ** 2 + (r / Q) ** 2); };
      const phs = (u) => { const r = ratio(u); return (-Math.atan2(r / Q, 1 - r * r) * 180) / Math.PI; };
      const yMag = (db) => a.y + ((12 - db) / 60) * a.h;
      const yPh = (deg) => a.y + (-deg / 180) * a.h * 0.96 + a.h * 0.02;
      clipTo(c, a);
      c.beginPath();
      for (let x = 0; x <= a.w; x += 1) { const u = x / a.w; const y = yMag(mag(u)); if (x === 0) c.moveTo(a.x + x, y); else c.lineTo(a.x + x, y); }
      glow(c, COL.magenta, 1.4);
      c.setLineDash([3, 3]);
      c.beginPath();
      for (let x = 0; x <= a.w; x += 1) { const u = x / a.w; const y = yPh(phs(u)); if (x === 0) c.moveTo(a.x + x, y); else c.lineTo(a.x + x, y); }
      c.strokeStyle = COL.cyan;
      c.lineWidth = 1;
      c.stroke();
      c.setLineDash([]);
      const u = (t * 0.11) % 1.15;
      if (u <= 1) {
        const x = a.x + u * a.w;
        c.strokeStyle = "rgba(255,255,255,.35)";
        c.setLineDash([2, 3]);
        c.beginPath(); c.moveTo(x, a.y); c.lineTo(x, a.y + a.h); c.stroke();
        c.setLineDash([]);
        [[yMag(mag(u)), COL.magenta], [yPh(phs(u)), COL.cyan]].forEach((p) => {
          c.fillStyle = p[1];
          c.beginPath(); c.arc(x, p[0], 2.6, 0, Math.PI * 2); c.fill();
        });
      }
      c.restore();
      const uu = Math.min(1, u);
      readoutBox(c, a.x + a.w - 6, a.y + 4, [fmtHz(10 * Math.pow(10, uu * 5)), (mag(uu) >= 0 ? "+" : "") + mag(uu).toFixed(1) + " dB  " + phs(uu).toFixed(0) + "°"], COL.magenta);
    },

    layer(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Layer · ctrl_board_r3", accent: COL.green, status: "Net SPI_MOSI  4 pads  38.2 mm  1 via" });
      const chips = [["TOP", "#C98A3E", true], ["BOT", "#3E7FB5", true], ["SLK", "#E8E6DC", true], ["DRL", "#8A8E96", false]];
      c.font = "600 7px " + MONO;
      c.textBaseline = "middle";
      chips.forEach((ch, i) => {
        const y = a.y + 4 + i * 15;
        c.fillStyle = ch[2] ? "#181A1F" : "#111215";
        rr(c, a.x, y, 30, 11, 2);
        c.fill();
        c.fillStyle = ch[1];
        c.globalAlpha = ch[2] ? 1 : 0.4;
        c.fillRect(a.x + 3, y + 3, 5, 5);
        c.fillStyle = "#AEB2BA";
        c.fillText(ch[0], a.x + 11, y + 6);
        c.globalAlpha = 1;
      });
      const b = { x: a.x + 38, y: a.y + 2, w: a.w - 40, h: a.h - 4 };
      const P = (p) => [b.x + p[0] * b.w, b.y + p[1] * b.h];
      c.fillStyle = "#0E2A21";
      rr(c, b.x, b.y, b.w, b.h, 6);
      c.fill();
      c.strokeStyle = "rgba(232,230,220,.35)";
      c.lineWidth = 1;
      c.stroke();
      const path = (pts) => { c.beginPath(); pts.forEach((p, i) => { const q = P(p); if (i === 0) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); }); };
      c.lineCap = "round";
      c.lineJoin = "round";
      PCB.bottom.forEach((tr) => { path(tr); c.strokeStyle = "rgba(62,127,181,.55)"; c.lineWidth = 2; c.stroke(); });
      PCB.traces.forEach((tr, i) => { if (i === 0) return; path(tr); c.strokeStyle = "rgba(201,138,62,.85)"; c.lineWidth = 2; c.stroke(); });
      const ic = P([0.31, 0.32]);
      const icW = 0.22 * b.w, icH = 0.36 * b.h;
      c.fillStyle = "#1B1D21";
      c.fillRect(ic[0], ic[1], icW, icH);
      c.fillStyle = "#C98A3E";
      for (let k = 0; k < 6; k++) {
        const fy = ic[1] + icH * (0.12 + k * 0.152);
        c.fillRect(ic[0] - 4, fy - 1.2, 4, 2.4);
        c.fillRect(ic[0] + icW, fy - 1.2, 4, 2.4);
        const fx = ic[0] + icW * (0.12 + k * 0.152);
        c.fillRect(fx - 1.2, ic[1] - 4, 2.4, 4);
        c.fillRect(fx - 1.2, ic[1] + icH, 2.4, 4);
      }
      PCB.pads.forEach((p) => { const q = P(p); c.fillStyle = "#D29A4E"; c.fillRect(q[0] - 3, q[1] - 2.5, 6, 5); });
      PCB.vias.forEach((p) => {
        const q = P(p);
        c.fillStyle = "#C98A3E"; c.beginPath(); c.arc(q[0], q[1], 2.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#0A0B0E"; c.beginPath(); c.arc(q[0], q[1], 1.1, 0, Math.PI * 2); c.fill();
      });
      c.fillStyle = "rgba(232,230,220,.75)";
      c.font = "600 7px " + MONO;
      const lab = (s, p) => { const q = P(p); c.fillText(s, q[0], q[1]); };
      lab("U1", [0.39, 0.5]); lab("J2", [0.86, 0.7]); lab("R4", [0.12, 0.17]); lab("C7", [0.7, 0.93]);
      const net = PCB.traces[0].map(P);
      c.beginPath();
      net.forEach((q, i) => { if (i === 0) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); });
      c.shadowColor = COL.green;
      c.shadowBlur = 8;
      c.strokeStyle = COL.green;
      c.lineWidth = 2.4;
      c.stroke();
      c.shadowBlur = 0;
      let L = 0;
      const seg = [];
      for (let i = 1; i < net.length; i++) { const d = Math.hypot(net[i][0] - net[i - 1][0], net[i][1] - net[i - 1][1]); seg.push(d); L += d; }
      let pos = ((t * 0.45) % 1) * L;
      let px = net[0][0], py = net[0][1];
      for (let i = 0; i < seg.length; i++) {
        if (pos <= seg[i]) { const f = pos / seg[i]; px = net[i][0] + (net[i + 1][0] - net[i][0]) * f; py = net[i][1] + (net[i + 1][1] - net[i][1]) * f; break; }
        pos -= seg[i];
      }
      const rg = c.createRadialGradient(px, py, 0, px, py, 9);
      rg.addColorStop(0, "rgba(220,255,230,.95)");
      rg.addColorStop(0.35, "rgba(86,214,126,.6)");
      rg.addColorStop(1, "rgba(86,214,126,0)");
      c.fillStyle = rg;
      c.beginPath(); c.arc(px, py, 9, 0, Math.PI * 2); c.fill();
    },

    wire(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Wire · COM7", accent: COL.teal, status: "115200 8N1  TX 1.2 kB  RX 18.4 kB" });
      c.fillStyle = "#07080A";
      c.fillRect(a.x - 2, a.y - 3, a.w + 4, a.h + 6);
      const lh = 11;
      const maxLines = Math.max(1, Math.floor(a.h / lh));
      const total = t * 1.05;
      const n = Math.floor(total);
      const frac = total - n;
      const first = Math.max(0, n - maxLines + 1);
      c.font = "500 8px " + MONO;
      c.textBaseline = "top";
      let cursorX = a.x, cursorY = a.y;
      for (let i = first; i <= n; i++) {
        const row = i - first;
        const line = WIRE[i % WIRE.length];
        let text = line[1];
        if (i === n) text = text.slice(0, Math.floor(text.length * Math.min(1, frac * 1.7)));
        const ts = "[" + (i * 0.84).toFixed(2).padStart(6, "0") + "] ";
        const y = a.y + row * lh;
        c.fillStyle = "#5C6068";
        c.fillText(ts, a.x, y);
        const tsw = c.measureText(ts).width;
        c.fillStyle = line[0] === "tx" ? COL.teal : line[0] === "sys" ? "#8A8E96" : "#D9DBDF";
        c.fillText(text, a.x + tsw, y);
        cursorX = a.x + tsw + c.measureText(text).width + 2;
        cursorY = y;
      }
      if (Math.floor(t * 2.2) % 2 === 0) { c.fillStyle = COL.teal; c.fillRect(cursorX, cursorY, 5, 9); }
    },

    flash(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Flash · SWD", accent: COL.red, status: "SWD 4 MHz  256 KB  id 0x2BA01477" });
      const ph = (t % 7.5) / 7.5;
      const cols = 16, rows = 5, total = cols * rows;
      const gridH = a.h - 26;
      const gap = 2;
      const cell = Math.min((a.w - (cols - 1) * gap) / cols, (gridH - (rows - 1) * gap) / rows);
      const gx = a.x + (a.w - (cell * cols + gap * (cols - 1))) / 2;
      let label = "", pct = 0;
      let erased = 0, written = 0, verified = 0;
      if (ph < 0.14) { erased = ph / 0.14; label = "Erasing"; pct = erased * 10; }
      else if (ph < 0.74) { erased = 1; written = (ph - 0.14) / 0.6; label = "Writing"; pct = 10 + written * 75; }
      else if (ph < 0.92) { erased = 1; written = 1; verified = (ph - 0.74) / 0.18; label = "Verifying"; pct = 85 + verified * 15; }
      else { erased = 1; written = 1; verified = 1; label = "Done"; pct = 100; }
      for (let k = 0; k < total; k++) {
        const x = gx + (k % cols) * (cell + gap);
        const y = a.y + Math.floor(k / cols) * (cell + gap);
        const f = k / total;
        let col = "#17191D";
        if (f < erased) col = "#2A2D33";
        if (f < written) col = "rgba(255,93,93,.8)";
        if (written < 1 && Math.floor(written * total) === k && label === "Writing") col = Math.floor(t * 10) % 2 ? COL.yellow : "#FFE48A";
        if (f < verified) col = COL.green;
        c.fillStyle = col;
        rr(c, x, y, cell, cell, 1.5);
        c.fill();
      }
      const by = a.y + gridH + 8;
      c.fillStyle = "#1A1C21";
      rr(c, a.x, by, a.w, 6, 3);
      c.fill();
      c.fillStyle = label === "Done" ? COL.green : COL.red;
      rr(c, a.x, by, Math.max(6, (a.w * pct) / 100), 6, 3);
      c.fill();
      const addr = 0x08000000 + Math.floor(Math.min(0.999, label === "Verifying" ? verified : written) * total) * 0x800;
      const hex = addr.toString(16).toUpperCase().padStart(8, "0");
      c.font = "500 8px " + MONO;
      c.textBaseline = "top";
      c.fillStyle = "#AEB2BA";
      const msg = label === "Done" ? "Verified  CRC 0x7A3F19C2" : label + "  0x" + hex.slice(0, 4) + "_" + hex.slice(4);
      c.fillText(msg, a.x, by + 9);
      const pctText = Math.round(pct) + "%";
      c.fillText(pctText, a.x + a.w - c.measureText(pctText).width, by + 9);
    },

    watt(c, w, h, t) {
      const a = chrome(c, w, h, { title: "Watt · 3.00 V", accent: COL.lime, status: "100 kS/s  auto range  Vout 3.00 V" });
      const lx = a.x + 26, lw = a.w - 26;
      c.font = "500 7px " + MONO;
      c.textBaseline = "middle";
      const labels = ["100m", "10m", "1m", "100µ", "10µ", "1µ"];
      c.lineWidth = 1;
      labels.forEach((s, i) => {
        const y = Math.round(a.y + (a.h * i) / 5) + 0.5;
        c.strokeStyle = "rgba(255,255,255,.06)";
        c.beginPath(); c.moveTo(lx, y); c.lineTo(a.x + a.w, y); c.stroke();
        c.fillStyle = "#6F737B";
        c.fillText(s, a.x, y);
      });
      const shift = t * 42;
      const cur = (x) => {
        const xx = x + shift;
        const p = (((xx / 150) % 1) + 1) % 1;
        let I = 3e-6 * (1 + hash(Math.floor(xx)) * 0.5);
        if (p > 0.18 && p < 0.31) I = 2.1e-3 * (1 + hash(Math.floor(xx) + 9) * 0.12);
        if (p > 0.22 && p < 0.27) I = 38e-3 * (0.82 + 0.18 * Math.sin(p * 420));
        if (p >= 0.31 && p < 0.36) I = 0.5e-3 * Math.exp(-(p - 0.31) * 70) + 3e-6;
        return I;
      };
      const Y = (I) => a.y + a.h - ((Math.log10(I) + 6) / 5) * a.h;
      clipTo(c, { x: lx, y: a.y, w: lw, h: a.h });
      c.beginPath();
      c.moveTo(lx, a.y + a.h);
      for (let x = 0; x <= lw; x += 1) c.lineTo(lx + x, Y(cur(x)));
      c.lineTo(lx + lw, a.y + a.h);
      c.closePath();
      const g = c.createLinearGradient(0, a.y, 0, a.y + a.h);
      g.addColorStop(0, "rgba(183,227,76,.42)");
      g.addColorStop(1, "rgba(183,227,76,.02)");
      c.fillStyle = g;
      c.fill();
      c.beginPath();
      for (let x = 0; x <= lw; x += 1) { const y = Y(cur(x)); if (x === 0) c.moveTo(lx, y); else c.lineTo(lx + x, y); }
      glow(c, COL.lime, 1.1);
      c.restore();
      readoutBox(c, a.x + a.w - 4, a.y + 2, ["Avg   " + (412 + Math.round((hash(Math.floor(t * 2)) - 0.5) * 8)) + " µA", "Peak  38.2 mA"], COL.lime);
    }
  };

  function initPreviews() {
    const items = $$("canvas[data-viz]").map((cv) => ({ cv, c: cv.getContext("2d"), viz: VIZ[cv.getAttribute("data-viz")], st: {}, w: 0, h: 0, on: false }));
    if (!items.length) return null;
    const size = (it) => {
      const r = it.cv.getBoundingClientRect();
      const d = Math.min(2, window.devicePixelRatio || 1);
      it.w = r.width; it.h = r.height;
      it.cv.width = Math.max(1, Math.round(r.width * d));
      it.cv.height = Math.max(1, Math.round(r.height * d));
      it.c.setTransform(d, 0, 0, d, 0, 0);
    };
    const draw = (it, t) => {
      if (!it.viz || it.w < 40) return;
      it.c.save();
      it.viz(it.c, it.w, it.h, t, it.st);
      it.c.restore();
    };
    const still = () => items.forEach((it) => draw(it, 4.2));
    items.forEach(size);
    still();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { const it = items.find((i) => i.cv === e.target); if (it) it.on = e.isIntersecting; });
    }, { rootMargin: "80px 0px" });
    items.forEach((it) => io.observe(it.cv));
    let raf = 0, last = 0, running = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 40) return;
      last = now;
      const t = now / 1000;
      items.forEach((it) => { if (it.on) draw(it, t); });
    };
    const start = () => { if (running || reduced || doc.hidden) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    doc.addEventListener("visibilitychange", () => { if (doc.hidden) stop(); else start(); });
    window.addEventListener("resize", debounce(() => { items.forEach(size); still(); }, 150));
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (!running) still(); });
    start();
    return { setReduced() { if (reduced) { stop(); still(); } else start(); } };
  }
  const previews = initPreviews();

  /* Lab dashboard: a live ripple trace that tiles seamlessly every 240 units. */
  const spark = $(".spark-line");
  if (spark) {
    let d = "";
    for (let x = 0; x <= 480; x += 2) {
      const u = x / 240;
      const v = 30 + Math.sin(u * Math.PI * 2 * 6) * 9 * (0.72 + 0.28 * Math.sin(u * Math.PI * 2)) + (hash(x % 240) - 0.5) * 4;
      d += (x ? "L" : "M") + x + " " + v.toFixed(1);
    }
    spark.setAttribute("d", d);
  }

  onThemeChange = () => { if (hero) hero.recolor(); };
  reduceMQ.addEventListener("change", (e) => {
    reduced = e.matches;
    if (hero) hero.setReduced();
    if (previews) previews.setReduced();
  });

  /* ---------- Pricing toggle ---------- */
  const segs = $$(".seg");
  segs.forEach((b) => b.addEventListener("click", () => {
    const mode = b.getAttribute("data-billing");
    segs.forEach((s) => { const on = s === b; s.classList.toggle("is-on", on); s.setAttribute("aria-pressed", on ? "true" : "false"); });
    $$("[data-monthly]").forEach((el) => { el.textContent = el.getAttribute("data-" + mode); });
  }));

  /* ---------- Downloads: highlight the visitor's OS ---------- */
  const platform = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "").toLowerCase();
  const os = /win/.test(platform) ? "windows" : /mac|iphone|ipad/.test(platform) ? "mac" : /linux|x11|cros/.test(platform) ? "linux" : null;
  const OS_NAMES = { windows: "Windows", mac: "macOS", linux: "Linux" };
  if (os) {
    const card = $('.os[data-os="' + os + '"]');
    if (card) {
      card.classList.add("is-detected");
      const btn = $(".btn", card);
      btn.classList.remove("btn-outline");
      btn.classList.add("btn-solid");
    }
    const cap = $(".os-caption");
    if (cap) cap.textContent = "v0.9.2 · 84 MB · for " + OS_NAMES[os];
  }
  const dlMsg = $(".dl-msg");
  $$("[data-dl]").forEach((b) => b.addEventListener("click", () => {
    dlMsg.textContent = "This is a portfolio concept, so there's no real " + b.getAttribute("data-dl") + " installer to download.";
  }));

  /* ---------- Build-notes form ---------- */
  const form = $("#notes");
  const email = $("#notes-email");
  const err = $("#notes-email-err");
  const done = $("#notes-done");
  const interest = $("#notes-interest");
  const DONE_TEXT = {
    apps: "Desktop app build notes",
    team: "Lab build notes and a trial invite",
    lab: "A note from the Lab team"
  };
  function validEmail() {
    const v = email.value.trim();
    let msg = "";
    if (!v) msg = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "That doesn't look like a complete email address.";
    err.textContent = msg;
    email.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validEmail()) { email.focus(); return; }
      $(".notes-done-text").textContent = DONE_TEXT[interest.value] + " will go to " + email.value.trim() + ". Nothing was actually sent: this is a demo form.";
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
    email.addEventListener("input", () => { if (email.getAttribute("aria-invalid") === "true") validEmail(); });
    email.addEventListener("blur", () => { if (email.value.trim()) validEmail(); });
  }
  $$("[data-interest]").forEach((a) => a.addEventListener("click", () => { if (interest) interest.value = a.getAttribute("data-interest"); }));
})();
