import { defineConfig } from 'astro/config';
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
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
