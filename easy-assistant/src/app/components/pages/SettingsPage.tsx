import { Building, Mail, MapPin, ShieldCheck, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

function InfoRow({ label, value, emptyLabel }: { label: string; value: string | null | undefined; emptyLabel: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value?.trim() || emptyLabel}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const user = session?.user;
  const organization = session?.organization;
  const location = session?.location;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1>{t('settings.title')}</h1>
        <p className="text-gray-500">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600" />
                <CardTitle>{t('settings.businessDetails')}</CardTitle>
              </div>
            <CardDescription>{t('settings.businessDetailsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow label={t('settings.businessName')} value={organization?.name} emptyLabel={t('settings.notSet')} />
            <InfoRow label={t('settings.location')} value={location?.name} emptyLabel={t('settings.notSet')} />
            <InfoRow label={t('settings.phone')} value={location?.phone} emptyLabel={t('settings.notSet')} />
            <InfoRow label={t('settings.timezone')} value={location?.timezone ?? organization?.timezone} emptyLabel={t('settings.notSet')} />
            <InfoRow label={t('settings.city')} value={location?.city} emptyLabel={t('settings.notSet')} />
            <InfoRow label={t('settings.address')} value={[location?.addressLine1, location?.addressLine2].filter(Boolean).join(', ')} emptyLabel={t('settings.notSet')} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <CardTitle>{t('settings.signedInAs')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                  {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{user?.name || t('settings.accountOwner')}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user?.email || t('settings.noEmailSet')}</span>
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">{t('settings.owner')}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <CardTitle>{t('settings.pilotSupport')}</CardTitle>
              </div>
              <CardDescription>{t('settings.pilotSupportDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('settings.changeDetails')}</p>
              </div>
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('settings.passwordChanges')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
