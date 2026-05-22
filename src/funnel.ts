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

type AttachSide = 'right' | 'left' | 'top' | 'bottom';

type Transition = {
  id: string;
  from: string;
  to: string;
  pct: number;
  labelOverride?: string;
  /** Quadratic Bézier control point (legacy) */
  curve?: { cx: number; cy: number };
  /** Cubic Bézier control points (overrides auto control points if set) */
  cubicCurve?: { c1x: number; c1y: number; c2x: number; c2y: number };
  variant: 'forward' | 'shortcut';
  /** Which edge to leave the source from. Default: 'right' (right midline). */
  fromAttach?: AttachSide;
  /** Which edge to arrive at the target on. Default: 'left' (left midline). */
  toAttach?: AttachSide;
};

type Leak = {
  id: string;
  fromStageId: string;
  label: string;
  pctOverride?: number;
  xOffset?: number;
};

const STAGES: Stage[] = [
  // Home flush left at x=30 (30 px viewBox padding).
  { id: 'home',     label: 'Home',         icon: 'home',          x: 30,   y: 55,
    tooltip:
      "Homepage exits trace back to weak hero clarity, no obvious value proposition, and navigation that hides what shoppers actually came for." },
  // Search/Browsing sit in the (wider) Home–PDP gap with breathing room.
  { id: 'search',   label: 'Search',       icon: 'search',        x: 240,  y: 20,
    tooltip:
      "Drop-offs at search are usually caused by missing synonyms and weak typo tolerance. Shoppers searching with non-canonical terms see 'no results' and leave." },
  { id: 'browsing', label: 'Browsing',     icon: 'grid_view',     x: 400,  y: 90,
    tooltip:
      "Category browsers leak when grids are slow, image quality is inconsistent, and filters don't match how shoppers actually narrow their choice." },
  // Main-row continuation. PDP→Cart and Cart→Checkout gaps are equal (175 px each).
  { id: 'pdp',      label: 'Product page', icon: 'description',   x: 630,  y: 55,
    tooltip:
      "The lack of high-quality images, missing attributes or key specifications, and weak product descriptions all increase drop-off here. The product page is where intent turns into action — or it doesn't." },
  { id: 'cart',     label: 'Cart',         icon: 'shopping_cart', x: 935,  y: 55,
    tooltip:
      "Cart abandonment is driven by surprise shipping costs, mandatory account creation, and a long path to checkout. Trust signals and total-cost transparency matter most." },
  // Checkout flush right (right edge at viewBox.w - 30 = 1370).
  { id: 'checkout', label: 'Checkout',     icon: 'payments',      x: 1240, y: 55,
    tooltip:
      "Returns are driven by image vs. product mismatch, sizing/fit ambiguity, and missing detail photographs (texture, scale, packaging). Better PDPs reduce returns 30-50%." },
];

const TRANSITIONS: Transition[] = [
  { id: 't-home-search',   from: 'home',     to: 'search',   pct: 40, variant: 'forward' },
  { id: 't-home-browsing', from: 'home',     to: 'browsing', pct: 45, variant: 'forward' },
  // Search → PDP and Browsing → PDP both run right→left, keeping the space above Search free.
  { id: 't-search-pdp',    from: 'search',   to: 'pdp',      pct: 35, variant: 'forward' },
  { id: 't-browsing-pdp',  from: 'browsing', to: 'pdp',      pct: 25, variant: 'forward' },
  { id: 't-pdp-cart',      from: 'pdp',      to: 'cart',     pct: 12, variant: 'forward' },
  { id: 't-cart-checkout', from: 'cart',     to: 'checkout', pct: 30, variant: 'forward' },
];

const LEAKS: Leak[] = [
  { id: 'leak-home',     fromStageId: 'home',     label: 'home exit' },
  // Search and Browsing now sit at different x, so Search's leak can drop from its centre — no xOffset needed.
  { id: 'leak-search',   fromStageId: 'search',   label: 'no results' },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'no results' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'exit' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'abandoned cart' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'returns', pctOverride: 17 },
];

