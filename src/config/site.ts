/**
 * UFF-DA site-wide brand copy and links.
 * Production values can be overridden with NEXT_PUBLIC_* environment variables.
 */

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

export const SITE_URL = env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, '');

export const siteConfig = {
  businessName: env('NEXT_PUBLIC_BUSINESS_NAME', 'UFF-DA'),
  brandWordPrimary: env('NEXT_PUBLIC_BRAND_WORD_PRIMARY', 'UFF'),
  brandWordSecondary: env('NEXT_PUBLIC_BRAND_WORD_SECONDARY', 'DA'),
  titleSuffix: env('NEXT_PUBLIC_TITLE_SUFFIX', 'Good Food. Midwest Soul.'),
  description: env(
    'NEXT_PUBLIC_SITE_DESCRIPTION',
    'UFF-DA is a Minnesota food truck built around bold food, Midwest hospitality, and a little extra personality.',
  ),
  keywords: env(
    'NEXT_PUBLIC_SITE_KEYWORDS',
    'UFF-DA, Minnesota food truck, Midwest food, Minnesota street food, food truck',
  ).split(',').map((value) => value.trim()).filter(Boolean),
  phoneE164: env('NEXT_PUBLIC_PHONE_E164', '+15555550100'),
  phoneDisplay: env('NEXT_PUBLIC_PHONE_DISPLAY', '+1 (555) 555-0100'),
  whatsappDigits: env('NEXT_PUBLIC_WHATSAPP_DIGITS', '15555550100'),
  emailContact: env('NEXT_PUBLIC_EMAIL_CONTACT', 'hello@uffda.example'),
  orderUrl: env('NEXT_PUBLIC_ORDER_URL', '#'),
  addressLine: env('NEXT_PUBLIC_ADDRESS_LINE', ''),
  addressCity: env('NEXT_PUBLIC_ADDRESS_CITY', ''),
  addressRegion: env('NEXT_PUBLIC_ADDRESS_REGION', 'MN'),
  addressStateName: env('NEXT_PUBLIC_ADDRESS_STATE_NAME', 'Minnesota'),
  addressPostal: env('NEXT_PUBLIC_ADDRESS_POSTAL', ''),
  addressCountry: env('NEXT_PUBLIC_ADDRESS_COUNTRY', 'US'),
  addressDisplay: env('NEXT_PUBLIC_ADDRESS_DISPLAY', 'Minnesota'),
  mapsLink: env('NEXT_PUBLIC_MAPS_URL', 'https://maps.google.com/?q=Minnesota'),
  latitude: parseFloat(env('NEXT_PUBLIC_GEO_LAT', '46.7296')),
  longitude: parseFloat(env('NEXT_PUBLIC_GEO_LNG', '-94.6859')),
  geoRegionMeta: env('NEXT_PUBLIC_GEO_REGION_META', 'US-MN'),
  geoPlacename: env('NEXT_PUBLIC_GEO_PLACENAME', 'Minnesota'),
  areaServedCity: env('NEXT_PUBLIC_AREA_SERVED_CITY', 'Minnesota'),
  areaServedMetro: env('NEXT_PUBLIC_AREA_SERVED_METRO', 'Minnesota'),
  openingHoursSchema: env('NEXT_PUBLIC_OPENING_HOURS_SCHEMA', ''),
  hoursLine1: env('NEXT_PUBLIC_HOURS_LINE1', 'Follow us for current locations'),
  hoursLine2: env('NEXT_PUBLIC_HOURS_LINE2', ''),
  servesCuisine: env('NEXT_PUBLIC_SERVES_CUISINE', 'Midwest-inspired street food')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  paymentAccepted: env('NEXT_PUBLIC_PAYMENT_METHODS', 'Cash, Credit Card')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  social: {
    instagram: env('NEXT_PUBLIC_SOCIAL_INSTAGRAM', 'https://instagram.com'),
    facebook: env('NEXT_PUBLIC_SOCIAL_FACEBOOK', 'https://facebook.com'),
    x: env('NEXT_PUBLIC_SOCIAL_X', 'https://x.com'),
    tiktok: env('NEXT_PUBLIC_SOCIAL_TIKTOK', 'https://tiktok.com'),
    youtube: env('NEXT_PUBLIC_SOCIAL_YOUTUBE', 'https://youtube.com'),
  },
  twitterCreator: env('NEXT_PUBLIC_TWITTER_CREATOR', '@uffda'),
  themeColor: env('NEXT_PUBLIC_THEME_COLOR', '#102B23'),
  schemaRatingValue: process.env.NEXT_PUBLIC_SCHEMA_RATING_VALUE?.trim(),
  schemaReviewCount: process.env.NEXT_PUBLIC_SCHEMA_REVIEW_COUNT?.trim(),
};

export const sameAsSocial = [siteConfig.social.facebook, siteConfig.social.instagram].filter(Boolean);
