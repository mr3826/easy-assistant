/// <reference types="vite/client" />
import type { ReactNode } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  children?: ReactNode;
}

const defaultTitle = import.meta.env.VITE_APP_TITLE ?? 'BookingAI Admin Dashboard';
const defaultDescription = 'Manage your bookings, staff, and customers with BookingAI — the AI-powered appointment scheduling platform.';
const canonical = typeof window !== 'undefined' ? window.location.href : '';

export function SEO({
  title,
  description = defaultDescription,
  image = '',
  url = canonical,
  type = 'website',
  children,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {children}
    </>
  );
}
