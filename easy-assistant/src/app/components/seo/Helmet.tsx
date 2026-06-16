/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  children?: ReactNode;
}

const defaultTitle = import.meta.env.VITE_APP_TITLE ?? 'Easy Assistant';
const canonical = typeof window !== 'undefined' ? window.location.href : '';

export function SEO({
  title,
  description,
  image = '',
  url = canonical,
  type = 'website',
  children,
}: SEOProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('app.title');
  const resolvedDescription = description ?? t('app.description');
  const fullTitle = `${resolvedTitle} | ${defaultTitle}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {image && <meta name="twitter:image" content={image} />}
      {children}
    </>
  );
}
