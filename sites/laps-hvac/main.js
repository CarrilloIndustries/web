/* LAPS HVAC shared behavior: mobile menu, scroll reveals, count-ups, demo forms,
   diagram parallax, and the mouse-reactive airflow contours behind the hero. */
(function () {
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile menu */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (menuBtn && nav) {
    var setMenu = function (open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("open", open);
    };
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* Freeze SVG (SMIL) animations for reduced motion; CSS animations are handled in the stylesheet. */
  if (calm) document.querySelectorAll("svg").forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });

  /* Count-up numbers: <strong data-count="4200" data-suffix="+"> */
  function countUp(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var fmt = function (n) { return Math.round(n).toLocaleString("en-US") + suffix; };
    if (calm) { el.textContent = fmt(end); return; }
    var t0 = performance.now(), dur = 1400;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* Scroll reveal with stagger for elements that arrive together */
  var counters = document.querySelectorAll("[data-count]");
  if (calm || !("IntersectionObserver" in window)) {
    counters.forEach(countUp);
    document.querySelectorAll(".steps-duct").forEach(function (d) { d.classList.add("in"); });
  } else {
    document.documentElement.classList.add("reveal-on");
    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--d", Math.min(i++ * 90, 540) + "ms");
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        if (e.target.hasAttribute("data-count")) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal], .steps-duct").forEach(function (el) { io.observe(el); });
  }

  /* Highlight today's row in the hours table */
  var today = document.querySelector('.hours tr[data-day="' + new Date().getDay() + '"]');
  if (today) today.classList.add("now");

  /* Demo forms: validate in the browser, then show a success state. Nothing is sent anywhere. */
  window.lapsValidate = function (form) {
    var ok = true, first = null;
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      var wrap = f.closest(".field");
      if (!wrap || f.type === "radio") return;
      var err = wrap.querySelector(".err");
      var msg = "";
      if (!f.checkValidity()) {
        if (f.validity.valueMissing) msg = "Please fill this in.";
        else if (f.type === "email") msg = "Enter an email like name@example.com.";
        else if (f.type === "tel") msg = "Enter a 10-digit phone number.";
        else msg = f.getAttribute("data-msg") || "Please check this field.";
      }
      wrap.classList.toggle("bad", !!msg);
      f.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg;
      if (msg) { ok = false; first = first || f; }
    });
    if (first) first.focus();
    return ok;
  };
  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!window.lapsValidate(form)) return;
      var done = document.getElementById(form.getAttribute("data-demo"));
      form.hidden = true;
      if (done) { done.hidden = false; done.focus(); }
    });
  });

  /* Hero diagrams drift slightly against each other with the pointer */
  var hero = document.querySelector(".hero");
  var split = document.querySelector(".split");
  if (hero && split && !calm && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      split.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      split.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", function () { split.style.setProperty("--px", 0); split.style.setProperty("--py", 0); });
  }

  /* Airflow contours: plain WebGL. Lines bend toward the pointer, pause off screen,
     draw one still frame for reduced motion, and quietly do nothing without WebGL. */
  document.querySelectorAll("canvas.fx").forEach(function (canvas) {
    var host = canvas.parentElement;
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl || !gl.getExtension("OES_standard_derivatives")) return;

    var fs = [
      "#extension GL_OES_standard_derivatives : enable",
      "precision mediump float;",
      "uniform vec2 uRes; uniform float uTime; uniform vec2 uPtr; uniform float uPtrAmt; uniform float uGain;",
      "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
      "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }",
      "float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }",
      "float iso(float n, float w){ float f = fract(n); return 1.0 - smoothstep(0.0, w, min(f, 1.0 - f)); }",
      "void main(){",
      "  vec2 uv = gl_FragCoord.xy / uRes.y;",
      "  float t = uTime * 0.045;",
      // Stretched horizontally so the contours read like drifting air currents.
      "  vec2 q = uv * vec2(1.1, 2.0);",
      "  float v = fbm(q + vec2(t, -t * 0.4)) + 0.35 * fbm(q * 2.3 - vec2(t * 0.8, t * 0.3));",
      "  vec2 d = (gl_FragCoord.xy - uPtr) / uRes.y;",
      "  v += uPtrAmt * 0.26 * exp(-dot(d, d) * 12.0);",
      "  float n = v * 11.0;",
      "  float w = fwidth(n);",
      "  float a = 0.20 * iso(n, w * 1.1) + 0.32 * iso(n / 5.0, w * 0.4);",
      // Glow near the pointer.
      "  a += uPtrAmt * 0.18 * exp(-dot(d, d) * 30.0) * iso(n, w * 2.5);",
      "  vec2 s = gl_FragCoord.xy / uRes;",
      "  a *= smoothstep(0.0, 0.35, s.y) * uGain;",
      "  vec3 col = mix(vec3(0.85, 0.31, 0.0), vec3(1.0, 0.55, 0.26), s.x);",
      "  gl_FragColor = vec4(col * a, a);",
      "}"
    ].join("\n");
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vsh = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
    var fsh = sh(gl.FRAGMENT_SHADER, fs);
    if (!vsh || !fsh) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ["uRes", "uTime", "uPtr", "uPtrAmt", "uGain"].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(U.uRes, w, h);
      gl.uniform1f(U.uGain, canvas.clientWidth < 700 ? 0.6 : 1.0);
    }
    var ptr = { x: -9999, y: -9999, on: false }, amt = 0;
    if (!calm) {
      host.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        ptr.x = (e.clientX - r.left) * dpr; ptr.y = (r.bottom - e.clientY) * dpr; ptr.on = true;
      });
      host.addEventListener("pointerleave", function () { ptr.on = false; });
    }
    var start = performance.now(), raf = 0, visible = true;
    function draw(now) {
      amt += ((ptr.on ? 1 : 0) - amt) * 0.06;
      gl.uniform1f(U.uTime, calm ? 30.0 : 30.0 + (now - start) / 1000);
      gl.uniform2f(U.uPtr, ptr.x, ptr.y);
      gl.uniform1f(U.uPtrAmt, amt);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) { draw(now); raf = requestAnimationFrame(loop); }
    function play() { if (!calm && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    resize(); draw(performance.now());
    new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(canvas);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) play(); else stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
    canvas.addEventListener("webglcontextlost", stop);
    play();
  });
})();
