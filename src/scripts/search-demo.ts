/**
 * Client-side search demo for the landing page.
 *
 * Talks directly to Meilisearch Cloud (the `demo` index) using a
 * search-only API key that is restricted to that one index. The key is
 * embedded here intentionally — Meilisearch search-only keys are
 * designed to be shipped to the browser, and this one cannot read any
 * other index, mutate data, or mint other keys.
 *
 * Two searches run on every query:
 *
 *   1. Keyword search — what the user typed (the dietary trio).
 *      Returns products whose dietary_tags / name actually match.
 *
 *   2. Category sweep — empty query + filter category="Snack Bars".
 *      Returns ALL products in the same category, including the ones
 *      keyword search missed because the merchant never filled in
 *      attributes. The diff between (2) and (1) is the "hidden by
 *      data quality" cohort — the GroLabs sales pitch in one row.
 */

const MS_HOST = 'https://ms-5a6fa3e472b4-47486.nyc.meilisearch.io';
const MS_SEARCH_KEY =
  '3d095bf1146002d0978c5f5fe36cc83d9d97da384b3694c91e55e49eb968bfca';
const INDEX = 'demo';
const CATEGORY = 'Snack Bars';

const TRACKED_TAGS = ['gluten-free', 'sugar-free', 'dairy-free'] as const;
type TrackedTag = (typeof TRACKED_TAGS)[number];

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

type SearchResponse = { hits: Product[] };

async function meiliSearch(body: Record<string, unknown>): Promise<Product[]> {
  const res = await fetch(`${MS_HOST}/indexes/${INDEX}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MS_SEARCH_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Meilisearch ${res.status}`);
  const json = (await res.json()) as SearchResponse;
  return json.hits;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

function pillsHtml(product: Product, query: string): string {
  // Which of the tracked tags are present on the product?
  const productTags = new Set(product.dietary_tags);
  // Which of the tracked tags did the user actually type?
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

function matchScore(product: Product, query: string): { hit: number; queried: number } {
  const productTags = new Set(product.dietary_tags);
  const lowerQuery = query.toLowerCase();
  let queried = 0;
  let hit = 0;
  for (const tag of TRACKED_TAGS) {
    if (lowerQuery.includes(tag)) {
      queried++;
      if (productTags.has(tag)) hit++;
    }
  }
  return { hit, queried };
}

function cardHtml(product: Product, query: string, hidden: boolean): string {
  const { hit, queried } = matchScore(product, query);
  const score = queried > 0 ? `${hit}/${queried}` : '0/0';
  const hiddenClass = hidden ? ' search-demo-card--hidden' : '';
  const hiddenBadge = hidden
    ? `<div class="search-demo-card-hidden-badge">Hidden — attributes missing in catalog</div>`
    : '';
  return `
    <article class="search-demo-card${hiddenClass}">
      <img src="${product.image_url}" alt="${product.name}" class="search-demo-card-image" loading="lazy" />
      <div class="search-demo-card-body">
        <div class="search-demo-card-meta">
          <span class="search-demo-card-brand">${product.brand}</span>
          <span class="search-demo-card-score">${score}</span>
        </div>
        <h3 class="search-demo-card-title">${product.name}</h3>
        <p class="search-demo-card-price">${formatPrice(product.price)}</p>
        <div class="search-demo-pills">${pillsHtml(product, query)}</div>
        ${hiddenBadge}
      </div>
    </article>
  `;
}

function emptyStateHtml(message: string): string {
  return `<div class="search-demo-empty">${message}</div>`;
}

async function runSearch(input: HTMLInputElement, resultsEl: HTMLElement): Promise<void> {
  const query = input.value.trim();
  if (!query) {
    resultsEl.innerHTML = emptyStateHtml('Type something to search.');
    return;
  }
  resultsEl.setAttribute('aria-busy', 'true');
  try {
    const [keywordHits, categoryHits] = await Promise.all([
      meiliSearch({ q: query, limit: 20 }),
      meiliSearch({ q: '', filter: `category = "${CATEGORY}"`, limit: 20 }),
    ]);
    const keywordIds = new Set(keywordHits.map((p) => p.id));
    const hiddenHits = categoryHits.filter((p) => !keywordIds.has(p.id));

    const visibleSorted = [...keywordHits].sort((a, b) => {
      const sa = matchScore(a, query).hit;
      const sb = matchScore(b, query).hit;
      return sb - sa;
    });

    const parts: string[] = [];
    if (visibleSorted.length === 0) {
      parts.push(emptyStateHtml('No products matched your search.'));
    } else {
      parts.push(
        '<div class="search-demo-grid">',
        ...visibleSorted.map((p) => cardHtml(p, query, false)),
        '</div>',
      );
    }
    if (hiddenHits.length > 0) {
      parts.push(
        '<div class="search-demo-hidden-header">',
        '<span class="search-demo-hidden-eyebrow">Also in your catalog</span>',
        '<p>These products belong in the same category but have no dietary attributes filled in. Meilisearch can\'t surface them by keyword — the data simply isn\'t there.</p>',
        '</div>',
        '<div class="search-demo-grid">',
        ...hiddenHits.map((p) => cardHtml(p, query, true)),
        '</div>',
      );
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

  // Initial render — kick off with the pre-filled value so the demo
  // shows results immediately instead of an empty state.
  trigger();
}
