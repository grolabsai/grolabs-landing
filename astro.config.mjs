import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// `GITHUB_PAGES=true` is set by the deploy workflow so the site builds with
// the `/grolabs-landing` subpath. Local dev and a future Vercel deploy both
// run with `base = '/'` so links stay clean.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGitHubPages ? 'https://grolabsai.github.io' : 'https://grolabs.io',
  base: isGitHubPages ? '/grolabs-landing' : undefined,
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
