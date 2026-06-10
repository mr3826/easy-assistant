import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, MessageSquare, Ban, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const dailyBookings = [
  { date: 'Nov 15', bookings: 12, completed: 10, cancelled: 2 },
  { date: 'Nov 16', bookings: 19, completed: 17, cancelled: 2 },
  { date: 'Nov 17', bookings: 15, completed: 14, cancelled: 1 },
  { date: 'Nov 18', bookings: 22, completed: 20, cancelled: 2 },
  { date: 'Nov 19', bookings: 28, completed: 25, cancelled: 3 },
  { date: 'Nov 20', bookings: 25, completed: 23, cancelled: 2 },
  { date: 'Nov 21', bookings: 18, completed: 16, cancelled: 2 },
];

const customerActivity = [
  { hour: '8AM', conversations: 5 },
  { hour: '10AM', conversations: 15 },
  { hour: '12PM', conversations: 28 },
  { hour: '2PM', conversations: 32 },
  { hour: '4PM', conversations: 25 },
  { hour: '6PM', conversations: 18 },
  { hour: '8PM', conversations: 8 },
];

const channelData = [
  { name: 'WhatsApp', value: 450, color: '#25D366' },
  { name: 'Facebook', value: 320, color: '#1877F2' },
  { name: 'Web Widget', value: 180, color: '#2563eb' },
  { name: 'Telegram', value: 90, color: '#0088cc' },
];

const aiPerformance = [
  { metric: 'Understanding Rate', value: 96.5, target: 95 },
  { metric: 'Booking Success', value: 94.2, target: 90 },
  { metric: 'Response Accuracy', value: 97.8, target: 95 },
  { metric: 'Customer Satisfaction', value: 92.1, target: 85 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7days');
  const [actionStatus, setActionStatus] = useState('');

  const dateRangeLabels: Record<string, string> = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    '90days': 'Last 90 Days',
    year: 'This Year',
  };

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Analytics</h1>
            <p className="text-gray-500">Track your performance and customer insights</p>
          </div>
          <Select
            value={dateRange}
            onValueChange={(value) => {
              setDateRange(value);
              setActionStatus(`Showing demo analytics for ${dateRangeLabels[value]}.`);
            }}
          >
            <SelectTrigger className="w-40 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {actionStatus && (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {actionStatus}
          </p>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Total Bookings</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,847</div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+18.2%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">No-Show Rate</CardTitle>
              <Ban className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.8%</div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-green-600">-1.2%</span> improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Reschedule Rate</CardTitle>
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-red-600" />
                <span className="text-red-600">+2.1%</span> from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm text-gray-600">Unique Customers</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">892</div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+24.5%</span> new customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Bookings Trend</CardTitle>
              <CardDescription>Bookings vs. completed appointments over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyBookings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} name="Total Bookings" />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Activity</CardTitle>
              <CardDescription>Conversation volume by time of day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversations" fill="#2563eb" name="Conversations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Conversion</CardTitle>
              <CardDescription>Successful bookings by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {channelData.map((channel) => (
                  <div key={channel.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{channel.name}</p>
                      <p className="font-medium">{channel.value} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Performance Metrics</CardTitle>
              <CardDescription>Key AI performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiPerformance.map((item) => (
                  <div key={item.metric} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.metric}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full ${item.value >= item.target ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Target: {item.target}% • 
                      {item.value >= item.target ? (
                        <span className="text-green-600 ml-1">✓ Target met</span>
                      ) : (
                        <span className="text-yellow-600 ml-1">⚠ Below target</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <CardTitle>Conversation Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Conversations</span>
                <span className="font-medium">2,341</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Duration</span>
                <span className="font-medium">2m 34s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium text-green-600">94.2%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <CardTitle>Booking Patterns</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Busiest Day</span>
                <span className="font-medium">Friday</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peak Hour</span>
                <span className="font-medium">2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Advance Booking</span>
                <span className="font-medium">4.2 days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle>Customer Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">New vs. Returning</span>
                <span className="font-medium">42% / 58%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Repeat Rate</span>
                <span className="font-medium text-green-600">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Lifetime Value</span>
                <span className="font-medium">$342</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
