import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../context/AuthContext';
import { buildBusinessHourSeed, fetchBusinessHours, mergeBusinessHours, type TenantScope } from '../../api';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

interface DayHours {
  weekday: number;
  active: boolean;
  openTime: string;
  closeTime: string;
}

function normalizeHours(hours: DayHours[]) {
  const map = new Map(hours.map((entry) => [entry.weekday, entry]));
  return weekDays.map((_, index) => {
    const weekday = index === 6 ? 0 : index + 1;
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
  const [hours, setHours] = useState<DayHours[]>(normalizeHours(buildBusinessHourSeed().map((entry) => ({ ...entry }))));
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');

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

        setHours(normalizeHours(buildBusinessHourSeed().map((entry) => ({ ...entry }))));
        setIsLive(false);
        setActionStatus('Live business-hours data is not available yet, so the local fallback is visible.');
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
  }, [scope]);

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
    setActionStatus('Copied the current working-day hours locally.');
  };

  const saveChanges = () => {
    setActionStatus('Availability changes are staged locally only until the backend PUT endpoint lands.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Availability Settings</h1>
        <p className="text-gray-500">Configure your business hours and booking availability</p>
      </div>
      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Loading availability from the current tenant...</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">The save path is intentionally local-only for now, but the screen is reading live hours when available.</p>}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>Set your operating hours for each day of the week</CardDescription>
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
                  {weekDays[day.weekday === 0 ? 6 : day.weekday - 1]}
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
              <span className="text-gray-500">to</span>
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
              Apply to All Days
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveChanges}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
