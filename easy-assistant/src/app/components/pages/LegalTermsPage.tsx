import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

export default function LegalTermsPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          {t('public.backToApp')}
        </Link>

        <div className="mt-6 space-y-5 text-gray-700">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t('public.termsTitle')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('public.termsSubtitle')}</p>
          </div>

          <p>{t('public.termsBodyOne')}</p>

          <p>{t('public.termsBodyTwo')}</p>

          <p>{t('public.termsBodyThree')}</p>

          <p>{t('public.termsBodyFour')}</p>

          <p>{t('public.termsBodyFive')}</p>

          <div className="border-t border-gray-200 pt-5 text-sm">
            <Link to="/privacy" className="text-blue-600 hover:underline">
              {t('public.viewPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
