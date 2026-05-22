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
  /** Quadratic Bézier control point */
  curve?: { cx: number; cy: number };
  /** Cubic Bézier control points (overrides `curve` if both set) */
  cubicCurve?: { c1x: number; c1y: number; c2x: number; c2y: number };
  /** 'forward' = straight midline; 'shortcut' = top→top arc-over. Visual styling identical. */
  variant: 'forward' | 'shortcut';
  /** Target attachment override for forward variant ('top' = land on top edge instead of left edge). */
  toAttach?: 'top';
};

type Leak = {
  id: string;
  fromStageId: string;
  label: string;
  pctOverride?: number;
  xOffset?: number;
};

const STAGES: Stage[] = [
  // Home is the entry point now — Traffic removed. Middle row at y=55 (midline y=80).
  { id: 'home',     label: 'Home',         icon: 'home',          x: 60,   y: 55,
    tooltip:
      "Homepage exits trace back to weak hero clarity, no obvious value proposition, and navigation that hides what shoppers actually came for." },
  // Search 10 px above Home midline → bottom y=70.
  { id: 'search',   label: 'Search',       icon: 'search',        x: 290,  y: 20,
    tooltip:
      "Drop-offs at search are usually caused by missing synonyms and weak typo tolerance. Shoppers searching with non-canonical terms see 'no results' and leave." },
  // Browsing 10 px below Home midline → top y=90. Search-Browsing vertical gap = 20 px.
  { id: 'browsing', label: 'Browsing',     icon: 'grid_view',     x: 360,  y: 90,
    tooltip:
      "Category browsers leak when grids are slow, image quality is inconsistent, and filters don't match how shoppers actually narrow their choice." },
  // PDP / Cart / Checkout share Home's row.
  { id: 'pdp',      label: 'Product page', icon: 'description',   x: 540,  y: 55,
    tooltip:
      "The lack of high-quality images, missing attributes or key specifications, and weak product descriptions all increase drop-off here. The product page is where intent turns into action — or it doesn't." },
  { id: 'cart',     label: 'Cart',         icon: 'shopping_cart', x: 770,  y: 55,
    tooltip:
      "Cart abandonment is driven by surprise shipping costs, mandatory account creation, and a long path to checkout. Trust signals and total-cost transparency matter most." },
  { id: 'checkout', label: 'Checkout',     icon: 'payments',      x: 990,  y: 55,
    tooltip:
      "Returns are driven by image vs. product mismatch, sizing/fit ambiguity, and missing detail photographs (texture, scale, packaging). Better PDPs reduce returns 30-50%." },
];

const TRANSITIONS: Transition[] = [
  { id: 't-home-search',   from: 'home',     to: 'search',   pct: 40, variant: 'forward' },
  { id: 't-home-browsing', from: 'home',     to: 'browsing', pct: 45, variant: 'forward' },
  { id: 't-search-pdp',    from: 'search',   to: 'pdp',      pct: 35, variant: 'forward', toAttach: 'top' },
  { id: 't-browsing-pdp',  from: 'browsing', to: 'pdp',      pct: 25, variant: 'forward' },
  { id: 't-pdp-cart',      from: 'pdp',      to: 'cart',     pct: 12, variant: 'forward' },
  { id: 't-cart-checkout', from: 'cart',     to: 'checkout', pct: 30, variant: 'forward' },
];

const LEAKS: Leak[] = [
  { id: 'leak-home',     fromStageId: 'home',     label: 'home exit' },
  // Nudged right of Search's left edge so the line clears Browsing without aligning to either box edge
  { id: 'leak-search',   fromStageId: 'search',   label: 'no results', xOffset: 35 },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'no results' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'exit' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'abandoned cart' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'returns', pctOverride: 17 },
];

// Geometry — short horizontal boxes (icon-left, label-right)
const STAGE_W = 130;
const STAGE_H = 50;
const LEAK_Y = 220;
const LEAK_ARROW_START_DY = 8;     // arrow starts just below box
const LABEL_PCT_DY = -22;          // % position relative to LEAK_Y (above arrowhead)
const LABEL_CAUSE_DY = -6;         // cause label position relative to LEAK_Y (just above arrowhead)
const VIEWBOX = { x: 0, y: 0, w: 1400, h: 235 };

const STAGE_FILL = '#1b1b1e';
const STAGE_BORDER = 'rgba(255, 255, 255, 0.22)';
const STAGE_BORDER_W = 1.5;
const STAGE_ACCENT = '#fae194'; // text + icon

