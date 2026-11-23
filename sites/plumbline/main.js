/* Plumbline concept site. Plain JS, no dependencies. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = mqReduce.matches;
  var header = $(".site-header");
  var panel = $("#mobile-panel");
  var menuBtn = $(".menu-btn");

  /* ---------- Header tone follows the section underneath ---------- */
  var themed = $$("main [data-theme], .site-footer");
  function updateTone() {
    if (!panel.hidden) return;
    var y = header.getBoundingClientRect().bottom + 1;
    var tone = "blue";
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) {
        var t = themed[i].getAttribute("data-theme");
        tone = t === "white" || t === "light" ? "light" : t;
        break;
      }
    }
    if (header.getAttribute("data-tone") !== tone) header.setAttribute("data-tone", tone);
  }
  var toneQueued = false;
  window.addEventListener("scroll", function () {
    if (toneQueued) return;
    toneQueued = true;
    requestAnimationFrame(function () { toneQueued = false; updateTone(); });
  }, { passive: true });
  window.addEventListener("resize", updateTone);
  updateTone();

  /* ---------- Desktop mega menus ---------- */
  var triggers = $$(".nav-trigger");
  var hoverCapable = window.matchMedia("(hover: hover)");
  var hoverTimer = 0;
  function setMenu(trigger, open) {
    trigger.setAttribute("aria-expanded", String(open));
    document.getElementById(trigger.getAttribute("aria-controls")).hidden = !open;
    if (!open) trigger.removeAttribute("data-hover");
  }
  function closeMenus(except) {
    triggers.forEach(function (t) {
      if (t !== except && t.getAttribute("aria-expanded") === "true") setMenu(t, false);
    });
  }
  function openTrigger() {
    return triggers.filter(function (t) { return t.getAttribute("aria-expanded") === "true"; })[0] || null;
  }
  triggers.forEach(function (t) {
    var item = t.parentElement;
    t.addEventListener("click", function () {
      var isOpen = t.getAttribute("aria-expanded") === "true";
      if (isOpen && t.hasAttribute("data-hover")) { t.removeAttribute("data-hover"); return; }
      closeMenus(t);
      setMenu(t, !isOpen);
    });
    item.addEventListener("mouseenter", function () {
      if (!hoverCapable.matches) return;
      clearTimeout(hoverTimer);
      if (t.getAttribute("aria-expanded") !== "true") {
        closeMenus(t);
        setMenu(t, true);
        t.setAttribute("data-hover", "");
      }
    });
    item.addEventListener("mouseleave", function () {
      if (!hoverCapable.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () { setMenu(t, false); }, 200);
    });
    item.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !item.contains(e.relatedTarget)) setMenu(t, false);
    });
  });
  document.addEventListener("click", function (e) {
    if (openTrigger() && !header.contains(e.target)) closeMenus();
  });

  /* ---------- Mobile panel ---------- */
  function setPanel(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      panel.style.setProperty("--panel-top", Math.max(0, header.getBoundingClientRect().bottom) + "px");
      header.setAttribute("data-tone", "light");
    }
    panel.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
    if (!open) updateTone();
  }
  menuBtn.addEventListener("click", function () {
    setPanel(menuBtn.getAttribute("aria-expanded") !== "true");
  });
  $$(".m-trigger").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
    });
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024 && !panel.hidden) setPanel(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var t = openTrigger();
    if (t) { closeMenus(); t.focus(); return; }
    if (!panel.hidden) { setPanel(false); menuBtn.focus(); }
  });

  /* ---------- Tabs (use cases and code samples) ---------- */
  var tabGroups = {};
  $$("[data-tabs]").forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      if (list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: tab.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    function edge() { list.classList.toggle("at-end", list.scrollLeft + list.clientWidth >= list.scrollWidth - 2); }
    list.addEventListener("scroll", edge, { passive: true });
    window.addEventListener("resize", edge);
    edge();
    tabGroups[list.getAttribute("data-tabs")] = { tabs: tabs, select: select };
  });
  function selectTab(group, key) {
    var g = tabGroups[group];
    if (!g) return;
    var t = g.tabs.filter(function (x) { return x.getAttribute("data-key") === key; })[0];
    if (t) g.select(t, false);
  }

  /* ---------- Dialogs ---------- */
  function openDialog(id) {
    var d = document.getElementById(id);
    if (!d || typeof d.showModal !== "function") return;
    $$("dialog[open]").forEach(function (o) { if (o !== d) o.close(); });
    closeMenus();
    if (!panel.hidden) setPanel(false);
    if (!d.open) d.showModal();
    if (id === "search-dialog") {
      var input = $("#search-input");
      input.value = "";
      filterSearch();
      input.focus();
    } else if (id === "contact-dialog") {
      var first = $("#c-name");
      if (first && !$("#contact-form").hidden) first.focus();
    }
  }
  $$("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) {
      if (e.target !== d) return;
      var r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });

  /* ---------- Read dialog content ---------- */
  var READS = {
    a2: { kicker: "Upgrade", title: "Feeds v4 cuts update latency to 400 milliseconds on fast networks", meta: "Nov 3, 2026 · Release notes",
      body: ["Feeds v4 changes how nodes agree on a value, cutting the time from source to onchain round to 400 milliseconds on fast networks.",
        "Existing integrations keep working without changes. New integrations can opt into the faster path with a single configuration flag, and the feed monitor now shows which path each feed uses."] },
    a3: { kicker: "Research", title: "How we measure source independence across 2,400 feeds", meta: "Oct 28, 2026 · Research",
      body: ["Two sources that license data from the same upstream vendor aren't independent, even if they sign separately. We now score every feed on how much its sources share upstream.",
        "The score is published next to each value in the feed monitor, so integrators can require a minimum level of independence before a round is accepted."] },
    a4: { kicker: "Event", title: "Plumb Summit 2027 opens its call for speakers", meta: "Oct 21, 2026 · Events",
      body: ["Plumb Summit returns in spring 2027 with two days of talks and workshops for teams building on verified data.",
        "We're looking for talks on proof of reserves, cross-network risk and data quality, from first integrations to postmortems. Submissions close December 12."] },
    n1: { kicker: "Press", title: "Plumbline Foundation opens node operator applications for 2027", meta: "Nov 18, 2026 · Press release",
      body: ["The Foundation is adding 40 operator seats across five regions for Feeds and Relay.",
        "Applicants need two years of production infrastructure experience and a clean security review. Selected teams join a 90-day shadow period before they sign live rounds. Applications close January 15."] },
    n2: { kicker: "Release", title: "Relay reaches 52 networks", meta: "Nov 12, 2026 · Release notes",
      body: ["Relay now connects 52 networks. The release adds per-asset transfer limits that lane owners can change through governance without redeploying contracts.",
        "A new dry-run mode shows how a proposed limit change would have affected the last 30 days of traffic before it goes live."] },
    n3: { kicker: "Research", title: "A field guide to oracle failure modes", meta: "Nov 6, 2026 · Research report",
      body: ["Our research team catalogued every degraded round on the network since 2021 and grouped them into twelve failure modes, from stale sources to correlated outages.",
        "The guide pairs each failure mode with the control that caught it and the deviation, heartbeat and disagreement settings we now recommend for each kind of feed."] },
    n4: { kicker: "Ecosystem", title: "Kettlewick & Co. moves supplier payouts to Relay", meta: "Oct 30, 2026 · Customer news",
      body: ["Kettlewick & Co. pays more than 9,000 suppliers in 31 currencies. Moving payouts to Relay cut settlement from two days to under a minute.",
        "Exchange rates from independent sources are recorded next to every payment, so the treasury team reconciles from the same file it always has."],
      quote: ["Our suppliers noticed before our auditors did. Then our auditors liked it too.", "Ruth Okonjo, Group Treasurer, Kettlewick & Co."] },
    n5: { kicker: "Release", title: "Attest adds bank-account reserve sources", meta: "Oct 22, 2026 · Release notes",
      body: ["Attest now reads balances from participating banks through signed statements, so issuers can prove cash reserves alongside onchain wallets.",
        "Each statement is checked against the bank's published signing key before it counts toward a reserve total."] },
    n6: { kicker: "Event", title: "Recap: Verified Data Day in Lisbon", meta: "Oct 15, 2026 · Events",
      body: ["Four hundred builders joined us in Lisbon for a day of talks and workshops on proof of reserves, rate limits and the next five years of the network.",
        "Recordings of all 18 sessions, including the rate-limit design review, are on their way to the newsroom."] },
    n7: { kicker: "Research", title: "What 40 billion rounds taught us about heartbeats", meta: "Sep 30, 2026 · Research",
      body: ["We analysed 40 billion rounds to see how heartbeat length affects freshness during volatile markets.",
        "For most collateral feeds, heartbeats longer than 30 minutes add risk faster than they save fees. The full dataset is available to integrators."] },
    n8: { kicker: "Release", title: "Compute jobs can now read private inputs", meta: "Sep 18, 2026 · Release notes",
      body: ["Compute now supports private inputs held in secure enclaves. A job can read a confidential credit score or a bank balance, and only the signed result reaches the network.",
        "Inputs are encrypted end to end and deleted when the job finishes."] },
    n9: { kicker: "Press", title: "Plumbline publishes its third independent security review", meta: "Sep 4, 2026 · Security",
      body: ["Our third annual review, by two independent firms, covered Feeds, Relay and the risk network.",
        "It found no critical or high issues and two medium findings, both fixed before the report was published in full."] },
    st1: { kicker: "Customer story", title: "Halvard on moving a money fund onchain", meta: "Halvard Asset Management · 6:24", video: true,
      body: ["Halvard's money fund had share classes on four networks and a NAV that arrived by email. Every morning, four teams reconciled four copies of the same number.",
        "Now the administrator signs one NAV a day and Plumbline delivers it everywhere the shares live. Subscriptions and redemptions settle against the same signed value."],
      quote: ["We stopped reconciling four versions of the same number.", "Ines Talvik, Head of Digital Assets, Halvard Asset Management"] },
    st2: { kicker: "Customer story", title: "How Ostrine Pay proves its reserves every hour", meta: "Ostrine Pay · 4:51", video: true,
      body: ["Ostrine Pay used to publish a reserve letter once a month. With Attest, its custodians and banks report directly to the network every hour.",
        "If reserves ever fall behind supply, Ostrine's mint limits tighten automatically until they catch up."],
      quote: ["Our holders don't have to trust a PDF anymore. They can check the network.", "Dario Mensah, Chief Financial Officer, Ostrine Pay"] },
    st3: { kicker: "Customer story", title: "Lumora Exchange on fair marks in a fast market", meta: "Lumora Exchange · 5:37", video: true,
      body: ["Lumora runs 300 derivatives markets. It replaced three data vendors with one Plumbline stream, and now marks and settles from the same signed reports.",
        "That ended a weekly reconciliation and gave the exchange a replayable record for every disputed fill."],
      quote: ["When a fill is disputed, we replay the round. The argument is over in a minute.", "Priya Okafor, Head of Market Structure, Lumora Exchange"] },
    st4: { kicker: "Customer story", title: "Brisande Mutual on parametric cover at field scale", meta: "Brisande Mutual · 7:02", video: true,
      body: ["Brisande insures smallholder farms against drought. Rainfall readings from twelve stations feed a trigger that Plumbline evaluates in the open.",
        "When the rains failed last season, 11,000 claims were paid in a week without a single claim form."],
      quote: ["Farmers were paid the week the rain failed, not the season after.", "Tomas Erlund, Chief Underwriter, Brisande Mutual"] },
    st5: { kicker: "Customer story", title: "Marrowby Clearing on settlement that never closes", meta: "Marrowby Clearing · 3:58", video: true,
      body: ["Marrowby clears trades for brokers in six time zones. Relay lets it settle between its own ledger and public networks around the clock.",
        "Its risk team sets limits for every lane, and the risk network can pause a lane in seconds if something looks wrong."],
      quote: ["Weekends used to be a risk. Now they're just two more settlement days.", "Halima Varga, Chief Operating Officer, Marrowby Clearing"] },
    st6: { kicker: "Customer story", title: "Corvant on liquidations without the panic", meta: "Corvant · 5:15", video: true,
      body: ["Corvant runs lending markets with thousands of open loans. During a 9% intraday drop, rounds every 400 milliseconds kept collateral values current.",
        "A disagreement breaker paused one feed for eleven seconds while sources split. Liquidations stayed orderly and no bad debt was left behind."],
      quote: ["We watched the breaker trip once, for eleven seconds. That was the whole incident.", "Mateo Lindqvist, Risk Lead, Corvant"] }
  };
  function openRead(key) {
    var d = READS[key];
    if (!d) return;
    $("#read-kicker").textContent = d.kicker;
    $("#read-title").textContent = d.title;
    $("#read-meta").textContent = d.meta;
    var body = $("#read-body");
    body.textContent = "";
    d.body.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    });
    if (d.quote) {
      var bq = document.createElement("blockquote");
      var qp = document.createElement("p");
      qp.textContent = "“" + d.quote[0] + "”";
      var cite = document.createElement("cite");
      cite.textContent = d.quote[1];
      bq.appendChild(qp);
      bq.appendChild(cite);
      body.appendChild(bq);
    }
    if (d.video) {
      var note = document.createElement("p");
      note.className = "read-note";
      note.textContent = "The video isn't part of this concept site, so here's the written summary.";
      body.appendChild(note);
    }
    openDialog("read-dialog");
  }

  /* ---------- Delegated clicks ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target : e.target.parentElement;
    if (!el) return;
    var opener = el.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      if (opener.hasAttribute("data-notice")) $("#notice-title").textContent = opener.getAttribute("data-notice");
      openDialog(opener.getAttribute("data-open"));
      return;
    }
    var reader = el.closest("[data-read]");
    if (reader) { closeMenus(); openRead(reader.getAttribute("data-read")); return; }
    var closer = el.closest("[data-close]");
    if (closer) { var dlg = closer.closest("dialog"); if (dlg) dlg.close(); return; }
    var tabLink = el.closest("a[data-tab]");
    if (tabLink) selectTab("uc", tabLink.getAttribute("data-tab"));
    if (el.closest(".mega a")) closeMenus();
    if (el.closest("#mobile-panel a")) setPanel(false);
    var searchLink = el.closest("#search-results a");
    if (searchLink) $("#search-dialog").close();
  });

  /* ---------- Search ---------- */
  var sInput = $("#search-input");
  var sItems = $$("#search-results li");
  var sEmpty = $("#search-empty");
  function filterSearch() {
    var q = sInput.value.trim().toLowerCase();
    var words = q ? q.split(/\s+/) : [];
    var shown = 0;
    sItems.forEach(function (li) {
      var a = li.firstElementChild;
      var hay = (a.textContent + " " + (a.getAttribute("data-k") || "")).toLowerCase();
      var ok = words.every(function (w) { return hay.indexOf(w) !== -1; });
      li.hidden = !ok;
      if (ok) shown++;
    });
    sEmpty.hidden = shown > 0;
  }
  sInput.addEventListener("input", filterSearch);
  sInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); $("#search-dialog").close(); return; }
    var first = sItems.filter(function (li) { return !li.hidden; })[0];
    if (!first) return;
    if (e.key === "Enter") { e.preventDefault(); first.firstElementChild.click(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); first.firstElementChild.focus(); }
  });
  $("#search-results").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    var links = sItems.filter(function (li) { return !li.hidden; }).map(function (li) { return li.firstElementChild; });
    var i = links.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === "ArrowDown" && i < links.length - 1) links[i + 1].focus();
    else if (e.key === "ArrowUp") (i === 0 ? sInput : links[i - 1]).focus();
  });
  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || tag === "select";
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      openDialog("search-dialog");
    }
  });

  /* ---------- Hero word rotator ---------- */
  (function () {
    var rot = $(".rotator");
    if (!rot) return;
    var track = $(".rotator-track", rot);
    var words = $$(".rw", track).map(function (w) { return w.textContent; });
    var n = words.length;
    track.textContent = "";
    for (var c = 0; c < 3; c++) {
      words.forEach(function (w) {
        var s = document.createElement("span");
        s.className = "rw";
        s.textContent = w;
        track.appendChild(s);
      });
    }
    var items = $$(".rw", track);
    var idx = n + 2, lh = 0, rows = 5, timer = 0, paused = false, visible = true;
    function measure() {
      lh = items[0].getBoundingClientRect().height;
      rows = parseInt(getComputedStyle(rot).getPropertyValue("--rows"), 10) || 5;
    }
    function render(animate) {
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translate3d(0," + (-(idx - Math.floor(rows / 2)) * lh) + "px,0)";
      items.forEach(function (el, i) {
        el.classList.toggle("is-active", i === idx);
        el.classList.toggle("is-near", Math.abs(i - idx) === 1);
      });
      if (!animate) { void track.offsetHeight; track.style.transition = ""; }
    }
    function step() {
      if (idx >= 2 * n) { idx -= n; render(false); }
      idx++;
      render(true);
    }
    function schedule() {
      clearInterval(timer);
      if (!reduce && !paused && visible && !document.hidden) timer = setInterval(step, 2300);
    }
    measure();
    render(false);
    window.addEventListener("resize", function () { measure(); render(false); });
    var title = $(".hero-title"), hero = $(".hero");
    title.addEventListener("mouseenter", function () { paused = true; schedule(); });
    title.addEventListener("mouseleave", function () { paused = false; schedule(); });
    hero.addEventListener("focusin", function () { paused = true; schedule(); });
    hero.addEventListener("focusout", function () { paused = false; schedule(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", schedule);
    mqReduce.addEventListener("change", function () { reduce = mqReduce.matches; schedule(); });
    schedule();
  })();

  /* ---------- Hero network canvas ---------- */
  (function () {
    var canvas = $(".hero-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var hero = $(".hero");
    var w = 0, h = 0, nodes = [], edges = [], adj = [], pulses = [], raf = 0, last = 0, spawnAt = 0, visible = true;
    var seed = 11;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function build() {
      seed = 11; nodes = []; edges = []; pulses = [];
      var cell = w < 700 ? 96 : 128;
      var cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1, grid = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (rand() < 0.16) { grid.push(-1); continue; }
          grid.push(nodes.length);
          nodes.push({ x: (c - 0.3 + rand() * 0.6) * cell, y: (r - 0.3 + rand() * 0.6) * cell, ph: rand() * 6.283, hub: rand() < 0.1, flash: 0 });
        }
      }
      adj = nodes.map(function () { return []; });
      function link(a, b) {
        if (a < 0 || b < 0) return;
        adj[a].push(edges.length); adj[b].push(edges.length);
        edges.push([a, b]);
      }
      for (var rr = 0; rr < rows; rr++) {
        for (var cc = 0; cc < cols; cc++) {
          var a = grid[rr * cols + cc];
          if (a < 0) continue;
          if (cc + 1 < cols && rand() < 0.86) link(a, grid[rr * cols + cc + 1]);
          if (rr + 1 < rows && rand() < 0.86) link(a, grid[(rr + 1) * cols + cc]);
          if (cc + 1 < cols && rr + 1 < rows && rand() < 0.3) link(a, grid[(rr + 1) * cols + cc + 1]);
        }
      }
    }
    function pos(nd, t) { return [nd.x + Math.sin(t * 0.0004 + nd.ph) * 3, nd.y + Math.cos(t * 0.0005 + nd.ph) * 3]; }
    function makePulse(p) {
      var e = Math.floor(Math.random() * edges.length), fwd = Math.random() < 0.5, ab = edges[e];
      return { from: fwd ? ab[0] : ab[1], to: fwd ? ab[1] : ab[0], edge: e, p: p, speed: 0.0009 + Math.random() * 0.0008, hops: 1 + Math.floor(Math.random() * 3), lime: Math.random() < 0.16 };
    }
    function draw(t, dt) {
      ctx.clearRect(0, 0, w, h);
      var P = nodes.map(function (nd) { return pos(nd, t); });
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(205,212,255,0.14)";
      ctx.beginPath();
      edges.forEach(function (e) { ctx.moveTo(P[e[0]][0], P[e[0]][1]); ctx.lineTo(P[e[1]][0], P[e[1]][1]); });
      ctx.stroke();
      for (var i = pulses.length - 1; i >= 0; i--) {
        var q = pulses[i];
        q.p += q.speed * dt;
        if (q.p >= 1) {
          nodes[q.to].flash = 1;
          var opts = adj[q.to].filter(function (ei) { return ei !== q.edge; });
          if (q.hops > 0 && opts.length) {
            var ne = opts[Math.floor(Math.random() * opts.length)], ed = edges[ne];
            q.from = q.to; q.to = ed[0] === q.to ? ed[1] : ed[0]; q.edge = ne; q.p = 0; q.hops--;
          } else { pulses.splice(i, 1); continue; }
        }
        var A = P[q.from], B = P[q.to];
        var x = A[0] + (B[0] - A[0]) * q.p, y = A[1] + (B[1] - A[1]) * q.p;
        var tp = Math.max(0, q.p - 0.4);
        var tx = A[0] + (B[0] - A[0]) * tp, ty = A[1] + (B[1] - A[1]) * tp;
        var col = q.lime ? "215,255,58" : "222,227,255";
        var g = ctx.createLinearGradient(tx, ty, x, y);
        g.addColorStop(0, "rgba(" + col + ",0)");
        g.addColorStop(1, "rgba(" + col + ",0.9)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = "rgba(" + col + ",1)";
        ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 6.283); ctx.fill();
      }
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k], px = P[k][0], py = P[k][1];
        ctx.fillStyle = nd.hub ? "rgba(236,239,255,0.75)" : "rgba(220,226,255,0.42)";
        ctx.beginPath(); ctx.arc(px, py, nd.hub ? 2.6 : 1.6, 0, 6.283); ctx.fill();
        if (nd.hub) {
          ctx.strokeStyle = "rgba(236,239,255,0.2)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(px, py, 8, 0, 6.283); ctx.stroke();
        }
        if (nd.flash > 0.02) {
          ctx.strokeStyle = "rgba(255,255,255," + (0.6 * nd.flash) + ")"; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(px, py, 4 + (1 - nd.flash) * 11, 0, 6.283); ctx.stroke();
          nd.flash *= Math.pow(0.003, dt / 1000);
        }
      }
    }
    function frame(t) {
      var dt = last ? Math.min(48, t - last) : 16;
      last = t;
      if (t > spawnAt && edges.length && pulses.length < 26) { pulses.push(makePulse(0)); spawnAt = t + 150 + Math.random() * 230; }
      draw(t, dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (raf || reduce || !visible || document.hidden) return; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    function drawStatic() {
      pulses = [];
      for (var i = 0; i < Math.min(12, edges.length); i++) pulses.push(makePulse(0.3 + Math.random() * 0.6));
      pulses.forEach(function (q) { q.hops = 0; q.speed = 0; });
      draw(0, 0);
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) drawStatic(); else if (!raf) draw(performance.now(), 0);
    }
    resize();
    if ("ResizeObserver" in window) {
      var queued = false;
      new ResizeObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; resize(); });
      }).observe(hero);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
    mqReduce.addEventListener("change", function () {
      reduce = mqReduce.matches;
      if (reduce) { stop(); drawStatic(); } else { build(); start(); }
    });
    start();
  })();

  /* ---------- Reveal on scroll ---------- */
  (function () {
    var els = $$(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    els.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
      el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 60 + "ms");
      io.observe(el);
    });
  })();

  /* ---------- Value counter ---------- */
  (function () {
    var el = $("#value-digits");
    if (!el) return;
    var base = 18402551209734, value = base, started = false, raf = 0, lastTick = 0, visible = false;
    var head = document.createTextNode(""), tailEl = document.createElement("span");
    tailEl.className = "value-tail";
    el.textContent = "";
    el.appendChild(head);
    el.appendChild(tailEl);
    function render() {
      var s = Math.floor(value).toLocaleString("en-US");
      head.nodeValue = s.slice(0, -3);
      tailEl.textContent = s.slice(-3);
    }
    function tick() {
      if (raf) return;
      function f(t) {
        if (!visible || document.hidden) { raf = 0; return; }
        if (t - lastTick > 90) { value += 28000 + Math.random() * 140000; render(); lastTick = t; }
        raf = requestAnimationFrame(f);
      }
      raf = requestAnimationFrame(f);
    }
    function countUp() {
      var from = base * 0.985, t0 = performance.now(), dur = 2200;
      function f(t) {
        var k = Math.min(1, (t - t0) / dur);
        value = from + (base - from) * (1 - Math.pow(1 - k, 4));
        render();
        if (k < 1) raf = requestAnimationFrame(f);
        else { raf = 0; tick(); }
      }
      raf = requestAnimationFrame(f);
    }
    render();
    if (reduce || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (!visible) return;
      if (!started) { started = true; countUp(); } else tick();
    }, { threshold: 0.3 }).observe(el.closest(".value"));
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible && started) tick(); });
  })();

  /* ---------- Code copy ---------- */
  (function () {
    var btn = $("#copy-btn");
    if (!btn) return;
    var label = btn.querySelector("span"), status = $("#copy-status"), timer = 0;
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.className = "sr-only";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
    function done(ok) {
      label.textContent = ok ? "Copied" : "Select and copy";
      btn.classList.toggle("is-done", ok);
      status.textContent = ok ? "Code copied to the clipboard." : "Copy failed. Select the code and copy it manually.";
      clearTimeout(timer);
      timer = setTimeout(function () { label.textContent = "Copy"; btn.classList.remove("is-done"); status.textContent = ""; }, 2000);
    }
    btn.addEventListener("click", function () {
      var panelEl = $$(".code-panel").filter(function (p) { return !p.hidden; })[0];
      var text = panelEl.querySelector("code").textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  })();

  /* ---------- Simulated feed monitor ---------- */
  (function () {
    var rows = $$("#feed-rows tr");
    if (!rows.length) return;
    var state = rows.map(function (r) {
      return {
        base: parseFloat(r.getAttribute("data-v")), v: parseFloat(r.getAttribute("data-v")),
        dp: parseInt(r.getAttribute("data-dp"), 10), vol: parseFloat(r.getAttribute("data-vol")),
        unit: r.getAttribute("data-unit") || "", age: parseInt(r.querySelector(".hb-t").textContent, 10) || 0,
        vEl: r.querySelector(".v"), dEl: r.querySelector(".d"), dot: r.querySelector(".hb-dot"), tEl: r.querySelector(".hb-t")
      };
    });
    var visible = false, timer = 0;
    function fmt(s) {
      return s.v.toLocaleString("en-US", { minimumFractionDigits: s.dp, maximumFractionDigits: s.dp }) + s.unit;
    }
    function update(s) {
      var prev = s.v;
      s.v = Math.max(s.base * 0.98, Math.min(s.base * 1.02, s.v + (Math.random() - 0.5) * 2 * s.vol));
      var chg = (s.v - s.base) / s.base * 100;
      s.vEl.textContent = fmt(s);
      s.dEl.textContent = (chg >= 0 ? "+" : "−") + Math.abs(chg).toFixed(2) + "%";
      s.dEl.classList.toggle("up", chg >= 0);
      s.dEl.classList.toggle("down", chg < 0);
      s.vEl.classList.remove("flash-up", "flash-down");
      void s.vEl.offsetWidth;
      s.vEl.classList.add(s.v >= prev ? "flash-up" : "flash-down");
      setTimeout(function () { s.vEl.classList.remove("flash-up", "flash-down"); }, 650);
      s.dot.classList.remove("beat");
      void s.dot.offsetWidth;
      s.dot.classList.add("beat");
      s.age = 0;
      s.tEl.textContent = "just now";
    }
    function loop() {
      state.forEach(function (s) { s.age++; s.tEl.textContent = s.age + "s ago"; });
      var count = 1 + Math.floor(Math.random() * 2);
      for (var i = 0; i < count; i++) update(state[Math.floor(Math.random() * state.length)]);
    }
    function schedule() {
      clearInterval(timer);
      if (!reduce && visible && !document.hidden) timer = setInterval(loop, 1400);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(); }).observe($(".monitor"));
    }
    document.addEventListener("visibilitychange", schedule);
  })();

  /* ---------- Stories carousel ---------- */
  (function () {
    var track = $("#stories-track");
    if (!track) return;
    var btns = $$(".car-btn");
    function stepSize() {
      var card = track.querySelector(".story");
      var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
      return card ? card.getBoundingClientRect().width + gap : 300;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      btns.forEach(function (b) {
        var dir = parseInt(b.getAttribute("data-dir"), 10);
        var off = dir < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
        b.setAttribute("aria-disabled", String(off));
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("aria-disabled") === "true") return;
        track.scrollBy({ left: stepSize() * parseInt(b.getAttribute("data-dir"), 10), behavior: reduce ? "auto" : "smooth" });
      });
    });
    var queued = false;
    track.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* ---------- Newsroom expand ---------- */
  (function () {
    var btn = $("#news-toggle");
    if (!btn) return;
    var extra = $$(".news-more");
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Show fewer" : "View all";
      extra.forEach(function (li) { li.hidden = !open; });
      if (open) extra[0].querySelector("button").focus();
    });
  })();

  /* ---------- Forms ---------- */
  function labelFor(input) {
    var l = document.querySelector('label[for="' + input.id + '"]');
    return l ? l.childNodes[0].textContent.trim().toLowerCase() : "this field";
  }
  function messageFor(input) {
    var v = input.validity;
    if (v.valueMissing) {
      if (input.type === "checkbox") return "Tick the box to confirm you'd like the newsletter.";
      if (input.tagName === "SELECT") return "Choose what you're interested in.";
      return "Enter your " + labelFor(input) + ".";
    }
    if (v.typeMismatch && input.type === "email") return "Enter a valid email address, like name@company.com.";
    if (input.name === "name" && input.value.trim().length < 2) return "Enter your full name.";
    return "";
  }
  function showError(input, msg) {
    var err = document.getElementById(input.getAttribute("aria-describedby"));
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      input.removeAttribute("aria-invalid");
      if (err) { err.textContent = ""; err.hidden = true; }
    }
    return !msg;
  }
  function validate(fields) {
    var firstBad = null;
    fields.forEach(function (f) {
      var ok = showError(f, messageFor(f));
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function liveCheck(fields) {
    fields.forEach(function (f) {
      var ev = f.type === "checkbox" || f.tagName === "SELECT" ? "change" : "input";
      f.addEventListener(ev, function () { if (f.getAttribute("aria-invalid") === "true") showError(f, messageFor(f)); });
      f.addEventListener("blur", function () { if (f.value && f.type !== "checkbox") showError(f, messageFor(f)); });
    });
  }

  (function () {
    var form = $("#nl-form");
    if (!form) return;
    var email = $("#nl-email"), consent = $("#nl-consent"), fields = [email, consent];
    liveCheck(fields);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(fields)) return;
      $("#nl-success-email").textContent = email.value.trim();
      $$(".field, .check", form).forEach(function (el) { el.hidden = true; });
      $("#nl-success").hidden = false;
    });
  })();

  (function () {
    var form = $("#contact-form");
    if (!form) return;
    var dlg = $("#contact-dialog"), success = $("#contact-success");
    var fields = ["#c-name", "#c-email", "#c-company", "#c-interest"].map(function (s) { return $(s); });
    liveCheck(fields);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(fields)) return;
      $("#contact-success-name").textContent = fields[0].value.trim().split(/\s+/)[0];
      $("#contact-ref").textContent = "PL-" + String(Math.floor(100000 + Math.random() * 900000));
      form.hidden = true;
      success.hidden = false;
      success.querySelector("button").focus();
    });
    dlg.addEventListener("close", function () {
      if (success.hidden) return;
      form.reset();
      fields.forEach(function (f) { showError(f, ""); });
      form.hidden = false;
      success.hidden = true;
    });
  })();
})();
