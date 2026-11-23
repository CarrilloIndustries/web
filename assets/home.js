/* Home page behavior: header menu and scroll spy, scroll reveal, the hero shader,
   the Work grid (read from catalog.json) and the contact form. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.homeReady = true;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Scroll reveal: elements marked data-reveal rise in as they enter the viewport.
     Elements that arrive together are staggered. */
  if (calm || !("IntersectionObserver" in window)) {
    root.classList.add("no-reveal");
    window.revealWatch = function () {};
  } else {
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--d", Math.min(i++ * 80, 480) + "ms");
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    window.revealWatch = function (scope) {
      scope.querySelectorAll("[data-reveal]:not(.in)").forEach(function (el) { io.observe(el); });
    };
    window.revealWatch(doc);
  }

  /* Header: a shadow once the page scrolls, a menu panel on narrow screens,
     and the nav link for the section in view marked as current. */
  (function () {
    var bar = doc.querySelector(".bar");
    var btn = doc.querySelector(".menu-btn");
    var nav = doc.getElementById("site-nav");
    function setMenu(open) {
      bar.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("click", function (e) { if (bar.classList.contains("open") && !bar.contains(e.target)) setMenu(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.classList.contains("open")) { setMenu(false); btn.focus(); }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });

    function onScroll() { bar.classList.toggle("scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) return;
    var links = {};
    nav.querySelectorAll('a[href^="#"]:not(.btn)').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var watched = Object.keys(links).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    watched.push(doc.querySelector(".hero"), doc.getElementById("contact"));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute("aria-current"); });
        if (links[e.target.id]) links[e.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    watched.forEach(function (el) { if (el) spy.observe(el); });
  })();

  /* Hero shader: topographic contour lines over drifting noise, drawn in the accent color.
     Plain WebGL, no library. Pauses off screen, renders one still frame for reduced motion,
     and leaves the plain grid paper in place if WebGL is unavailable. */
  (function () {
    var canvas = doc.querySelector(".hero-fx");
    var band = doc.querySelector(".hero-band");
    var gl = canvas && canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) return;

    var vs = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
    var fs = [
      "#extension GL_OES_standard_derivatives : enable",
      "precision mediump float;",
      "uniform vec2 uRes; uniform float uTime; uniform vec3 uInk; uniform vec2 uPtr; uniform float uPtrAmt; uniform float uGain;",
      "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
      "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }",
      "float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }",
      "float iso(float n, float w){ float f = fract(n); return 1.0 - smoothstep(0.0, w, min(f, 1.0 - f)); }",
      "void main(){",
      "  vec2 uv = gl_FragCoord.xy / uRes.y;",
      "  float t = uTime * 0.035;",
      "  float v = fbm(uv * 1.5 + vec2(t, -t * 0.6)) + 0.35 * fbm(uv * 3.1 - vec2(t * 0.7, t));",
      "  vec2 d = (gl_FragCoord.xy - uPtr) / uRes.y;",
      "  v += uPtrAmt * 0.22 * exp(-dot(d, d) * 14.0);",
      "  float n = v * 10.0;",
      "  float w = fwidth(n);",
      "  float a = 0.22 * iso(n, w * 1.1) + 0.30 * iso(n / 5.0, w * 0.4);",
      "  vec2 s = gl_FragCoord.xy / uRes;",
      "  a *= smoothstep(0.22, 0.85, s.x) * smoothstep(0.0, 0.3, s.y) * uGain;",
      "  gl_FragColor = vec4(uInk * a, a);",
      "}"
    ].join("\n");

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var v = shader(gl.VERTEX_SHADER, vs), f = shader(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ["uRes", "uTime", "uInk", "uPtr", "uPtrAmt", "uGain"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    function readInk() {
      var hex = getComputedStyle(root).getPropertyValue("--mark").trim().replace("#", "");
      if (hex.length === 3) hex = hex.replace(/./g, "$&$&");
      var n = parseInt(hex, 16) || 0xC43D14;
      gl.uniform3f(U.uInk, (n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
    }

    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U.uRes, w, h);
      // Copy spans the full width on phones, so keep the lines fainter there.
      gl.uniform1f(U.uGain, canvas.clientWidth < 700 ? 0.55 : 1.0);
    }

    var ptr = { x: -9999, y: -9999, on: false }, amt = 0;
    if (!calm) {
      band.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        ptr.x = (e.clientX - r.left) * dpr;
        ptr.y = (r.bottom - e.clientY) * dpr;
        ptr.on = true;
      });
      band.addEventListener("pointerleave", function () { ptr.on = false; });
    }

    var start = performance.now(), raf = 0, visible = true;
    function draw(now) {
      amt += ((ptr.on ? 1 : 0) - amt) * 0.06;
      gl.uniform1f(U.uTime, calm ? 40.0 : 40.0 + (now - start) / 1000);
      gl.uniform2f(U.uPtr, ptr.x, ptr.y);
      gl.uniform1f(U.uPtrAmt, amt);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
    function play() { if (!calm && !raf && visible && !doc.hidden) raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    readInk();
    resize();
    draw(performance.now());
    new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(canvas);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { readInk(); draw(performance.now()); });
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) play(); else stop(); }).observe(canvas);
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) stop(); else play(); });
    canvas.addEventListener("webglcontextlost", stop);
    play();
  })();

  /* Work grid: every item in catalog.json. Items marked "featured" come first, then the newest.
     The first six show until "Show all" is pressed. */
  (function () {
    var TYPE = { site: "Website", tool: "Web tool" };
    var HUES = ["#2E63C9", "#C8441C", "#1E7D66", "#7A49C4", "#A87700", "#B4325F"];
    var LIMIT = 6;
    var grid = doc.getElementById("grid");
    var more = doc.getElementById("show-all");
    var items = [];
    var current = "all";
    var expanded = false;

    function hue(s) {
      var h = 7;
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return HUES[h % HUES.length];
    }
    function card(it) {
      var visual = it.thumb
        ? '<img class="thumb" src="' + esc(it.thumb) + '" alt="Screenshot of ' + esc(it.title) + '" loading="lazy">'
        : '<div class="tile" style="background-color:' + hue(it.slug || it.title || "") + '"><i>' + esc(TYPE[it.type] || "Project") + "</i><b>" + esc(it.title) + "</b></div>";
      var tags = [it.industry].concat(it.style || []).filter(Boolean)
        .map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
      var feats = (it.features || []).slice(0, 4).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("");
      return '<a class="card" data-reveal href="' + esc(it.path) + '">' + visual +
        '<div class="body"><span class="label">' + esc(TYPE[it.type] || "Project") + "</span>" +
        "<h3>" + esc(it.title) + "</h3><p>" + esc(it.summary) + "</p>" +
        (feats ? '<ul class="feats">' + feats + "</ul>" : "") +
        '<div class="tags">' + tags + '</div><span class="open">Open the ' + (it.type === "tool" ? "tool" : "site") + " →</span></div></a>";
    }
    function render() {
      var shown = items.filter(function (it) { return current === "all" || it.type === current; });
      if (!items.length) {
        grid.innerHTML = '<p class="empty"><b>The first pieces are on the bench.</b>New websites and tools are added every week.</p>';
      } else if (!shown.length) {
        grid.innerHTML = '<p class="empty"><b>Nothing here yet.</b>The first ' + (current === "tool" ? "web tools are" : "pieces are") + " on the way.</p>";
      } else {
        grid.innerHTML = (expanded ? shown : shown.slice(0, LIMIT)).map(card).join("");
      }
      more.hidden = expanded || shown.length <= LIMIT;
      more.textContent = "Show all " + shown.length;
      window.revealWatch(grid);
      doc.getElementById("tb-count").textContent = items.length;
      var latest = items.reduce(function (a, it) { return (it.added || "") > a ? it.added : a; }, "");
      doc.getElementById("tb-rev").textContent = latest || "—";
    }
    doc.querySelectorAll(".filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        current = b.getAttribute("data-f");
        doc.querySelectorAll(".filters button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render();
      });
    });
    more.addEventListener("click", function () {
      expanded = true;
      render();
      var next = grid.children[LIMIT];
      if (next) next.focus();
    });
    fetch("catalog.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; })
      .then(function (data) {
        items = (Array.isArray(data) ? data : []).slice().sort(function (a, b) {
          return ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) || (b.added || "").localeCompare(a.added || "");
        });
        render();
      });
  })();

  /* Copy buttons, with a fallback for browsers that block the clipboard API. */
  doc.querySelectorAll("[data-copy]").forEach(function (b) {
    var label = b.textContent;
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      function ok() {
        b.textContent = "Copied";
        setTimeout(function () { b.textContent = label; }, 1600);
      }
      function fallback() {
        var t = doc.createElement("textarea");
        t.value = text;
        t.setAttribute("readonly", "");
        t.style.position = "fixed";
        t.style.opacity = "0";
        doc.body.appendChild(t);
        t.select();
        try { if (doc.execCommand("copy")) ok(); } catch (e) { /* leave the label as is */ }
        doc.body.removeChild(t);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
      else fallback();
    });
  });

  /* Contact form. Validates in the browser, then posts to the Google Apps Script web app in
     data-endpoint (source in apps-script/contact-form.gs), which emails the message to Cameron.
     Until an endpoint is set, it opens the visitor's email app instead, with the message filled in. */
  (function () {
    var form = doc.getElementById("contact-form");
    if (!form) return;
    var status = doc.getElementById("form-status");
    var submit = form.querySelector('button[type="submit"]');
    var EMAIL = "cam.carrillo@carrilloindustries.com";
    var mailLink = '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>";
    var rules = {
      name: function (v) { return v.trim() ? "" : "Please enter your name."; },
      email: function (v) {
        v = v.trim();
        if (!v) return "Please enter your email address.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "That email address doesn't look right. Check for typos.";
      },
      need: function (v) { return v ? "" : "Please choose what you need."; },
      message: function (v) { return v.trim().length >= 10 ? "" : "Please add a sentence or two about the project."; }
    };

    function check(el) {
      var msg = rules[el.name](el.value);
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      doc.getElementById(el.id + "-err").textContent = msg;
      return !msg;
    }
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener("blur", function () { if (el.value || el.hasAttribute("aria-invalid")) check(el); });
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () {
        if (el.getAttribute("aria-invalid") === "true") check(el);
      });
    });

    function show(html, isError) {
      status.className = "status wide" + (isError ? " is-error" : "");
      status.innerHTML = html;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).map(function (n) { return form.elements[n]; }).filter(function (el) { return !check(el); });
      if (bad.length) {
        show("", false);
        bad[0].focus();
        return;
      }
      if (form.elements._gotcha.value) return;

      var data = new FormData(form);
      var name = String(data.get("name")).trim();
      var email = String(data.get("email")).trim();
      var endpoint = form.getAttribute("data-endpoint");

      if (!endpoint) {
        var body = "Name: " + name + "\nEmail: " + email +
          (data.get("company") ? "\nCompany: " + data.get("company") : "") +
          "\nNeed: " + data.get("need") + "\n\n" + data.get("message");
        window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Project inquiry from " + name) +
          "&body=" + encodeURIComponent(body);
        show("Your email app should open with your message filled in. If it didn't, email me at " + mailLink + ".", false);
        return;
      }

      submit.disabled = true;
      submit.textContent = "Sending…";
      // A URL-encoded body with no custom headers keeps this a simple cross-origin request,
      // which Apps Script accepts. It always answers with JSON: { ok: true } or { ok: false }.
      fetch(endpoint, { method: "POST", body: new URLSearchParams(data) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || res.ok !== true) throw new Error(res && res.error);
          form.classList.add("sent");
          show("<b>Thanks, " + esc(name.split(/\s+/)[0]) + ".</b> Your message is on its way. I'll reply to " + esc(email) + ".", false);
          status.setAttribute("tabindex", "-1");
          status.focus();
        })
        .catch(function () {
          show("Your message didn't go through. Please try again, or email me at " + mailLink + ".", true);
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = "Send message";
        });
    });
  })();

  var year = doc.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
