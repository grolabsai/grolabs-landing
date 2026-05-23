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
  /** Override the default STAGE_W. Useful for stages with longer labels (e.g. Product page). */
  width?: number;
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
  /** Shift the percentage pill from its natural midpoint (e.g. to dodge a leak column). */
  labelOffset?: { dx?: number; dy?: number };
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
  { id: 'search',   label: 'Search',       icon: 'search',        x: 250,  y: 20,
    tooltip:
      "Drop-offs at search are usually caused by missing synonyms and weak typo tolerance. Shoppers searching with non-canonical terms see 'no results' and leave." },
  // Browsing centered between Search (ends x=380) and PDP (starts x=740)
  // so its leak label in the red bar doesn't crowd Search's leak label.
  { id: 'browsing', label: 'Browsing',     icon: 'grid_view',     x: 500,  y: 90,
    tooltip:
      "Category browsers leak when grids are slow, image quality is inconsistent, and filters don't match how shoppers actually narrow their choice." },
  // Main-row continuation. PDP gets a wider box so the "Product page" label fits comfortably.
  { id: 'pdp',      label: 'Product page', icon: 'description',   x: 740,  y: 55,  width: 160,
    tooltip:
      "The lack of high-quality images, missing attributes or key specifications, and weak product descriptions all increase drop-off here. The product page is where intent turns into action — or it doesn't." },
  { id: 'cart',     label: 'Cart',         icon: 'shopping_cart', x: 990,  y: 55,
    tooltip:
      "Cart abandonment is driven by surprise shipping costs, mandatory account creation, and a long path to checkout. Trust signals and total-cost transparency matter most." },
  // Checkout flush right (right edge at viewBox.w - 30 = 1370).
  { id: 'checkout', label: 'Checkout',     icon: 'payments',      x: 1240, y: 55,
    tooltip:
      "Returns are driven by image vs. product mismatch, sizing/fit ambiguity, and missing detail photographs (texture, scale, packaging). Better PDPs reduce returns 30-50%." },
];

const TRANSITIONS: Transition[] = [
  { id: 't-home-search',   from: 'home',     to: 'search',   pct: 40, variant: 'forward' },
  // Home→Browsing exits Home going down-right (cubicCurve C1 pushes downward instead of horizontal),
  // and labelOffset stacks the 45% pill directly below the 40% pill so the breakdown is easy to read.
  { id: 't-home-browsing', from: 'home',     to: 'browsing', pct: 45, variant: 'forward',
    cubicCurve: { c1x: 200, c1y: 115, c2x: 320, c2y: 115 },
    labelOffset: { dx: -60, dy: -10 } },
  // Search→PDP arcs UP through the 35% pill — the line "from Search to 35%" is the rising half of the arc.
  { id: 't-search-pdp',    from: 'search',   to: 'pdp',      pct: 35, variant: 'forward',
    cubicCurve: { c1x: 480, c1y: -11, c2x: 640, c2y: -11 } },
  // 25% pill sits at the natural midpoint of Browsing→PDP — acts as a junction where the line from
  // Browsing meets the outgoing lines to PDP (the arrow itself) and Cart (the dotted connector).
  { id: 't-browsing-pdp',  from: 'browsing', to: 'pdp',      pct: 25, variant: 'forward' },
  { id: 't-pdp-cart',      from: 'pdp',      to: 'cart',     pct: 20, variant: 'forward' },
  { id: 't-cart-checkout', from: 'cart',     to: 'checkout', pct: 30, variant: 'forward' },
];

const LEAKS: Leak[] = [
  // Home no longer surfaces a leak — the entry stage just feeds Search / Browsing.
  { id: 'leak-search',   fromStageId: 'search',   label: 'UNABLE TO FIND PRODUCT' },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'UNABLE TO FIND PRODUCT' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'LACK OF CONVINCING INFO' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'ABANDONED CART' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'RETURNS', pctOverride: 17 },
];

