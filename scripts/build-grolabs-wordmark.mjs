/**
 * Build the GroLabs wordmark in TWO colour variants — outputs path-based
 * SVGs and PNGs with the real Permanent Marker glyphs baked in.
 *
 *   public/grolabs-wordmark.svg          (bone — the default)
 *   public/grolabs-wordmark.png
 *   public/grolabs-wordmark-yellow.svg   (primary yellow — special use)
 *   public/grolabs-wordmark-yellow.png
 *
 * The bone variant is the canonical brand mark used in most places.
 * The yellow variant is reserved for specific surfaces where the
 * brand needs to pop against a dark composition (e.g. the social-
 * sign-in demo).
 *
 *   npm install --no-save satori @resvg/resvg-js
 *   node scripts/build-grolabs-wordmark.mjs
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

const WIDTH = 500;
const HEIGHT = 120;

const VARIANTS = [
  { slug: 'grolabs-wordmark',        color: '#EDEAE0' }, // bone (default)
  { slug: 'grolabs-wordmark-yellow', color: '#fae194' }, // yellow accent
];

for (const { slug, color } of VARIANTS) {
  const tree = {
    type: 'div',
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
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
  fs.writeFileSync(path.join(PUBLIC_DIR, `${slug}.svg`), svg);

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH * 3 },
    font: {
      fontFiles: [path.join(FONT_DIR, 'permanent-marker.ttf')],
      loadSystemFonts: false,
    },
  });
  const pngBuf = resvg.render().asPng();
  fs.writeFileSync(path.join(PUBLIC_DIR, `${slug}.png`), pngBuf);

  console.log(`${slug}.svg  ${svg.length} bytes`);
  console.log(`${slug}.png  ${pngBuf.length} bytes`);
}
