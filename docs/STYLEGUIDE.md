# GroLabs Landing — Style Guide

**This file is the single source of truth for the landing page's visual
language.** When designing any new section, component, page, or asset
for `grolabs-landing`, every color / font / spacing / radius decision
should come from this list. Adding a new token means updating this
file first.

A live visual version of this guide is at `docs/style-guide.html` —
open it in any browser.

## Colors

### Backgrounds

| Token              | Hex         | Tailwind class        | Used by |
|--------------------|-------------|-----------------------|---------|
| Canvas (body bg)   | `#131316`   | `bg-canvas`           | Hero, Search demo, default body, footer card |
| Canvas-deeper      | `#0E0E11`   | `bg-canvas-deeper`    | Revenue leaks section, **footer**, alternating dark sections |
| Brand yellow       | `#fae194`   | `bg-primary`          | Grow a Company section, booking embed section, CTA primary |
| Card surface       | `#1c1d24`   | (inline, in scoped css) | Hero stat cards, equation card, search demo panel — sits ONE tone above the canvas it's on |
| Black              | `#000000`   | `bg-black`            | (avoid except where deeper-than-deepest is needed) |

### Foreground / text

| Token                  | Hex / RGBA                  | Tailwind class             | Used by |
|------------------------|------------------------------|-----------------------------|---------|
| Pure white             | `#FFFFFF`                   | `text-white`                | Headlines, primary highlight text |
| Cream / off-white      | `#EDEAE0`                   | — (use `text-secondary-fixed-dim` for the muted variant) | Wordmark default fill |
| Muted body             | `rgba(237,234,224,0.6)`     | `text-secondary-fixed-dim`  | Hero lede, card body, paragraphs |
| Subtle (citations)     | `rgba(237,234,224,0.35)`    | (inline)                    | `<cite>` source attributions under stats |
| Gray (footer text)     | `#71717a`                   | `text-zinc-500`             | Footer wordmark, footer tagline, Privacy/Terms/Security, copyright |
| Lighter gray (hover)   | `#d4d4d8`                   | `text-zinc-300`             | Footer link hover |
| Dark text on yellow    | `#1A1A1A`                   | (inline)                    | Primary button label on yellow gradient |
| Near-black             | `#18181b`                   | `text-on-primary`           | Strong text on yellow surfaces |
| Black                  | `#000000`                   | `text-black`                | Grow a Company section title + eyebrow (on yellow) |

### Accents

| Token              | Hex         | Used by |
|--------------------|-------------|---------|
| Primary yellow     | `#fae194`   | `text-primary` — eyebrows, accent words, card titles in eyebrow style |
| Funnel leak red    | gradient `#4a1c1c → #5e2424 → #4a1c1c` | Funnel "Leaking funnel" bar (subtle, blends with yellow) |
| Funnel leak drop   | `#a85050`   | Falling droplets in the funnel diagram |

### Borders

| Token              | Value                       | Used by |
|--------------------|------------------------------|---------|
| Hairline (subtle)  | `rgba(255,255,255,0.05)`    | Card borders on dark bg |
| Hairline (medium)  | `rgba(255,255,255,0.08)`    | Slightly stronger card borders |
| Yellow accent      | `rgba(250,225,148,0.3)`     | Blockquote left border |
| Dark border on yellow bg | `rgba(0,0,0,0.3)`     | Grow-section blockquote (when on yellow) |

## Typography

### Font families

| Token         | Family                       | Tailwind class    | Used by |
|---------------|------------------------------|--------------------|---------|
| `marker`      | `"Permanent Marker", cursive` | `font-marker`     | Hero headlines, section H2s, equation big text, card stats — the brand handwritten voice |
| `caveat`      | `"Caveat", cursive`           | `font-caveat`     | Pen-style secondary handwritten lines (registered, used sparingly) |
| `sans`        | `"Hanken Grotesk", sans-serif` | (default) `font-body-md` etc. | Body, nav links, buttons, paragraphs |
| `mono`        | `monospace`                   | `font-mono`       | Eyebrow labels — always paired with `tracking-[0.2em] text-xs uppercase` |
| `typewriter`  | `"Special Elite", monospace`  | `font-typewriter` | Closing copy voice (loaded, rarely used) |

All four are loaded by `BaseLayout.astro` via Google Fonts.

### Type ramps

