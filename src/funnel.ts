// Interactive funnel diagram — dark stage cards with kinetic-yellow icon + text,
// PDP/Cart/Checkout aligned with Browsing, leak labels at the foot of each arrow,
// and a hover info panel in the freed slab above the bottom row.

type Stage = {
  id: string;
  label: string;
  /** Material Symbols Outlined glyph name */
  icon: string;
  x: number;
  y: number;
  /** Descriptive text shown in the info panel on hover */
  tooltip?: string;
};

type Transition = {
  id: string;
  from: string;
  to: string;
  pct: number;
  labelOverride?: string;
  curve?: { cx: number; cy: number };
  /** 'forward' = straight midline; 'shortcut' = top→top arc-over. Visual styling identical. */
  variant: 'forward' | 'shortcut';
};

type Leak = {
  id: string;
  fromStageId: string;
  label: string;
  pctOverride?: number;
  xOffset?: number;
};

const STAGES: Stage[] = [
  { id: 'traffic',  label: 'Traffic',      icon: 'public',        x: 60,   y: 200,
    tooltip:
      "Drop-offs at the entry point are driven by ad/landing-page mismatch, slow first-paint, and search-intent misreads. Most bouncers leave in under 10 seconds." },
  { id: 'home',     label: 'Home',         icon: 'home',          x: 320,  y: 200,
    tooltip:
      "Homepage exits trace back to weak hero clarity, no obvious value proposition, and navigation that hides what shoppers actually came for." },
  { id: 'search',   label: 'Search',       icon: 'search',        x: 540,  y: 60,
    tooltip:
      "Drop-offs at search are usually caused by missing synonyms and weak typo tolerance. Shoppers searching with non-canonical terms see 'no results' and leave." },
  { id: 'browsing', label: 'Browsing',     icon: 'grid_view',     x: 610,  y: 380,
    tooltip:
      "Category browsers leak when grids are slow, image quality is inconsistent, and filters don't match how shoppers actually narrow their choice." },
  { id: 'pdp',      label: 'Product page', icon: 'shopping_bag',  x: 800,  y: 380,
    tooltip:
      "The lack of high-quality images, missing attributes or key specifications, and weak product descriptions all increase drop-off here. The product page is where intent turns into action — or it doesn't." },
  { id: 'cart',     label: 'Cart',         icon: 'shopping_cart', x: 1030, y: 380,
    tooltip:
      "Cart abandonment is driven by surprise shipping costs, mandatory account creation, and a long path to checkout. Trust signals and total-cost transparency matter most." },
  { id: 'checkout', label: 'Checkout',     icon: 'payments',      x: 1250, y: 380,
    tooltip:
      "Returns are driven by image vs. product mismatch, sizing/fit ambiguity, and missing detail photographs (texture, scale, packaging). Better PDPs reduce returns 30-50%." },
];

const TRANSITIONS: Transition[] = [
  { id: 't-traffic-home',  from: 'traffic',  to: 'home',     pct: 62, variant: 'forward' },
  { id: 't-traffic-pdp',   from: 'traffic',  to: 'pdp',      pct: 12, variant: 'shortcut',
    labelOverride: '12% direct to PDP',
    curve: { cx: 495, cy: -450 } },
  { id: 't-home-search',   from: 'home',     to: 'search',   pct: 40, variant: 'forward' },
  { id: 't-home-browsing', from: 'home',     to: 'browsing', pct: 45, variant: 'forward' },
  { id: 't-search-pdp',    from: 'search',   to: 'pdp',      pct: 35, variant: 'forward' },
  { id: 't-browsing-pdp',  from: 'browsing', to: 'pdp',      pct: 25, variant: 'forward' },
  { id: 't-pdp-cart',      from: 'pdp',      to: 'cart',     pct: 12, variant: 'forward' },
  { id: 't-cart-checkout', from: 'cart',     to: 'checkout', pct: 30, variant: 'forward' },
];

const LEAKS: Leak[] = [
  { id: 'leak-traffic',  fromStageId: 'traffic',  label: 'bounce' },
  { id: 'leak-home',     fromStageId: 'home',     label: 'home exit' },
  // Nudged right of Search's left edge so the line clears Browsing without aligning to either box edge
  { id: 'leak-search',   fromStageId: 'search',   label: 'no results', xOffset: 35 },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'no results' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'exit' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'abandoned cart' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'returns', pctOverride: 17 },
];

