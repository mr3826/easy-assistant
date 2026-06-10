import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Bot, Upload, Volume2, MessageSquare, Brain, Zap } from 'lucide-react';
import { Separator } from '../ui/separator';

export default function AISettings() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1>AI Settings</h1>
          <p className="text-gray-500">Configure your AI assistant&apos;s behavior and capabilities</p>
        </div>
        {actionStatus && (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {actionStatus}
          </p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">AI Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,847</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <p className="text-xs text-gray-500 mt-1">Successful bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Avg. Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-gray-500 mt-1">Response time</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Personality & Tone */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <CardTitle>Conversation Style</CardTitle>
            </div>
            <CardDescription>Define how your AI assistant communicates with customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tone Selector</Label>
              <Select defaultValue="friendly">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="professional">Professional & Formal</SelectItem>
                  <SelectItem value="warm">Warm & Empathetic</SelectItem>
                  <SelectItem value="concise">Concise & Direct</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic & Upbeat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select defaultValue="en">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="multi">Multi-language (Auto-detect)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Greeting Message</Label>
              <Textarea 
                placeholder="Hi! I'm your booking assistant. How can I help you today?"
                className="bg-white resize-none"
                rows={3}
                defaultValue="Hi! I'm your booking assistant. How can I help you today?"
              />
              <p className="text-xs text-gray-500">This message will be sent when customers first contact you</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Capabilities */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <CardTitle>AI Capabilities</CardTitle>
            </div>
            <CardDescription>Enable or disable specific AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Confirm Bookings</Label>
                <p className="text-sm text-gray-500">Automatically confirm bookings without manual approval</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Smart Rescheduling</Label>
                <p className="text-sm text-gray-500">Allow AI to suggest alternative times when slots are unavailable</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conversation Memory</Label>
                <p className="text-sm text-gray-500">Remember customer preferences and past conversations</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Reminders</Label>
                <p className="text-sm text-gray-500">Automatically send appointment reminders to customers</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Follow-up Messages</Label>
                <p className="text-sm text-gray-500">Send post-appointment follow-ups for feedback</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Voice Call Bot */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-600" />
              <CardTitle>Voice Call Bot</CardTitle>
            </div>
            <CardDescription>Enable AI-powered voice calling for phone bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Voice Call Bot</Label>
                <p className="text-sm text-gray-500">Allow customers to book via phone calls</p>
              </div>
              <Switch
                disabled
                title="Voice calling is disabled in demo mode"
                aria-label="Voice call bot unavailable in demo mode"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Pro Feature:</strong> Voice calling requires a Professional or Enterprise plan. 
                Upgrade to enable phone bookings with natural voice AI.
              </p>
              <Button
                variant="link"
                className="h-auto p-0 mt-2"
                disabled
                title="Plan upgrades are disabled in demo mode"
                aria-label="Upgrade plan unavailable in demo mode"
              >
                Upgrade Plan →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <CardTitle>Knowledge Base Training</CardTitle>
            </div>
            <CardDescription>Upload FAQs and training documents to improve AI responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload FAQ or Training Files</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-not-allowed opacity-75"
                aria-disabled="true"
                title="Training file upload is disabled in demo mode"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Upload disabled in demo
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, TXT, DOCX (Max 10MB)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              <div className="space-y-2">
                {[
                  { name: 'Service_FAQ.pdf', size: '245 KB', date: 'Nov 15, 2025' },
                  { name: 'Cancellation_Policy.txt', size: '12 KB', date: 'Nov 10, 2025' },
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="Training document removal is disabled in demo mode"
                      aria-label={`Remove ${doc.name} unavailable in demo mode`}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <CardTitle>Advanced Settings</CardTitle>
            </div>
            <CardDescription>Fine-tune AI behavior and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Response Creativity</Label>
              <Select defaultValue="balanced">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="precise">Precise (Consistent responses)</SelectItem>
                  <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                  <SelectItem value="creative">Creative (Varied responses)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fallback Behavior</Label>
              <Select defaultValue="human">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retry">Retry with clarification</SelectItem>
                  <SelectItem value="human">Transfer to human agent</SelectItem>
                  <SelectItem value="apologize">Apologize and collect info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setActionStatus('AI settings reset locally for this demo.')}
          >
            Reset to Defaults
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setActionStatus('AI settings saved locally for this demo.')}
          >
            Save Settings
          </Button>
        </div>
    </div>
  );
}
