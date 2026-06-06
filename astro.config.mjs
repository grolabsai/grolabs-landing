import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// `GITHUB_PAGES=true` is set by the deploy workflow so the site builds with
// the `/grolabs-landing` subpath. Local dev and a future Vercel deploy both
// run with `base = '/'` so links stay clean.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGitHubPages ? 'https://grolabsai.github.io' : 'https://grolabs.ai',
  base: isGitHubPages ? '/grolabs-landing' : undefined,
  // English serves at the root (`/`), Spanish at `/es/`. The visitor
  // toggles between them via the LocaleSwitcher component in the
  // header — no auto-redirect on first visit, per the agreed UX.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Video source of truth = Cloudflare. The explainer's UID changes on every
  // upload, so instead of pinning it in env we look it up at build time by a
  // stable NAME (CF_STREAM_VIDEO_NAME, default "explainer") via the Stream
  // API. Set the two secrets once (Vercel + local .env); thereafter swapping
  // the video means uploading + naming it in Cloudflare and redeploying — no
  // env or code edits. PUBLIC_CF_STREAM_URL stays as an optional fallback so
  // builds never break if the API is unconfigured/unreachable.
  env: {
    schema: {
      CF_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      CF_STREAM_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      CF_STREAM_VIDEO_NAME: envField.string({ context: 'server', access: 'secret', optional: true, default: 'explainer' }),
      PUBLIC_CF_STREAM_URL: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
