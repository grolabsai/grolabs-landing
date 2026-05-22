# GroLabs landing page

Standalone marketing landing page for GroLabs, deployed separately from the main Scout admin application.

**Design system:** Engineered Luxury — deep zinc canvas (`#131316`), kinetic yellow accent (`#fae194`), Hanken Grotesk primary type, extreme vertical whitespace (160–200 px between major sections), ambient radial glows behind hero / feature / CTA blocks.

## Stack

- **Astro 6** — static-site generator, file-based routing, content collections for the blog
- **TypeScript** — strict (`astro/tsconfigs/strict`)
- **Tailwind CSS v3.4** via `@astrojs/tailwind` — custom theme tokens in [tailwind.config.js](./tailwind.config.js)
- **No client framework** — vanilla TS modules at [src/scripts/](./src/scripts). The interactive funnel and the Luminous Equation animation are hand-rolled SVG + IntersectionObserver.
- **Sitemap** generated automatically via `@astrojs/sitemap` (`dist/sitemap-index.xml`).

## Layout

```
src/
├── layouts/
│   └── BaseLayout.astro    ← shared head, fonts, ambient grid, header, footer, script tag
├── pages/
│   ├── index.astro         ← marketing landing (hero + leaks + Luminous Eq + funnel + modules + code + stats)
│   └── blog/
│       ├── index.astro     ← chronological post list
│       └── [...slug].astro ← post detail (renders Markdown with prose-blog styles)
├── content/
│   ├── blog/               ← drop a .md file here to publish a post
│   └── ...
├── content.config.ts       ← blog collection schema (title, description, pubDate, author, tags[], draft)
├── scripts/
│   ├── main.ts             ← entry: particles, reveal-on-scroll, mouse glow, scroll progress, equation reveal
│   └── funnel.ts           ← interactive funnel SVG renderer
└── styles/
    └── global.css          ← Tailwind base + custom classes (glass-card, ambient-grid, funnel-info, etc.)
```

## Publishing a blog post

1. Create `src/content/blog/<slug>.md` with frontmatter:
   ```yaml
   ---
   title: Your post title
   description: One-line summary (used in <meta description> and the index card)
   pubDate: 2026-05-22
   author: GroLabs        # optional, defaults to "GroLabs"
   tags: [search, aeo]    # optional
   draft: false           # optional; set true to hide from production
   ---
   ```
2. Write the post in Markdown below the frontmatter.
3. Commit + push. Vercel rebuilds and the post appears at `/blog/<slug>`.

No code changes needed per post.

## Custom Tailwind tokens

Token highlights (full list in [tailwind.config.js](./tailwind.config.js)):

| Token | Value |
|---|---|
| `text-primary` / `bg-primary` | `#fae194` (kinetic yellow accent) |
| `text-success-emerald` | `#10b981` |
| `font-page-title` | Hanken Grotesk 48/56 |
| `font-section-header` | Hanken Grotesk 12/16, +0.15em tracking |
| `p-margin-mobile` / `p-margin-desktop` | 16 px / 48 px page gutters |
| spacing scale: `xs` `sm` `md` `lg` `xl` | 4 / 8 / 16 / 24 / 40 px |

## Interactive funnel

[src/scripts/funnel.ts](./src/scripts/funnel.ts) renders the funnel diagram: Home → Search → Browsing → Product page → Cart → Checkout, with red leak columns at every stage and a dotted shortcut from Search/Browsing into Cart. Hover any stage row in the table below to highlight the matching SVG stage; the info panel on the right swaps to the drop-off drivers for that stage.

All geometry comes from `STAGES` / `TRANSITIONS` / `LEAKS` arrays — adjust those to retune without touching DOM code.

## Scripts

```bash
npm install        # one-time
npm run dev        # astro dev server → http://localhost:4321
npm run build      # astro check + astro build → dist/
npm run preview    # serve the production build locally
```

## Deployment

Connected to **Vercel** with auto-deploy from `main` (same pattern as the Scout admin). Each push to `main` triggers a Vercel build; preview deploys for every PR.

If the connection is ever lost:

1. `vercel.com/new` → Import Git Repository → `grolabsai/grolabs-landing`
2. Vercel auto-detects Astro (framework preset: Astro, build command `astro build`, output `dist/`) — accept defaults.
3. Deploy. Subsequent pushes to `main` redeploy automatically.

The production `site` URL is set in [astro.config.mjs](./astro.config.mjs) as `https://grolabs.io` — update if the canonical domain changes.

## Why this is separate from Scout

The main Scout admin (`~/code/scout`) is the authenticated, RLS-protected SaaS application. This landing page is unauthenticated marketing — different audience, different deploy cadence, different framework constraints. Keeping it in its own repo means we can iterate on the marketing site without rebuilding or risking the admin product.

## License

Proprietary — © GroLabs.
