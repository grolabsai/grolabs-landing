# GroLabs landing page

Standalone marketing landing page for GroLabs, deployed separately from the main Scout admin application.

**Design system:** Engineered Luxury — deep zinc canvas (`#131316`), kinetic yellow accent (`#fae194`), Hanken Grotesk primary type, extreme vertical whitespace (160–200 px between major sections), ambient radial glows behind hero / feature / CTA blocks.

## Stack

- **Vite 8** — static build, deployable to Vercel / Netlify / Cloudflare Pages
- **TypeScript** — strict
- **Tailwind CSS v3.4** — custom theme tokens in [tailwind.config.js](./tailwind.config.js)
- **No framework** — vanilla TS modules. The interactive funnel and bar chart are hand-rolled SVG.

## Layout

| Section | File / anchor | Notes |
|---|---|---|
| Nav | `index.html` top | Brand mark + 4 anchor links + Book demo CTA |
| Hero | `#top` | text-7xl headline, italicized "revenue" in kinetic yellow |
| Comprehensive capabilities | `#capabilities` | 3-col feature grid, 6 blocks, internal card-glow |
| Easy to integrate | `#integrations` | 2-col layout, list + 6-cell integration grid |
| Funnel benchmark | `#benchmark` | Interactive funnel ([src/funnel.ts](./src/funnel.ts)) + Old/New/Improvement table |
| Compound growth | `#growth` | 5-bar chart ([src/growth-chart.ts](./src/growth-chart.ts)), final bar in kinetic yellow |
| CTA / Footer | `#contact` | Final conversion block + thin footer |

## Custom Tailwind tokens

| Token | Value |
|---|---|
| `bg-zinc-black` | `#131316` (page canvas) |
| `bg-zinc-card` | `#1b1b1e` (feature blocks, panels) |
| `bg-zinc-card-soft` | `#212126` |
| `text-kinetic-yellow` | `#fae194` (accents + active state) |
| `font-sans` | Hanken Grotesk → system-ui |
| `font-marker` | Caveat → Permanent Marker (brand mark only) |
| `py-stack-3x` | 160 px section padding |
| `py-stack-4x` | 200 px (used on Funnel + Growth) |
| `max-w-page` | 1280 px (matches 1920-optimized design) |

## Interactive funnel

[src/funnel.ts](./src/funnel.ts) renders the funnel diagram you see in the screenshot reference: Traffic → Home → (Search / Browsing) → Product detail page → Cart → Checkout, plus a 12% direct-to-PDP shortcut and red dashed leak arrows at every stage (bounce, home exit, no results, exit, abandoned cart, returns).

- Hover any stage to dim the rest of the diagram and highlight the transitions and leaks tied to that stage.
- All geometry comes from one `STAGES` / `TRANSITIONS` / `LEAKS` array — adjust those to retune the diagram without touching DOM code.
- Transition pills sit on a `#1b1b1e` background with a hairline border (kinetic yellow on the shortcut arrow).

## Compound growth chart

[src/growth-chart.ts](./src/growth-chart.ts) renders 5 vertical bars at 1.00× → 1.10× → 1.21× → 1.46× → 1.85×. Only the final bar is filled with kinetic yellow; the rest are neutral zinc so the eye lands on the compounded result.

## Scripts

```bash
npm install        # one-time
npm run dev        # local dev server with HMR
npm run build      # tsc + vite build → dist/
npm run preview    # serve the production build locally
```

## Deploy

The `dist/` directory is a fully static bundle. Any static host works:

- **Vercel:** `npx vercel --prod` from the repo root
- **Netlify:** point at the repo, build command `npm run build`, publish directory `dist`
- **Cloudflare Pages:** same config as Netlify

## Why this is separate from Scout

The main Scout admin (`~/code/scout`) is the authenticated, RLS-protected SaaS application. This landing page is unauthenticated marketing — different audience, different deploy cadence, different framework constraints. Keeping it in its own repo means we can iterate on the marketing site without rebuilding or risking the admin product.

## License

Proprietary — © GroLabs.