// Geometry — taller boxes now that icon is on top, label centered below.
const STAGE_W = 130;
const STAGE_H = 80;                // was 50; grew to fit stacked icon + larger label
const LEAK_Y = 180;                // drops end at the top of the red bar
const LEAK_ARROW_START_DY = 8;     // drop column starts just below stage box
const BAR_Y = 180;                 // red bar top edge (drops meet it)
const BAR_H = 105;                 // red bar height (% + cause + title fit inside)
// Top extends to -15 so the 35% pill (lifted to the level of Search's top edge) has clearance.
const VIEWBOX = { x: 0, y: -15, w: 1400, h: BAR_Y + BAR_H + 15 };

// Stage cards punch DARKER than the section background — they read as
// recessed "wells" in the canvas-deeper surface. Pure black gives the
// strongest separation; the kinetic-yellow icons + bone-white labels
// pop loudest against it. Border stays as a subtle hairline.
const STAGE_FILL = '#000000';
const STAGE_BORDER = 'rgba(255, 255, 255, 0.08)';
const STAGE_BORDER_W = 1;
const STAGE_ACCENT = '#fae194'; // text + icon

// Forward arrows: very subtle neutral gray so they recede; the red
// leaks are what should pop on the funnel. Arrowheads use the same
// stroke so they stay coherent with the line.
const FORWARD_STROKE = '#5a5a60';
const FORWARD_STROKE_OPACITY = '0.5';

// Percentage-pill text colour. Independent from FORWARD_STROKE so we
// can keep the pills readable even when the arrows go invisible-quiet.
// Dark-ish gray — visible against the #1b1b1e pill bg but not loud.
const TRANSITION_LABEL_COLOR = '#9a9aa1';

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
  const offset = l.xOffset ?? stageWidth(stage) / 2;
  return stage.x + offset;
}

function stageWidth(stage: Stage): number {
  return stage.width ?? STAGE_W;
}

