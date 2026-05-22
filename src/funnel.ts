// Interactive funnel diagram — matches the second-screenshot reference:
// Traffic → Home → (Search / Browsing) → Product detail page → Cart → Checkout
// plus 12% direct-to-PDP shortcut and red dashed leak arrows at every stage.
// Hover any stage to isolate the transitions and leaks tied to it.

type Stage = {
  id: string;
  label: string;
  x: number;
  y: number;
  fill: string;
  border: string;
  text: string;
};

type Transition = {
  id: string;
  from: string;
  to: string;
  pct: number;
  labelOverride?: string;
  curve?: { cx: number; cy: number };
  variant: 'forward' | 'shortcut';
};

type Leak = {
  id: string;
  fromStageId: string;
  label: string;
};

const STAGES: Stage[] = [
  { id: 'traffic',  label: 'Traffic',         x: 60,   y: 240, fill: '#f5efe4', border: '#d8c79a', text: '#3a2f12' },
  { id: 'home',     label: 'Home',            x: 260,  y: 240, fill: '#eae6f5', border: '#9c95c5', text: '#241f4d' },
  { id: 'search',   label: 'Search',          x: 470,  y: 120, fill: '#e2f3df', border: '#79b46b', text: '#1d3a18' },
  { id: 'browsing', label: 'Browsing',        x: 470,  y: 360, fill: '#fae1c7', border: '#d49866', text: '#3d2410' },
  { id: 'pdp',      label: 'Product detail',  x: 690,  y: 240, fill: '#f5d8cf', border: '#cd7666', text: '#3d1610' },
  { id: 'cart',     label: 'Cart',            x: 920,  y: 240, fill: '#f3cfdc', border: '#c66b8d', text: '#3a0f1f' },
  { id: 'checkout', label: 'Checkout',        x: 1130, y: 240, fill: '#d0f0d5', border: '#5fa370', text: '#0f3318' },
];

const TRANSITIONS: Transition[] = [
  { id: 't-traffic-home',  from: 'traffic',  to: 'home',     pct: 62, variant: 'forward' },
  { id: 't-traffic-pdp',   from: 'traffic',  to: 'pdp',      pct: 12, variant: 'shortcut',
    labelOverride: '12% direct to PDP',
    curve: { cx: 600, cy: -20 } },
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
  { id: 'leak-search',   fromStageId: 'search',   label: 'no results' },
  { id: 'leak-browsing', fromStageId: 'browsing', label: 'no results' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: 'exit' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: 'abandoned cart' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: 'returns' },
];

const STAGE_W = 130;
const STAGE_H = 50;
const LEAK_Y = 540;

function stageById(id: string): Stage {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown stage: ${id}`);
  return s;
}

function transitionPath(t: Transition): { d: string; midX: number; midY: number } {
  const from = stageById(t.from);
  const to = stageById(t.to);

  const x1 = from.x + STAGE_W;
  const y1 = from.y + STAGE_H / 2;
  const x2 = to.x;
  const y2 = to.y + STAGE_H / 2;

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
  const x = stage.x + STAGE_W / 2;
  const yTop = stage.y + STAGE_H;
  return `M ${x} ${yTop} L ${x} ${LEAK_Y}`;
}

export function renderFunnel(root: HTMLElement): void {
  const VIEWBOX_W = 1300;
  const VIEWBOX_H = 620;
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
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
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#7ad196" />
    </marker>
    <marker id="arrow-shortcut" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#fae194" />
    </marker>
    <marker id="arrow-leak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#e87b6b" />
    </marker>
  `;
  svg.appendChild(defs);

  // ---- Leak arrows (behind everything) ----
  const leakGroup = document.createElementNS(svgNS, 'g');
  leakGroup.setAttribute('class', 'funnel-leaks');
  LEAKS.forEach((leak) => {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', leakPath(leak));
    path.setAttribute('stroke', '#e87b6b');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-dasharray', '4 4');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrow-leak)');
    path.setAttribute('opacity', '0.7');
    path.dataset.leakId = leak.id;
    path.style.transition = 'opacity 200ms ease';
    leakGroup.appendChild(path);

    const stage = stageById(leak.fromStageId);
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(stage.x + STAGE_W / 2));
    label.setAttribute('y', String(LEAK_Y + 25));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#e87b6b');
    label.setAttribute('font-size', '13');
    label.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    label.textContent = leak.label;
    leakGroup.appendChild(label);
  });
  svg.appendChild(leakGroup);

  // ---- Forward / shortcut transitions ----
  const edgeGroup = document.createElementNS(svgNS, 'g');
  edgeGroup.setAttribute('class', 'funnel-edges');

  TRANSITIONS.forEach((t) => {
    const { d, midX, midY } = transitionPath(t);
    const isShortcut = t.variant === 'shortcut';
    const stroke = isShortcut ? '#fae194' : '#7ad196';
    const marker = isShortcut ? 'url(#arrow-shortcut)' : 'url(#arrow-forward)';

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', isShortcut ? '6 6' : '5 5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', marker);
    path.setAttribute('opacity', '0.9');
    path.dataset.transitionId = t.id;
    path.style.transition = 'opacity 200ms ease, stroke-width 200ms ease';
    edgeGroup.appendChild(path);

    // Percentage label in a rounded pill
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
    labelBg.setAttribute('stroke', isShortcut ? '#fae194' : '#3a3a3f');
    labelBg.setAttribute('stroke-width', '1');
    labelGroup.appendChild(labelBg);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(estimatedWidth / 2));
    label.setAttribute('y', '18');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', isShortcut ? '#fae194' : '#e5e5e5');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.textContent = labelText;
    labelGroup.appendChild(label);

    edgeGroup.appendChild(labelGroup);
  });
  svg.appendChild(edgeGroup);

  // ---- Stage cards ----
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
    rect.setAttribute('fill', stage.fill);
    rect.setAttribute('stroke', stage.border);
    rect.setAttribute('stroke-width', '1.5');
    rect.style.transition = 'filter 180ms ease';
    group.appendChild(rect);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', String(STAGE_W / 2));
    text.setAttribute('y', String(STAGE_H / 2 + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', stage.text);
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
    leakGroup.querySelectorAll<SVGPathElement>('[data-leak-id]').forEach((p) => {
      const lid = p.dataset.leakId!;
      const l = LEAKS.find((x) => x.id === lid)!;
      const involved = l.fromStageId === stageId;
      p.setAttribute('opacity', involved ? '1' : '0.18');
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
    leakGroup.querySelectorAll<SVGPathElement>('[data-leak-id]').forEach((p) => {
      p.setAttribute('opacity', '0.7');
    });
    stageGroup.querySelectorAll<SVGGElement>('[data-stage-id]').forEach((g) => {
      (g.firstChild as SVGRectElement).style.filter = 'none';
    });
  }
}