// Forward arrows fade back so the red leaks pop
const FORWARD_STROKE = '#a8e6c5';
const FORWARD_STROKE_OPACITY = '0.55';

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
  let mode: 'horizontal' | 'right-to-top' | 'shortcut';

  if (t.variant === 'shortcut') {
    x1 = from.x + STAGE_W / 2;
    y1 = from.y;
    x2 = to.x + STAGE_W / 2;
    y2 = to.y;
    mode = 'shortcut';
  } else if (t.toAttach === 'top') {
    x1 = from.x + STAGE_W;
    y1 = from.y + STAGE_H / 2;
    x2 = to.x + STAGE_W / 2;
    y2 = to.y;
    mode = 'right-to-top';
  } else {
    x1 = from.x + STAGE_W;
    y1 = from.y + STAGE_H / 2;
    x2 = to.x;
    y2 = to.y + STAGE_H / 2;
    mode = 'horizontal';
  }

  if (t.cubicCurve) {
    const c = t.cubicCurve;
    const d = `M ${x1} ${y1} C ${c.c1x} ${c.c1y}, ${c.c2x} ${c.c2y}, ${x2} ${y2}`;
    // Cubic Bézier point at t=0.5: B(0.5) = 0.125 P0 + 0.375 P1 + 0.375 P2 + 0.125 P3
    const midX = 0.125 * x1 + 0.375 * c.c1x + 0.375 * c.c2x + 0.125 * x2;
    const midY = 0.125 * y1 + 0.375 * c.c1y + 0.375 * c.c2y + 0.125 * y2;
    return { d, midX, midY };
  }

  if (t.curve) {
    const d = `M ${x1} ${y1} Q ${t.curve.cx} ${t.curve.cy} ${x2} ${y2}`;
    const midX = 0.25 * x1 + 0.5 * t.curve.cx + 0.25 * x2;
    const midY = 0.25 * y1 + 0.5 * t.curve.cy + 0.25 * y2;
    return { d, midX, midY };
  }

  if (mode === 'right-to-top') {
    // Cubic: depart horizontally from source, arrive vertically into target top
    const dxAbs = Math.abs(x2 - x1);
    const dyAbs = Math.abs(y2 - y1);
    const c1x = x1 + dxAbs * 0.7;
    const c1y = y1;
    const c2x = x2;
    const c2y = y2 - dyAbs * 0.7;
    const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
    return { d, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 };
  }

  const dx = (x2 - x1) * 0.5;
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  return { d, midX: (x1 + x2) / 2, midY: (y1 + y2) / 2 };
}

