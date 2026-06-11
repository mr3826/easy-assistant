import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Lock, MessageSquare, Phone, RefreshCw, Shield } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useAuth } from '../../context/AuthContext';
import { fetchChannels, type TenantScope } from '../../api';
import type { Channel } from '../../types';

type FeedbackTone = 'info' | 'success' | 'error';

interface FeedbackMessage {
  tone: FeedbackTone;
  text: string;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not synced yet';
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

function maskIdentifier(value: string | null | undefined) {
  if (!value) {
    return 'Not synced yet';
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}••••`;
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function channelTypeLabel(type: Channel['type']) {
  switch (type) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'manual':
      return 'Manual inbox';
    default:
      return type;
  }
}

function channelDescription(channel: Channel) {
  if (channel.type === 'whatsapp') {
    return 'Live WhatsApp channel record managed on the server.';
  }

  return 'Human-managed inbox record with no public credential exposure.';
}

function channelIcon(channel: Channel) {
  switch (channel.type) {
    case 'whatsapp':
      return MessageSquare;
    case 'manual':
      return Phone;
    default:
      return Shield;
  }
}

function channelAccentClasses(channel: Channel) {
  switch (channel.type) {
    case 'whatsapp':
      return {
        wrapper: 'bg-green-100',
        icon: 'text-green-600',
      };
    case 'manual':
      return {
        wrapper: 'bg-slate-100',
        icon: 'text-slate-600',
      };
    default:
      return {
        wrapper: 'bg-gray-100',
        icon: 'text-gray-600',
      };
  }
}

function channelConnectionState(channel: Channel) {
  if (!channel.active) {
    return {
      label: 'Inactive',
      className: 'bg-gray-100 text-gray-700',
    };
  }

  if (channel.type === 'manual') {
    return {
      label: 'Manual inbox',
      className: 'bg-slate-100 text-slate-700',
    };
  }

  const hasLiveConnection = Boolean(
    channel.encryptedAccessToken || channel.externalAccountId || channel.externalPhoneNumberId || channel.displayPhoneNumber
  );

  return hasLiveConnection
    ? {
        label: 'Connected',
        className: 'bg-green-100 text-green-700',
      }
    : {
        label: 'Setup pending',
        className: 'bg-amber-100 text-amber-700',
      };
}

function credentialState(value: string | null, label: string) {
  return {
    label,
    value: value ? 'Stored server-side' : 'Not configured',
    hasValue: Boolean(value),
  };
}

function MetricField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-gray-900 ${mono ? 'font-mono text-xs break-all' : 'break-words'}`}>
        {value}
      </p>
    </div>
  );
}

export default function ChannelConnection() {
  const { session } = useAuth();
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

  const orderedChannels = useMemo(() => {
    return [...channels].sort((left, right) => {
      const typeWeight = (channel: Channel) => (channel.type === 'whatsapp' ? 0 : 1);
      const activeWeight = (channel: Channel) => (channel.active ? 0 : 1);

      return (
        typeWeight(left) - typeWeight(right) ||
        activeWeight(left) - activeWeight(right) ||
        left.name.localeCompare(right.name)
      );
    });
  }, [channels]);

  const stats = useMemo(() => {
    const total = channels.length;
    const whatsappCount = channels.filter((channel) => channel.type === 'whatsapp').length;
    const activeCount = channels.filter((channel) => channel.active).length;
    const syncedNumberCount = channels.filter((channel) => Boolean(channel.displayPhoneNumber)).length;

    return {
      total,
      whatsappCount,
      activeCount,
      syncedNumberCount,
    };
  }, [channels]);

  const whatsappChannels = useMemo(
    () => orderedChannels.filter((channel) => channel.type === 'whatsapp'),
    [orderedChannels]
  );

  const loadChannels = async () => {
    if (!scope) {
      setChannels([]);
      setLoading(false);
      setFeedback({
        tone: 'info',
        text: 'Sign in to view live channel records.',
      });
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchChannels(scope);
      setChannels(rows);
      setFeedback({
        tone: 'success',
        text: rows.length > 0 ? `Loaded ${rows.length} channel record${rows.length === 1 ? '' : 's'} from the API.` : 'No channel records were returned by the API.',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to load live channel records.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const refreshLabel = loading ? 'Refreshing...' : 'Refresh';
  const hasChannels = orderedChannels.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>Channel Connections</h1>
          <p className="text-gray-500">
            Live WhatsApp and channel records from the backend. Setup controls stay read-only until the backend actions are ready.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadChannels()}
          disabled={loading || !scope}
          title={!scope ? 'Sign in to refresh channels' : 'Reload live channel records'}
          aria-label="Refresh channel records"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {refreshLabel}
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-4 w-4 text-gray-500" />
          <p className="text-sm text-gray-600">
            Credential values stay server-side. This page only shows redacted status and the live connection record.
          </p>
        </div>
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

      {loading && !hasChannels && <p className="text-sm text-gray-500">Loading live channel records...</p>}

      {!loading && !hasChannels && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300" />
            <div className="space-y-1">
              <p className="font-medium text-gray-900">No channel records are connected yet.</p>
              <p className="text-sm text-gray-500">
                When the backend provisions a WhatsApp or manual inbox channel, it will appear here automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasChannels && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Total Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.whatsappCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-700">{stats.activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-600">Synced Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{stats.syncedNumberCount}</div>
              </CardContent>
            </Card>
          </div>

          {whatsappChannels.length === 0 && (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              No WhatsApp channel record is available yet. The live list below currently shows the manual inbox record.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {orderedChannels.map((channel) => {
              const Icon = channelIcon(channel);
              const accent = channelAccentClasses(channel);
              const connection = channelConnectionState(channel);
              const accessTokenState = credentialState(channel.encryptedAccessToken, 'Access token');
              const webhookState = credentialState(channel.verifyTokenHash, 'Webhook verification');
              const actionLabel =
                channel.type === 'whatsapp'
                  ? channel.active
                    ? 'WhatsApp connected'
                    : 'Connect WhatsApp'
                  : 'Manual channel';

              return (
                <Card key={channel.id} className="overflow-hidden">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${accent.wrapper}`}>
                          <Icon className={`h-6 w-6 ${accent.icon}`} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="truncate">{channel.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {channelTypeLabel(channel.type)}
                            </Badge>
                          </div>
                          <CardDescription>{channelDescription(channel)}</CardDescription>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={channel.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {channel.active ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                        <Badge className={connection.className}>{connection.label}</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricField label="WhatsApp number" value={channel.displayPhoneNumber ?? 'Not synced yet'} />
                      <MetricField label="Account ID" value={maskIdentifier(channel.externalAccountId)} mono />
                      <MetricField label="Phone number ID" value={maskIdentifier(channel.externalPhoneNumberId)} mono />
                      <MetricField label="Last updated" value={formatDateTime(channel.updatedAt)} />
                    </div>

                    <Separator />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{accessTokenState.label}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{accessTokenState.value}</p>
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{webhookState.label}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{webhookState.value}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-600">
                        Setup actions stay disabled until the backend mutators are available.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Channel actions are read-only from this page right now"
                          aria-label={`${actionLabel} unavailable`}
                        >
                          {actionLabel}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Editing is disabled until the backend update endpoint is ready"
                          aria-label={`Edit ${channel.name} unavailable`}
                        >
                          Edit settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
