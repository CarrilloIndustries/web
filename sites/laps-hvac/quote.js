/* LAPS HVAC instant quote. Prices are an illustrative model for this portfolio concept. */
(function () {
  var SERVICES = {
    residential: [
      { id: "ac", name: "Central AC install", note: "New condenser and coil", base: 3900, per: 1.55, kind: "install", incl: ["Room-by-room load calculation", "New condenser, coil and line set", "Smart thermostat setup", "Old unit hauled away"] },
      { id: "furnace", name: "Furnace install", note: "Gas or electric", base: 3400, per: 1.1, kind: "install", incl: ["Load calculation", "New furnace and venting", "Carbon monoxide safety test", "Old unit hauled away"] },
      { id: "heatpump", name: "Heat pump system", note: "Heats and cools", base: 5200, per: 1.9, kind: "install", incl: ["Load calculation", "Outdoor and indoor units", "Rebate paperwork handled", "Old equipment hauled away"] },
      { id: "ducts", name: "Duct replace and seal", note: "Fix hot and cold rooms", base: 1600, per: 2.4, kind: "work", incl: ["Duct leakage test before and after", "New insulated runs where needed", "Mastic sealing at every joint", "Airflow check at each register"] },
      { id: "tune", name: "Seasonal tune-up", note: "Heating or cooling", base: 149, per: 0, kind: "flat", incl: ["21-point inspection", "Filter replacement", "Coil and drain cleaning", "Written health report"] },
      { id: "repair", name: "Diagnostic and repair", note: "Something's not right", base: 180, per: 0.05, kind: "repair", incl: ["Full system diagnostic", "Flat-rate repair price before work", "Common parts on the truck", "90-day repair warranty"] }
    ],
    commercial: [
      { id: "rtu", name: "Rooftop unit replacement", note: "Packaged RTU", base: 11000, per: 2.2, kind: "install", incl: ["Load and airflow survey", "Crane and permit coordination", "After-hours changeover", "Startup and controls tie-in"] },
      { id: "vrf", name: "VRF or split system", note: "Zoned comfort", base: 14000, per: 3.1, kind: "install", incl: ["Zoning design", "Outdoor and indoor units", "Refrigerant piping and testing", "Tenant-friendly scheduling"] },
      { id: "balance", name: "Ductwork and air balancing", note: "Even airflow", base: 3200, per: 0.9, kind: "work", incl: ["Airflow reading at every diffuser", "Damper and fan adjustments", "Duct repairs as needed", "Certified balance report"] },
      { id: "pm", name: "Preventive maintenance plan", note: "Quarterly visits", base: 480, per: 0.06, kind: "plan", incl: ["Four visits per year", "Filters and belts included", "Written report for every unit", "Priority emergency response"] },
      { id: "crepair", name: "Diagnostic and repair", note: "Fast fixes", base: 350, per: 0.04, kind: "repair", incl: ["Full system diagnostic", "Flat-rate repair price before work", "Common parts on the truck", "90-day repair warranty"] },
      { id: "bas", name: "Controls upgrade", note: "Building automation", base: 6500, per: 0.8, kind: "work", incl: ["Controls audit", "New controllers and sensors", "Scheduling and setback programming", "Remote monitoring setup"] }
    ]
  };
  var SIZE = { residential: { min: 600, max: 6000, step: 50, def: 2000 }, commercial: { min: 2000, max: 60000, step: 500, def: 12000 } };
  var FLOORS = {
    residential: [["1", "1 floor"], ["2", "2 floors"], ["3", "3 or more"]],
    commercial: [["1", "1 floor"], ["2.5", "2 to 3"], ["5", "4 to 6"], ["8", "7 or more"]]
  };

  var form = document.getElementById("quote");
  var svcBox = document.getElementById("svc-opts");
  var floorBox = document.getElementById("floor-opts");
  var sqft = document.getElementById("sqft");
  var sqftOut = document.getElementById("sqft-out");
  var priceEl = document.getElementById("price");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var val = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; };

  function radio(name, value, label, note, checked) {
    return '<label class="opt"><input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + "><span><b>" + label + "</b>" + (note ? "<small>" + note + "</small>" : "") + "</span></label>";
  }

  function buildForType(type) {
    var prev = val("svc");
    var list = SERVICES[type];
    var keep = list.some(function (s) { return s.id === prev; });
    svcBox.innerHTML = list.map(function (s, i) { return radio("svc", s.id, s.name, s.note, keep ? s.id === prev : i === 0); }).join("");
    floorBox.innerHTML = FLOORS[type].map(function (f, i) { return radio("floors", f[0], f[1], "", i === (type === "residential" ? 1 : 0)); }).join("");
    var z = SIZE[type];
    sqft.min = z.min; sqft.max = z.max; sqft.step = z.step; sqft.value = z.def;
    document.getElementById("sqft-min").textContent = z.min.toLocaleString("en-US");
    document.getElementById("sqft-max").textContent = z.max.toLocaleString("en-US") + " sq ft";
  }

  // cur tracks the midpoint on screen so an interrupted tween restarts from where it is.
  var cur = 0, anim = 0, finalText = "";
  function showPrice(lo, hi, unit) {
    var from = cur, to = (lo + hi) / 2, t0 = performance.now();
    finalText = money(round(lo)) + " – " + money(round(hi));
    var paint = function (k) {
      if (k >= 1) { cur = to; priceEl.textContent = finalText; return; }
      cur = from + (to - from) * k;
      var spread = (hi - lo) / 2 * (cur / to);
      priceEl.textContent = money(round(cur - spread)) + " – " + money(round(cur + spread));
    };
    cancelAnimationFrame(anim);
    if (calm || !from) paint(1);
    else {
      (function tick(now) {
        var k = Math.min(1, (now - t0) / 450);
        paint(k >= 1 ? 1 : 1 - Math.pow(1 - k, 3));
        if (k < 1) anim = requestAnimationFrame(tick);
      })(t0);
    }
    document.getElementById("price-unit").textContent = unit;
  }
  function round(n) { return n >= 1000 ? Math.round(n / 50) * 50 : Math.round(n / 5) * 5; }
  function pct(m) { var p = Math.round((m - 1) * 100); return p ? "+" + p + "%" : "—"; }

  function update() {
    var type = val("ptype");
    var svc = SERVICES[type].filter(function (s) { return s.id === val("svc"); })[0] || SERVICES[type][0];
    var size = +sqft.value;
    var floors = +(val("floors") || 1);
    var isInstall = svc.kind === "install", isRepair = svc.kind === "repair";
    document.getElementById("tier-step").hidden = !isInstall;
    document.getElementById("age-step").hidden = !isRepair;

    var tier = isInstall ? +val("tier") : 1;
    var age = isRepair ? +val("age") : 1;
    var urg = +val("urg");
    var floorM = svc.kind === "flat" ? 1 : 1 + 0.05 * (floors - 1);
    var base = svc.base, sizeCost = svc.per * size;
    var est = (base + sizeCost) * tier * age * floorM * urg;

    sqftOut.textContent = size.toLocaleString("en-US") + " sq ft";
    sqft.style.setProperty("--fill", ((size - sqft.min) / (sqft.max - sqft.min) * 100) + "%");

    var unit = { install: "installed, before rebates", work: "for the full job", flat: "per system", repair: "typical repair, diagnostic included", plan: "per quarter" }[svc.kind];
    showPrice(est * 0.9, est * 1.12, unit);
    document.getElementById("sum-svc").textContent = svc.name + " · " + (type === "residential" ? "Residential" : "Commercial");

    var rows = [["Base price", money(base)]];
    if (sizeCost) rows.push(["Size (" + size.toLocaleString("en-US") + " sq ft)", "+" + money(sizeCost)]);
    if (isInstall) rows.push(["Efficiency level", pct(tier)]);
    if (isRepair) rows.push(["System age", pct(age)]);
    if (svc.kind !== "flat") rows.push(["Floors served", pct(floorM)]);
    rows.push(["Scheduling", pct(urg)]);
    document.getElementById("breakdown").innerHTML = rows.map(function (r) { return "<li><span>" + r[0] + "</span><span>" + r[1] + "</span></li>"; }).join("");
    document.getElementById("includes").innerHTML = svc.incl.map(function (t) { return "<li>" + t + "</li>"; }).join("");
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "ptype") buildForType(e.target.value);
    update();
  });
  sqft.addEventListener("input", update);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!window.lapsValidate(form)) return;
    var ref = "LAPS-" + Math.floor(10000 + Math.random() * 90000);
    var first = document.getElementById("q-name").value.trim().split(/\s+/)[0];
    document.getElementById("done-text").textContent = "Thanks, " + first + ". Your quote " + ref + " (" + finalText + ", " +
      document.getElementById("sum-svc").textContent + ") is held for 30 days. We'll call within one business hour to book your on-site check.";
    Array.prototype.forEach.call(form.querySelectorAll("fieldset"), function (f) { f.hidden = true; });
    var done = document.getElementById("quote-done");
    done.hidden = false;
    done.focus();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: calm ? "auto" : "smooth" });
  });

  buildForType("residential");
  update();
})();
