/**
 * Build the GroLabs wordmark — outputs a path-based SVG and a PNG with
 * the real Permanent Marker glyphs baked in, so any asset that needs
 * the brand mark can render it as <image href="..." /> instead of
 * trying (and failing) to render text with font-family="Permanent
 * Marker, cursive". The cursive fallback used by most SVG renderers
 * looks nothing like the real font; this script ends that problem
 * once and for all.
 *
 *   npm install --no-save satori @resvg/resvg-js
 *   node scripts/build-grolabs-wordmark.mjs
 *
 * Fonts cached under /tmp/og-fonts (downloaded by build-og-image.mjs
 * the first time it ran). To re-download:
 *
 *   curl -L -o /tmp/og-fonts/permanent-marker.ttf \
 *     https://github.com/google/fonts/raw/main/apache/permanentmarker/PermanentMarker-Regular.ttf
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const FONT_DIR = '/tmp/og-fonts';

const pmTtf = fs.readFileSync(path.join(FONT_DIR, 'permanent-marker.ttf'));

// Canvas tuned so the wordmark fills the asset with a small inset on
// each side. The wordmark is rendered with letter-spacing the marker
// font hand-drew into the glyphs themselves; no extra tracking on top.
const WIDTH = 500;
const HEIGHT = 120;

const YELLOW = '#fae194';

const tree = {
  type: 'div',
  props: {
    style: {
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: YELLOW,
      fontFamily: 'Permanent Marker',
      fontSize: '88px',
      letterSpacing: '2px',
      lineHeight: 1,
    },
    children: 'GROLABS',
  },
};

const svg = await satori(tree, {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: 'Permanent Marker', data: pmTtf, weight: 400, style: 'normal' },
  ],
});

fs.writeFileSync(path.join(PUBLIC_DIR, 'grolabs-wordmark.svg'), svg);

// Render PNG at 3× for crisp display when scaled down inside other
// SVGs. fitTo width:1500 → final PNG is 1500×360.
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: WIDTH * 3 },
  font: {
    fontFiles: [path.join(FONT_DIR, 'permanent-marker.ttf')],
    loadSystemFonts: false,
  },
  // Transparent background — the asset gets composited on top of whatever
  // surface needs it.
});
const pngBuf = resvg.render().asPng();
fs.writeFileSync(path.join(PUBLIC_DIR, 'grolabs-wordmark.png'), pngBuf);

console.log('Wordmark SVG bytes:', svg.length);
console.log('Wordmark PNG bytes:', pngBuf.length);
