# GroLabs landing page

Standalone marketing landing page for GroLabs, deployed separately from the main Scout admin application.

**Design system:** Engineered Luxury — deep zinc canvas (`#131316`), kinetic yellow accent (`#fae194`), Hanken Grotesk primary type, extreme vertical whitespace (160–200 px between major sections), ambient radial glows behind hero / feature / CTA blocks.

> ⚠️ **Before changing any color, font, spacing, or component on this page, read [`docs/STYLEGUIDE.md`](./docs/STYLEGUIDE.md) first.** It is the single source of truth for every visual token. Visual mirror (open in any browser, no build needed): [`docs/style-guide.html`](./docs/style-guide.html). If a token you need isn't there, add it to the guide first, then implement it in code.

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
│   └── BaseLayout.astro       ← shared head, fonts, ambient grid, header, footer, script tag
├── components/
│   ├── LeakCard.astro         ← the 5 metrics cards (variants: default | featured | emerging)
│   ├── EquationCard.astro     ← Luminous Equation cards (variants: default | returns)
│   ├── CapabilityCard.astro   ← AI-assisted module cards (slot for structured body)
│   ├── StatBlock.astro        ← big-number social-proof blocks above the footer
│   ├── FunnelStageRow.astro   ← one row of the diagnostic table under the funnel SVG
│   ├── SearchDemo.astro       ← live Meilisearch demo panel (locale-aware)
│   ├── SearchCopyHelper.astro ← yellow pulsing copy pill above the search demo
│   └── VideoEmbed.astro       ← Cloudflare Stream explainer video (see "Video" below)
├── pages/
│   ├── index.astro            ← marketing landing — composes the components above
│   └── blog/
│       ├── index.astro        ← chronological post list
│       └── [...slug].astro    ← post detail (renders Markdown with prose-blog styles)
├── content/
│   ├── blog/                  ← drop a .md file here to publish a post
│   └── ...
├── content.config.ts          ← blog collection schema
├── scripts/
│   ├── main.ts                ← entry: particles, reveal-on-scroll, mouse glow, scroll progress
│   └── funnel.ts              ← interactive funnel SVG renderer
└── styles/
    └── global.css             ← Tailwind base + custom classes (glass-card, equation-card, etc.)
