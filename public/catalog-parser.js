/* ══════════════════════════════════════════════════════════════════════
   Catalog parser — scroll-driven.
   Spreadsheet (unordered rows, bottom-up) → scan head sweeps each title
   colouring tokens → row drops toward its base card → SKU table.
   Every visual is a pure function of scroll progress p (scroll up rewinds).
   Reads window.CATALOG_CONFIG.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  const CFG = window.CATALOG_CONFIG;
  const root = document.getElementById(CFG.rootId || "cps");
  const q1 = (s) => root.querySelector(s);
  const track = q1(".cps-track"), stage = q1(".cps-stage"), inner = q1(".cps-inner");
  const sheet = q1(".cps-sheet"), rowsEl = q1(".cps-rows"), head = q1(".cps-head"), trail = q1(".cps-trail");
  const cardsEl = q1(".cps-cards"), tableEl = q1(".cps-table"), tbody = q1(".cps-tbody");
  const hintEl = q1(".cps-hint"), sheetCount = q1(".cps-sheet-n"), sheetDone = q1(".cps-sheet-done");
  const legendEl = q1(".cps-legend");
  const ROWS = CFG.rows, N = ROWS.length;

  const cl = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
  const es = (t) => t * t * (3 - 2 * t);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const seg = (v, a, b) => cl((v - a) / (b - a));

  /* ── Timing · bottom row first ──────────────────────────────── */
  const START = 0.045, END = 0.70, LEN = (END - START) / N;
  const slotOf = (i) => N - 1 - i;
  const rowQ = (p, i) => cl((p - (START + slotOf(i) * LEN)) / LEN);
  const TBL = [0.72, 0.865], LEG = [0.875, 0.93];

  /* ── Which rows create a base vs extend one (bottom-up) ─────── */
  const seen = {};
  [...ROWS].map((r, i) => i).sort((a, b) => slotOf(a) - slotOf(b)).forEach((i) => {
    ROWS[i].isNew = !seen[ROWS[i].base]; seen[ROWS[i].base] = 1;
  });

  /* ── Spreadsheet rows ───────────────────────────────────────── */
  const rowRefs = ROWS.map((r, i) => {
    const li = document.createElement("li");
    li.className = "cps-r";
    const box = document.createElement("div");
    box.className = "cps-r-in";
    box.innerHTML = '<span class="cps-r-i"></span><span class="cps-r-c"></span><span class="cps-r-s"></span><span class="cps-r-p"></span>';
    box.querySelector(".cps-r-i").textContent = String(i + 2);
    box.querySelector(".cps-r-s").textContent = r.sku;
    box.querySelector(".cps-r-p").textContent = r.price.toFixed(2);
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

  /* ── Cards, ordered by discovery ────────────────────────────── */
  const BASES = CFG.bases.slice().sort((a, b) => {
    const f = (id) => Math.min.apply(null, ROWS.map((r, i) => (r.base === id ? slotOf(i) : 99)));
    return f(a.id) - f(b.id);
  });
  const cardRefs = BASES.map((b, bi) => {
    const c = document.createElement("div");
    c.className = "cps-c";
    c.innerHTML = '<div class="cps-c-h"><span class="cps-c-dot"></span><span class="cps-c-name"></span></div>'
      + '<div class="cps-c-body"><div class="cps-c-attrs"></div><div class="cps-c-axes"></div></div><div class="cps-c-f"></div>';
    c.querySelector(".cps-c-name").textContent = b.name;
    const at = c.querySelector(".cps-c-attrs");
    const chips = b.attrs.map(([k, v]) => {
      const ch = document.createElement("span");
      ch.className = "cps-chip";
      ch.innerHTML = "<i></i><b></b>";
      ch.querySelector("i").textContent = k;
      ch.querySelector("b").textContent = v;
      at.appendChild(ch);
      return ch;
    });
    const ax = c.querySelector(".cps-c-axes");
    const axRefs = b.axes.map((a) => {
      const row = document.createElement("div");
      row.className = "cps-ax";
      row.innerHTML = '<span class="cps-ax-k"></span><span class="cps-ax-v"></span>';
      row.querySelector(".cps-ax-k").textContent = a.name;
      const vwrap = row.querySelector(".cps-ax-v");
      const pills = a.values.map((v) => {
        const p = document.createElement("span");
        p.className = "cps-pill";
        p.textContent = v;
        vwrap.appendChild(p);
        return p;
      });
      ax.appendChild(row);
      return { row, pills, axis: a };
    });
    cardsEl.appendChild(c);
    const mine = ROWS.map((r, i) => (r.base === b.id ? i : -1)).filter((i) => i >= 0);
    return { el: c, body: c.querySelector(".cps-c-body"), chips, axRefs, foot: c.querySelector(".cps-c-f"),
      base: b, side: bi === 0 ? -1 : 1, mine, bodyH: 0,
      first: mine.reduce((a, i) => (slotOf(i) < slotOf(a) ? i : a), mine[0]) };
  });
  const sideOf = {}; cardRefs.forEach((c) => { sideOf[c.base.id] = c.side; });

  /* ── SKU table ──────────────────────────────────────────────── */
  const trRefs = [];
  BASES.forEach((b) => {
    const gr = document.createElement("tr");
    gr.className = "cps-tg";
    gr.innerHTML = '<td colspan="7"><span class="cps-tg-dot"></span><span></span></td>';
    gr.querySelector("td span:last-child").textContent = b.name;
    tbody.appendChild(gr);
    trRefs.push(gr);
    ROWS.map((r, i) => ({ r, i })).filter((o) => o.r.base === b.id)
      .sort((a, c) => (a.r.vals[0][1] + a.r.vals[1][1]).localeCompare(c.r.vals[0][1] + c.r.vals[1][1]))
      .forEach((o) => {
        const tr = document.createElement("tr");
        const cells = [
          ["sku", o.r.sku], ["var", o.r.vals[0][1]], ["var", o.r.vals[1][1]],
          ["at", b.attrs[1][1]], ["at", b.attrs[2][1]], ["at", b.attrs[0][1]],
          ["pr", "$" + o.r.price.toFixed(2)],
        ];
        cells.forEach(([k, v]) => { const td = document.createElement("td"); td.className = "c-" + k; td.textContent = v; tr.appendChild(td); });
        tbody.appendChild(tr);
        trRefs.push(tr);
      });
  });

  /* ── Measure + auto-fit ─────────────────────────────────────── */
  let cur = 0, fit = 1, ready = false;
  function measure() {
    try { measureInner(); } catch (e) { console.error("cps measure", e); } finally { ready = true; }
  }
  function measureInner() {
    ready = false;
    inner.style.zoom = "1";
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
    sheet.style.minHeight = "0px";
    const sheetH = sheet.offsetHeight;
    cardRefs.forEach((c) => { c.el.style.display = ""; c.body.style.height = "auto"; c.bodyH = c.body.offsetHeight; });
    tableEl.style.display = "";
    sheet.style.minHeight = sheetH + "px";
    ready = true;
    let tallest = 0;
    [0, 0.2, 0.4, 0.6, 0.7, 0.8, 1].forEach((s) => { render(s); tallest = Math.max(tallest, inner.offsetHeight); });
    const avail = stage.clientHeight - 26 - hintEl.offsetHeight;
    fit = Math.max(0.5, Math.min(1, avail / (tallest || 1)));
    inner.style.zoom = fit < 0.999 ? String(fit.toFixed(3)) : "1";
    render(cur);
  }

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
      const fade = eo(seg(q, 0.74, 0.99));
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

      const dx = (sideOf[ROWS[i].base] || 0) * inner.clientWidth * 0.19;
      const dy = (cardsEl.offsetTop + 16) - (sheet.offsetTop + rowsEl.offsetTop + r.li.offsetTop);
      r.box.style.transform = "translate(" + (dx * travel).toFixed(1) + "px," + (dy * travel).toFixed(1) + "px) scale(" + (1 - 0.2 * travel).toFixed(3) + ")";
      r.box.style.opacity = (1 - fade).toFixed(3);
      r.li.style.height = collapse <= 0.001 ? "auto" : (r.h * (1 - collapse)).toFixed(1) + "px";
      r.li.style.zIndex = travel > 0 ? "5" : "1";
    });

    /* scan head + trail */
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
      trail.style.transform = "translate(" + r.toks[0].x + "px," + top.toFixed(1) + "px)";      trail.style.width = Math.max(0, x - r.toks[0].x).toFixed(1) + "px";
      trail.style.height = t.h + "px";
    } else { head.style.opacity = "0"; trail.style.opacity = "0"; }

    /* sheet */
    sheetCount.textContent = (N - parsed) + (N - parsed === 1 ? " row" : " rows");
    const dn = es(seg(p, END - LEN * 0.4, END));
    sheetDone.style.opacity = dn.toFixed(3);
    sheetDone.style.height = (dn * 30).toFixed(1) + "px";

    /* cards */
    let bases = 0, skus = 0;
    cardRefs.forEach((cr) => {
      const rev = es(seg(rowQ(p, cr.first), 0.72, 0.98));
      cr.el.style.setProperty("--rev", rev.toFixed(3));
      if (rev > 0.02) bases++;
      cr.body.style.height = "auto";
      cr.chips.forEach((ch, k) => ch.style.setProperty("--on", es(cl((rev - 0.10 - k * 0.11) / 0.34)).toFixed(3)));
      const got = {};
      let n = 0;
      cr.mine.forEach((i) => { if (rowQ(p, i) >= 0.80) { n++; ROWS[i].vals.forEach(([a, v]) => { (got[a] = got[a] || {})[v] = 1; }); } });
      skus += n;
      let poss = 1, axesShown = 0;
      cr.axRefs.forEach((ar) => {
        let c = 0;
        ar.pills.forEach((pl) => {
          const on = got[ar.axis.name] && got[ar.axis.name][pl.textContent] ? 1 : 0;
          pl.style.setProperty("--on", String(on));
          if (on) c++;
        });
        poss *= Math.max(1, c);
        if (c) axesShown++;
        ar.row.style.opacity = (rev * (c ? 1 : 0.28)).toFixed(3);
      });
      const gaps = Math.max(0, poss - n);
      cr.foot.innerHTML = "";
      const a = document.createElement("span");
      a.textContent = n + (n === 1 ? " variant · " : " variants · ") + axesShown + (axesShown === 1 ? " axis" : " axes");
      cr.foot.appendChild(a);
      if (rev > 0.9 && cr.mine.every((i) => rowQ(p, i) >= 1)) {
        const g = document.createElement("span");
        g.className = gaps > 0 ? "cps-gap" : "cps-full";
        g.textContent = gaps > 0 ? gaps + (gaps === 1 ? " gap in matrix" : " gaps in matrix") : "complete matrix";
        cr.foot.appendChild(g);
      }
    });

    /* SKU table */
    const tv = seg(p, TBL[0], TBL[1]);
    tableEl.style.setProperty("--on", es(tv).toFixed(3));
    trRefs.forEach((tr, k) => tr.style.opacity = es(cl((tv - k * 0.075) / 0.25)).toFixed(3));

    legendEl.style.setProperty("--on", es(seg(p, LEG[0], LEG[1])).toFixed(3));
    hintEl.style.setProperty("--on", (1 - es(seg(p, 0.01, 0.06))).toFixed(3));
  }

  /* ── Scroll driver (event-driven; no rAF loop — rAF is throttled
     in background/offscreen frames, which would stall the render) ── */
  let manual = null, sched = false, lastW = 0, rt = 0;
  function progress() {
    if (manual != null) return manual;
    const r = track.getBoundingClientRect();
    const span = r.height - stage.offsetHeight;
    return span <= 0 ? 0 : cl(-r.top / span);
  }
  function sync() {
    cur = progress();
    try { render(cur); } catch (e) { console.error("cps render", e); }
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
  root.__setP = (p) => { manual = p; sync(); };          // debug / embed hook
  lastW = inner.clientWidth;
  measure();
  sync();
})();
