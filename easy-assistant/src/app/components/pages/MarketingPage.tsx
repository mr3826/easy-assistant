import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Megaphone, Bell, MessageSquare } from 'lucide-react';
import { Separator } from '../ui/separator';

export default function MarketingPage() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
        <div>
          <h1>Marketing & Reminders</h1>
          <p className="text-gray-500">Automate customer communications and reminders</p>
        </div>
        {actionStatus && (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {actionStatus}
          </p>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle>Appointment Reminders</CardTitle>
            </div>
            <CardDescription>Send automated reminders to reduce no-shows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Appointment Reminders</Label>
                <p className="text-sm text-gray-500">Send automatic reminders before appointments</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Reminder Timing</Label>
              <Select defaultValue="24h">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour before</SelectItem>
                  <SelectItem value="3h">3 hours before</SelectItem>
                  <SelectItem value="24h">24 hours before</SelectItem>
                  <SelectItem value="48h">48 hours before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reminder Message Template</Label>
              <Textarea 
                placeholder="Hi {customer}, this is a reminder about your {service} appointment tomorrow at {time}."
                className="bg-white resize-none"
                rows={4}
                defaultValue="Hi {customer}, this is a reminder about your {service} appointment tomorrow at {time}."
              />
              <p className="text-xs text-gray-500">
                Available variables: {'{customer}'}, {'{service}'}, {'{time}'}, {'{date}'}, {'{staff}'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <CardTitle>Follow-up Messages</CardTitle>
            </div>
            <CardDescription>Collect feedback and encourage repeat bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Follow-ups</Label>
                <p className="text-sm text-gray-500">Send messages after appointments</p>
              </div>
              <Switch />
            </div>

            <div className="space-y-2">
              <Label>Send After</Label>
              <Select defaultValue="2h">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour after</SelectItem>
                  <SelectItem value="2h">2 hours after</SelectItem>
                  <SelectItem value="24h">1 day after</SelectItem>
                  <SelectItem value="48h">2 days after</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <CardTitle>Promotional Campaigns</CardTitle>
            </div>
            <CardDescription>Send special offers to your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g., Spring Special" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Your promotional message here..."
                className="bg-white resize-none"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="returning">Returning Customers</SelectItem>
                  <SelectItem value="inactive">Inactive Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setActionStatus('Campaign queued locally for this demo.')}
            >
              Send Campaign
            </Button>
          </CardContent>
        </Card>
        </div>
  );
}
