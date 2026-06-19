import { Globe2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useI18n } from './I18nContext';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm">
      <Globe2 className="ml-2 h-4 w-4 text-gray-500" />
      <Button
        type="button"
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        {t('common.english')}
      </Button>
      <Button
        type="button"
        variant={locale === 'bn' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => setLocale('bn')}
        aria-pressed={locale === 'bn'}
      >
        {t('common.bangla')}
      </Button>
    </div>
  );
}

