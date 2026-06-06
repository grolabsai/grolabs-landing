export const prerender = false;

import type { APIRoute } from 'astro';

const APP_URL = import.meta.env.APP_URL || 'https://app.grolabs.ai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const url = (body.url as string)?.trim();
    if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400 });

    const res = await fetch(`${APP_URL}/api/v1/diagnostic/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, version: 'v5' }),
      signal: AbortSignal.timeout(25000),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'upstream error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
