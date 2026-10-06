export const prerender = false;

import type { APIRoute } from 'astro';
import { CONSENT_REGIONS } from '../../lib/consent-regions';

/**
 * Tells ConsentBanner whether this visitor needs the consent prompt.
 * Country comes from Vercel's geo header; when it is missing (local dev,
 * non-Vercel hosts) we answer "required" so the banner errs toward showing.
 * In dev, `?country=XX` overrides the header for testing.
 */
export const GET: APIRoute = ({ request, url }) => {
  const override = import.meta.env.DEV ? url.searchParams.get('country') : null;
  const country = (override || request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const required = !country || CONSENT_REGIONS.includes(country);

  return new Response(JSON.stringify({ required }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
};