// Geometry
const STAGE_W = 130;
const STAGE_H = 74;                // grew to fit stacked icon + label
const LEAK_Y = 540;
const LEAK_ARROW_START_DY = 8;     // arrow starts just below box
const LABEL_PCT_DY = -22;          // % position relative to LEAK_Y (above arrowhead)
const LABEL_CAUSE_DY = -6;         // cause label position relative to LEAK_Y (just above arrowhead)
const VIEWBOX = { x: 0, y: -100, w: 1400, h: 680 };

const STAGE_FILL = '#1b1b1e';
const STAGE_BORDER = 'rgba(255, 255, 255, 0.22)';
const STAGE_BORDER_W = 1.5;
const STAGE_ACCENT = '#fae194'; // text + icon

const FORWARD_STROKE = '#7ad196';

function stageById(id: string): Stage {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage: ${id}`);
  return s;
}

function leakPctFor(leak: Leak): number {
  if (leak.pctOverride !== undefined) return leak.pctOverride;
  const totalForward = TRANSITIONS
    .filter((t) => t.from === leak.fromStageId)
    .reduce((sum, t) => sum + t.pct, 0);
  return 100 - totalForward;
}

function leakX(l: Leak): number {
  const stage = stageById(l.fromStageId);
  const offset = l.xOffset ?? STAGE_W / 2;
  return stage.x + offset;
}

function transitionPath(t: Transition): { d: string; midX: number; midY: number } {
  const from = stageById(t.from);
  const to = stageById(t.to);

  let x1: number, y1: number, x2: number, y2: number;
  if (t.variant === 'shortcut') {
    x1 = from.x + STAGE_W / 2;
    y1 = from.y;
    x2 = to.x + STAGE_W / 2;
    y2 = to.y;
  } else {
    x1 = from.x + STAGE_W;
    y1 = from.y + STAGE_H / 2;
    x2 = to.x;
    y2 = to.y + STAGE_H / 2;
  }

  if (t.curve) {
    const d = `M ${x1} ${y1} Q ${t.curve.cx} ${t.curve.cy} ${x2} ${y2}`;
    const midX = 0.25 * x1 + 0.5 * t.curve.cx + 0.25 * x2;
    const midY = 0.25 * y1 + 0.5 * t.curve.cy + 0.25 * y2;
    return { d, midX, midY };
  }

  const dx = (x2 - x1) * 0.5;
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  return { d, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 };
}

function leakPath(l: Leak): string {
  const stage = stageById(l.fromStageId);
  const x = leakX(l);
  const yTop = stage.y + STAGE_H + LEAK_ARROW_START_DY;
  return `M ${x} ${yTop} L ${x} ${LEAK_Y}`;
}

export function renderFunnel(root: HTMLElement): void {
  const svgNS = 'http://www.w3.org/2000/svg';
  const xhtmlNS = 'http://www.w3.org/1999/xhtml';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', 'auto');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'E-commerce funnel: Traffic → Home → Search/Browsing → Product page → Cart → Checkout, with leak arrows at every stage',
  );
  svg.classList.add('select-none');

  // ---- Defs (arrowhead markers) ----
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <marker id="arrow-forward" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${FORWARD_STROKE}" />
    </marker>
    <marker id="arrow-leak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#e87b6b" />
    </marker>
  `;
  svg.appendChild(defs);

  // ---- Info panel (foreignObject in the freed upper-right slab) ----
  const fo = document.createElementNS(svgNS, 'foreignObject');
  fo.setAttribute('x', '900');
  fo.setAttribute('y', '0');
  fo.setAttribute('width', '480');
  fo.setAttribute('height', '360');

  const panel = document.createElementNS(xhtmlNS, 'div') as HTMLDivElement;
  panel.setAttribute('class', 'funnel-info');
  panel.innerHTML = `
    <div class="funnel-info-default">
      <span class="material-symbols-outlined">touch_app</span>
      <span>Hover any stage to see what typically causes drop-offs there.</span>
    </div>
    <div class="funnel-info-content">
      <div class="funnel-info-eyebrow">
        <span class="material-symbols-outlined" data-info-icon>info</span>
        <span data-info-tag>Drop-off drivers</span>
      </div>
      <div class="funnel-info-title" data-info-title></div>
      <div class="funnel-info-body" data-info-body></div>
    </div>
  `;
  fo.appendChild(panel);
  svg.appendChild(fo);

  const infoIcon = panel.querySelector<HTMLElement>('[data-info-icon]')!;
  const infoTitle = panel.querySelector<HTMLElement>('[data-info-title]')!;
  const infoBody = panel.querySelector<HTMLElement>('[data-info-body]')!;

  // ---- Leak arrows + bottom-of-line labels ----
  const leakGroup = document.createElementNS(svgNS, 'g');
  leakGroup.setAttribute('class', 'funnel-leaks');

  LEAKS.forEach((leak) => {
    const cx = leakX(leak);
    const pct = leakPctFor(leak);

    // Vertical dashed leak arrow (animated)
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', leakPath(leak));
    path.setAttribute('stroke', '#e87b6b');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-dasharray', '4 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrow-leak)');
    path.setAttribute('opacity', '0.85');
    path.setAttribute('class', 'funnel-leak-path');
    path.dataset.leakId = leak.id;
    leakGroup.appendChild(path);

    // Mask rect — paints over the arrow behind the labels so dashes don't poke through
    const mask = document.createElementNS(svgNS, 'rect');
    mask.setAttribute('x', String(cx - 48));
    mask.setAttribute('y', String(LEAK_Y - 34));
    mask.setAttribute('width', '96');
    mask.setAttribute('height', '32');
    mask.setAttribute('fill', '#16161a');
    mask.setAttribute('rx', '4');
    mask.dataset.leakId = leak.id;
    leakGroup.appendChild(mask);

    // Dropout % — closer to the arrowhead, above the cause label
    const pctLabel = document.createElementNS(svgNS, 'text');
    pctLabel.setAttribute('x', String(cx));
    pctLabel.setAttribute('y', String(LEAK_Y + LABEL_PCT_DY));
    pctLabel.setAttribute('text-anchor', 'middle');
    pctLabel.setAttribute('fill', '#e87b6b');
    pctLabel.setAttribute('font-size', '12');
    pctLabel.setAttribute('font-weight', '600');
    pctLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    pctLabel.dataset.leakId = leak.id;
    pctLabel.textContent = `${pct}%`;
    leakGroup.appendChild(pctLabel);

    // Cause label — just above the arrowhead
    const causeLabel = document.createElementNS(svgNS, 'text');
    causeLabel.setAttribute('x', String(cx));
    causeLabel.setAttribute('y', String(LEAK_Y + LABEL_CAUSE_DY));
    causeLabel.setAttribute('text-anchor', 'middle');
    causeLabel.setAttribute('fill', '#e87b6b');
    causeLabel.setAttribute('font-size', '12');
    causeLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    causeLabel.dataset.leakId = leak.id;
    causeLabel.textContent = leak.label;
    leakGroup.appendChild(causeLabel);
  });
  svg.appendChild(leakGroup);

  // ---- Forward / shortcut transitions ----
  const edgeGroup = document.createElementNS(svgNS, 'g');
  edgeGroup.setAttribute('class', 'funnel-edges');

  TRANSITIONS.forEach((t) => {
    const { d, midX, midY } = transitionPath(t);

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', FORWARD_STROKE);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '5 5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrow-forward)');
    path.setAttribute('opacity', '0.9');
    path.dataset.transitionId = t.id;
    path.style.transition = 'opacity 200ms ease, stroke-width 200ms ease';
    edgeGroup.appendChild(path);

    const labelText = t.labelOverride ?? `${t.pct}%`;
    const padX = 12;
    const estimatedWidth = labelText.length * 7.5 + padX * 2;

    const labelGroup = document.createElementNS(svgNS, 'g');
    labelGroup.setAttribute('transform', `translate(${midX - estimatedWidth / 2}, ${midY - 14})`);
    labelGroup.style.pointerEvents = 'none';

    const labelBg = document.createElementNS(svgNS, 'rect');
    labelBg.setAttribute('x', '0');
    labelBg.setAttribute('y', '0');
    labelBg.setAttribute('width', String(estimatedWidth));
    labelBg.setAttribute('height', '28');
    labelBg.setAttribute('rx', '14');
    labelBg.setAttribute('fill', '#1b1b1e');
    labelBg.setAttribute('stroke', '#3a3a3f');
    labelBg.setAttribute('stroke-width', '1');
    labelGroup.appendChild(labelBg);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(estimatedWidth / 2));
    label.setAttribute('y', '18');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#ffffff');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.textContent = labelText;
    labelGroup.appendChild(label);

    edgeGroup.appendChild(labelGroup);
  });
  svg.appendChild(edgeGroup);

  // ---- Stage cards (dark fill, large icon on top + label below, both centered) ----
  const stageGroup = document.createElementNS(svgNS, 'g');
  stageGroup.setAttribute('class', 'funnel-stages');

  const ICON_FS = 32;
  const LABEL_FS = 14;
  const ICON_BASELINE_Y = 42;
  const LABEL_BASELINE_Y = 64;

  STAGES.forEach((stage) => {
    const group = document.createElementNS(svgNS, 'g');
    group.setAttribute('transform', `translate(${stage.x}, ${stage.y})`);
    group.style.cursor = 'pointer';
    group.dataset.stageId = stage.id;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('width', String(STAGE_W));
    rect.setAttribute('height', String(STAGE_H));
    rect.setAttribute('rx', '12');
    rect.setAttribute('fill', STAGE_FILL);
    rect.setAttribute('stroke', STAGE_BORDER);
    rect.setAttribute('stroke-width', String(STAGE_BORDER_W));
    rect.style.transition = 'filter 180ms ease, stroke 180ms ease';
    group.appendChild(rect);

    const cx = STAGE_W / 2;

    const iconText = document.createElementNS(svgNS, 'text');
    iconText.setAttribute('x', String(cx));
    iconText.setAttribute('y', String(ICON_BASELINE_Y));
    iconText.setAttribute('text-anchor', 'middle');
    iconText.setAttribute('fill', STAGE_ACCENT);
    iconText.setAttribute('font-size', String(ICON_FS));
    iconText.setAttribute('class', 'funnel-icon');
    iconText.textContent = stage.icon;
    group.appendChild(iconText);

    const labelText = document.createElementNS(svgNS, 'text');
    labelText.setAttribute('x', String(cx));
    labelText.setAttribute('y', String(LABEL_BASELINE_Y));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', STAGE_ACCENT);
    labelText.setAttribute('font-size', String(LABEL_FS));
    labelText.setAttribute('font-weight', '500');
    labelText.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    labelText.textContent = stage.label;
    group.appendChild(labelText);

    group.addEventListener('mouseenter', () => {
      highlightStage(stage.id);
      showInfo(stage);
    });
    group.addEventListener('mouseleave', () => {
      clearHighlight();
      resetInfo();
    });

    stageGroup.appendChild(group);
  });
  svg.appendChild(stageGroup);

  root.innerHTML = '';
  root.appendChild(svg);

  function showInfo(stage: Stage) {
    panel.classList.add('is-active');
    infoIcon.textContent = stage.icon;
    infoTitle.textContent = stage.label;
    infoBody.textContent =
      stage.tooltip ?? 'No detail captured for this stage yet. Add your hypothesis or analytics finding here.';
  }

  function resetInfo() {
    panel.classList.remove('is-active');
  }

  function highlightStage(stageId: string) {
    edgeGroup.querySelectorAll<SVGPathElement>('[data-transition-id]').forEach((p) => {
      const tid = p.dataset.transitionId!;
      const t = TRANSITIONS.find((x) => x.id === tid)!;
      const involved = t.from === stageId || t.to === stageId;
      p.setAttribute('opacity', involved ? '1' : '0.18');
      p.setAttribute('stroke-width', involved ? '3' : '2');
    });
    leakGroup.querySelectorAll<SVGElement>('[data-leak-id]').forEach((el) => {
      const lid = el.dataset.leakId!;
      const l = LEAKS.find((x) => x.id === lid)!;
      const involved = l.fromStageId === stageId;
      el.setAttribute('opacity', involved ? '1' : '0.18');
    });
    stageGroup.querySelectorAll<SVGGElement>('[data-stage-id]').forEach((g) => {
      const isTarget = g.dataset.stageId === stageId;
      const rectEl = g.firstChild as SVGRectElement;
      rectEl.style.stroke = isTarget ? STAGE_ACCENT : STAGE_BORDER;
      rectEl.style.filter = isTarget ? 'none' : 'brightness(0.7)';
    });
  }

  function clearHighlight() {
    edgeGroup.querySelectorAll<SVGPathElement>('[data-transition-id]').forEach((p) => {
      p.setAttribute('opacity', '0.9');
      p.setAttribute('stroke-width', '2');
    });
    leakGroup.querySelectorAll<SVGElement>('[data-leak-id]').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'path') el.setAttribute('opacity', '0.85');
      else if (tag === 'rect') el.setAttribute('opacity', '1');
      else el.setAttribute('opacity', '1');
    });
    stageGroup.querySelectorAll<SVGGElement>('[data-stage-id]').forEach((g) => {
      const rectEl = g.firstChild as SVGRectElement;
      rectEl.style.stroke = STAGE_BORDER;
      rectEl.style.filter = 'none';
    });
  }
}

// Vite HMR — hot-swap the funnel in place without reloading the whole page
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (!newModule) return;
    const root = document.getElementById('funnel-root');
    if (root) (newModule as unknown as { renderFunnel: typeof renderFunnel }).renderFunnel(root);
  });
}
