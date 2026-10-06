/**
 * Countries where analytics cookies need opt-in consent before they are set:
 * the EEA (GDPR + ePrivacy), the UK (UK GDPR + PECR) and Switzerland (FADP).
 *
 * Shared by Analytics.astro (Consent Mode region-specific defaults) and
 * /api/consent-region (decides whether ConsentBanner shows). ISO 3166-1
 * alpha-2, the format both Google Consent Mode and Vercel's
 * x-vercel-ip-country header use.
 */
export const CONSENT_REGIONS = [
  // EU-27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // Rest of the EEA
  'IS', 'LI', 'NO',
  // UK and Switzerland
  'GB', 'CH',
];
