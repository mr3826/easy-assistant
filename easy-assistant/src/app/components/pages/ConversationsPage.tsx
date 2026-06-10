import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search, Send, Bot } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const conversations = [
  { id: 1, customer: 'Sarah Johnson', lastMessage: 'Thanks for booking my appointment!', time: '2 min ago', unread: 0, channel: 'WhatsApp' },
  { id: 2, customer: 'Mike Peters', lastMessage: 'Can I reschedule to tomorrow?', time: '15 min ago', unread: 2, channel: 'Facebook' },
  { id: 3, customer: 'Anna Williams', lastMessage: 'Perfect, see you then!', time: '1 hour ago', unread: 0, channel: 'Web' },
  { id: 4, customer: 'John Davis', lastMessage: 'What services do you offer?', time: '2 hours ago', unread: 1, channel: 'Telegram' },
];

const initialMessages = [
  { id: 1, sender: 'customer', text: 'Hi, I\'d like to book an appointment', time: '10:00 AM' },
  { id: 2, sender: 'ai', text: 'Hello! I\'d be happy to help you book an appointment. What service are you interested in?', time: '10:00 AM' },
  { id: 3, sender: 'customer', text: 'I need a haircut', time: '10:01 AM' },
  { id: 4, sender: 'ai', text: 'Great! We have haircut appointments available. When would you prefer to come in?', time: '10:01 AM' },
  { id: 5, sender: 'customer', text: 'Tomorrow afternoon if possible', time: '10:02 AM' },
  { id: 6, sender: 'ai', text: 'I have the following times available tomorrow afternoon: 2:00 PM, 3:30 PM, and 4:00 PM. Which works best for you?', time: '10:02 AM' },
  { id: 7, sender: 'customer', text: '3:30 PM would be perfect', time: '10:03 AM' },
  { id: 8, sender: 'ai', text: 'Excellent! I\'ve booked your haircut appointment for tomorrow at 3:30 PM with Emily Chen. Can I get your name and phone number to confirm?', time: '10:03 AM' },
];

export default function ConversationsPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [isHumanHandled, setIsHumanHandled] = useState(false);
  const [actionStatus, setActionStatus] = useState('');

  const sendMessage = () => {
    const text = draft.trim();

    if (!text) {
      setActionStatus('Type a message before sending.');
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
    setDraft('');
    setActionStatus('Message added locally for this demo.');
  };

  return (
    <div className="space-y-6">
        <div>
          <h1>AI Conversations</h1>
          <p className="text-gray-500">View and manage AI chat logs with customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search conversations..." className="pl-10 bg-white" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {conv.customer.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{conv.customer}</p>
                          <span className="text-xs text-gray-500">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{conv.channel}</Badge>
                          {conv.unread > 0 && (
                            <Badge className="bg-blue-600 text-xs">{conv.unread} new</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-600 text-white">SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>Sarah Johnson</CardTitle>
                    <p className="text-sm text-gray-500">via WhatsApp • Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={isHumanHandled ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                    {isHumanHandled ? 'Human Handled' : 'AI Handled'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsHumanHandled(true);
                      setActionStatus('You are handling this conversation in demo mode.');
                    }}
                    disabled={isHumanHandled}
                    aria-label={isHumanHandled ? 'Conversation already taken over' : 'Take over this conversation'}
                  >
                    Take Over
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] ${msg.sender === 'customer' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            msg.sender === 'customer'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {msg.sender === 'ai' && (
                            <div className="flex items-center gap-1 mb-1">
                              <Bot className="w-3 h-3" />
                              <span className="text-xs opacity-90">AI Assistant</span>
                            </div>
                          )}
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
                    placeholder="Type a message..."
                    className="bg-white"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={sendMessage}
                    aria-label="Send demo message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {actionStatus && (
                  <p className="text-xs text-green-700 mt-2" role="status" aria-live="polite">
                    {actionStatus}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This conversation is being handled by {isHumanHandled ? 'you' : 'AI'}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
  );
}
