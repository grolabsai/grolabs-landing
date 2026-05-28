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
  /** Optional second line rendered underneath `label` inside the leak bar. */
  sublabel?: string;
  pctOverride?: number;
  xOffset?: number;
};

// Localised string tables. Picked at render time from the `data-locale`
// attribute on `#funnel-root` (set by index.astro per page locale).
type Locale = 'en' | 'es';
const STAGE_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home',
    search: 'Search',
    browsing: 'Browsing',
    pdp: 'Product page',
    cart: 'Cart',
    checkout: 'Checkout',
  },
  es: {
    home: 'Inicio',
    search: 'Búsqueda',
    browsing: 'Navegación',
    pdp: 'Página de producto',
    cart: 'Carrito',
    checkout: 'Checkout',
  },
};
const STAGE_TOOLTIPS: Record<Locale, Record<string, string>> = {
  en: {
    home: "Homepage exits trace back to weak hero clarity, no obvious value proposition, and navigation that hides what shoppers actually came for.",
    search: "Search drop-offs are usually a compound problem: misconfigured typo tolerance, missing synonyms, and — underneath both of those — patchy catalog data the engine has nothing rich to match against. Once the product data is clean, semantic search becomes the next lever to push discovery further: matching by meaning, not just keywords.",
    browsing: "Browsing leaks when the category taxonomy doesn't follow industry best practice and when products lack the attributes needed to power relevant faceted filtering. Without those facets, shoppers can't narrow a ten-thousand-item shelf down to the handful that actually match how they decide.",
    pdp: "The lack of high-quality images, missing attributes or key specifications, and weak product descriptions all increase drop-off here. The product page is where intent turns into action — or it doesn't.",
    cart: "The single biggest source of cart abandonment is the login wall — a required email-and-password account that has to be created and email-confirmed before the first purchase can close. It kills most first orders outright. And on the second visit it punishes returning shoppers who don't remember the password they set months ago, adding fresh friction every time.",
    checkout: "Returns trace back to opaque search results. Most engines rank probabilistically and never tell the shopper which keywords matched which product attributes — so the buyer commits to something they think matches, gets it home, and finds out it doesn't. Show the matches and the mismatches up front and returns drop sharply.",
  },
  es: {
    home: "Las salidas desde la home se deben a heros confusos, propuestas de valor poco claras y navegación que esconde lo que el comprador realmente vino a buscar.",
    search: "Los abandonos en la búsqueda suelen ser un problema compuesto: tolerancia a errores mal configurada, sinónimos faltantes y — por debajo de ambos — datos de catálogo pobres con los que el motor no tiene nada rico que asociar. Una vez que los datos del producto están limpios, la búsqueda semántica se convierte en la siguiente palanca para mejorar el descubrimiento: buscar por significado, no solo por palabras clave.",
    browsing: "La navegación falla cuando la taxonomía de categorías no sigue las mejores prácticas de la industria y cuando los productos carecen de los atributos necesarios para tener filtros facetados relevantes. Sin esos filtros, los compradores no pueden reducir una estantería de diez mil ítems a la decena que realmente coincide con cómo deciden.",
    pdp: "La falta de imágenes de alta calidad, atributos faltantes o especificaciones clave y descripciones débiles aumentan el abandono aquí. La página de producto es donde la intención se convierte en acción — o no.",
    cart: "La principal fuente de abandono del carrito es el muro de login — la cuenta obligatoria con email y contraseña que hay que crear y confirmar antes de cerrar la primera compra. Mata la mayoría de las primeras órdenes. Y en la segunda visita castiga a los clientes recurrentes que no recuerdan la contraseña que crearon hace meses.",
    checkout: "Las devoluciones se originan en resultados de búsqueda opacos. La mayoría de los motores rankean probabilísticamente y nunca le dicen al comprador qué palabras clave coincidieron con qué atributos del producto — así que el comprador se compromete con algo que cree que coincide, lo recibe y descubre que no. Muestra las coincidencias y las no-coincidencias por adelantado y las devoluciones bajan considerablemente.",
  },
};
const LEAK_LABELS: Record<Locale, Record<string, { label: string; sublabel?: string }>> = {
  en: {
    'leak-home':     { label: 'BOUNCE' },
    'leak-search':   { label: 'UNABLE TO FIND PRODUCT' },
    'leak-browsing': { label: 'UNABLE TO FIND PRODUCT' },
    'leak-pdp':      { label: 'LACK OF CONVINCING INFO' },
    'leak-cart':     { label: 'ABANDONED CART', sublabel: 'USER REGISTRATION FRICTION' },
    'leak-checkout': { label: 'RETURNS',        sublabel: 'PRODUCT MISMATCH' },
  },
  es: {
    'leak-home':     { label: 'REBOTE' },
    'leak-search':   { label: 'NO ENCUENTRA EL PRODUCTO' },
    'leak-browsing': { label: 'NO ENCUENTRA EL PRODUCTO' },
    'leak-pdp':      { label: 'INFO POCO CONVINCENTE' },
    'leak-cart':     { label: 'CARRITO ABANDONADO', sublabel: 'FRICCIÓN POR REGISTRO' },
    'leak-checkout': { label: 'DEVOLUCIONES',       sublabel: 'PRODUCTO NO COINCIDE' },
  },
};
const UI_STRINGS: Record<Locale, { barTitle: string; dropOffDrivers: string; hint: string; noDetail: string }> = {
  en: {
    barTitle: 'LEAKING FUNNEL = LOST REVENUE',
    dropOffDrivers: 'Drop-off drivers',
    hint: 'Hover any stage to see what typically causes drop-offs there.',
    noDetail: 'No detail captured for this stage yet. Add your hypothesis or analytics finding here.',
  },
  es: {
    barTitle: 'EMBUDO CON FUGAS = INGRESOS PERDIDOS',
    dropOffDrivers: 'Causas del abandono',
    hint: 'Pasa el cursor sobre cualquier etapa para ver qué suele causar abandonos ahí.',
    noDetail: 'Aún no hay detalle capturado para esta etapa. Agrega tu hipótesis o hallazgo de analítica aquí.',
  },
};

