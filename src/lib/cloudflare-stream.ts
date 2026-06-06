import {
  CF_ACCOUNT_ID,
  CF_STREAM_API_TOKEN,
  CF_STREAM_VIDEO_NAME,
} from 'astro:env/server';
import { PUBLIC_CF_STREAM_URL } from 'astro:env/client';

/**
 * Resolve the explainer video's iframe URL at BUILD TIME.
 *
 * Single source of truth = Cloudflare. The Stream API is queried for the
 * video whose name matches CF_STREAM_VIDEO_NAME (default "explainer"); its
 * current UID is read straight off the response, so re-uploading the video
 * (which mints a brand-new UID) needs no env or code change — just keep the
 * same name in the Cloudflare dashboard and redeploy.
 *
 * Setup (once): CF_ACCOUNT_ID + CF_STREAM_API_TOKEN (a token with
 * Stream:Read) in Vercel and local `.env`. Name the video in Cloudflare.
 *
 * Safety: if the API isn't configured or the lookup fails for any reason,
 * we fall back to PUBLIC_CF_STREAM_URL (the old behaviour) so a build never
 * breaks and local dev works without a token.
 */

let cached: Promise<string | undefined> | undefined;

interface StreamVideo {
  uid?: string;
  readyToStream?: boolean;
  preview?: string;
  thumbnail?: string;
  meta?: { name?: string };
}

// Turn any customer-subdomain URL Cloudflare hands back (preview/watch or a
// thumbnail) into the canonical `…/<uid>/iframe` embed URL.
function toIframeUrl(ref: string): string | undefined {
  const root = ref.replace(/\/(watch|iframe|thumbnails)(\/[^?]*)?(\?.*)?$/, '');
  return root && root !== ref ? `${root}/iframe` : undefined;
}

async function lookup(): Promise<string | undefined> {
  const fallback = PUBLIC_CF_STREAM_URL || undefined;
  if (!CF_ACCOUNT_ID || !CF_STREAM_API_TOKEN) return fallback;

  const name = CF_STREAM_VIDEO_NAME || 'explainer';
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?search=${encodeURIComponent(name)}`,
      { headers: { Authorization: `Bearer ${CF_STREAM_API_TOKEN}` } },
    );
    if (!res.ok) return fallback;

    const json = (await res.json()) as { result?: StreamVideo[] };
    const ready = (json.result ?? []).filter((v) => v?.readyToStream);
    const lower = name.toLowerCase();
    const pick =
      ready.find((v) => v.meta?.name === name) ??
      ready.find((v) => v.meta?.name?.toLowerCase().includes(lower)) ??
      ready[0];

    const ref = pick?.preview || pick?.thumbnail;
    return (ref && toIframeUrl(ref)) || fallback;
  } catch {
    return fallback;
  }
}

/** Build-time-cached resolver. Returns undefined when no video is available. */
export function getStreamIframeUrl(): Promise<string | undefined> {
  return (cached ??= lookup());
}
