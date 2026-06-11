import { useEffect, useMemo, useState } from 'react';
import { Bell, Bot, Languages, MessageSquare, RefreshCw, Save, Undo2, type LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { LoadingFallback } from '../guards';
import { fetchAiSettings, updateAiSettings, type TenantScope } from '../../api';
import type { AiSettings } from '../../types';

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

const DEFAULT_AI_SETTINGS: AiSettingsDraft = {
  assistantName: 'Easy Assistant',
  tone: 'friendly',
  defaultLanguage: 'en',
  greetingMessage: "Hi! I'm your booking assistant. How can I help you today?",
  humanHandoffMessage: 'Thanks. A human team member will take it from here.',
  autoConfirmBookings: true,
  reminderEnabled: false,
};

function cloneDraft(value: AiSettingsDraft) {
  return { ...value };
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

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not saved yet';
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
  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const [serverDraft, setServerDraft] = useState<AiSettingsDraft>(cloneDraft(DEFAULT_AI_SETTINGS));
  const [formDraft, setFormDraft] = useState<AiSettingsDraft>(cloneDraft(DEFAULT_AI_SETTINGS));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const loadSettings = async (nextScope: TenantScope | null = scope) => {
    if (!nextScope) {
      setServerDraft(cloneDraft(DEFAULT_AI_SETTINGS));
      setFormDraft(cloneDraft(DEFAULT_AI_SETTINGS));
      setLastSavedAt(null);
      setFeedback({
        tone: 'info',
        text: 'Sign in to edit AI settings.',
      });
      setLoading(false);
      setHydrated(true);
      return;
    }

    setLoading(true);
    try {
      const settings = await fetchAiSettings(nextScope);
      const nextDraft = settings ? toDraft(settings) : cloneDraft(DEFAULT_AI_SETTINGS);
      setServerDraft(cloneDraft(nextDraft));
      setFormDraft(cloneDraft(nextDraft));
      setLastSavedAt(settings?.updatedAt ?? null);
      setFeedback({
        tone: 'success',
        text: settings ? 'Loaded AI settings from the server.' : 'Loaded default AI settings.',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to load AI settings.',
      });
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  };

  useEffect(() => {
    void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  if (isLoading) {
    return <LoadingFallback message="Loading AI settings..." />;
  }

  if (!scope) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">Sign in to edit AI settings.</p>
      </div>
    );
  }

  if (!hydrated) {
    return <LoadingFallback message="Loading AI settings..." />;
  }

  const isDirty = !draftsMatch(formDraft, serverDraft);

  const handleReset = () => {
    setFormDraft(cloneDraft(serverDraft));
    setFeedback({
      tone: 'info',
      text: 'Unsaved changes were discarded.',
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
        text: 'AI settings saved.',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to save AI settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1>AI Settings</h1>
          <p className="text-gray-500">Configure the receptionist behavior used for WhatsApp bookings.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSettings()}
            disabled={loading || saving}
            title="Reload settings from the server"
            aria-label="Reload AI settings"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || saving}
            title="Discard unsaved changes"
            aria-label="Discard AI settings changes"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
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
          label="Assistant"
          value={formDraft.assistantName}
          description="Name used in AI replies"
          icon={Bot}
        />
        <SummaryCard
          label="Tone"
          value={formDraft.tone}
          description="Current conversation style"
          icon={MessageSquare}
        />
        <SummaryCard
          label="Language"
          value={formDraft.defaultLanguage}
          description="Default assistant language"
          icon={Languages}
        />
        <SummaryCard
          label="Reminder"
          value={formDraft.reminderEnabled ? 'Enabled' : 'Disabled'}
          description={formatDateTime(lastSavedAt)}
          icon={Bell}
        />
      </div>

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
              <CardTitle>Conversation</CardTitle>
            </div>
            <CardDescription>Greeting text and tone controls for the receptionist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Assistant name</Label>
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
                <Label>Tone</Label>
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
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-language">Default language</Label>
                <Input
                  id="default-language"
                  value={formDraft.defaultLanguage}
                  onChange={(event) =>
                    setFormDraft((current) => ({
                      ...current,
                      defaultLanguage: event.target.value,
                    }))
                  }
                  placeholder="en"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greeting-message">Greeting message</Label>
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
              <CardTitle>Automation</CardTitle>
            </div>
            <CardDescription>Booking confirmation and reminder behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-confirm">Auto-confirm bookings</Label>
                <p className="text-sm text-gray-500">Confirm bookings automatically when the slot is valid.</p>
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
                <Label htmlFor="reminders">Reminder enabled</Label>
                <p className="text-sm text-gray-500">Enable reminder scheduling for confirmed appointments.</p>
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
              <CardTitle>Handoff</CardTitle>
            </div>
            <CardDescription>Message sent when the assistant should step back.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handoff-message">Human handoff message</Label>
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
              <p className="text-xs uppercase tracking-wide text-gray-500">Last saved</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(lastSavedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={handleReset} disabled={!isDirty || saving}>
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!isDirty || loading || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