const STAGES: Stage[] = [
  // Home flush left at x=30 (30 px viewBox padding).
  { id: 'home',     label: 'Home',         icon: 'home',          x: 30,   y: 55 },
  // Search/Browsing sit in the (wider) Home–PDP gap with breathing room.
  { id: 'search',   label: 'Search',       icon: 'search',        x: 250,  y: 20 },
  // Browsing centered between Search (ends x=380) and PDP (starts x=740)
  // so its leak label in the red bar doesn't crowd Search's leak label.
  { id: 'browsing', label: 'Browsing',     icon: 'grid_view',     x: 500,  y: 70 },
  // Main-row continuation. PDP gets a wider box so the "Product page" label fits comfortably.
  { id: 'pdp',      label: 'Product page', icon: 'description',   x: 740,  y: 55,  width: 160 },
  { id: 'cart',     label: 'Cart',         icon: 'shopping_cart', x: 990,  y: 55 },
  // Checkout flush right (right edge at viewBox.w - 30 = 1370).
  { id: 'checkout', label: 'Checkout',     icon: 'payments',      x: 1240, y: 55 },
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
  // Home → bounce leak. pct computes from 100 - (40% to Search + 45% to Browsing) = 15%.
  { id: 'leak-home',     fromStageId: 'home',     label: '' },
  { id: 'leak-search',   fromStageId: 'search',   label: '' },
  { id: 'leak-browsing', fromStageId: 'browsing', label: '' },
  { id: 'leak-pdp',      fromStageId: 'pdp',      label: '' },
  { id: 'leak-cart',     fromStageId: 'cart',     label: '' },
  { id: 'leak-checkout', fromStageId: 'checkout', label: '',                                   pctOverride: 17 },
];

// Geometry — taller boxes now that icon is on top, label centered below.
const STAGE_W = 130;
const STAGE_H = 80;                // was 50; grew to fit stacked icon + larger label
const LEAK_Y = 185;                // drops end at the top of the red bar
const LEAK_ARROW_START_DY = 8;     // drop column starts just below stage box
const BAR_Y = 185;                 // red bar top edge (drops meet it)
const BAR_H = 145;                 // red bar height — taller than the original 105
                                   // to leave room above the % numbers, between
                                   // them and the (now optionally two-line) cause
                                   // captions, and below the leaking-funnel title.
// Top extends to -15 so the 35% pill (lifted to the level of Search's top edge) has clearance.
const VIEWBOX = { x: 0, y: -15, w: 1400, h: BAR_Y + BAR_H + 15 };

