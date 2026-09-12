import './globals.css';
import type { Metadata, Viewport } from 'next';
import { barlowCondensed, inter } from './fonts';
import { SITE_URL, siteConfig } from '@/config/site';
import { getStructuredDataGraph } from '@/config/structuredData';

const structuredDataGraph = getStructuredDataGraph();
const brandLogoUrl = `${SITE_URL}/brand/uff-da-logo.png`;
const faviconUrl = `${SITE_URL}/favicon.ico`;
const manifestUrl = `${SITE_URL}/manifest.json`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: siteConfig.themeColor,
};

export const metadata: Metadata = {
  title: 'UFF-DA',
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.businessName }],
  creator: siteConfig.businessName,
  publisher: siteConfig.businessName,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: faviconUrl, type: 'image/x-icon', sizes: '16x16 32x32 48x48' }],
    shortcut: faviconUrl,
  },
  manifest: manifestUrl,
  alternates: { canonical: SITE_URL },
  category: 'restaurant',
  openGraph: {
    title: `${siteConfig.businessName} | ${siteConfig.titleSuffix}`,
    description: siteConfig.description,
    url: SITE_URL,
    siteName: siteConfig.businessName,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: brandLogoUrl,
        width: 1200,
        height: 630,
        alt: `${siteConfig.businessName} Minnesota food truck`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.businessName} | ${siteConfig.titleSuffix}`,
    description: siteConfig.description,
    images: [brandLogoUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'geo.region': siteConfig.geoRegionMeta,
    'geo.placename': siteConfig.geoPlacename,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <head>
        <link rel="icon" href={faviconUrl} type="image/x-icon" />
        <link rel="shortcut icon" href={faviconUrl} type="image/x-icon" />
        <link rel="alternate" type="text/plain" title="LLM context" href={`${SITE_URL}/llms.txt`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataGraph) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
