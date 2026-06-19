import { useEffect, useMemo, useState } from 'react';
import { Bot, CalendarPlus, MessageSquare, Search, Send, Shield, User, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import {
  closeConversation,
  fetchChannels,
  fetchConversationDetail,
  fetchConversationMessages,
  fetchConversations,
  fetchCustomers,
  sendConversationMessage,
  takeoverConversation,
  type ConversationThreadDetail,
  type ConversationThreadSummary,
  type SendConversationMessageInput,
  type TenantScope,
} from '../../api';
import type { Channel, Customer, Message } from '../../types';

type StateTone = 'ai' | 'human' | 'closed';

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

function formatShortTime(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function conversationLabel(
  thread: ConversationThreadSummary | null,
  customerById: Map<string, Customer>,
  channelById: Map<string, Channel>,
  t: (path: string) => string,
) {
  if (!thread) {
    return t('conversations.selectConversation');
  }

  const customer = thread.customerName
    ?? (thread.customerId ? customerById.get(thread.customerId)?.name ?? null : null)
    ?? (thread.customerId ? customerById.get(thread.customerId)?.phone ?? null : null);

  if (customer) {
    return customer;
  }

  const channelName = thread.channelName ?? channelById.get(thread.channelId)?.name;
  if (channelName) {
    return `${channelName} ${t('conversations.conversationSuffix')}`;
  }

  return `${t('conversations.conversationPrefix')} ${thread.id.slice(0, 8)}`;
}

function channelLabel(thread: ConversationThreadSummary | null, channelById: Map<string, Channel>, t: (path: string) => string) {
  if (!thread) {
    return t('conversations.noChannel');
  }

  return thread.channelName
    ?? channelById.get(thread.channelId)?.name
    ?? thread.channelType
    ?? t('conversations.unlinkedChannel');
}

function conversationTone(state: ConversationThreadSummary['state']): StateTone {
  if (state === 'closed') {
    return 'closed';
  }

  return state === 'human_handled' ? 'human' : 'ai';
}

function toneClasses(tone: StateTone) {
  switch (tone) {
    case 'human':
      return 'bg-blue-100 text-blue-700';
    case 'closed':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-green-100 text-green-700';
  }
}

function stateLabel(state: ConversationThreadSummary['state'], t: (path: string) => string) {
  switch (state) {
    case 'human_handled':
      return t('conversations.needsHuman');
    case 'closed':
      return t('conversations.closed');
    default:
      return t('conversations.aiReplied');
  }
}

function hasBookingSignal(thread: ConversationThreadSummary) {
  const preview = `${thread.lastMessagePreview ?? ''} ${thread.customerName ?? ''}`.toLowerCase();
  return preview.includes('book') || preview.includes('appointment') || preview.includes('service');
}

function senderLabel(message: Message, t: (path: string) => string) {
  switch (message.sender) {
    case 'customer':
      return t('conversations.customer');
    case 'ai':
      return t('conversations.assistant');
    case 'human':
      return t('conversations.human');
    default:
      return t('conversations.system');
  }
}

function senderIcon(message: Message) {
  switch (message.sender) {
    case 'customer':
      return User;
    case 'ai':
      return Bot;
    case 'human':
      return Shield;
    default:
      return MessageSquare;
  }
}

function bubbleClasses(message: Message) {
  if (message.sender === 'customer') {
    return 'bg-gray-100 text-gray-900';
  }

  if (message.sender === 'system') {
    return 'bg-amber-50 text-amber-900';
  }

  return 'bg-slate-900 text-white';
}

export default function ConversationsPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [conversations, setConversations] = useState<ConversationThreadSummary[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ConversationThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState('');
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

  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const channelById = useMemo(() => new Map(channels.map((channel) => [channel.id, channel])), [channels]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const resolvedThread = useMemo<ConversationThreadDetail | null>(() => {
    if (!selectedConversation) {
      return selectedThread;
    }

    return {
      conversation: selectedThread?.conversation ?? selectedConversation,
      customer:
        selectedThread?.customer
        ?? (selectedConversation.customerId ? customerById.get(selectedConversation.customerId) ?? null : null),
      channel:
        selectedThread?.channel
        ?? channelById.get(selectedConversation.channelId)
        ?? null,
      messages: selectedThread?.messages ?? [],
    };
  }, [channelById, customerById, selectedConversation, selectedThread]);

  const loadInbox = async (clearStatus = true) => {
    if (!scope) {
      setLoading(false);
      return;
    }

    setLoading(true);
    if (clearStatus) {
      setActionStatus('');
    }

    const [conversationsResult, channelsResult, customersResult] = await Promise.allSettled([
      fetchConversations(scope),
      fetchChannels(scope),
      fetchCustomers(scope),
    ]);

    setConversations(conversationsResult.status === 'fulfilled' ? conversationsResult.value : []);
    setChannels(channelsResult.status === 'fulfilled' ? channelsResult.value : []);
    setCustomers(customersResult.status === 'fulfilled' ? customersResult.value : []);
    setLoading(false);
  };

  useEffect(() => {
    void loadInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, t]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null);
      setSelectedThread(null);
      return;
    }

    if (!selectedConversationId || !conversations.some((conversation) => conversation.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0]!.id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    let active = true;

    async function loadThread() {
      if (!scope || !selectedConversationId) {
        setSelectedThread(null);
        return;
      }

      setThreadLoading(true);

      const [detailResult, messagesResult] = await Promise.allSettled([
        fetchConversationDetail(scope, selectedConversationId),
        fetchConversationMessages(scope, selectedConversationId),
      ]);

      if (!active) {
        return;
      }

      const conversation = selectedConversation;
      const detail = detailResult.status === 'fulfilled' ? detailResult.value : null;
      const messages = messagesResult.status === 'fulfilled' ? messagesResult.value : [];

      if (!conversation && !detail) {
        setSelectedThread(null);
        setThreadLoading(false);
        return;
      }

      setSelectedThread({
        conversation: detail?.conversation ?? conversation!,
        customer:
          detail?.customer
          ?? (conversation?.customerId ? customerById.get(conversation.customerId) ?? null : null),
        channel:
          detail?.channel
          ?? (conversation ? channelById.get(conversation.channelId) ?? null : null),
        messages: detail?.messages?.length ? detail.messages : messages,
      });
      setThreadLoading(false);
    }

    void loadThread();

    return () => {
      active = false;
    };
  }, [channelById, customerById, scope, selectedConversation, selectedConversationId, t]);

  const selectedStateTone = conversationTone(resolvedThread?.conversation.state ?? 'ai_handled');
  const selectedConversationStatus = resolvedThread?.conversation.state ?? 'ai_handled';
  const canReply = Boolean(resolvedThread && resolvedThread.conversation.state !== 'closed' && !saving);

  const refreshAfterAction = async () => {
    await loadInbox(false);
    if (selectedConversationId) {
      setThreadLoading(true);
      const [detailResult, messagesResult] = await Promise.allSettled([
        fetchConversationDetail(scope!, selectedConversationId),
        fetchConversationMessages(scope!, selectedConversationId),
      ]);

      const detail = detailResult.status === 'fulfilled' ? detailResult.value : null;
      const messages = messagesResult.status === 'fulfilled' ? messagesResult.value : [];
      const conversation = conversations.find((item) => item.id === selectedConversationId) ?? null;

      if (conversation || detail) {
        setSelectedThread({
          conversation: detail?.conversation ?? conversation!,
          customer:
            detail?.customer
            ?? (conversation?.customerId ? customerById.get(conversation.customerId) ?? null : null),
          channel:
            detail?.channel
            ?? (conversation ? channelById.get(conversation.channelId) ?? null : null),
          messages: detail?.messages?.length ? detail.messages : messages,
        });
      }

      setThreadLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!scope || !selectedConversationId) {
      setActionStatus(t('conversations.selectConversationPrompt'));
      return;
    }

    const text = draft.trim();
    if (!text) {
      setActionStatus(t('conversations.typeReply'));
      return;
    }

    setSaving(true);
    try {
      const payload: SendConversationMessageInput = {
        body: text,
        sender: 'human',
        direction: 'outbound',
      };

      await sendConversationMessage(scope, selectedConversationId, payload);
      setDraft('');
      setActionStatus(t('conversations.repliedTo'));
      await refreshAfterAction();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('conversations.sendReply'));
    } finally {
      setSaving(false);
    }
  };

  const handleTakeover = async () => {
    if (!scope || !selectedConversationId) {
      return;
    }

    setSaving(true);
    try {
      await takeoverConversation(scope, selectedConversationId);
      setActionStatus(t('conversations.handoffToHuman'));
      await refreshAfterAction();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('conversations.handoffToHuman'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!scope || !selectedConversationId) {
      return;
    }

    setSaving(true);
    try {
      await closeConversation(scope, selectedConversationId);
      setActionStatus(t('conversations.closed'));
      await refreshAfterAction();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('conversations.closed'));
    } finally {
      setSaving(false);
    }
  };

  const stateBadgeLabel = stateLabel(selectedConversationStatus, t);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1>{t('conversations.title')}</h1>
        <p className="text-gray-500">{t('conversations.subtitle')}</p>
      </div>

      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="min-h-[520px] lg:min-h-[720px]">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              {t('conversations.assistantInbox')}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder={t('conversations.searchPlaceholder')} className="pl-9 bg-white" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 pb-4 text-sm text-gray-500">{t('conversations.loading')}</div>
            ) : conversations.length === 0 ? (
              <div className="mx-4 mb-4 rounded-lg border border-dashed border-gray-200 p-6 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 font-medium text-gray-900">{t('conversations.noConversations')}</p>
                <p className="mt-1 text-sm text-gray-500">{t('conversations.connectInboxPrompt')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActionStatus(t('conversations.openWhatsAppSetup'))}
                >
                  {t('conversations.connectWhatsApp')}
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[420px] lg:h-[620px]">
                <div className="space-y-1 px-2 pb-3">
                  {conversations.map((conversation) => {
                    const channel = channelById.get(conversation.channelId);
                    const isActive = conversation.id === selectedConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                          isActive ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium">{conversationLabel(conversation, customerById, channelById, t)}</p>
                            <p className="truncate text-sm text-gray-500">
                              {conversation.lastMessagePreview ?? channelLabel(conversation, channelById, t)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Badge variant="outline" className="text-xs">
                                {channel?.name ?? conversation.channelType ?? t('conversations.channel')}
                              </Badge>
                              <Badge className={`text-xs ${toneClasses(conversationTone(conversation.state))}`}>
                                {stateLabel(conversation.state, t)}
                              </Badge>
                              {hasBookingSignal(conversation) && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">{t('conversations.bookingDetected')}</Badge>
                              )}
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-xs text-gray-500">
                            {formatDateTime(conversation.lastMessageAt ?? conversation.updatedAt, t('conversations.unknownTime'))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[520px] lg:min-h-[720px]">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  {conversationLabel(selectedConversation, customerById, channelById, t)}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{channelLabel(selectedConversation, channelById, t)}</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatDateTime(resolvedThread?.conversation.lastMessageAt ?? null, t('conversations.unknownTime'))}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={toneClasses(selectedStateTone)}>{stateBadgeLabel}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTakeover}
                  disabled={!selectedConversationId || saving || selectedConversationStatus === 'human_handled' || selectedConversationStatus === 'closed'}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('conversations.handoffToHuman')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionStatus(t('conversations.createBooking'))}
                  disabled={!selectedConversationId || saving || selectedConversationStatus === 'closed'}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {t('conversations.createBooking')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={!selectedConversationId || saving || selectedConversationStatus === 'closed'}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('conversations.close')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedConversationId ? (
              <div className="px-4 py-8 text-sm text-gray-500">{t('conversations.selectConversation')}</div>
            ) : threadLoading ? (
              <div className="px-4 py-8 text-sm text-gray-500">{t('conversations.loadingThread')}</div>
            ) : !resolvedThread ? (
              <div className="px-4 py-8 text-sm text-gray-500">{t('conversations.noThread')}</div>
            ) : (
              <>
                <ScrollArea className="h-[420px] p-4 lg:h-[520px]">
                  <div className="space-y-4">
                    {resolvedThread.messages.length === 0 ? (
                      <div className="rounded-md border border-dashed border-gray-200 p-6 text-sm text-gray-500">
                        {t('conversations.noMessagesYet')}
                      </div>
                    ) : (
                      resolvedThread.messages.map((message) => {
                        const Icon = senderIcon(message);
                        const alignRight = message.sender !== 'customer';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[78%] ${alignRight ? 'text-right' : 'text-left'}`}>
                              <div className={`inline-block rounded-lg px-3 py-3 ${bubbleClasses(message)}`}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium opacity-90">{senderLabel(message, t)}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
                              </div>
                              <p className="mt-1 px-1 text-xs text-gray-500">{formatShortTime(message.sentAt, t('conversations.unknownTime'))}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-3">
                      <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={canReply ? t('conversations.typeReply') : t('conversations.closedReadOnly')}
                      className="min-h-[96px] bg-white"
                      disabled={!canReply}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        {selectedConversationStatus === 'closed'
                          ? t('conversations.closedReadOnly')
                          : selectedConversationStatus === 'human_handled'
                            ? t('conversations.replyAsHuman')
                            : t('conversations.replyAsAssistant')}
                      </p>
                      <Button className="bg-slate-900 hover:bg-slate-800" onClick={sendMessage} disabled={!canReply}>
                        <Send className="mr-2 h-4 w-4" />
                        {t('conversations.sendReply')}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