| Role                    | Size                              | Family             | Other                         | Where |
|-------------------------|-----------------------------------|---------------------|--------------------------------|-------|
| Hero headline           | `clamp(36px, 3.9vw, 54px)`        | Permanent Marker    | `leading-none`, `letter-spacing: 0.005em` | `.hero-v2-line` |
| Hero tagline / eyebrow  | `clamp(12px, 1.4vw, 18px)`        | monospace caps      | `letter-spacing: 0.2em`, `text-transform: uppercase`, yellow | `.hero-v2-tagline` |
| Hero lede               | `20px`                            | Hanken Grotesk      | `line-height: 1.55`, muted    | `.hero-v2-lede` |
| Section H2 (page title) | `text-4xl` / `md:text-5xl` (36 / 48 px) | Permanent Marker | uppercase, white               | Every `<h2 class="font-marker uppercase">` |
| Section eyebrow         | `text-xs` (12px)                  | monospace           | `tracking-[0.2em] uppercase text-primary` | Every section eyebrow `<span>` |
| Card title (eyebrow)    | `12px`                            | monospace           | `tracking-[0.2em] uppercase`, yellow | `.hero-v2-card-title` |
| Card body               | `16px`                            | Hanken Grotesk      | `line-height: 1.6`, muted     | `.hero-v2-card-body` |
| Card body (featured)    | `20px`                            | Hanken Grotesk      | otherwise same                | `.hero-v2-card--featured .hero-v2-card-body` |
| Card stat               | `34px`                            | Permanent Marker    | white, `line-height: 1`       | `.hero-v2-stat` |
| Equation big            | `28px`                            | Permanent Marker    | uppercase, cream              | `.leak-equation` |
| Button label            | `15px`                            | Hanken Grotesk      | weight 600                    | `.hero-v2-btn`, `.footer-cta` |
| Header CTA label        | `13px`                            | Hanken Grotesk      | weight 600                    | `.header-cta` |
| Citation under stats    | `11px`                            | monospace           | `letter-spacing: 0.08em`, uppercase, very low opacity | `.hero-v2-card-source` |
| Body paragraph          | `text-body-lg` / `text-body-md`   | Hanken Grotesk      | varies by context             | section body paragraphs |

## Spacing scale (Tailwind tokens)

| Token   | Value   | Notes |
|---------|---------|-------|
| `xs`    | `4px`   | |
| `sm`    | `8px`   | |
| `base`  | `8px`   | (alias of `sm`) |
| `md`    | `16px`  | Most common gap |
| `lg`    | `24px`  | Section-title-to-content gap on mobile |
| `xl`    | `40px`  | |
| `2xl`   | `80px`  | Section padding on mobile |
| `3xl`   | `160px` | Section padding on desktop |
| `margin-mobile`  | `16px` | Horizontal page padding, mobile |
| `margin-desktop` | `48px` | Horizontal page padding, desktop |

### Standards built on the scale

| Pattern                          | Mobile         | Desktop                  | Notes |
|----------------------------------|----------------|--------------------------|-------|
| Section vertical padding         | `py-2xl` (80)  | `md:py-3xl` (160)        | Apply to outer `<section>`, NEVER to the inner `max-w-page` div. |
| Section title → content gap      | `mb-lg` (24)   | `md:mb-[48px]`           | On every section `<h2>`. |
| Horizontal page padding          | `px-margin-mobile` | `md:px-margin-desktop` | Always on outer `<section>`, paired with `max-w-page mx-auto` inner div. |
| Footer top padding               | `pt-2xl` (80)  | `md:pt-[120px]`          | 3× the bottom — extra breathing room before footer content. |

## Layout

| Token        | Value     | Used by |
|--------------|-----------|---------|
| `max-w-page` | `1440px`  | The content area max width. Every section uses `<div class="max-w-page mx-auto">` inside the padded section element. |
| `min-h-hero` | `60vh`    | Hero minimum height. |

### Section-padding pattern (the right way)

```html
<!-- ✅ Correct: padding on outer section, inner is just max-w-page mx-auto -->
<section class="relative py-2xl md:py-3xl px-margin-mobile md:px-margin-desktop bg-canvas">
  <div class="max-w-page mx-auto">
    ...
  </div>
</section>
```

```html
<!-- ❌ Wrong: padding on inner div causes content to start further-right
     than the header logo on viewports > 1440px. -->
<section class="py-2xl bg-canvas">
  <div class="max-w-page mx-auto px-margin-mobile md:px-margin-desktop">
    ...
  </div>
</section>
```

