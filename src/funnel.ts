// Interactive funnel diagram — uniform kinetic-yellow stages, top-arc shortcut,
// leak labels above each leak arrow, animated leak lines pouring into the red banner.

type Stage = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type Transition = {
  id: string;
  from: string;
  to: string;
  pct: number;
  labelOverride?: string;
  curve?: { cx: number; cy: number };
  /** 'forward' = standard right→left midline; 'shortcut' = top→top arc-over. Visual styling is identical. */
  variant: 'forward' | 'shortcut';
};

type Leak = {
  id: string;
  fromStageId: string;
  label: string;
  /** Override the computed dropout (used for terminal stages where 100 − sum(forwards) is meaningless). */
  pctOverride?: number;
  /** Horizontal offset of the leak column from `stage.x`. Default = STAGE_W / 2 (centered). */
  xOffset?: number;
};

const STAGES: Stage[] = [
  { id: 'traffic',  label: 'Traffic',        x: 60,   y: 200 },
  { id: 'home',     label: 'Home',           x: 320,  y: 200 },
  { id: 'search',   label: 'Search',         x: 540,  y: 60  },
  { id: 'browsing', label: 'Browsing',       x: 610,  y: 320 },
  { id: 'pdp',      label: 'Product detail', x: 800,  y: 200 },
  { id: 'cart',     label: 'Cart',           x: 1030, y: 200 },
  { id: 'checkout', label: 'Checkout',       x: 1250, y: 200 },
];

const TRANSITIONS: Transition[] = [
  { id: 't-traffic-home',  from: 'traffic',  to: 'home',     pct: 62, variant: 'forward' },
  { id: 't-traffic-pdp',   from: 'traffic',  to: 'pdp',      pct: 12, variant: 'shortcut',
    labelOverride: '12% direct to PDP',
    curve: { cx: 495, cy: -240 } },
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
  // Search's leak column drops from the LEFT edge so it passes to the left of Browsing
  { id: 'leak-search',   fromStageId: 'search',   label: 'no results', xOffset: 0 },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'no results' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'exit' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'abandoned cart' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'returns', pctOverride: 17 },
];

// Geometry
const STAGE_W = 130;
const STAGE_H = 50;
const LEAK_Y = 460;
const PCT_LABEL_DY = 14;          // px below stage bottom — dropout %
const CAUSE_LABEL_DY = 30;        // px below stage bottom — cause text (bounce / no results / …)
const LEAK_ARROW_START_DY = 46;   // px below stage bottom — arrow starts here, leaves room for labels above
const VIEWBOX = { x: 0, y: -40, w: 1400, h: 510 };

// Uniform kinetic-yellow palette for every box
const STAGE_FILL = '#fae194';
const STAGE_BORDER = '#d4af37';
const STAGE_TEXT = '#18181b';

// Forward / shortcut arrow + pill share one visual style (the shortcut is just curved)
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

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', 'auto');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    'E-commerce funnel: Traffic → Home → Search/Browsing → Product detail → Cart → Checkout, with leak arrows at every stage',
  );
  svg.classList.add('select-none');

  // ---- Arrowhead markers ----
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

  // ---- Leak arrows + dropout % + cause label (stacked just below each box) ----
  const leakGroup = document.createElementNS(svgNS, 'g');
  leakGroup.setAttribute('class', 'funnel-leaks');

  LEAKS.forEach((leak) => {
    const stage = stageById(leak.fromStageId);
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

    // Dropout % — closer to the box
    const pctLabel = document.createElementNS(svgNS, 'text');
    pctLabel.setAttribute('x', String(cx));
    pctLabel.setAttribute('y', String(stage.y + STAGE_H + PCT_LABEL_DY));
    pctLabel.setAttribute('text-anchor', 'middle');
    pctLabel.setAttribute('fill', '#e87b6b');
    pctLabel.setAttribute('font-size', '12');
    pctLabel.setAttribute('font-weight', '600');
    pctLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    pctLabel.dataset.leakId = leak.id;
    pctLabel.textContent = `${pct}%`;
    leakGroup.appendChild(pctLabel);

    // Cause label — just above the arrow
    const causeLabel = document.createElementNS(svgNS, 'text');
    causeLabel.setAttribute('x', String(cx));
    causeLabel.setAttribute('y', String(stage.y + STAGE_H + CAUSE_LABEL_DY));
    causeLabel.setAttribute('text-anchor', 'middle');
    causeLabel.setAttribute('fill', '#e87b6b');
    causeLabel.setAttribute('font-size', '12');
    causeLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    causeLabel.dataset.leakId = leak.id;
    causeLabel.textContent = leak.label;
    leakGroup.appendChild(causeLabel);
  });
  svg.appendChild(leakGroup);

  // ---- Forward / shortcut transitions (identical styling — green stroke, dark pill) ----
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

    // Percentage pill — uniform dark style for every transition (forward + shortcut)
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

  // ---- Stage cards (uniform kinetic yellow) ----
  const stageGroup = document.createElementNS(svgNS, 'g');
  stageGroup.setAttribute('class', 'funnel-stages');

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
    rect.setAttribute('stroke-width', '1.5');
    rect.style.transition = 'filter 180ms ease';
    group.appendChild(rect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', String(STAGE_W / 2));
    text.setAttribute('y', String(STAGE_H / 2 + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', STAGE_TEXT);
    text.setAttribute('font-size', '15');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    text.textContent = stage.label;
    group.appendChild(text);

    group.addEventListener('mouseenter', () => highlightStage(stage.id));
    group.addEventListener('mouseleave', () => clearHighlight());

    stageGroup.appendChild(group);
  });
  svg.appendChild(stageGroup);

  root.innerHTML = '';
  root.appendChild(svg);

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
      const dimmed = g.dataset.stageId !== stageId;
      (g.firstChild as SVGRectElement).style.filter = dimmed
        ? 'saturate(0.3) brightness(0.7)'
        : 'none';
    });
  }

  function clearHighlight() {
    edgeGroup.querySelectorAll<SVGPathElement>('[data-transition-id]').forEach((p) => {
      p.setAttribute('opacity', '0.9');
      p.setAttribute('stroke-width', '2');
    });
    leakGroup.querySelectorAll<SVGElement>('[data-leak-id]').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      el.setAttribute('opacity', tag === 'path' ? '0.85' : '1');
    });
    stageGroup.querySelectorAll<SVGGElement>('[data-stage-id]').forEach((g) => {
      (g.firstChild as SVGRectElement).style.filter = 'none';
    });
  }
}