function attachPoint(stage: Stage, side: AttachSide): { x: number; y: number } {
  const w = stageWidth(stage);
  switch (side) {
    case 'right':  return { x: stage.x + w,     y: stage.y + STAGE_H / 2 };
    case 'left':   return { x: stage.x,         y: stage.y + STAGE_H / 2 };
    case 'top':    return { x: stage.x + w / 2, y: stage.y };
    case 'bottom': return { x: stage.x + w / 2, y: stage.y + STAGE_H };
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

  let d: string;
  let midX: number;
  let midY: number;

  if (t.cubicCurve) {
    // Explicit cubic curve overrides auto-controls (kept for backward compat).
    const c = t.cubicCurve;
    d = `M ${start.x} ${start.y} C ${c.c1x} ${c.c1y}, ${c.c2x} ${c.c2y}, ${end.x} ${end.y}`;
    midX = 0.125 * start.x + 0.375 * c.c1x + 0.375 * c.c2x + 0.125 * end.x;
    midY = 0.125 * start.y + 0.375 * c.c1y + 0.375 * c.c2y + 0.125 * end.y;
  } else if (t.curve) {
    // Legacy quadratic.
    d = `M ${start.x} ${start.y} Q ${t.curve.cx} ${t.curve.cy} ${end.x} ${end.y}`;
    midX = 0.25 * start.x + 0.5 * t.curve.cx + 0.25 * end.x;
    midY = 0.25 * start.y + 0.5 * t.curve.cy + 0.25 * end.y;
  } else {
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

    d = `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
    midX = 0.125 * start.x + 0.375 * c1x + 0.375 * c2x + 0.125 * end.x;
    midY = 0.125 * start.y + 0.375 * c1y + 0.375 * c2y + 0.125 * end.y;
  }

  // Apply per-transition label offset so pills can dodge leak columns etc.
  if (t.labelOffset) {
    midX += t.labelOffset.dx ?? 0;
    midY += t.labelOffset.dy ?? 0;
  }

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

  // ---- Defs (forward arrow marker + leak-bar horizontal gradient) ----
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <marker id="arrow-forward" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${FORWARD_STROKE}" />
    </marker>
    <linearGradient id="leak-bar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7F1D1D" />
      <stop offset="50%" stop-color="#991B1B" />
      <stop offset="100%" stop-color="#7F1D1D" />
    </linearGradient>
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
  const DROP_SPEED = 50;      // px / second
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
    label.setAttribute('fill', TRANSITION_LABEL_COLOR);
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.textContent = labelText;
    labelGroup.appendChild(label);

    edgeGroup.appendChild(labelGroup);
  });
  svg.appendChild(edgeGroup);

  // ---- Secondary dotted connectors from 35% / 25% pills to Cart ----
  // These suggest the onward flow into Cart without their own label.
  const connectorGroup = document.createElementNS(svgNS, 'g');
  connectorGroup.setAttribute('class', 'funnel-connectors');

  const cartStage = stageById('cart');
  const searchPdpPill = transitionPath(TRANSITIONS.find((t) => t.id === 't-search-pdp')!);
  const browsingPdpPill = transitionPath(TRANSITIONS.find((t) => t.id === 't-browsing-pdp')!);

  // Endpoints on Cart. Both shifted IN from Cart's left edge so the lines don't conflict
  // with Cart's leak column (which falls from Cart's centre).
  const connectorEndX = cartStage.x + 30;     // 30 px inside Cart's left edge
  const cartTopY = cartStage.y;
  const cartBottomY = cartStage.y + STAGE_H;

  // C2 offset chosen so the end tangent at Cart lands at a 45° angle (instead of
  // a perpendicular vertical/horizontal approach) — the auto-rotating arrow marker
  // then naturally tilts to match the line's diagonal.
  const TANGENT_OFFSET = 40;

  // 35% (above the main line) — arcs over PDP, lands on Cart's top edge at 45° down-right.
  const connector35 = document.createElementNS(svgNS, 'path');
  connector35.setAttribute(
    'd',
    `M ${searchPdpPill.midX} ${searchPdpPill.midY} ` +
      `C ${searchPdpPill.midX} 15, ${connectorEndX - TANGENT_OFFSET} 15, ${connectorEndX} ${cartTopY}`,
  );
  connector35.setAttribute('stroke', FORWARD_STROKE);
  connector35.setAttribute('stroke-width', '1.5');
  connector35.setAttribute('stroke-dasharray', '2 5');
  connector35.setAttribute('stroke-linecap', 'round');
  connector35.setAttribute('fill', 'none');
  connector35.setAttribute('opacity', '0.6');
  connector35.setAttribute('marker-end', 'url(#arrow-forward)');
  connectorGroup.appendChild(connector35);

  // 25% (below the main line) — dips under PDP, lands on Cart's bottom edge at 45° up-right.
  const connector25 = document.createElementNS(svgNS, 'path');
  connector25.setAttribute(
    'd',
    `M ${browsingPdpPill.midX} ${browsingPdpPill.midY} ` +
      `C ${browsingPdpPill.midX} 150, ${connectorEndX - TANGENT_OFFSET} ${cartBottomY + TANGENT_OFFSET}, ${connectorEndX} ${cartBottomY}`,
  );
  connector25.setAttribute('stroke', FORWARD_STROKE);
  connector25.setAttribute('stroke-width', '1.5');
  connector25.setAttribute('stroke-dasharray', '2 5');
  connector25.setAttribute('stroke-linecap', 'round');
  connector25.setAttribute('fill', 'none');
  connector25.setAttribute('opacity', '0.6');
  connector25.setAttribute('marker-end', 'url(#arrow-forward)');
  connectorGroup.appendChild(connector25);

  svg.appendChild(connectorGroup);

  // ---- Stage cards (lighter fill on canvas-deeper section bg, icon
  //      centered on TOP, uppercase label below, PDP wraps to 2 lines) ----
  const stageGroup = document.createElementNS(svgNS, 'g');
  stageGroup.setAttribute('class', 'funnel-stages');

  const ICON_FS = 24;
  const LABEL_FS = 16;                  // ~2× of the previous 17 was unreadable in 130-px-wide
                                        // boxes; 16 px in caps reads about 2× heavier visually
                                        // due to uppercase. Adjust upward if you want bigger.
  const LABEL_LINE_GAP = 4;             // vertical gap between the two lines of "PRODUCT PAGE"

  STAGES.forEach((stage) => {
    const w = stageWidth(stage);
    const group = document.createElementNS(svgNS, 'g');
    group.setAttribute('transform', `translate(${stage.x}, ${stage.y})`);
    group.style.cursor = 'pointer';
    group.dataset.stageId = stage.id;

    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(STAGE_H));
    rect.setAttribute('rx', '10');
    rect.setAttribute('fill', STAGE_FILL);
    rect.setAttribute('stroke', STAGE_BORDER);
    rect.setAttribute('stroke-width', String(STAGE_BORDER_W));
    rect.style.transition = 'filter 180ms ease, stroke 180ms ease';
    group.appendChild(rect);

    // Stacked layout: icon top-centered, uppercase label centered below.
    // "Product page" → two lines ("PRODUCT" / "PAGE"); everything else
    // is a single line. ICON_Y / LABEL_Y are chosen per layout so the
    // pair stays vertically centered within the 80-px tall box.
    const labelLines = stage.label.toUpperCase().split(' ');
    const isMultiLine = labelLines.length > 1;
    const centerX = w / 2;

    const iconY    = isMultiLine ? 16 : 22;
    const label1Y  = isMultiLine ? 44 : 56;
    const label2Y  = label1Y + LABEL_FS + LABEL_LINE_GAP;

    const iconText = document.createElementNS(svgNS, 'text');
    iconText.setAttribute('x', String(centerX));
    iconText.setAttribute('y', String(iconY));
    iconText.setAttribute('text-anchor', 'middle');
    iconText.setAttribute('dominant-baseline', 'central');
    iconText.setAttribute('fill', STAGE_ACCENT);
    iconText.setAttribute('font-size', String(ICON_FS));
    iconText.setAttribute('class', 'funnel-icon');
    iconText.textContent = stage.icon;
    group.appendChild(iconText);

    labelLines.forEach((line, idx) => {
      const labelText = document.createElementNS(svgNS, 'text');
      labelText.setAttribute('x', String(centerX));
      labelText.setAttribute('y', String(idx === 0 ? label1Y : label2Y));
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dominant-baseline', 'central');
      labelText.setAttribute('fill', '#EDEAE0');
      labelText.setAttribute('font-size', String(LABEL_FS));
      labelText.setAttribute('font-weight', '600');
      labelText.setAttribute('letter-spacing', '0.05em');
      labelText.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
      labelText.textContent = line;
      group.appendChild(labelText);
    });

    group.addEventListener('mouseenter', () => highlightStage(stage.id));
    group.addEventListener('mouseleave', () => clearHighlight());

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
  barRect.setAttribute('fill', 'url(#leak-bar-gradient)');
  barRect.setAttribute('stroke', 'none');
  barGroup.appendChild(barRect);

  // Top border only — subtle red glow at the top edge, no bottom or side borders.
  const barTopBorder = document.createElementNS(svgNS, 'line');
  barTopBorder.setAttribute('x1', '12');
  barTopBorder.setAttribute('y1', String(BAR_Y + 0.5));
  barTopBorder.setAttribute('x2', String(VIEWBOX.w - 12));
  barTopBorder.setAttribute('y2', String(BAR_Y + 0.5));
  barTopBorder.setAttribute('stroke', 'rgba(239, 68, 68, 0.3)');
  barTopBorder.setAttribute('stroke-width', '1');
  barGroup.appendChild(barTopBorder);

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
    causeLabel.setAttribute('fill', 'rgba(254, 226, 226, 0.8)');
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
  barTitle.setAttribute('font-size', '26');
  barTitle.setAttribute('font-weight', '700');
  barTitle.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
  barTitle.setAttribute('letter-spacing', '-0.01em');
  barTitle.textContent = 'Leaking funnel = Lost revenue';
  barGroup.appendChild(barTitle);

  svg.appendChild(barGroup);

  root.innerHTML = '';
  root.appendChild(svg);

  // Bind hover on the table rows so they trigger the same highlight/info flow.
  document.querySelectorAll<HTMLElement>('.stage-row').forEach((row) => {
    const stageId = row.dataset.stageId;
    if (!stageId) return;
    row.addEventListener('mouseenter', () => highlightStage(stageId));
    row.addEventListener('mouseleave', () => clearHighlight());
  });

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
    document.querySelectorAll<HTMLElement>('.stage-row').forEach((row) => {
      row.classList.toggle('is-active', row.dataset.stageId === stageId);
    });
    const stage = STAGES.find((s) => s.id === stageId);
    if (stage) showInfo(stage);
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
    document.querySelectorAll<HTMLElement>('.stage-row').forEach((row) => {
      row.classList.remove('is-active');
    });
    resetInfo();
  }
}
