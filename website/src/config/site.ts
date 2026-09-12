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
    'UFF-DA is a Minnesota food truck serving smash burgers, bold dry-rub and sauced wings, and crispy fries with Midwest soul.',
  ),
  keywords: env(
    'NEXT_PUBLIC_SITE_KEYWORDS',
    'UFF-DA, Minnesota food truck, smash burgers, wings, fries, Midwest food, Minnesota street food',
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  phoneE164: env('NEXT_PUBLIC_PHONE_E164', ''),
  phoneDisplay: env('NEXT_PUBLIC_PHONE_DISPLAY', ''),
  emailContact: env('NEXT_PUBLIC_EMAIL_CONTACT', ''),
  addressLine: env('NEXT_PUBLIC_ADDRESS_LINE', ''),
  addressCity: env('NEXT_PUBLIC_ADDRESS_CITY', ''),
  addressRegion: env('NEXT_PUBLIC_ADDRESS_REGION', 'MN'),
  addressStateName: env('NEXT_PUBLIC_ADDRESS_STATE_NAME', 'Minnesota'),
  addressPostal: env('NEXT_PUBLIC_ADDRESS_POSTAL', ''),
  addressCountry: env('NEXT_PUBLIC_ADDRESS_COUNTRY', 'US'),
  addressDisplay: env('NEXT_PUBLIC_ADDRESS_DISPLAY', 'Minnesota'),
  geoRegionMeta: env('NEXT_PUBLIC_GEO_REGION_META', 'US-MN'),
  geoPlacename: env('NEXT_PUBLIC_GEO_PLACENAME', 'Minnesota'),
  areaServedCity: env('NEXT_PUBLIC_AREA_SERVED_CITY', 'Minnesota'),
  areaServedMetro: env('NEXT_PUBLIC_AREA_SERVED_METRO', 'Minnesota'),
  openingHoursSchema: env('NEXT_PUBLIC_OPENING_HOURS_SCHEMA', ''),
  hoursLine1: env('NEXT_PUBLIC_HOURS_LINE1', 'Follow us for current locations and service times'),
  hoursLine2: env('NEXT_PUBLIC_HOURS_LINE2', ''),
  servesCuisine: env(
    'NEXT_PUBLIC_SERVES_CUISINE',
    'Smash burgers, Wings, Fries, Midwest-inspired street food',
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  paymentAccepted: env('NEXT_PUBLIC_PAYMENT_METHODS', 'Cash, Credit Card')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  social: {
    instagram: env('NEXT_PUBLIC_SOCIAL_INSTAGRAM', ''),
    facebook: env('NEXT_PUBLIC_SOCIAL_FACEBOOK', ''),
  },
  themeColor: env('NEXT_PUBLIC_THEME_COLOR', '#020202'),
};

export const sameAsSocial = [siteConfig.social.facebook, siteConfig.social.instagram].filter(Boolean);
