/* ══════════════════════════════════════════════════════════════════════
   Catalog parser v2 — scroll-driven EXPERIMENT (base → variants map).
   Same spreadsheet scan as catalog-parser.js, but the output area is a
   two-column relationship view: base cards stacked on the LEFT, one
   mini variant card per parsed row on the RIGHT (color · size · sku ·
   price), each connected to its base with an arrowed link as it lands.
   Every visual is a pure function of scroll progress p.
   Reads window.CATALOG_CONFIG2.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  const CFG = window.CATALOG_CONFIG2;
  const root = document.getElementById(CFG.rootId || "cps2");
  if (!root) return;
  const q1 = (s) => root.querySelector(s);
  const track = q1(".cps-track"), stage = q1(".cps-stage"), inner = q1(".cps-inner");
  const sheet = q1(".cps-sheet"), rowsEl = q1(".cps-rows"), head = q1(".cps-head"), trail = q1(".cps-trail");
  const wrap = q1(".cb-wrap"), groupsEl = q1(".cb-groups"), headsEl = q1(".cb-heads"), links = q1(".cb-links");
  const hintEl = q1(".cps-hint"), sheetCount = q1(".cps-sheet-n"), sheetDone = q1(".cps-sheet-done");
  const ROWS = CFG.rows, N = ROWS.length;
  const NS = "http://www.w3.org/2000/svg";

  const cl = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  const es = (t) => t * t * (3 - 2 * t);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const seg = (v, a, b) => cl((v - a) / (b - a));

  /* ── Timing · bottom row first ──────────────────────────────── */
  /* END is DYNAMIC: the point where the next section starts rising is
     pure geometry (viewport height vs track/stage/padding), so the
     parse-end is computed from that geometry — the last row always
     lands BEFORE the rise window opens, on any screen. tuneEnd() keeps
     these in sync on measure and resize. */
  const START = 0.006;
  let END = 0.97, LEN = (END - START) / N;
  function tuneEnd() {
    const trackH = track.offsetHeight, stageH = stage.offsetHeight;
    const off = parseFloat(getComputedStyle(stage).top) || 0;
    const sec = track.closest(".cps");
    const pb = sec ? parseFloat(getComputedStyle(sec).paddingBottom) || 0 : 0;
    const span = trackH - stageH;
    if (span <= 0) return;
    const pRise = (off + pb + trackH - innerHeight) / span;
    END = Math.min(0.97, Math.max(0.5, pRise - 0.015));
    LEN = (END - START) / N;
  }
  const slotOf = (i) => N - 1 - i;
  const rowQ = (p, i) => cl((p - (START + slotOf(i) * LEN)) / LEN);

  const seen = {};
  [...ROWS].map((r, i) => i).sort((a, b) => slotOf(a) - slotOf(b)).forEach((i) => {
    ROWS[i].isNew = !seen[ROWS[i].base]; seen[ROWS[i].base] = 1;
  });

  /* ── Spreadsheet rows (same construction as v1) ─────────────── */
  const rowRefs = ROWS.map((r, i) => {
    const li = document.createElement("li");
    li.className = "cps-r";
    const box = document.createElement("div");
    box.className = "cps-r-in";
    box.innerHTML = '<span class="cps-r-i"></span><span class="cps-r-c"></span><span class="cps-r-s"></span><span class="cps-r-p"></span>';
    box.querySelector(".cps-r-i").textContent = String(i + 2);
    box.querySelector(".cps-r-s").textContent = r.sku;
    box.querySelector(".cps-r-p").textContent = String(Math.round(r.price));
    const cell = box.querySelector(".cps-r-c");
    const toks = [];
    r.tokens.forEach((t) => {
      if (t.sep) { const s = document.createElement("span"); s.className = "cps-sep"; s.textContent = t.sep; cell.appendChild(s); return; }
      const s = document.createElement("span");
      s.className = "cps-tok cps-tok-" + t.role;
      s.textContent = t.t;
      cell.appendChild(s);
      cell.appendChild(document.createTextNode(" "));
      toks.push({ el: s, x: 0, y: 0, w: 0, h: 0 });
    });
    if (r.flag) { const f = document.createElement("span"); f.className = "cps-flag"; f.textContent = r.flag; box.appendChild(f); }
    const bub = document.createElement("span");
    bub.className = "cps-bubble " + (r.isNew ? "nb" : "pv");
    bub.textContent = r.isNew ? CFG.badge.base : CFG.badge.variant;
    box.appendChild(bub);
    li.appendChild(box);
    rowsEl.appendChild(li);
    return { li, box, toks, bub, flag: box.querySelector(".cps-flag"), h: 0 };
  });

  /* ── Base cards (LEFT column), ordered by discovery ─────────── */
  const BASES = CFG.bases.slice().sort((a, b) => {
    const f = (id) => Math.min.apply(null, ROWS.map((r, i) => (r.base === id ? slotOf(i) : 99)));
    return f(a.id) - f(b.id);
  });
  /* Each base gets a GROUP band: base card left, its variants right —
     the first variant of each base aligns with its base's top, and
     because groups are separate, connector lines can never cross. */
  const varRefs = new Array(N);
  const baseRefs = BASES.map((b) => {
    const grp = document.createElement("div");
    grp.className = "cb-group";
    const c = document.createElement("div");
    c.className = "cb-base";
    c.innerHTML = '<div class="cb-b-h"><span class="cb-b-name"></span></div>'
      + '<div class="cb-b-chips"></div>';
    c.querySelector(".cb-b-name").textContent = b.name;
    const at = c.querySelector(".cb-b-chips");
    b.attrs.forEach(([k, v]) => {
      const ch = document.createElement("span");
      ch.className = "cps-chip";
      ch.innerHTML = "<i></i><b></b>";
      ch.querySelector("i").textContent = k;
      ch.querySelector("b").textContent = v;
      ch.style.setProperty("--on", "1");
      at.appendChild(ch);
    });
    grp.appendChild(c);
    const gv = document.createElement("div");
    gv.className = "cb-gvars";
    grp.appendChild(gv);
    groupsEl.appendChild(grp);
    const mine = ROWS.map((r, i) => (r.base === b.id ? i : -1)).filter((i) => i >= 0);
    // this base's variant slots, stacked in parse order from the top
    mine.slice().sort((x, y) => slotOf(x) - slotOf(y)).forEach((i) => {
      const r = ROWS[i];
      const v = document.createElement("div");
      v.className = "cb-var";
      v.innerHTML = '<span class="cps-pill cb-v-pill"></span><span class="cps-pill cb-v-pill"></span>'
        + '<span class="cb-v-sku"></span><span class="cb-v-price"></span>';
      const pills = v.querySelectorAll(".cb-v-pill");
      pills[0].textContent = r.vals[0][1];
      pills[1].textContent = r.vals[1][1];
      v.querySelector(".cb-v-sku").textContent = r.sku;
      v.querySelector(".cb-v-price").textContent = "$" + Math.round(r.price);
      gv.appendChild(v);
      const path = document.createElementNS(NS, "path");
      links.appendChild(path);
      varRefs[i] = { el: v, path };
    });
    return { el: c, base: b, mine,
      first: mine.reduce((a, i) => (slotOf(i) < slotOf(a) ? i : a), mine[0]) };
  });
  const baseOf = {}; baseRefs.forEach((b) => { baseOf[b.base.id] = b; });

  /* ── Measure + auto-fit ─────────────────────────────────────── */
  let cur = 0, fit = 1, ready = false;
  function measure() {
    try { measureInner(); } catch (e) { console.error("cps2 measure", e); } finally { ready = true; }
  }
  function measureGeom() {
    rowRefs.forEach((r) => {
      r.li.style.height = "auto";
      r.box.style.transform = "none"; r.box.style.opacity = "1";
      r.box.style.setProperty("--lift", "0");
      r.bub.style.opacity = "0";
      r.toks.forEach((t) => {
        t.el.style.setProperty("--on", "0");
        t.x = t.el.offsetLeft; t.y = t.el.offsetTop; t.w = t.el.offsetWidth; t.h = t.el.offsetHeight;
      });
      r.h = r.li.offsetHeight;
    });
  }
  function measureInner() {
    ready = false;
    inner.style.zoom = "1";
    measureGeom();
    ready = true;
    let tallest = 0;
    [0, 0.3, 0.6, 0.9, 1].forEach((s) => { render(s); tallest = Math.max(tallest, inner.offsetHeight); });
    const avail = stage.clientHeight - 26 - hintEl.offsetHeight;
    fit = Math.max(0.5, Math.min(1, avail / (tallest || 1)));
    inner.style.zoom = fit < 0.999 ? String(fit.toFixed(3)) : "1";
    if (fit < 0.999) { ready = false; measureGeom(); ready = true; }
    tuneEnd();
    render(cur);
  }

  /* offsets of an element within the .cb-wrap (its positioned ancestor) */
  const inWrap = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });

  /* ── Render ─────────────────────────────────────────────────── */
  function render(p) {
    if (!ready) return;
    let parsed = 0, active = -1, activeQ = 0;

    rowRefs.forEach((r, i) => {
      const q = rowQ(p, i);
      const sel = es(seg(q, 0, 0.07)) * (1 - es(seg(q, 0.52, 0.62)));
      const scan = seg(q, 0.07, 0.52);
      const lift = es(seg(q, 0.5, 0.64));
      const travel = eo(seg(q, 0.56, 0.96));
      const collapse = es(seg(q, 0.56, 0.80));
      const fade = eo(seg(q, 0.86, 0.99));   // vanish exactly at arrival
      if (q > 0 && q < 1) { active = i; activeQ = q; }
      if (q >= 0.80) parsed++;

      r.box.style.setProperty("--sel", sel.toFixed(3));
      r.box.style.setProperty("--lift", lift.toFixed(3));
      const nt = r.toks.length;
      r.toks.forEach((t, k) => t.el.style.setProperty("--on", cl((scan * nt - k) / 0.55).toFixed(3)));
      if (r.flag) r.flag.style.opacity = (es(seg(q, 0.30, 0.52)) * (1 - fade)).toFixed(3);
      const bv = es(seg(q, 0.52, 0.63)) * (1 - es(seg(q, 0.86, 0.97)));
      r.bub.style.opacity = bv.toFixed(3);
      r.bub.style.setProperty("--s", (0.8 + 0.2 * es(seg(q, 0.52, 0.66))).toFixed(3));

      // travel PRECISELY to this row's landing spot: base-creating rows
      // fly LEFT into the base card they create; variant rows fly RIGHT
      // into their exact slot. transform-origin is the row's TOP-LEFT and
      // the final scale is target-width / row-width, so at travel=1 the
      // row covers exactly the rect it's being inserted into — same
      // left edge, same width — instead of a right-shifted oversize.
      const tgt = ROWS[i].isNew ? inWrap(baseOf[ROWS[i].base].el) : inWrap(varRefs[i].el);
      const rw = r.box.offsetWidth || 1;
      const s1 = tgt.w / rw;
      const sc = 1 + (s1 - 1) * travel;
      const dx = (wrap.offsetLeft + tgt.x) - (sheet.offsetLeft + rowsEl.offsetLeft + r.li.offsetLeft + r.box.offsetLeft);
      const dy = (wrap.offsetTop + tgt.y) - (sheet.offsetTop + rowsEl.offsetTop + r.li.offsetTop)
               + ((tgt.h - r.h * s1) / 2) * travel;   // settle centered in the slot's height
      r.box.style.transformOrigin = "0 0";
      r.box.style.transform = "translate(" + (dx * travel).toFixed(1) + "px," + (dy * travel).toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
      r.box.style.opacity = (1 - fade).toFixed(3);
      r.li.style.height = collapse <= 0.001 ? "auto" : (r.h * (1 - collapse)).toFixed(1) + "px";
      r.li.style.zIndex = travel > 0 ? "5" : "1";
    });

    /* scan head + trail (identical to v1) */
    if (active >= 0 && activeQ > 0.05 && activeQ < 0.56) {
      const r = rowRefs[active], nt = r.toks.length;
      const s = cl(seg(activeQ, 0.07, 0.52) * nt, 0, nt);
      const k = Math.min(nt - 1, Math.floor(s));
      const t = r.toks[k], f = cl(s - k);
      const top = rowsEl.offsetTop + r.li.offsetTop + t.y, x = t.x + t.w * f;
      head.style.opacity = String(es(seg(activeQ, 0.05, 0.1)) * (1 - es(seg(activeQ, 0.48, 0.56))));
      head.style.transform = "translate(" + x.toFixed(1) + "px," + top.toFixed(1) + "px)";
      head.style.height = t.h + "px";
      trail.style.opacity = head.style.opacity;
      trail.style.transform = "translate(" + r.toks[0].x + "px," + top.toFixed(1) + "px)";
      trail.style.width = Math.max(0, x - r.toks[0].x).toFixed(1) + "px";
      trail.style.height = t.h + "px";
    } else { head.style.opacity = "0"; trail.style.opacity = "0"; }

    sheetCount.textContent = (N - parsed) + (N - parsed === 1 ? " row" : " rows");
    const dn = es(seg(p, END - LEN * 0.4, END));
    sheetDone.style.opacity = dn.toFixed(3);
    sheetDone.style.height = (dn * 30).toFixed(1) + "px";

    /* base cards reveal as their creating row arrives; column titles
       appear with the very first travel */
    baseRefs.forEach((b) => {
      const rev = es(seg(rowQ(p, b.first), 0.60, 0.82));
      b.el.style.setProperty("--rev", rev.toFixed(3));
    });
    headsEl.style.opacity = es(seg(rowQ(p, N - 1), 0.5, 0.85)).toFixed(3);

    /* variant cards fill + arrowed links back to their base */
    rowRefs.forEach((_, i) => {
      const q = rowQ(p, i);
      const v = varRefs[i];
      const nw = ROWS[i].isNew;
      const on = es(nw ? seg(q, 0.86, 0.97) : seg(q, 0.80, 0.94));
      v.el.style.setProperty("--vo", on.toFixed(3));
      v.el.classList.toggle("onv", q >= (nw ? 0.88 : 0.80));
      const b = baseOf[ROWS[i].base];
      const bb = inWrap(b.el), ss = inWrap(v.el);
      const x0 = bb.x + bb.w, y0 = bb.y + bb.h / 2;
      const x1 = ss.x - 6, y1 = ss.y + ss.h / 2;
      const mx = (x0 + x1) / 2;
      v.path.setAttribute("d",
        "M" + x0 + " " + y0 + " C" + mx + " " + y0 + " " + mx + " " + y1 + " " + x1 + " " + y1 +
        " M" + x1 + " " + y1 + " l-6 -4 M" + x1 + " " + y1 + " l-6 4");
      const L = v.path.getTotalLength();
      const k = es(nw ? seg(q, 0.90, 1) : seg(q, 0.84, 0.99));
      v.path.style.strokeDasharray = (L * k).toFixed(1) + " " + (L + 2).toFixed(1);
      v.path.style.opacity = k > 0 ? "1" : "0";
    });

    hintEl.style.setProperty("--on", (1 - es(seg(p, 0.01, 0.06))).toFixed(3));
  }

  /* ── Scroll driver (same as v1: sticky-offset aware) ────────── */
  let manual = null, sched = false, lastW = 0, rt = 0;
  function progress() {
    if (manual != null) return manual;
    const r = track.getBoundingClientRect();
    const span = r.height - stage.offsetHeight;
    const off = parseFloat(getComputedStyle(stage).top) || 0;
    return span <= 0 ? 0 : cl((off - r.top) / span);
  }
  function sync() {
    cur = progress();
    try { render(cur); } catch (e) { console.error("cps2 render", e); }
  }
  function schedule() {
    if (sched) return;
    sched = true;
    const run = () => { sched = false; sync(); };
    if (window.requestAnimationFrame) requestAnimationFrame(run); else setTimeout(run, 16);
    setTimeout(() => { if (sched) { sched = false; sync(); } }, 40);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (Math.abs(inner.clientWidth - lastW) > 2 || fit < 1) { lastW = inner.clientWidth; measure(); } sync(); }, 120);
    schedule();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); sync(); });
  root.__setP = (p) => { manual = p; sync(); };
  lastW = inner.clientWidth;
  measure();
  sync();
})();
