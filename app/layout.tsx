import type { Metadata } from 'next';
import { Fraunces, Manrope, Geist } from 'next/font/google';
import './globals.css';
import { LenisProvider } from '@/components/providers/LenisProvider';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// ─── Fonts ────────────────────────────────────────────────────────────────────

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
  // Variable font: don't specify weight when using axes
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Master of Pipsology — Professional Trading Education',
  icons: {
    icon: '/main_logo.png',
    apple: '/main_logo.png',
  },
  description:
    'A 12-week live trading programme covering risk architecture, market structure, order flow and execution psychology. Forex, equities and crypto. Cohort 14 starts 6 January 2025.',
  keywords: [
    'trading education',
    'forex trading',
    'market structure',
    'order flow',
    'trading psychology',
    'risk management',
    'trading course',
  ],
  authors: [{ name: 'Master of Pipsology' }],
  creator: 'Master of Pipsology',
  metadataBase: new URL('https://masterofpipsology.com'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://masterofpipsology.com',
    title: 'Master of Pipsology — Professional Trading Education',
    description:
      'Join 1,400+ graduates who trade with institutional precision. Cohort 14 starts 6 January 2025.',
    siteName: 'Master of Pipsology',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Master of Pipsology — Professional Trading Education',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Master of Pipsology — Professional Trading Education',
    description:
      'A 12-week live trading programme. 1,400+ graduates. Cohort 14 starts 6 January 2025.',
    images: ['/og-image.png'],
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
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(fraunces.variable, manrope.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