// Geometry — short horizontal boxes (icon-left, label-right)
const STAGE_W = 130;
const STAGE_H = 50;
const LEAK_Y = 180;                // drops end at the top of the red bar
const LEAK_ARROW_START_DY = 8;     // drop column starts just below stage box
const BAR_Y = 180;                 // red bar top edge (drops meet it)
const BAR_H = 105;                 // red bar height (% + cause + title fit inside)
const VIEWBOX = { x: 0, y: 0, w: 1400, h: BAR_Y + BAR_H };

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

function attachPoint(stage: Stage, side: AttachSide): { x: number; y: number } {
  switch (side) {
    case 'right':  return { x: stage.x + STAGE_W,     y: stage.y + STAGE_H / 2 };
    case 'left':   return { x: stage.x,               y: stage.y + STAGE_H / 2 };
    case 'top':    return { x: stage.x + STAGE_W / 2, y: stage.y };
    case 'bottom': return { x: stage.x + STAGE_W / 2, y: stage.y + STAGE_H };
  }
}

function controlOffset(side: AttachSide, dist: number): { dx: number; dy: number } {
  switch (side) {
    case 'right':  return { dx:  dist, dy: 0     };
    case 'left':   return { dx: -dist, dy: 0     };
    case 'top':    return { dx: 0,     dy: -dist };
    case 'bottom': return { dx: 0,     dy:  dist };
  }
}

