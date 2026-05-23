import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,ts,tsx,js,jsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Engineered Luxury canvas palette ─────────────────────────────
        // Use these for backgrounds, never raw hex.
        canvas: '#131316',          // page background, header glass tint
        'canvas-deeper': '#131313', // sectional dark stripe (Luminous Equation)
        // ─────────────────────────────────────────────────────────────────
        'secondary-fixed-dim': '#c8c5ca',
        'on-background': '#1a1c1c',
        'surface-bright': '#f9f9f9',
        'surface-dim': '#dadada',
        error: '#ba1a1a',
        'tertiary-fixed': '#e2e2e3',
        'on-primary-fixed': '#241a00',
        'surface-container': '#eeeeee',
        'on-secondary-container': '#656467',
        'outline-variant': '#d0c5af',
        tertiary: '#5d5e60',
        'primary-fixed': '#ffe088',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#4d4635',
        secondary: '#5f5e61',
        'on-primary-container': '#554300',
        'tertiary-fixed-dim': '#c6c6c7',
        primary: '#fae194',
        'on-primary': '#18181b',
        'kinetic-gold-deep': '#d4af37',
        'success-emerald': '#10b981',
        'zinc-950': '#18181b',
        'tertiary-container': '#b2b3b4',
        'surface-container-low': '#f3f3f4',
        'on-tertiary-fixed': '#1a1c1d',
        outline: '#7f7663',
        'inverse-primary': '#fae194',
        background: '#f9f9f9',
        'on-tertiary': '#ffffff',
        'on-secondary-fixed': '#1b1b1e',
        'error-red': '#ef4444',
        'inverse-on-surface': '#f0f1f1',
        'on-error-container': '#93000a',
        surface: '#f9f9f9',
        'primary-container': '#fae194',
        'surface-container-highest': '#e2e2e2',
        'surface-container-lowest': '#ffffff',
        'on-tertiary-fixed-variant': '#454748',
        'secondary-fixed': '#e4e1e6',
        'surface-tint': '#fae194',
        'error-container': '#ffdad6',
        'secondary-container': '#e4e1e6',
        'primary-fixed-dim': '#fae194',
        'on-secondary-fixed-variant': '#47464a',
        'inverse-surface': '#2f3131',
        'zinc-200': '#e4e4e4',
        'on-primary-fixed-variant': '#574500',
        'surface-container-high': '#e8e8e8',
        'on-error': '#ffffff',
        'surface-variant': '#e2e2e2',
        'on-tertiary-container': '#434546',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '8px',
        md: '16px',
        lg: '24px',
        gutter: '24px',
        xl: '40px',
        '2xl': '80px',
        '3xl': '160px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
      },
      fontFamily: {
        'section-header': ['"Hanken Grotesk"', 'sans-serif'],
        'label-caps': ['"Hanken Grotesk"', 'sans-serif'],
        'body-md': ['"Hanken Grotesk"', 'sans-serif'],
        'body-sm': ['"Hanken Grotesk"', 'sans-serif'],
        'page-title': ['"Hanken Grotesk"', 'sans-serif'],
        'body-lg': ['"Hanken Grotesk"', 'sans-serif'],
        'page-title-mobile': ['"Hanken Grotesk"', 'sans-serif'],
        'button-text': ['"Hanken Grotesk"', 'sans-serif'],
        // The brand-mark / hero hand-drawn voice. Loaded by BaseLayout.
        marker: ['"Permanent Marker"', 'cursive'],
        // Typewriter voice for closing copy. Also from the original site.
        typewriter: ['"Special Elite"', 'monospace'],
        mono: ['monospace'],
      },
      fontSize: {
        'section-header': ['12px', { lineHeight: '16px', letterSpacing: '0.15em', fontWeight: '400' }],
        'label-caps': ['11px', { lineHeight: '12px', letterSpacing: '0.05em', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'page-title': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'page-title-mobile': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'button-text': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        // ── Marketing-page extensions on top of the design system ────────
        hero: ['64px', { lineHeight: '72px', letterSpacing: '-0.02em', fontWeight: '400' }],
        'card-title-lg': ['32px', { lineHeight: '40px', fontWeight: '400' }],
        'card-title': ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'meta-xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '400' }],
        'meta-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '400' }],
        'meta-md': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      maxWidth: {
        page: '1440px',
      },
      minHeight: {
        hero: '60vh',          // shorter than 85vh so the stats peek above the fold
        section: '800px',
        'card-featured': '320px',
      },
      height: {
        'hero-band': '380px', // yellow glow strip the stats cards straddle
      },
    },
  },
  plugins: [forms, containerQueries],
};
