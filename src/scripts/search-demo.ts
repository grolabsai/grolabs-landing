/**
 * Client-side search demo for the landing page.
 *
 * Talks directly to Meilisearch Cloud (the `demo` index) using a
 * search-only API key restricted to that one index. The key is embedded
 * here intentionally — search-only keys are designed to ship to the
 * browser and cannot read other indexes, mutate data, or mint other
 * keys.
 *
 * One legitimate keyword search per query — the results are exactly
 * what Meilisearch returns, no staging. (The former "hidden by missing
 * attributes" category-sweep cohort was removed pending a better way
 * to present it.)
 */

const MS_HOST = 'https://ms-f663ae03da2b-47486.sfo.meilisearch.io';
const MS_SEARCH_KEY =
  '32b3319599c8618fc31d8167d9e368d0d1127fc800f02fd72fa2d35c092f26a3';
const INDEX = 'demo';

const TRACKED_TAGS = ['button-down', 'slim fit'] as const;

type Locale = 'en' | 'es';
const STRINGS = {
  en: {
    hiddenTag: 'Hidden · attributes missing',
    resultsSingular: 'result',
    resultsPlural: 'results',
    in: 'in',
    hiddenByAttrs: 'hidden by missing attributes',
    noMatch: 'No products matched your search.',
    unavailable: 'Search is temporarily unavailable. Please try again in a moment.',
  },
  es: {
    hiddenTag: 'Oculto · faltan atributos',
    resultsSingular: 'resultado',
    resultsPlural: 'resultados',
    in: 'en',
    hiddenByAttrs: 'ocultos por atributos faltantes',
    noMatch: 'Ningún producto coincide con tu búsqueda.',
    unavailable: 'La búsqueda no está disponible temporalmente. Inténtalo de nuevo en un momento.',
  },
} satisfies Record<Locale, Record<string, string>>;

type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  price: number;
  attribute_tags: string[];
};

type SearchResponse = {
  hits: Product[];
  processingTimeMs?: number;
};

async function meiliSearch(body: Record<string, unknown>): Promise<SearchResponse> {
  const res = await fetch(`${MS_HOST}/indexes/${INDEX}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MS_SEARCH_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Meilisearch ${res.status}`);
  return (await res.json()) as SearchResponse;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

// Matched (product, tag) pairs from the PREVIOUS render — a pill only
// gets the grow/shrink pop the moment it transitions gray → green, not
// on every re-render while it stays green.
let prevMatched = new Set<string>();
let nextMatched = new Set<string>();

function pillsHtml(product: Product, query: string): string {
  const productTags = new Set(product.attribute_tags);
  const lowerQuery = query.toLowerCase();
  return TRACKED_TAGS.map((tag) => {
    const queried = lowerQuery.includes(tag);
    const matched = queried && productTags.has(tag);
    const key = `${product.id}:${tag}`;
    if (matched) nextMatched.add(key);
    const pop = matched && !prevMatched.has(key) ? ' search-demo-pill--pop' : '';
    const cls = matched
      ? `search-demo-pill search-demo-pill--match${pop}`
      : 'search-demo-pill search-demo-pill--miss';
    return `<span class="${cls}">${tag}</span>`;
  }).join('');
}

function rowHtml(product: Product, query: string, hidden: boolean, t: typeof STRINGS['en']): string {
  const hiddenClass = hidden ? ' search-demo-row--hidden' : '';
  const hiddenTag = hidden
    ? `<span class="search-demo-hidden-tag">${t.hiddenTag}</span>`
    : '';
  return `
    <div class="search-demo-row${hiddenClass}">
      <img src="${product.image_url}" alt="${product.name}" class="search-demo-thumb" loading="lazy" />
      <div class="search-demo-info">
        <div class="search-demo-name">${product.name}</div>
        <div class="search-demo-brand">${product.brand}${hiddenTag}</div>
      </div>
      <div class="search-demo-right">
        <div class="search-demo-pills">${pillsHtml(product, query)}</div>
        <div class="search-demo-price">${formatPrice(product.price)}</div>
      </div>
    </div>
  `;
}

function emptyStateHtml(message: string): string {
  return `<div class="search-demo-empty">${message}</div>`;
}

function statusHtml(total: number, ms: number, t: typeof STRINGS['en']): string {
  const word = total === 1 ? t.resultsSingular : t.resultsPlural;
  return `
    <div class="search-demo-status">
      ${total} ${word} ${t.in} ${ms}ms
    </div>
  `;
}

async function runSearch(input: HTMLInputElement, resultsEl: HTMLElement, t: typeof STRINGS['en']): Promise<void> {
  const query = input.value.trim();
  if (!query) {
    // No staged results before the visitor has actually searched —
    // clearing innerHTML lets the :empty CSS rule collapse the results
    // area to zero height so the panel reads as "ready, not running".
    resultsEl.innerHTML = '';
    prevMatched = new Set();
    return;
  }
  resultsEl.setAttribute('aria-busy', 'true');
  const started = performance.now();
  try {

    const keywordRes = await meiliSearch({ q: query, limit: 20 });
    const elapsed = Math.max(
      keywordRes.processingTimeMs ?? 0,
      Math.round(performance.now() - started),
    );

    const parts: string[] = [];
    if (keywordRes.hits.length === 0) {
      parts.push(emptyStateHtml(t.noMatch));
    } else {
      for (const p of keywordRes.hits) parts.push(rowHtml(p, query, false, t));
      parts.push(statusHtml(keywordRes.hits.length, elapsed, t));
    }
    resultsEl.innerHTML = parts.join('');
    prevMatched = nextMatched;
    nextMatched = new Set();
  } catch (err) {
    resultsEl.innerHTML = emptyStateHtml(t.unavailable);
    console.error('[search-demo] meili call failed', err);
  } finally {
    resultsEl.removeAttribute('aria-busy');
  }
}

function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function initSearchDemo(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const results = root.querySelector<HTMLElement>('[data-search-results]');
  if (!input || !results) return;

  // Pick locale strings from the panel's data-locale attribute. Falls
  // back to English if absent or unrecognised.
  const localeAttr = root.dataset.locale as Locale | undefined;
  const t = (localeAttr && STRINGS[localeAttr]) || STRINGS.en;

  const trigger = () => void runSearch(input, results, t);
  const debounced = debounce(trigger, 180);

  input.addEventListener('input', debounced);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      trigger();
    }
  });

  // Kick off with the pre-filled value so the demo shows results
  // immediately without the visitor having to type.
  trigger();
}