### Section alternation

Sections alternate light/dark on the page so the eye reads them as
distinct blocks:

| Section            | Background        |
|--------------------|--------------------|
| Hero               | light (canvas)     |
| Revenue leaks      | dark (canvas-deeper) |
| Search demo        | light (canvas)     |
| Grow a Company     | yellow (primary)   |
| Footer             | dark (canvas-deeper) |

## Border radius

| Role               | Value   |
|--------------------|---------|
| Buttons            | `8px`   |
| Cards              | `16px`  |
| Inner pill chips   | `999px` (fully round, e.g. icon buttons inside cards) |

## Shadows (lifted-card treatment)

The "floating card" effect used on the hero stat cards, the equation
card, the search-demo panel, and any future lifted surface:

```css
box-shadow:
  0 1px 0 rgba(255,255,255,0.05) inset,       /* top 1px highlight */
  0 2px 4px rgba(0,0,0,0.5),                  /* contact shadow */
  0 30px 60px -12px rgba(0,0,0,0.65),         /* mid penumbra */
  0 60px 120px -24px rgba(0,0,0,0.55);        /* ambient halo */
```

## Buttons

| Class                  | Look                                              | Where |
|------------------------|---------------------------------------------------|-------|
| `cta-button-style`     | Yellow gradient: `linear-gradient(180deg, #fbe9a8 0%, #fae194 55%, #f0d770 100%)`. Add this class wherever a primary CTA appears. | Hero, header, footer primaries |
| `.hero-v2-btn--primary` | 14px 28px padding, 8px radius, dark text, inset top highlight, soft yellow halo | Hero |
| `.hero-v2-btn--ghost`   | Transparent, light gray text (`rgba(237,234,224,0.55)`) + light gray border (`rgba(237,234,224,0.35)`) | Hero, footer |
| `.header-cta--primary`  | Compact 8px 16px padding, otherwise same as hero primary | Header (anchored on scroll) |
| `.header-cta--ghost`    | Compact ghost variant                              | Header |
| `.footer-cta--primary`  | Same dimensions as hero primary (uses cta-button-style) | Footer |
| `.footer-cta--ghost`    | Same as hero ghost                                | Footer |

## Wordmark assets

All variants live in `public/`. Use the **`-tight`** variants whenever
alignment matters — their viewBox is cropped to the artwork bounds
(`32 29 438 70`), so the visible top/left/right edges of the rendered
image equal the artwork's edges.

| File                                   | Color (fill)     | Use case |
|----------------------------------------|------------------|----------|
| `grolabs-wordmark.svg` / `.png`        | Cream `#EDEAE0`  | Default. PNG fallback for non-SVG contexts. |
| `grolabs-wordmark-tight.svg`           | Cream `#EDEAE0`  | Aligned contexts where the edge of the artwork needs to be the edge of the box. |
| `grolabs-wordmark-yellow.svg` / `.png` | Yellow `#fae194` | On dark surfaces where the brand-accent variant is appropriate (OG image header, etc.). |
| `grolabs-wordmark-black.svg` / `.png`  | Black `#000000`  | Light-background contexts (PDFs, slides, co-branded materials). |
| `grolabs-wordmark-black-tight.svg`     | Black `#000000`  | Light-background, aligned. |
| `grolabs-wordmark-gray-tight.svg`      | Gray `#71717a`   | Footer (matches the gray Privacy/Terms/Security text). |

## Voice / copy rules (the parts that affect design)

- **Marker headlines are the brand voice.** Every hero headline and
  section H2 is Permanent Marker, all caps, white.
- **Eyebrow labels are monospace caps in yellow.** Every section gets
  one above its H2. `font-mono tracking-[0.2em] text-xs uppercase
  text-primary mb-4 block`.
- **Caveat is for secondary handwritten lines** when you want a
  different texture than the marker (rare — registered for future
  use, almost never the right call on its own).
- **Stats use Permanent Marker; their explanation uses Hanken Grotesk.**
  Mixing voices in one card is intentional.

## When this guide is wrong

If a token in this file conflicts with what's in production, **the
production code is the new source of truth.** Update this file in the
same PR so it stays canonical.

For new tokens (a new color, a new font size you need), add them here
first, then implement them in the code. If they appear in code and
not here, the next person to touch the page will accidentally diverge.
