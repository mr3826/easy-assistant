import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardSummary, type DashboardSummaryMetric, type TenantScope } from '../../api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LoadingFallback } from '../guards';
import {
  DEMO_BUSINESS_NAME,
  DEMO_DASHBOARD_METRICS,
  DEMO_RECENT_BOOKINGS,
  DEMO_SETUP_ITEMS,
} from '../../config/demoData';
import { useI18n } from '../../i18n';

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not set';
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

function formatMetricValue(metric: DashboardSummaryMetric | undefined) {
  if (!metric || metric.value === null) {
    return '0';
  }

  switch (metric.format) {
    case 'percent':
      return `${metric.value.toFixed(metric.value % 1 === 0 ? 0 : 1)}%`;
    case 'currency':
      if (metric.currency === 'BDT') {
        return `৳${new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(metric.value)}`;
      }

      return metric.currency
        ? new Intl.NumberFormat(undefined, { style: 'currency', currency: metric.currency }).format(metric.value)
        : new Intl.NumberFormat().format(metric.value);
    case 'duration':
      return `${metric.value.toFixed(metric.value % 1 === 0 ? 0 : 1)} min`;
    case 'text':
      return String(metric.value);
    default:
      return new Intl.NumberFormat().format(metric.value);
  }
}

function findMetric(metrics: DashboardSummaryMetric[], patterns: string[]) {
  return metrics.find((metric) => {
    const key = `${metric.key} ${metric.label}`.toLowerCase();
    return patterns.some((pattern) => key.includes(pattern));
  });
}

function SetupChecklist() {
  const { t } = useI18n();
  const completed = DEMO_SETUP_ITEMS.filter((item) => item.done).length;
  const total = DEMO_SETUP_ITEMS.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <Card className="border-emerald-100">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{t('dashboard.goLiveChecklist')}</CardTitle>
            <CardDescription>{t('dashboard.goLiveChecklistDescription')}</CardDescription>
          </div>
          <Badge className="bg-amber-100 text-amber-700">{t('dashboard.setupProgress', { completed, total })}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_SETUP_ITEMS.map((item) => (
            <div key={item.labelKey} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-emerald-600' : 'text-gray-300'}`} />
              <span className={item.done ? 'text-gray-700' : 'text-gray-500'}>{t(item.labelKey)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800">
            <Link to="/channels">{t('dashboard.connectWhatsApp')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/ai-settings">
              <PlayCircle className="mr-2 h-4 w-4" />
              {t('dashboard.testAssistant')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssistantStatusCard() {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t('dashboard.assistantTitle')}</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-700">{t('dashboard.readyToTest')}</Badge>
        </div>
        <CardDescription>{t('dashboard.assistantDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('dashboard.repliesToCustomers')}</span>
            <span className="font-medium text-gray-900">{t('common.on')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('dashboard.humanHandoff')}</span>
            <span className="font-medium text-gray-900">{t('common.on')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('dashboard.bookingReminders')}</span>
            <span className="font-medium text-gray-900">{t('common.on')}</span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/ai-settings">
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t('dashboard.checkAssistantReplies')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function appointmentStatusTone(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700 hover:bg-green-100';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
    case 'completed':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
    case 'cancelled':
    case 'canceled':
    case 'no_show':
      return 'bg-red-100 text-red-700 hover:bg-red-100';
    case 'rescheduled':
      return 'bg-slate-100 text-slate-700 hover:bg-slate-100';
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  }
}

export default function DashboardHome() {
  const { session, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchDashboardSummary>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async (nextScope: TenantScope | null = scope, showSpinner = false) => {
    if (!nextScope) {
      setSummary(null);
      setError('');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showSpinner || !summary) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError('');

    try {
      const nextSummary = await fetchDashboardSummary(nextScope);
      setSummary(nextSummary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('dashboard.retry'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) {
        return;
      }

      await loadSummary(scope, true);
    };

    void run();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  if (authLoading) {
    return <LoadingFallback message={t('common.loadingHome')} />;
  }

  if (!scope) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">{t('dashboard.signInMissing')}</p>
      </div>
    );
  }

  if (loading && !summary) {
    return <LoadingFallback message={t('common.loadingToday')} />;
  }

  const usingDemoData =
    !summary
    || (
      (summary.metrics?.length ?? 0) === 0
      && (summary.recentAppointments?.length ?? 0) === 0
    );
  const metrics = summary?.metrics?.length ? summary.metrics : DEMO_DASHBOARD_METRICS;
  const recentAppointments = summary?.recentAppointments?.length ? summary.recentAppointments : DEMO_RECENT_BOOKINGS;
  const hasAppointments = recentAppointments.length > 0;
  const bookingMetric = findMetric(metrics, ['booking']);
  const repliedMetric = findMetric(metrics, ['customers replied', 'message', 'conversation']);
  const missedMetric = findMetric(metrics, ['missed']);

  const actionCards = [
    {
      label: t('dashboard.bookings'),
      value: formatMetricValue(bookingMetric),
      helper: t('dashboard.newBookingsToday'),
      icon: Calendar,
      to: '/appointments',
    },
    {
      label: t('dashboard.customerChats'),
      value: formatMetricValue(repliedMetric),
      helper: t('dashboard.repliesToCustomers'),
      icon: MessageSquare,
      to: '/conversations',
    },
    {
      label: t('dashboard.missedInquiriesSaved'),
      value: formatMetricValue(missedMetric),
      helper: t('dashboard.repliesToCustomers'),
      icon: Clock,
      to: '/conversations',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>{t('dashboard.title')}</h1>
          <p className="text-gray-500">{t('dashboard.subtitle')}</p>
          {summary?.generatedAt && (
            <p className="text-xs text-gray-400">{t('dashboard.lastUpdated', { time: formatDateTime(summary.generatedAt) })}</p>
          )}
          {usingDemoData && (
            <p className="text-xs text-gray-400">{t('dashboard.demoData', { business: DEMO_BUSINESS_NAME })}</p>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={() => void loadSummary(scope, true)} disabled={loading || refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('common.refreshing') : t('dashboard.refresh')}
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span role="alert">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadSummary(scope, true)} disabled={loading || refreshing}>
            {t('dashboard.retry')}
          </Button>
        </div>
      )}

      {!error && refreshing && (
        <p className="text-sm text-gray-500" role="status" aria-live="polite">
          {t('common.refreshing')}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actionCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link key={card.label} to={card.to} className="block">
              <Card className="h-full transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm text-gray-600">{card.label}</CardTitle>
                  <Icon className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="mt-1 text-xs text-gray-500">{card.helper}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <SetupChecklist />
        <AssistantStatusCard />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('dashboard.recentBookings')}</CardTitle>
            <CardDescription>{t('dashboard.recentBookingsDescription')}</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/appointments">{t('dashboard.openBookings')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.customer')}</TableHead>
                <TableHead>{t('dashboard.service')}</TableHead>
                <TableHead>{t('dashboard.staff')}</TableHead>
                <TableHead>{t('dashboard.time')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasAppointments ? (
                recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.customerName ?? t('dashboard.customer')}</TableCell>
                    <TableCell>{appointment.serviceName ?? t('appointments.serviceNotSelected')}</TableCell>
                    <TableCell>{appointment.staffName ?? t('appointments.unassigned')}</TableCell>
                    <TableCell>{formatDateTime(appointment.startTime)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={appointmentStatusTone(String(appointment.status))}>
                        {String(appointment.status).replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    {t('dashboard.noBookingsYet')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