function transitionPath(t: Transition): { d: string; midX: number; midY: number } {
  const from = stageById(t.from);
  const to = stageById(t.to);

  // Shortcut variant defaults to top↔top; forward defaults to right→left.
  const defaultFrom: AttachSide = t.variant === 'shortcut' ? 'top'  : 'right';
  const defaultTo:   AttachSide = t.variant === 'shortcut' ? 'top'  : 'left';
  const fromAttach = t.fromAttach ?? defaultFrom;
  const toAttach   = t.toAttach   ?? defaultTo;

  const start = attachPoint(from, fromAttach);
  const end   = attachPoint(to,   toAttach);

  // Explicit cubic curve overrides auto-controls (kept for backward compat).
  if (t.cubicCurve) {
    const c = t.cubicCurve;
    const d = `M ${start.x} ${start.y} C ${c.c1x} ${c.c1y}, ${c.c2x} ${c.c2y}, ${end.x} ${end.y}`;
    const midX = 0.125 * start.x + 0.375 * c.c1x + 0.375 * c.c2x + 0.125 * end.x;
    const midY = 0.125 * start.y + 0.375 * c.c1y + 0.375 * c.c2y + 0.125 * end.y;
    return { d, midX, midY };
  }

  // Legacy quadratic.
  if (t.curve) {
    const d = `M ${start.x} ${start.y} Q ${t.curve.cx} ${t.curve.cy} ${end.x} ${end.y}`;
    const midX = 0.25 * start.x + 0.5 * t.curve.cx + 0.25 * end.x;
    const midY = 0.25 * start.y + 0.5 * t.curve.cy + 0.25 * end.y;
    return { d, midX, midY };
  }

  // Auto cubic — control points push out perpendicular to each attachment edge.
  // Shallower factor (0.3) for top/bottom attachments to keep arcs from over-extending.
  const euclidean = Math.hypot(end.x - start.x, end.y - start.y);
  const verticalAttach = (s: AttachSide) => s === 'top' || s === 'bottom';
  const factor = (verticalAttach(fromAttach) || verticalAttach(toAttach)) ? 0.3 : 0.5;
  const dist = euclidean * factor;

  const c1Off = controlOffset(fromAttach, dist);
  const c2Off = controlOffset(toAttach,   dist);
  const c1x = start.x + c1Off.dx;
  const c1y = start.y + c1Off.dy;
  const c2x = end.x   + c2Off.dx;
  const c2y = end.y   + c2Off.dy;

  const d = `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  const midX = 0.125 * start.x + 0.375 * c1x + 0.375 * c2x + 0.125 * end.x;
  const midY = 0.125 * start.y + 0.375 * c1y + 0.375 * c2y + 0.125 * end.y;
  return { d, midX, midY };
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

  // ---- Leak droplets ----
  const leakGroup = document.createElementNS(svgNS, 'g');
  leakGroup.setAttribute('class', 'funnel-leaks');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Constant fall speed + target spacing keeps drops visually consistent across leak lengths.
  const DROP_SPEED = 70;      // px / second
  const DROP_SPACING = 40;    // target px between drops in the column

  function makeDroplet(cx: number, cy: number, leakId: string): SVGEllipseElement {
    const drop = document.createElementNS(svgNS, 'ellipse');
    drop.setAttribute('cx', String(cx));
    drop.setAttribute('cy', String(cy));
    drop.setAttribute('rx', '3');
    drop.setAttribute('ry', '4.5');
    drop.setAttribute('fill', '#dc2626');
    drop.setAttribute('opacity', '0.92');
    drop.setAttribute('class', 'funnel-droplet');
    drop.dataset.leakId = leakId;
    return drop;
  }

  LEAKS.forEach((leak) => {
    const stage = stageById(leak.fromStageId);
    const cx = leakX(leak);
    const yStart = stage.y + STAGE_H + LEAK_ARROW_START_DY;
    const yEnd = LEAK_Y;                     // drops fall right to the top of the red bar
    const dropDist = Math.max(0, yEnd - yStart);

    const dropCount = Math.max(1, Math.round(dropDist / DROP_SPACING));
    const dropDuration = dropDist / DROP_SPEED;
    const stagger = dropDuration / dropCount;

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

  // ---- Red leak bar (background + per-stage %/cause labels + title) ----
  // Drops fall into the top of this bar; labels and the "Leaking funnel = Lost revenue" headline sit inside.
  const barGroup = document.createElementNS(svgNS, 'g');
  barGroup.setAttribute('class', 'funnel-bar');

  const barRect = document.createElementNS(svgNS, 'rect');
  barRect.setAttribute('x', '0');
  barRect.setAttribute('y', String(BAR_Y));
  barRect.setAttribute('width', String(VIEWBOX.w));
  barRect.setAttribute('height', String(BAR_H));
  barRect.setAttribute('rx', '12');
  barRect.setAttribute('fill', '#3a0a0a');
  barRect.setAttribute('stroke', 'rgba(127, 29, 29, 0.5)');
  barRect.setAttribute('stroke-width', '1');
  barGroup.appendChild(barRect);

  // Per-stage labels (% in white, cause label below in soft white)
  LEAKS.forEach((leak) => {
    const cx = leakX(leak);
    const pct = leakPctFor(leak);

    const pctLabel = document.createElementNS(svgNS, 'text');
    pctLabel.setAttribute('x', String(cx));
    pctLabel.setAttribute('y', String(BAR_Y + 32));
    pctLabel.setAttribute('text-anchor', 'middle');
    pctLabel.setAttribute('fill', '#ffffff');
    pctLabel.setAttribute('font-size', '24');
    pctLabel.setAttribute('font-weight', '700');
    pctLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    pctLabel.dataset.leakId = leak.id;
    pctLabel.textContent = `${pct}%`;
    barGroup.appendChild(pctLabel);

    const causeLabel = document.createElementNS(svgNS, 'text');
    causeLabel.setAttribute('x', String(cx));
    causeLabel.setAttribute('y', String(BAR_Y + 50));
    causeLabel.setAttribute('text-anchor', 'middle');
    causeLabel.setAttribute('fill', 'rgba(255, 255, 255, 0.65)');
    causeLabel.setAttribute('font-size', '12');
    causeLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    causeLabel.dataset.leakId = leak.id;
    causeLabel.textContent = leak.label;
    barGroup.appendChild(causeLabel);
  });

  // Title at the bottom of the bar
  const barTitle = document.createElementNS(svgNS, 'text');
  barTitle.setAttribute('x', String(VIEWBOX.w / 2));
  barTitle.setAttribute('y', String(BAR_Y + 90));
  barTitle.setAttribute('text-anchor', 'middle');
  barTitle.setAttribute('fill', '#ffffff');
  barTitle.setAttribute('font-size', '22');
  barTitle.setAttribute('font-weight', '700');
  barTitle.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
  barTitle.setAttribute('letter-spacing', '-0.01em');
  barTitle.textContent = 'Leaking funnel = Lost revenue';
  barGroup.appendChild(barTitle);

  svg.appendChild(barGroup);

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
    svg.querySelectorAll<SVGElement>('[data-leak-id]').forEach((el) => {
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
    svg.querySelectorAll<SVGElement>('[data-leak-id]').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'ellipse') el.setAttribute('opacity', '0.92');
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
