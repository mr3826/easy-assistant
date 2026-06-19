import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, MessageSquare, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../context/AuthContext';
import { fetchChannels, type TenantScope } from '../../api';
import type { Channel } from '../../types';
import { useI18n } from '../../i18n';

type FeedbackTone = 'info' | 'success' | 'error';

interface FeedbackMessage {
  tone: FeedbackTone;
  text: string;
}

function formatDateTime(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function connectionState(channel: Channel | undefined, t: (path: string) => string) {
  if (!channel) {
    return {
      label: t('channels.notConnected'),
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (!channel.active) {
    return {
      label: t('channels.paused'),
      className: 'bg-gray-100 text-gray-700',
    };
  }

  const hasNumber = Boolean(channel.displayPhoneNumber);

  return hasNumber
    ? {
        label: t('channels.connected'),
        className: 'bg-green-100 text-green-700',
      }
    : {
        label: t('channels.needsSetup'),
        className: 'bg-amber-100 text-amber-700',
      };
}

export default function ChannelConnection() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const whatsappChannel = useMemo(() => {
    return channels.find((channel) => channel.type === 'whatsapp');
  }, [channels]);

  const loadChannels = async () => {
    if (!scope) {
      setChannels([]);
      setLoading(false);
      setFeedback({
        tone: 'info',
        text: t('channels.signInToView'),
      });
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchChannels(scope);
      setChannels(rows);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : t('channels.loadFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, t]);

  const state = connectionState(whatsappChannel, t);
  const phoneNumber = whatsappChannel?.displayPhoneNumber ?? t('channels.noNumberConnected');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>{t('channels.title')}</h1>
          <p className="text-gray-500">{t('channels.subtitle')}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadChannels()}
          disabled={loading || !scope}
          title={!scope ? t('channels.signInToRefresh') : t('channels.refresh')}
          aria-label={t('channels.refresh')}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? t('channels.refreshing') : t('channels.refresh')}
        </Button>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
            feedback.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : feedback.tone === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.tone === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4" />
          ) : (
            <Check className="mt-0.5 h-4 w-4" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      {loading && !whatsappChannel ? (
        <p className="text-sm text-gray-500">{t('channels.loading')}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle>{t('channels.inboxTitle')}</CardTitle>
                    <CardDescription>{t('channels.inboxDescription')}</CardDescription>
                  </div>
                </div>
                <Badge className={state.className}>{state.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t('channels.number')}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{phoneNumber}</p>
                </div>
                <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{t('channels.lastChecked')}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(whatsappChannel?.updatedAt, t('channels.notSyncedYet'))}</p>
                </div>
              </div>

              <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {t('channels.keepLaunchFocused')}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  disabled
                  className="bg-slate-900 hover:bg-slate-800"
                  title={t('channels.connectWhatsApp')}
                >
                  {t('channels.connectWhatsApp')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title={t('channels.sendTestMessage')}
                >
                  {t('channels.sendTestMessage')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <CardTitle>{t('channels.beforeGoingLive')}</CardTitle>
              </div>
              <CardDescription>{t('channels.inboxDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('channels.confirmNumber')}</p>
              </div>
              <div className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('channels.sendTestCustomerMessage')}</p>
              </div>
              <div className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('channels.checkBookingsPage')}</p>
              </div>
              <div className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>{t('channels.handoffCheck')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
