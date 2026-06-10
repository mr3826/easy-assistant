import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { MessageSquare, Facebook, Send, Globe, Smartphone, Copy, Check } from 'lucide-react';

const channels = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Cloud API',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    status: 'connected',
    description: 'Connect your WhatsApp Business account to receive booking requests',
    apiKey: 'wa_live_3k8s9d2j4k5l6m7n8o9p',
    setupSteps: [
      'Create a Facebook Business account',
      'Register your WhatsApp Business number',
      'Get your API credentials',
      'Paste the API key below',
    ],
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    status: 'connected',
    description: 'Integrate with your Facebook Page to handle bookings via Messenger',
    apiKey: 'fb_page_9x8y7z6w5v4u3t2s1r',
    setupSteps: [
      'Connect your Facebook Page',
      'Enable Messenger on your page',
      'Authorize the BookingAI app',
      'Configure automated responses',
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    icon: Send,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    status: 'disconnected',
    description: 'Let customers book appointments through your Telegram bot',
    apiKey: '',
    setupSteps: [
      'Talk to @BotFather on Telegram',
      'Create your bot and get token',
      'Paste the bot token below',
      'Share your bot link with customers',
    ],
  },
  {
    id: 'webchat',
    name: 'Web Chat Widget',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    status: 'connected',
    description: 'Add a booking chatbot to your website',
    apiKey: 'widget_c1d2e3f4g5h6i7j8k9',
    setupSteps: [
      'Copy the embed code',
      'Paste it before </body> tag on your website',
      'Customize widget appearance',
      'Test the chat widget',
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile SDK (Flutter)',
    icon: Smartphone,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    status: 'disconnected',
    description: 'Integrate booking AI into your mobile app',
    apiKey: '',
    setupSteps: [
      'Install the BookingAI Flutter package',
      'Initialize with your API key',
      'Configure booking flow in your app',
      'Test the integration',
    ],
  },
];

export default function ChannelConnection() {
  const [actionStatus, setActionStatus] = useState('');

  const copyApiKey = async (channelName: string, apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setActionStatus(`${channelName} API key copied.`);
    } catch {
      setActionStatus(`${channelName} API key is ready to copy.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1>Channel Connections</h1>
        <p className="text-gray-500">Connect your communication channels to start receiving bookings</p>
      </div>
      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Connected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {channels.filter((c) => c.status === 'connected').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {channels.filter((c) => c.status === 'disconnected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const isConnected = channel.status === 'connected';

          return (
            <Card key={channel.id} className="relative overflow-hidden">
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${channel.bgColor} opacity-20 rounded-full -mr-16 -mt-16`}
              />

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${channel.bgColor} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${channel.color}`} />
                    </div>
                    <div>
                      <CardTitle>{channel.name}</CardTitle>
                      <CardDescription className="mt-1">{channel.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                    <span className="text-sm text-gray-500">{channel.status}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isConnected ? 'outline' : 'default'}
                    className={isConnected ? '' : 'bg-blue-600 hover:bg-blue-700'}
                    disabled
                    title={
                      isConnected
                        ? `${channel.name} is already connected in demo data`
                        : `${channel.name} connection is disabled in demo mode`
                    }
                    aria-label={
                      isConnected
                        ? `${channel.name} already connected in demo data`
                        : `Connect ${channel.name} unavailable in demo mode`
                    }
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>

                {channel.apiKey && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={channel.apiKey}
                        className="bg-gray-50 text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyApiKey(channel.name, channel.apiKey)}
                        aria-label={`Copy ${channel.name} API key`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
