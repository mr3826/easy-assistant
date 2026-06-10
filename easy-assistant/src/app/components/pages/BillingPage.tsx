import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CreditCard, Download, Check, Zap, Star, Crown } from 'lucide-react';
import { Progress } from '../ui/progress';

const invoices = [
  { id: 'INV-001', date: '2025-11-01', amount: 79, status: 'paid', plan: 'Professional' },
  { id: 'INV-002', date: '2025-10-01', amount: 79, status: 'paid', plan: 'Professional' },
  { id: 'INV-003', date: '2025-09-01', amount: 29, status: 'paid', plan: 'Starter' },
  { id: 'INV-004', date: '2025-08-01', amount: 29, status: 'paid', plan: 'Starter' },
];

export default function BillingPage() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1>Billing & Subscription</h1>
        <p className="text-gray-500">Manage your plan, payment methods, and invoices</p>
      </div>
      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}

      {/* Current Plan */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Professional Plan</CardTitle>
                <CardDescription className="text-gray-700">Your current subscription</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">$79</div>
              <p className="text-sm text-gray-600">per month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-8">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Billing Cycle</p>
              <p className="font-medium">Monthly</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
              <p className="font-medium">December 1, 2025</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              disabled
              title="Plan changes are disabled in demo mode"
              aria-label="Change plan unavailable in demo mode"
            >
              Change Plan
            </Button>
            <Button
              variant="outline"
              disabled
              title="Subscription cancellation is disabled in demo mode"
              aria-label="Cancel subscription unavailable in demo mode"
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bookings This Month</CardTitle>
            <CardDescription>854 of unlimited bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-medium">Unlimited</span>
              </div>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                &#10003; Unlimited bookings included in your plan
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Messages</CardTitle>
            <CardDescription>12,847 of unlimited messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-medium">Unlimited</span>
              </div>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                &#10003; Unlimited AI conversations included
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              price: 29,
              icon: Zap,
              color: 'text-gray-600',
              bgColor: 'bg-gray-100',
              features: [
                '100 bookings per month',
                '1 communication channel',
                'Basic AI features',
                'Email support',
                'Basic analytics',
              ],
              current: false,
            },
            {
              name: 'Professional',
              price: 79,
              icon: Star,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100',
              features: [
                'Unlimited bookings',
                'All communication channels',
                'Advanced AI features',
                'Priority support',
                'Advanced analytics',
                'Custom branding',
              ],
              current: true,
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 199,
              icon: Crown,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100',
              features: [
                'Everything in Professional',
                'Custom AI training',
                'Dedicated account manager',
                'White-label solution',
                'API access',
                'SLA guarantee',
              ],
              current: false,
            },
          ].map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.name} className={`relative ${plan.current ? 'border-blue-600 border-2' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 ${plan.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${plan.color}`} />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.current ? 'outline' : 'default'}
                    className={`w-full ${!plan.current ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    disabled
                    title={
                      plan.current
                        ? 'This is the current demo plan'
                        : `${plan.name} upgrade is disabled in demo mode`
                    }
                    aria-label={
                      plan.current
                        ? 'Current demo plan'
                        : `Upgrade to ${plan.name} unavailable in demo mode`
                    }
                  >
                    {plan.current ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </div>
            <Button
              variant="outline"
              disabled
              title="Payment method updates are disabled in demo mode"
              aria-label="Update payment method unavailable in demo mode"
            >
              Update
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Visa ending in 4242</p>
              <p className="text-sm text-gray-500">Expires 12/2026</p>
            </div>
            <Badge className="bg-green-100 text-green-700">Default</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>Download your past invoices</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setActionStatus('Invoice archive prepared locally for this demo.')}>
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell>${invoice.amount}.00</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActionStatus(`${invoice.id} download prepared locally for this demo.`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
