import { useEffect, useMemo, useState } from 'react';
import { Bell, Bot, CalendarCheck, Languages, MessageSquare, PlayCircle, RefreshCw, Save, ShieldCheck, Undo2, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { LoadingFallback } from '../guards';
import { fetchAiSettings, updateAiSettings, type TenantScope } from '../../api';
import type { AiSettings } from '../../types';
import { DEMO_BUSINESS_NAME } from '../../config/demoData';

type AiSettingsDraft = Pick<
  AiSettings,
  | 'assistantName'
  | 'tone'
  | 'defaultLanguage'
  | 'greetingMessage'
  | 'humanHandoffMessage'
  | 'autoConfirmBookings'
  | 'reminderEnabled'
>;

type FeedbackTone = 'info' | 'success' | 'error';

interface FeedbackMessage {
  tone: FeedbackTone;
  text: string;
}

function cloneDraft(value: AiSettingsDraft) {
  return { ...value };
}

function buildDefaultAiSettings(translate: (key: string) => string): AiSettingsDraft {
  return {
    assistantName: 'Easy Assistant',
    tone: 'friendly',
    defaultLanguage: 'en',
    greetingMessage: translate('assistant.defaultGreetingMessage').replace('{business}', DEMO_BUSINESS_NAME),
    humanHandoffMessage: translate('assistant.defaultHumanHandoffMessage'),
    autoConfirmBookings: true,
    reminderEnabled: false,
  };
}

function toDraft(settings: AiSettings): AiSettingsDraft {
  return {
    assistantName: settings.assistantName,
    tone: settings.tone,
    defaultLanguage: settings.defaultLanguage,
    greetingMessage: settings.greetingMessage,
    humanHandoffMessage: settings.humanHandoffMessage,
    autoConfirmBookings: settings.autoConfirmBookings,
    reminderEnabled: settings.reminderEnabled,
  };
}

function draftsMatch(left: AiSettingsDraft, right: AiSettingsDraft) {
  return (
    left.assistantName === right.assistantName &&
    left.tone === right.tone &&
    left.defaultLanguage === right.defaultLanguage &&
    left.greetingMessage === right.greetingMessage &&
    left.humanHandoffMessage === right.humanHandoffMessage &&
    left.autoConfirmBookings === right.autoConfirmBookings &&
    left.reminderEnabled === right.reminderEnabled
  );
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

function feedbackClasses(tone: FeedbackTone) {
  switch (tone) {
    case 'error':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-700';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm text-gray-600">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-lg font-semibold text-gray-900">{value}</div>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function AISettings() {
  const { session, isLoading } = useAuth();
  const { t } = useI18n();
  const defaultDraft = useMemo(() => buildDefaultAiSettings(t), [t]);
  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const [serverDraft, setServerDraft] = useState<AiSettingsDraft>(cloneDraft(defaultDraft));
  const [formDraft, setFormDraft] = useState<AiSettingsDraft>(cloneDraft(defaultDraft));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [testMessage, setTestMessage] = useState(t('assistant.defaultTestMessage'));

  const loadSettings = async (nextScope: TenantScope | null = scope) => {
    if (!nextScope) {
      setServerDraft(cloneDraft(defaultDraft));
      setFormDraft(cloneDraft(defaultDraft));
      setLastSavedAt(null);
      setFeedback({
        tone: 'info',
        text: t('assistant.signInToSetReplies'),
      });
      setLoading(false);
      setHydrated(true);
      return;
    }

    setLoading(true);
    try {
      const settings = await fetchAiSettings(nextScope);
      const nextDraft = settings ? toDraft(settings) : cloneDraft(defaultDraft);
      setServerDraft(cloneDraft(nextDraft));
      setFormDraft(cloneDraft(nextDraft));
      setLastSavedAt(settings?.updatedAt ?? null);
      setFeedback({
        tone: 'success',
        text: settings ? t('assistant.assistantRepliesLoaded') : t('assistant.defaultRepliesLoaded'),
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : t('assistant.unableToLoad'),
      });
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  };

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultDraft, scope, t]);

  if (isLoading) {
    return <LoadingFallback message={t('common.loadingAssistant')} />;
  }

  if (!scope) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">{t('assistant.signInToSetReplies')}</p>
      </div>
    );
  }

  if (!hydrated) {
    return <LoadingFallback message={t('common.loadingAssistant')} />;
  }

  const isDirty = !draftsMatch(formDraft, serverDraft);
  const testResponse =
    testMessage.trim().length === 0
      ? t('assistant.typeToPreview')
      : `${formDraft.greetingMessage}\n\n${t('assistant.previewPrompt')}`;

  const handleReset = () => {
    setFormDraft(cloneDraft(serverDraft));
    setFeedback({
      tone: 'info',
      text: t('assistant.discardChanges'),
    });
  };

  const handleSave = async () => {
    if (!scope) {
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAiSettings(scope, formDraft);
      if (!updated) {
        throw new Error('The server did not return AI settings.');
      }

      const nextDraft = toDraft(updated);
      setServerDraft(cloneDraft(nextDraft));
      setFormDraft(cloneDraft(nextDraft));
      setLastSavedAt(updated.updatedAt);
      setFeedback({
        tone: 'success',
        text: t('assistant.assistantRepliesSaved'),
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : t('assistant.unableToSave'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>{t('assistant.title')}</h1>
          <p className="text-gray-500">{t('assistant.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSettings()}
            disabled={loading || saving}
            title={t('assistant.reload')}
            aria-label={t('assistant.reload')}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('assistant.reload')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || saving}
            title={t('assistant.discardChanges')}
            aria-label={t('assistant.discardChanges')}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            {t('assistant.reset')}
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${feedbackClasses(feedback.tone)}`}
          role="status"
          aria-live="polite"
        >
          <MessageSquare className="mt-0.5 h-4 w-4" />
          <p>{feedback.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          label={t('assistant.status')}
          value={isDirty ? t('assistant.unsaved') : t('assistant.ready')}
          description={t('assistant.saveBeforeCustomersSee')}
          icon={Bot}
        />
        <SummaryCard
          label={t('assistant.lastSaved')}
          value={formatDateTime(lastSavedAt, t('assistant.notSavedYet'))}
          description={t('assistant.savedRepliesLoaded')}
          icon={CalendarCheck}
        />
        <SummaryCard
          label={t('assistant.humanHandoff')}
          value={t('common.on')}
          description={t('settings.owner')}
          icon={ShieldCheck}
        />
        <SummaryCard
          label={t('assistant.reminders')}
          value={formDraft.reminderEnabled ? t('common.enabled') : t('common.disabled')}
          description={t('assistant.bookingRulesDescription')}
          icon={Bell}
        />
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-emerald-600" />
              <CardTitle>{t('assistant.testAssistant')}</CardTitle>
            </div>
          <CardDescription>{t('assistant.previewPrompt')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="test-message">{t('assistant.customerMessage')}</Label>
            <Textarea
              id="test-message"
              rows={5}
              value={testMessage}
              onChange={(event) => setTestMessage(event.target.value)}
              className="bg-white resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('assistant.preview')}</Label>
            <div className="min-h-[132px] rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {testResponse}
            </div>
            <p className="text-xs text-gray-500">{t('assistant.previewOnly')}</p>
          </div>
        </CardContent>
      </Card>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle>{t('assistant.replyStyle')}</CardTitle>
            </div>
            <CardDescription>{t('assistant.replyStyleDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">{t('assistant.assistantName')}</Label>
                <Input
                  id="assistant-name"
                  value={formDraft.assistantName}
                  onChange={(event) =>
                    setFormDraft((current) => ({
                      ...current,
                      assistantName: event.target.value,
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('assistant.tone')}</Label>
                <Select
                  value={formDraft.tone}
                  onValueChange={(value) =>
                    setFormDraft((current) => ({
                      ...current,
                      tone: value as AiSettingsDraft['tone'],
                    }))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">{t('assistant.friendly')}</SelectItem>
                    <SelectItem value="professional">{t('assistant.professional')}</SelectItem>
                    <SelectItem value="formal">{t('assistant.formal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-language">{t('assistant.defaultLanguage')}</Label>
                <Select
                  value={formDraft.defaultLanguage}
                  onValueChange={(value) =>
                    setFormDraft((current) => ({
                      ...current,
                      defaultLanguage: value,
                    }))
                  }
                >
                  <SelectTrigger id="default-language" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('assistant.english')}</SelectItem>
                    <SelectItem value="bn">{t('assistant.bangla')}</SelectItem>
                    <SelectItem value="en-bn">{t('assistant.englishBangla')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting-message">{t('assistant.greetingMessage')}</Label>
              <Textarea
                id="greeting-message"
                rows={4}
                value={formDraft.greetingMessage}
                onChange={(event) =>
                  setFormDraft((current) => ({
                    ...current,
                    greetingMessage: event.target.value,
                  }))
                }
                className="bg-white resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle>{t('assistant.bookingRules')}</CardTitle>
            </div>
            <CardDescription>{t('assistant.bookingRulesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-confirm">{t('assistant.autoConfirmBookings')}</Label>
                <p className="text-sm text-gray-500">{t('assistant.autoConfirmBookingsDescription')}</p>
              </div>
              <Switch
                id="auto-confirm"
                checked={formDraft.autoConfirmBookings}
                onCheckedChange={(checked) =>
                  setFormDraft((current) => ({
                    ...current,
                    autoConfirmBookings: checked,
                  }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="reminders">{t('assistant.sendBookingReminders')}</Label>
                <p className="text-sm text-gray-500">{t('assistant.sendBookingRemindersDescription')}</p>
              </div>
              <Switch
                id="reminders"
                checked={formDraft.reminderEnabled}
                onCheckedChange={(checked) =>
                  setFormDraft((current) => ({
                    ...current,
                    reminderEnabled: checked,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-blue-600" />
              <CardTitle>{t('assistant.fallbackAndHandoff')}</CardTitle>
              </div>
            <CardDescription>{t('assistant.fallbackAndHandoffDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handoff-message">{t('assistant.humanHandoffMessage')}</Label>
              <Textarea
                id="handoff-message"
                rows={4}
                value={formDraft.humanHandoffMessage}
                onChange={(event) =>
                  setFormDraft((current) => ({
                    ...current,
                    humanHandoffMessage: event.target.value,
                  }))
                }
                className="bg-white resize-none"
              />
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">{t('assistant.lastSaved')}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(lastSavedAt, t('assistant.notSavedYet'))}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleReset} disabled={!isDirty || saving}>
            {t('assistant.reset')}
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!isDirty || loading || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {t('assistant.saveAssistant')}
          </Button>
        </div>
      </form>
    </div>
  );
}
