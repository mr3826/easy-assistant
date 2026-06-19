import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import {
  buildBusinessHourSeed,
  fetchBusinessHours,
  mergeBusinessHours,
  replaceBusinessHours,
  type TenantScope,
} from '../../api';
import type { Weekday } from '../../types';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

interface DayHours {
  weekday: Weekday;
  active: boolean;
  openTime: string;
  closeTime: string;
}

type ActionTone = 'success' | 'error' | 'info';

function normalizeHours(hours: DayHours[]) {
  const map = new Map(hours.map((entry) => [entry.weekday, entry]));
  return weekDays.map((_, index) => {
    const weekday = (index === 6 ? 0 : index + 1) as Weekday;
    return map.get(weekday) ?? {
      weekday,
      active: weekday !== 0,
      openTime: weekday === 0 ? '10:00' : '09:00',
      closeTime: weekday === 0 ? '15:00' : '17:00',
    };
  });
}

export default function AvailabilityPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [hours, setHours] = useState<DayHours[]>(normalizeHours(buildBusinessHourSeed().map((entry) => ({ ...entry }))));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionTone, setActionTone] = useState<ActionTone>('info');

  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!scope) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setActionStatus('');
      setActionTone('info');

      try {
        const businessHours = await fetchBusinessHours(scope);
        if (!active) {
          return;
        }

        setHours(normalizeHours(mergeBusinessHours(scope, businessHours).map((entry) => ({ ...entry }))));
        setIsLive(true);
      } catch {
        if (!active) {
          return;
        }

        setIsLive(false);
        setActionStatus(t('availability.loadFailed'));
        setActionTone('error');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope, t]);

  const applyToAll = () => {
    const firstActive = hours.find((entry) => entry.active) ?? hours[0];
    setHours((current) =>
      current.map((entry) => ({
        ...entry,
        active: firstActive?.active ?? entry.active,
        openTime: firstActive?.openTime ?? entry.openTime,
        closeTime: firstActive?.closeTime ?? entry.closeTime,
      }))
    );
    setActionStatus(t('availability.copied'));
    setActionTone('info');
  };

  const saveChanges = async () => {
    const invalidDay = hours.find((day) => day.active && day.openTime >= day.closeTime);
    if (invalidDay) {
      const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][
        invalidDay.weekday === 0 ? 6 : invalidDay.weekday - 1
      ];
      setActionStatus(t('availability.invalidHour', { day: t(`availability.${dayKey}`) }));
      setActionTone('error');
      return;
    }

    if (!scope) {
      setActionStatus(t('availability.signInMissing'));
      setActionTone('error');
      return;
    }

    setSaving(true);

    try {
      const updatedHours = await replaceBusinessHours(
        scope,
        hours.map((day) => ({
          weekday: day.weekday,
          active: day.active,
          openTime: day.openTime,
          closeTime: day.closeTime,
        }))
      );
      setHours(normalizeHours(mergeBusinessHours(scope, updatedHours).map((entry) => ({ ...entry }))));
      setIsLive(true);
      setActionStatus(t('availability.hoursSaved'));
      setActionTone('success');
    } catch {
      setActionStatus(t('availability.liveHoursUnavailable'));
      setActionTone('error');
    } finally {
      setSaving(false);
    }
  };

  const dayLabels = [
    t('availability.monday'),
    t('availability.tuesday'),
    t('availability.wednesday'),
    t('availability.thursday'),
    t('availability.friday'),
    t('availability.saturday'),
    t('availability.sunday'),
  ];

  const activeHoursPreview = hours
    .filter((day) => day.active)
    .map((day) => ({
      day: dayLabels[day.weekday === 0 ? 6 : day.weekday - 1],
      range: `${day.openTime} ${t('common.to')} ${day.closeTime}`,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1>{t('availability.title')}</h1>
        <p className="text-gray-500">{t('availability.subtitle')}</p>
      </div>
      {actionStatus && (
        <p
          className={`text-sm ${actionTone === 'error' ? 'text-red-700' : actionTone === 'success' ? 'text-green-700' : 'text-gray-600'}`}
          role="status"
          aria-live="polite"
        >
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">{t('availability.loading')}</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">{t('availability.noLiveData')}</p>}

      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <CardTitle>{t('availability.weeklySchedule')}</CardTitle>
            </div>
          <CardDescription>{t('availability.assistantUsesHours')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hours.map((day) => (
            <div key={day.weekday} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`weekday-${day.weekday}`}
                  checked={day.active}
                  onCheckedChange={(checked) =>
                    setHours((current) =>
                      current.map((entry) => (entry.weekday === day.weekday ? { ...entry, active: checked === true } : entry))
                    )
                  }
                />
                <Label htmlFor={`weekday-${day.weekday}`} className="font-medium">
                  {dayLabels[day.weekday === 0 ? 6 : day.weekday - 1]}
                </Label>
              </div>
              <Input
                type="time"
                value={day.openTime}
                onChange={(event) =>
                  setHours((current) =>
                    current.map((entry) => (entry.weekday === day.weekday ? { ...entry, openTime: event.target.value } : entry))
                  )
                }
                className="w-32 bg-white"
              />
              <span className="text-gray-500">{t('common.to')}</span>
              <Input
                type="time"
                value={day.closeTime}
                onChange={(event) =>
                  setHours((current) =>
                    current.map((entry) => (entry.weekday === day.weekday ? { ...entry, closeTime: event.target.value } : entry))
                  )
                }
                className="w-32 bg-white"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={applyToAll}>
              {t('availability.applyToAllDays')}
            </Button>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void saveChanges()} disabled={saving}>
              {saving ? t('common.saving') : t('availability.saveChanges')}
            </Button>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="mb-3">
              <p className="font-medium text-gray-900">{t('availability.previewTitle')}</p>
              <p className="text-sm text-gray-500">{t('availability.previewDescription')}</p>
            </div>
            {activeHoursPreview.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {activeHoursPreview.map((entry) => (
                  <div key={entry.day} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-700">{entry.day}</span>
                    <span className="text-gray-600">{entry.range}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">{t('availability.previewEmpty')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
