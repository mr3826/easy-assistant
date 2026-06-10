import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, MessageSquare, HelpCircle, Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollArea } from '../ui/scroll-area';

const tickets = [
  { id: 'TKT-001', subject: 'Cannot connect WhatsApp', status: 'open', priority: 'high', date: '2025-11-20' },
  { id: 'TKT-002', subject: 'Billing question', status: 'pending', priority: 'medium', date: '2025-11-19' },
  { id: 'TKT-003', subject: 'Feature request: Email notifications', status: 'closed', priority: 'low', date: '2025-11-18' },
];

const initialMessages = [
  { id: 1, sender: 'support', text: 'Hi! How can I help you today?', time: '10:00 AM' },
];

const faqs = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I connect my first channel?', a: 'Go to Channels page, select your preferred channel, and follow the setup instructions. You\'ll need to provide API credentials from that platform.' },
      { q: 'What plan should I choose?', a: 'Start with the Starter plan if you have less than 100 bookings per month. Upgrade to Professional for unlimited bookings and all channels.' },
    ]
  },
  {
    category: 'AI Settings',
    items: [
      { q: 'How do I customize AI responses?', a: 'Visit AI Settings page to adjust tone, language, and upload training documents to customize how your AI assistant responds.' },
      { q: 'Can the AI handle multiple languages?', a: 'Yes! Select "Multi-language (Auto-detect)" in AI Settings to enable automatic language detection and response.' },
    ]
  },
  {
    category: 'Billing',
    items: [
      { q: 'How do I change my plan?', a: 'Go to Billing page, scroll to Available Plans section, and click Upgrade on your desired plan.' },
      { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time from the Billing page. You\'ll retain access until the end of your billing period.' },
    ]
  },
];

export default function SupportPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [chatDraft, setChatDraft] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  const sendSupportMessage = () => {
    const text = chatDraft.trim();

    if (!text) {
      setActionStatus('Type a support message before sending.');
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: current.length + 1,
        sender: 'user',
        text,
        time: 'Now',
      },
    ]);
    setChatDraft('');
    setActionStatus('Support message added locally for this demo.');
  };

  return (
    <div className="space-y-6">
        <div>
          <h1>Support Center</h1>
          <p className="text-gray-500">Get help with your BookingAI account</p>
        </div>
        {actionStatus && (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {actionStatus}
          </p>
        )}

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="chat">Live Chat</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Support Tickets */}
          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Support Tickets</CardTitle>
                  <CardDescription>View and manage your support requests</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Support Ticket</DialogTitle>
                      <DialogDescription>Describe your issue and we&apos;ll help you resolve it</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input placeholder="Brief description of the issue" className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="billing">Billing Question</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea 
                          placeholder="Please provide details about your issue..."
                          className="bg-white resize-none"
                          rows={5}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setActionStatus('Support ticket saved locally for this demo.')}
                        >
                          Submit Ticket
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono">{ticket.id}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              ticket.priority === 'high' ? 'border-red-500 text-red-700' :
                              ticket.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-gray-500 text-gray-700'
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.date}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActionStatus(`${ticket.id} opened in demo view mode.`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Chat */}
          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <CardTitle>Live Chat Support</CardTitle>
                </div>
                <CardDescription>Chat with our support team in real-time</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%]`}>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-1">{msg.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          sendSupportMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="bg-white"
                    />
                    <Button
                      type="button"
                      onClick={sendSupportMessage}
                      className="bg-blue-600 hover:bg-blue-700"
                      aria-label="Send demo support message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱ Average response time: 2 minutes
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
                <CardDescription>Find quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((category) => (
                    <div key={category.category}>
                      <h3 className="font-semibold mb-3">{category.category}</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.items.map((item, idx) => (
                          <AccordionItem key={idx} value={`item-${idx}`}>
                            <AccordionTrigger>{item.q}</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-gray-600">{item.a}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Can&apos;t find what you&apos;re looking for? 
                    <Button
                      variant="link"
                      className="h-auto p-0 ml-1"
                      onClick={() => setActionStatus('Use New Ticket or Live Chat to contact support in this demo.')}
                    >
                      Contact Support →
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
