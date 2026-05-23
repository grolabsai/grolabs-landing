/**
 * Client-side search demo for the landing page.
 *
 * Talks directly to Meilisearch Cloud (the `demo` index) using a
 * search-only API key restricted to that one index. The key is embedded
 * here intentionally — search-only keys are designed to ship to the
 * browser and cannot read other indexes, mutate data, or mint other
 * keys.
 *
 * Two searches run on every query:
 *
 *   1. Keyword search — what the user typed. Returns products whose
 *      dietary_tags / name actually match.
 *
 *   2. Category sweep — empty query + filter category="Snack Bars".
 *      Returns ALL products in the category, including ones keyword
 *      search missed because attributes were never filled in. The diff
 *      between (2) and (1) is the "hidden by data quality" cohort — the
 *      GroLabs sales pitch made concrete.
 */

const MS_HOST = 'https://ms-5a6fa3e472b4-47486.nyc.meilisearch.io';
const MS_SEARCH_KEY =
  '3d095bf1146002d0978c5f5fe36cc83d9d97da384b3694c91e55e49eb968bfca';
const INDEX = 'demo';
const CATEGORY = 'Snack Bars';

const TRACKED_TAGS = ['gluten-free', 'sugar-free', 'dairy-free'] as const;

type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  image_url: string;
  price: number;
  dietary_tags: string[];
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

function pillsHtml(product: Product, query: string): string {
  const productTags = new Set(product.dietary_tags);
  const lowerQuery = query.toLowerCase();
  return TRACKED_TAGS.map((tag) => {
    const queried = lowerQuery.includes(tag);
    const matched = queried && productTags.has(tag);
    const cls = matched
      ? 'search-demo-pill search-demo-pill--match'
      : 'search-demo-pill search-demo-pill--miss';
    return `<span class="${cls}">${tag}</span>`;
  }).join('');
}

function rowHtml(product: Product, query: string, hidden: boolean): string {
  const hiddenClass = hidden ? ' search-demo-row--hidden' : '';
  const hiddenTag = hidden
    ? '<span class="search-demo-hidden-tag">Hidden · attributes missing</span>'
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

function statusHtml(visibleCount: number, hiddenCount: number, ms: number): string {
  const total = visibleCount + hiddenCount;
  const hiddenNote =
    hiddenCount > 0
      ? ` · <span class="search-demo-status-hidden">${hiddenCount} hidden by missing attributes</span>`
      : '';
  return `
    <div class="search-demo-status">
      ${total} result${total === 1 ? '' : 's'} in ${ms}ms${hiddenNote}
    </div>
  `;
}

async function runSearch(input: HTMLInputElement, resultsEl: HTMLElement): Promise<void> {
  const query = input.value.trim();
  if (!query) {
    // No staged results before the visitor has actually searched —
    // clearing innerHTML lets the :empty CSS rule collapse the results
    // area to zero height so the panel reads as "ready, not running".
    resultsEl.innerHTML = '';
    return;
  }
  resultsEl.setAttribute('aria-busy', 'true');
  const started = performance.now();
  try {

    const [keywordRes, categoryRes] = await Promise.all([
      meiliSearch({ q: query, limit: 20 }),
      meiliSearch({ q: '', filter: `category = "${CATEGORY}"`, limit: 20 }),
    ]);
    const keywordIds = new Set(keywordRes.hits.map((p) => p.id));
    const hiddenHits = categoryRes.hits.filter((p) => !keywordIds.has(p.id));
    const elapsed = Math.max(
      keywordRes.processingTimeMs ?? 0,
      categoryRes.processingTimeMs ?? 0,
      Math.round(performance.now() - started),
    );

    const parts: string[] = [];
    if (keywordRes.hits.length === 0 && hiddenHits.length === 0) {
      parts.push(emptyStateHtml('No products matched your search.'));
    } else {
      for (const p of keywordRes.hits) parts.push(rowHtml(p, query, false));
      for (const p of hiddenHits) parts.push(rowHtml(p, query, true));
      parts.push(statusHtml(keywordRes.hits.length, hiddenHits.length, elapsed));
    }
    resultsEl.innerHTML = parts.join('');
  } catch (err) {
    resultsEl.innerHTML = emptyStateHtml(
      'Search is temporarily unavailable. Please try again in a moment.',
    );
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

  const trigger = () => void runSearch(input, results);
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
