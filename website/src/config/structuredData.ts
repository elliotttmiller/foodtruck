import { SITE_URL, siteConfig, sameAsSocial } from '@/config/site';

function googleMapsSearchUrl(): string | undefined {
  const location = [
    siteConfig.addressLine,
    siteConfig.addressCity,
    siteConfig.addressRegion,
    siteConfig.addressPostal,
  ]
    .filter(Boolean)
    .join(', ');

  if (!location) return undefined;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function getStructuredDataGraph() {
  const restaurant: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteConfig.businessName,
    description: siteConfig.description,
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.addressLine,
      addressLocality: siteConfig.addressCity,
      addressRegion: siteConfig.addressRegion,
      postalCode: siteConfig.addressPostal,
      addressCountry: siteConfig.addressCountry,
    },
    areaServed: [
      {
        '@type': 'AdministrativeArea',
        name: siteConfig.areaServedCity,
        containedInPlace: { '@type': 'State', name: siteConfig.addressStateName },
      },
      {
        '@type': 'AdministrativeArea',
        name: siteConfig.areaServedMetro,
      },
    ],
    servesCuisine: siteConfig.servesCuisine,
    priceRange: '$$',
    paymentAccepted: siteConfig.paymentAccepted,
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: false,
    currenciesAccepted: 'USD',
    sameAs: sameAsSocial,
  };

  if (siteConfig.phoneE164) restaurant.telephone = siteConfig.phoneE164;
  if (siteConfig.emailContact) restaurant.email = siteConfig.emailContact;

  const mapUrl = googleMapsSearchUrl();
  if (mapUrl) restaurant.hasMap = mapUrl;
  if (siteConfig.openingHoursSchema) restaurant.openingHours = [siteConfig.openingHoursSchema];

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.businessName,
    url: SITE_URL,
    description: siteConfig.description,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.businessName,
      url: SITE_URL,
    },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [website, restaurant],
  };
}