```

### When to extract a new component

Three or more visually-similar instances on the page is the trigger. If you find yourself copy-pasting a card or row with only the text changing, lift it into `src/components/` with typed `Props`. The 9 AI-assisted modules used to be 9 copies of the same markup; now they're 9 `<CapabilityCard ... />` calls.

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

## Design system — use tokens, not inline values

**Rule:** never write `text-[20px]`, `bg-[#131316]`, or `style="font-size: 16px"`. If the value isn't already a token, add it to [tailwind.config.js](./tailwind.config.js) or to a custom class in [src/styles/global.css](./src/styles/global.css), then reference the name. Inline arbitrary values fork the design system; named tokens centralise it.

The only legitimate exception is **em-relative scaling** (`text-[0.92em]`, `text-[0.75em]`) — those depend on the parent context, not the global scale.

### Colours

| Token | Value | When to use |
|---|---|---|
| `bg-canvas` | `#131316` | Page background, header glass tint |
| `bg-canvas-deeper` | `#131313` | Sectional dark stripe (Luminous Equation) |
| `text-primary` / `bg-primary` | `#fae194` | Kinetic-yellow accent — headlines, icons, badges |
| `text-error-red` / `bg-error-red` / `border-error-red` | `#ef4444` | Leak / loss / Returns red |
| `text-success-emerald` | `#10b981` | Recovery / positive deltas |

### Typography

| Token | Size / line / tracking | When to use |
|---|---|---|
| `text-hero` | 64 / 72 / -0.02em | Hero headline (desktop) |
| `text-page-title` | 48 / 56 / -0.02em | Section H2 (desktop) |
| `text-page-title-mobile` | 32 / 40 / -0.01em | Section H2 (mobile) |
| `text-card-title-lg` | 32 / 40 | Featured card title |
| `text-card-title` | 24 / 32 | Secondary card titles |
| `text-body-lg` | 18 / 28 | Lede paragraphs under section headings |
| `text-body-md` | 16 / 24 | Body copy default |
| `text-body-sm` | 14 / 20 | Compact body, table cells |
| `text-button-text` | 14 / 20, weight 600 | All button labels |
| `text-section-header` | 12 / 16, +0.15em tracking | Eyebrow above section H2 |
| `text-meta-md` | 12 / 16 | Inline meta labels |
| `text-meta-sm` | 11 / 14, +0.05em | Diagnostic table column headers |
| `text-meta-xs` | 10 / 14, +0.05em | Corner badges (CONFIDENCE: HIGH) |
| `text-label-caps` | 11 / 12, +0.05em, weight 600 | All-caps section/footer labels |

### Layout

| Token | Value | When to use |
|---|---|---|
| `max-w-page` | 1440 px | Page-wide containers |
| `min-h-hero` | 85vh | Hero section |
| `min-h-section` | 800 px | Tall feature sections (Luminous Equation) |
| `min-h-card-featured` | 320 px | Featured leak card so it dominates the row |
| spacing scale `xs` `sm` `md` `lg` `xl` | 4 / 8 / 16 / 24 / 40 px | Use over arbitrary `p-3`, `gap-5` etc. |
| `p-margin-mobile` / `p-margin-desktop` | 16 / 48 px | Page gutter |

### Custom CSS classes (in `global.css`)

| Class | What it does |
|---|---|
| `.glass-card` | Glass surface with hover lift + radial mouse glow |
| `.ambient-grid` | Fixed background grid masked to the cursor |
| `.shimmer-btn` | Buttons with the left-to-right shimmer hover |
| `.equation-card` / `.equation-card--returns` | Luminous Equation cards (base + red variant) |
| `.equation-operator` | The ×, −, = between equation cards |
| `.funnel-icon` | Material Symbols inside the funnel SVG (opsz 20) |
| `.funnel-icon-table` | Material Symbols in the funnel diagnostic table (22 px, opsz 24) |
| `.icon-inline-sm` / `.icon-inline-xs` | Inline Material Symbols at 16 px / 14 px |
| `.stage-row` / `.funnel-info` | Funnel hover-state row + info panel binding |
| `.hidden-element` / `.revealed` | Luminous Equation Returns reveal animation |
| `.reveal` | IntersectionObserver staggered fade/lift on scroll |
| `.code-block` | Yellow-bordered dark code panel |
| `.particle` / `#particles-container` | Hero particle layer |

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

## Video (Cloudflare Stream)

The explainer video below the hero is a cross-origin Cloudflare Stream iframe rendered by [`src/components/VideoEmbed.astro`](./src/components/VideoEmbed.astro). The whole section is gated on `PUBLIC_CF_STREAM_URL`, so an unconfigured environment renders nothing.

**Environment variables** (set in Vercel; see [`.env.example`](./.env.example)):

| Var | Purpose |
|---|---|
| `PUBLIC_CF_STREAM_URL` | The Stream **iframe embed URL** (`…/<id>/iframe`), copied from the video's Embed tab. Swapping the video is a one-variable change. |
| `PUBLIC_CF_STREAM_POSTER_TIME` | Frame to grab as the poster, e.g. `1.5s`. **Overridden by the `posterTime` prop** (below) when set. |

**Key behaviors:**

- **Poster** is auto-derived from `PUBLIC_CF_STREAM_URL` → `…/thumbnails/thumbnail.jpg?time=<t>`. Cloudflare generates the JPEG on-demand and edge-caches it (~10 days). Both homepages pass `posterTime="1.5s"`, which **takes precedence** over the env var — pinning the frame in code so a stale Vercel value can't override it.
- **Play button:** the player's native controls are loaded with `controls=false` (so its center play button doesn't overlap ours), and we layer our own `.video-play-pill`. The Stream SDK starts playback on click and flips `player.controls = true` on play, restoring scrubber / pause / fullscreen while watching.
- **Hero "Watch Video" CTA** (`[data-watch-video]`, EN page) scrolls to the player and starts it via the same SDK.
- **Analytics:** the SDK forwards `video_start` / `video_progress` / `video_complete` / `video_drop_off` to GA4, so all video stats live in Analytics.

> The local `.env` points at a different, origin-restricted test video, so the player **cannot render on localhost** — verify video changes on the live deploy.

## Deployment

Connected to **Vercel** with auto-deploy from `main` (same pattern as the Scout admin). Each push to `main` triggers a Vercel build; preview deploys for every PR.

If the connection is ever lost:

1. `vercel.com/new` → Import Git Repository → `grolabsai/grolabs-landing`
2. Vercel auto-detects Astro (framework preset: Astro, build command `astro build`, output `dist/`) — accept defaults.
3. Deploy. Subsequent pushes to `main` redeploy automatically.

The production `site` URL is set in [astro.config.mjs](./astro.config.mjs) as `https://grolabs.ai` (served at `www.grolabs.ai`) — update if the canonical domain changes.

## Why this is separate from Scout

The main Scout admin (`~/code/scout`) is the authenticated, RLS-protected SaaS application. This landing page is unauthenticated marketing — different audience, different deploy cadence, different framework constraints. Keeping it in its own repo means we can iterate on the marketing site without rebuilding or risking the admin product.

## License

Proprietary — © GroLabs.