// Stage cards now use the same lifted-card treatment as the hero v2
// cards: one tonal step ABOVE the section's canvas-deeper bg, with a
// soft drop shadow (applied via CSS on `.funnel-stages > g > rect` in
// global.css) so each tile reads as floating above the surface.
const STAGE_FILL = '#1c1d24';
const STAGE_BORDER = 'rgba(255, 255, 255, 0.05)';
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

  // Resolve locale from the root element's data-attribute. Default
  // to English if absent or unrecognised.
  const localeAttr = (root.dataset.locale as Locale | undefined);
  const locale: Locale = localeAttr === 'es' ? 'es' : 'en';
  const STAGE_LABEL = STAGE_LABELS[locale];
  const STAGE_TIP = STAGE_TOOLTIPS[locale];
  const LEAK_LABEL = LEAK_LABELS[locale];
  const UI = UI_STRINGS[locale];

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
      <stop offset="0%" stop-color="#a85050" />
      <stop offset="50%" stop-color="#a85050" />
      <stop offset="100%" stop-color="#a85050" />
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

  // Drops are dense + crawl. Combined with the teardrop shape, the column
  // reads as a slowly-drawn red dotted line rather than discrete drips —
  // motion is just subtle enough to confirm "it's still happening" without
  // pulling the eye.
  const DROP_SPEED = 6;       // px / second — very slow; ~10 s per 60 px column
  const DROP_SPACING = 8;     // px between drops — tight enough to read as a line

  function makeDroplet(cx: number, cy: number, leakId: string): SVGEllipseElement {
    const drop = document.createElementNS(svgNS, 'ellipse');
    drop.setAttribute('cx', String(cx));
    drop.setAttribute('cy', String(cy));
    drop.setAttribute('rx', '3');
    drop.setAttribute('ry', '4.5');
    drop.setAttribute('fill', '#a85050');
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
    rect.style.transition = 'opacity 180ms ease, stroke 180ms ease';
    group.appendChild(rect);

    // Stacked layout: icon top-centered, uppercase label centered below.
    // "Product page" → two lines ("PRODUCT" / "PAGE"); everything else
    // is a single line. ICON_Y / LABEL_Y are chosen per layout so the
    // pair stays vertically centered within the 80-px tall box.
    const labelLines = (STAGE_LABEL[stage.id] ?? stage.label).toUpperCase().split(' ');
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
  // NOTE: stageGroup is appended LAST (after barGroup below) so the
  // stage cards' drop-shadows render over the red bar rather than
  // being painted under it.

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
    pctLabel.setAttribute('y', String(BAR_Y + 44));
    pctLabel.setAttribute('text-anchor', 'middle');
    pctLabel.setAttribute('fill', '#ffffff');
    pctLabel.setAttribute('font-size', '21');
    pctLabel.setAttribute('font-weight', '700');
    pctLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    pctLabel.dataset.leakId = leak.id;
    pctLabel.textContent = `${pct}%`;
    barGroup.appendChild(pctLabel);

    const causeLabel = document.createElementNS(svgNS, 'text');
    causeLabel.setAttribute('x', String(cx));
    causeLabel.setAttribute('y', String(BAR_Y + 62));
    causeLabel.setAttribute('text-anchor', 'middle');
    causeLabel.setAttribute('fill', 'rgba(254, 226, 226, 0.8)');
    causeLabel.setAttribute('font-size', '12');
    causeLabel.setAttribute('font-family', '"Hanken Grotesk", system-ui, sans-serif');
    causeLabel.dataset.leakId = leak.id;

    // Use <tspan> children so the cause line and an optional second
    // descriptor render as two centered lines without misaligning.
    const labelLine = document.createElementNS(svgNS, 'tspan');
    labelLine.setAttribute('x', String(cx));
    const leakStrings = LEAK_LABEL[leak.id] ?? { label: leak.label, sublabel: leak.sublabel };
    labelLine.textContent = leakStrings.label;
    causeLabel.appendChild(labelLine);

    if (leakStrings.sublabel) {
      const sublabelLine = document.createElementNS(svgNS, 'tspan');
      sublabelLine.setAttribute('x', String(cx));
      sublabelLine.setAttribute('dy', '14');
      sublabelLine.textContent = leakStrings.sublabel;
      causeLabel.appendChild(sublabelLine);
    }

    barGroup.appendChild(causeLabel);
  });

  // Title at the bottom of the bar
  const barTitle = document.createElementNS(svgNS, 'text');
  barTitle.setAttribute('x', String(VIEWBOX.w / 2));
  barTitle.setAttribute('y', String(BAR_Y + 118));
  barTitle.setAttribute('text-anchor', 'middle');
  barTitle.setAttribute('fill', '#ffffff');
  barTitle.setAttribute('font-size', '28');
  barTitle.setAttribute('font-weight', '400');
  barTitle.setAttribute('font-family', '"Permanent Marker", cursive');
  barTitle.setAttribute('letter-spacing', '0.01em');
  barTitle.textContent = UI.barTitle;
  barGroup.appendChild(barTitle);

  svg.appendChild(barGroup);
  // Stages painted LAST so their drop-shadows cast over the bar.
  svg.appendChild(stageGroup);

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
    // Permanent flag: once the visitor has discovered that hovering
    // does something, the "Hover any stage…" hint stops pulsing for
    // the rest of the session — even after they move off the stage
    // and the hint becomes visible again.
    panel.classList.add('is-engaged');
    if (infoIcon) infoIcon.textContent = stage.icon;
    if (infoTitle) infoTitle.textContent = STAGE_LABEL[stage.id] ?? stage.label;
    if (infoBody) {
      infoBody.textContent = STAGE_TIP[stage.id] ?? UI.noDetail;
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
      // Use opacity (not filter) to dim non-target cards so the CSS
      // drop-shadow stays intact for everyone.
      rectEl.style.removeProperty('filter');
      rectEl.style.opacity = isTarget ? '1' : '0.6';
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
      // Don't set filter: 'none' — that would override the CSS
      // drop-shadow rule. Clearing the inline value lets the rule
      // reapply.
      rectEl.style.removeProperty('filter');
      rectEl.style.opacity = '1';
    });
    document.querySelectorAll<HTMLElement>('.stage-row').forEach((row) => {
      row.classList.remove('is-active');
    });
    resetInfo();
  }
}
