import type { DashboardAppointmentSummary, DashboardSummaryMetric } from '../api';

export const DEMO_BUSINESS_NAME = 'Glow Beauty Salon';

export const DEMO_SERVICES = [
  {
    name: 'Haircut',
    category: 'Hair Services',
    durationMinutes: 45,
    price: 700,
    description: 'Wash, haircut, and simple styling.',
    staffNames: ['Nusrat Akter'],
  },
  {
    name: 'Facial',
    category: 'Skin Care',
    durationMinutes: 60,
    price: 1500,
    description: 'Refreshing salon facial for regular customers.',
    staffNames: ['Farhana Rahman'],
  },
  {
    name: 'Bridal makeup',
    category: 'Makeup',
    durationMinutes: 180,
    price: 12000,
    description: 'Full bridal makeup with trial consultation.',
    staffNames: ['Maliha Chowdhury'],
  },
  {
    name: 'Spa treatment',
    category: 'Spa & Wellness',
    durationMinutes: 90,
    price: 3500,
    description: 'Relaxing spa treatment with advance booking.',
    staffNames: ['Farhana Rahman'],
  },
] as const;

export const DEMO_SETUP_ITEMS = [
  { labelKey: 'setup.businessDetails', done: true },
  { labelKey: 'setup.service', done: true },
  { labelKey: 'setup.hours', done: true },
  { labelKey: 'setup.teamMember', done: true },
  { labelKey: 'setup.connectWhatsApp', done: false },
  { labelKey: 'setup.testAssistant', done: false },
] as const;

export const DEMO_DASHBOARD_METRICS: DashboardSummaryMetric[] = [
  {
    key: 'new_bookings_today',
    label: 'New bookings today',
    value: 7,
    format: 'number',
    delta: 3,
    deltaLabel: 'more than yesterday',
    trend: 'up',
  },
  {
    key: 'missed_inquiries_prevented',
    label: 'Missed inquiries prevented',
    value: 12,
    format: 'number',
    delta: 4,
    deltaLabel: 'this week',
    trend: 'up',
  },
  {
    key: 'customers_replied',
    label: 'Customers replied by assistant',
    value: 24,
    format: 'number',
    delta: 8,
    deltaLabel: 'this week',
    trend: 'up',
  },
  {
    key: 'revenue_estimate',
    label: 'Revenue estimate from bookings',
    value: 26500,
    format: 'currency',
    currency: 'BDT',
    delta: 4500,
    deltaLabel: 'from confirmed bookings',
    trend: 'up',
  },
];

export const DEMO_RECENT_BOOKINGS: DashboardAppointmentSummary[] = [
  {
    id: 'demo-booking-1',
    customerName: 'Ayesha Rahman',
    serviceName: 'Bridal makeup',
    staffName: 'Maliha Chowdhury',
    channelName: 'WhatsApp',
    status: 'confirmed',
    startTime: '2026-06-11T11:00:00+06:00',
  },
  {
    id: 'demo-booking-2',
    customerName: 'Nabila Islam',
    serviceName: 'Facial',
    staffName: 'Farhana Rahman',
    channelName: 'WhatsApp',
    status: 'pending',
    startTime: '2026-06-11T15:30:00+06:00',
  },
  {
    id: 'demo-booking-3',
    customerName: 'Sadia Khan',
    serviceName: 'Haircut',
    staffName: 'Nusrat Akter',
    channelName: 'WhatsApp',
    status: 'confirmed',
    startTime: '2026-06-12T10:00:00+06:00',
  },
];
