/**
 * Shared data loader for the /resources page in both languages.
 *
 * Build-time fetch from the wwwGroLabs Supabase project (PostgREST
 * REST API). RLS on wwwGroLabs is configured so the public role can
 * SELECT categories and only-published articles, so the publishable
 * key embedded here cannot leak draft content or mutate anything.
 */

const SUPABASE_URL = 'https://vymfzuvgfmnwlpugyumh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_WqOPWG0AmqVDXaB4iGG50w_K6VsNPjH';

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  icon: string | null;
  sort_order: number;
};

export type Article = {
  id: string;
  slug: string;
  title_en: string;
  title_es: string | null;
  excerpt_en: string | null;
  excerpt_es: string | null;
  author: string | null;
  external_url: string | null;
  featured_image: string | null;
  rating: number | null;
  year: number | null;
  category_id: string | null;
  is_featured: boolean;
  sort_order: number;
};

async function fetchTable<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`wwwGroLabs ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T[];
}

export async function fetchResourceGroups(): Promise<
  { category: Category; items: Article[] }[]
> {
  const categories = await fetchTable<Category>(
    'categories?select=id,slug,name_en,name_es,icon,sort_order&order=sort_order.asc',
  );

  const articles = await fetchTable<Article>(
    'articles' +
      '?status=eq.published' +
      '&select=id,slug,title_en,title_es,excerpt_en,excerpt_es,author,external_url,featured_image,rating,year,category_id,is_featured,sort_order' +
      '&order=is_featured.desc,sort_order.asc,year.desc',
  );

  return categories
    .map((cat) => ({
      category: cat,
      items: articles.filter((a) => a.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);
}

/** Pick the localized title, falling back to English if title_es is null. */
export function localizedTitle(article: Article, locale: 'en' | 'es'): string {
  if (locale === 'es') return article.title_es ?? article.title_en;
  return article.title_en;
}

export function ctaForCategory(slug: string, locale: 'en' | 'es'): string {
  const map = {
    en: {
      books: 'Get it on Amazon',
      news: 'Read article',
      quotes: 'View source',
    } as Record<string, string>,
    es: {
      books: 'Cómprala en Amazon',
      news: 'Leer artículo',
      quotes: 'Ver fuente',
    } as Record<string, string>,
  } as const;
  return map[locale][slug] ?? (locale === 'es' ? 'Abrir' : 'Open');
}
