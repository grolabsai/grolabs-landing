/**
 * Build the Open Graph share image — outputs a PNG rasterised through
 * Satori + resvg-js with the GroLabs display fonts (Permanent Marker
 * and Special Elite) explicitly loaded. Satori treats the input as a
 * JSX/VDOM tree and produces a font-correct SVG, which resvg-js then
 * turns into a PNG. The PNG is what scrapers see in og:image.
 *
 *   npm install --no-save @resvg/resvg-js satori
 *   node scripts/build-og-image.mjs
 *
 * Font source: Google Fonts (TTF copies from the Google Fonts GitHub
 * mirror). Cached under /tmp/og-fonts.
 *
 *   mkdir -p /tmp/og-fonts
 *   curl -L -o /tmp/og-fonts/permanent-marker.ttf \
 *     https://github.com/google/fonts/raw/main/ofl/permanentmarker/PermanentMarker-Regular.ttf
 *   curl -L -o /tmp/og-fonts/special-elite.ttf \
 *     https://github.com/google/fonts/raw/main/apache/specialelite/SpecialElite-Regular.ttf
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
const seTtf = fs.readFileSync(path.join(FONT_DIR, 'special-elite.ttf'));

const BONE = '#EDEAE0';
const YELLOW = '#fae194';
const BG = '#0e0e11';

// Satori VDOM tree — same layout the previous SVG was trying to draw,
// expressed as nested object nodes (Satori's React-without-JSX form).
const tree = {
  type: 'div',
  props: {
    style: {
      width: '1200px',
      height: '630px',
      background:
        `radial-gradient(circle at 50% 50%, rgba(250,225,148,0.10), rgba(250,225,148,0.02) 55%, rgba(250,225,148,0) 100%), ${BG}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Permanent Marker',
      color: BONE,
      padding: '60px',
      textAlign: 'center',
    },
    children: [
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            fontFamily: 'Permanent Marker',
            fontSize: '88px',
            lineHeight: 1,
            letterSpacing: '-1px',
          },
          children: [
            { type: 'span', props: { children: 'RECOVER ' } },
            {
              type: 'span',
              props: { style: { color: YELLOW }, children: 'LOST REVENUE' },
            },
          ],
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontFamily: 'Permanent Marker',
            fontSize: '56px',
            margin: '30px 0',
            color: BONE,
          },
          children: '&',
        },
      },
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            fontFamily: 'Permanent Marker',
            fontSize: '88px',
            lineHeight: 1,
            letterSpacing: '-1px',
          },
          children: [
            {
              type: 'span',
              props: { style: { color: YELLOW }, children: 'GROW ' },
            },
            { type: 'span', props: { children: 'YOUR BUSINESS' } },
          ],
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontFamily: 'Special Elite',
            fontSize: '36px',
            marginTop: '60px',
            color: 'rgba(237, 234, 224, 0.9)',
          },
          children: 'without paying for more traffic',
        },
      },
    ],
  },
};

const svg = await satori(tree, {
  width: 1200,
  height: 630,
  fonts: [
    { name: 'Permanent Marker', data: pmTtf, weight: 400, style: 'normal' },
    { name: 'Special Elite', data: seTtf, weight: 400, style: 'normal' },
  ],
});

fs.writeFileSync(path.join(PUBLIC_DIR, 'og-image.svg'), svg);

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles: [
      path.join(FONT_DIR, 'permanent-marker.ttf'),
      path.join(FONT_DIR, 'special-elite.ttf'),
    ],
    loadSystemFonts: false,
  },
  background: BG,
});
const pngBuf = resvg.render().asPng();
fs.writeFileSync(path.join(PUBLIC_DIR, 'og-image.png'), pngBuf);

console.log('SVG bytes:', svg.length);
console.log('PNG bytes:', pngBuf.length);