export function renderFunnel(root: HTMLElement): void {
  const svgNS = 'http://www.w3.org/2000/svg';

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

  // ---- Defs (only forward arrow marker; leaks render as falling droplets) ----
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <marker id="arrow-forward" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${FORWARD_STROKE}" />
    </marker>
  `;
  svg.appendChild(defs);

  // Info panel lives in HTML now (below the SVG). Look it up if present.
  const panel = document.getElementById('funnel-info');
  const infoIcon = panel?.querySelector<HTMLElement>('[data-info-icon]') ?? null;
  const infoTitle = panel?.querySelector<HTMLElement>('[data-info-title]') ?? null;
  const infoBody = panel?.querySelector<HTMLElement>('[data-info-body]') ?? null;

  // ---- Leak droplets + bottom-of-line labels ----
  const leakGroup = document.createElementNS(svgNS, 'g');
  leakGroup.setAttribute('class', 'funnel-leaks');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Constant fall speed + constant spatial spacing keeps drops visually consistent
  // across leak lengths. Short bottom-row leaks get 1 drop; long Search leak gets 4.
  const DROP_SPEED = 70;      // px / second
  const DROP_SPACING = 70;    // target px between drops in the column
  const DROP_END_DY = -36;    // drops stop this far above LEAK_Y, well clear of the labels

  function makeDroplet(cx: number, cy: number, leakId: string): SVGEllipseElement {
    const drop = document.createElementNS(svgNS, 'ellipse');
    drop.setAttribute('cx', String(cx));
    drop.setAttribute('cy', String(cy));
    drop.setAttribute('rx', '3');
    drop.setAttribute('ry', '4.5');
    drop.setAttribute('fill', '#e87b6b');
    drop.setAttribute('opacity', '0.92');
    drop.setAttribute('class', 'funnel-droplet');
    drop.dataset.leakId = leakId;
    return drop;
  }

  LEAKS.forEach((leak) => {
    const stage = stageById(leak.fromStageId);
    const cx = leakX(leak);
    const pct = leakPctFor(leak);
    const yStart = stage.y + STAGE_H + LEAK_ARROW_START_DY;
    const yEnd = LEAK_Y + DROP_END_DY;
    const dropDist = yEnd - yStart;

    // Count of drops per leak — keeps drops ~DROP_SPACING px apart spatially
    const dropCount = Math.max(1, Math.round(dropDist / DROP_SPACING));
    const dropDuration = dropDist / DROP_SPEED;   // per-drop fall time (varies, speed constant)
    const stagger = dropDuration / dropCount;     // drops evenly distributed through the cycle

    if (reduceMotion || dropDist <= 0) {
      for (let i = 0; i < dropCount; i++) {
        const cy = yStart + (dropDist * (i + 0.5)) / dropCount;
        leakGroup.appendChild(makeDroplet(cx, cy, leak.id));
      }
    } else {
      for (let i = 0; i < dropCount; i++) {
        const drop = makeDroplet(cx, yStart, leak.id);

        const motion = document.createElementNS(svgNS, 'animateMotion');
        motion.setAttribute('path', `M 0 0 L 0 ${dropDist}`);
        motion.setAttribute('dur', `${dropDuration}s`);
        motion.setAttribute('repeatCount', 'indefinite');
        motion.setAttribute('begin', `-${i * stagger}s`);
        drop.appendChild(motion);

        const fade = document.createElementNS(svgNS, 'animate');
        fade.setAttribute('attributeName', 'opacity');
        fade.setAttribute('values', '0; 0.95; 0.95; 0');
        fade.setAttribute('keyTimes', '0; 0.18; 0.82; 1');
        fade.setAttribute('dur', `${dropDuration}s`);
        fade.setAttribute('repeatCount', 'indefinite');
        fade.setAttribute('begin', `-${i * stagger}s`);
        drop.appendChild(fade);

        leakGroup.appendChild(drop);
      }
    }

    // Dropout %
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

    // Cause label
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
    path.setAttribute('opacity', FORWARD_STROKE_OPACITY);
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

  // ---- Stage cards (dark fill, small icon LEFT + label to its RIGHT, both centered as a pair) ----
  const stageGroup = document.createElementNS(svgNS, 'g');
  stageGroup.setAttribute('class', 'funnel-stages');

  const ICON_FS = 18;
  const LABEL_FS = 14;
  const ICON_LABEL_GAP = 6;
  const CHAR_W = 7;
  const BASELINE_Y = STAGE_H / 2 + 5;

  STAGES.forEach((stage) => {
    const group = document.createElementNS(svgNS, 'g');
    group.setAttribute('transform', `translate(${stage.x}, ${stage.y})`);
    group.style.cursor = 'pointer';
    group.dataset.stageId = stage.id;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('width', String(STAGE_W));
    rect.setAttribute('height', String(STAGE_H));
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', STAGE_FILL);
    rect.setAttribute('stroke', STAGE_BORDER);
    rect.setAttribute('stroke-width', String(STAGE_BORDER_W));
    rect.style.transition = 'filter 180ms ease, stroke 180ms ease';
    group.appendChild(rect);

    // Center the icon+label combo horizontally within the box
    const labelWidth = stage.label.length * CHAR_W;
    const totalWidth = ICON_FS + ICON_LABEL_GAP + labelWidth;
    const startX = Math.max(10, (STAGE_W - totalWidth) / 2);

    const iconText = document.createElementNS(svgNS, 'text');
    iconText.setAttribute('x', String(startX));
    iconText.setAttribute('y', String(BASELINE_Y));
    iconText.setAttribute('text-anchor', 'start');
    iconText.setAttribute('fill', STAGE_ACCENT);
    iconText.setAttribute('font-size', String(ICON_FS));
    iconText.setAttribute('class', 'funnel-icon');
    iconText.textContent = stage.icon;
    group.appendChild(iconText);

    const labelText = document.createElementNS(svgNS, 'text');
    labelText.setAttribute('x', String(startX + ICON_FS + ICON_LABEL_GAP));
    labelText.setAttribute('y', String(BASELINE_Y));
    labelText.setAttribute('text-anchor', 'start');
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
    if (!panel) return;
    panel.classList.add('is-active');
    if (infoIcon) infoIcon.textContent = stage.icon;
    if (infoTitle) infoTitle.textContent = stage.label;
    if (infoBody) {
      infoBody.textContent =
        stage.tooltip ?? 'No detail captured for this stage yet. Add your hypothesis or analytics finding here.';
    }
  }

  function resetInfo() {
    panel?.classList.remove('is-active');
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
      p.setAttribute('opacity', FORWARD_STROKE_OPACITY);
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
