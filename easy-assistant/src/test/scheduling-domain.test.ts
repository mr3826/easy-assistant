import { describe, expect, it } from 'vitest';
import type {
  Appointment,
  BusinessHour,
  Service,
  Staff,
  StaffHour,
  StaffService,
} from '../app/types';
import {
  appointmentWindowsOverlap,
  canTransitionAppointmentStatus,
  findAppointmentConflict,
  generateAvailableSlots,
} from '../server/domain';

const timestamp = '2026-06-11T00:00:00+06:00';

const service: Service = {
  id: 'svc-haircut',
  organizationId: 'org-1',
  locationId: 'loc-1',
  name: 'Haircut',
  category: 'Hair',
  description: null,
  durationMinutes: 30,
  bufferMinutes: 0,
  price: 2500,
  currency: 'BDT',
  active: true,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const staff: Staff[] = [
  {
    id: 'staff-1',
    organizationId: 'org-1',
    locationId: 'loc-1',
    name: 'Ayesha',
    roleTitle: 'Stylist',
    email: 'ayesha@example.com',
    phone: null,
    avatarUrl: null,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'staff-2',
    organizationId: 'org-1',
    locationId: 'loc-1',
    name: 'Karim',
    roleTitle: 'Stylist',
    email: 'karim@example.com',
    phone: null,
    avatarUrl: null,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

const assignments: StaffService[] = [
  {
    id: 'assign-1',
    organizationId: 'org-1',
    locationId: 'loc-1',
    staffId: 'staff-1',
    serviceId: 'svc-haircut',
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

const businessHours: BusinessHour[] = [
  {
    id: 'hours-business-thursday',
    organizationId: 'org-1',
    locationId: 'loc-1',
    weekday: 4,
    openTime: '10:00',
    closeTime: '12:00',
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

const staffHours: StaffHour[] = [
  {
    id: 'hours-staff-thursday',
    organizationId: 'org-1',
    locationId: 'loc-1',
    staffId: 'staff-1',
    weekday: 4,
    startTime: '10:30',
    endTime: '12:00',
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    organizationId: 'org-1',
    locationId: 'loc-1',
    customerId: 'customer-1',
    serviceId: 'svc-haircut',
    staffId: 'staff-1',
    channelId: null,
    conversationId: null,
    startTime: '2026-06-11T11:00:00+06:00',
    endTime: '2026-06-11T11:30:00+06:00',
    status: 'confirmed',
    notes: null,
    createdBy: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('scheduling domain', () => {
  it('generates slots from business hours, staff hours, service duration, timezone, and assigned staff', () => {
    const result = generateAvailableSlots({
      date: '2026-06-11',
      timezone: 'Asia/Dhaka',
      service,
      staff,
      staffServices: assignments,
      businessHours,
      staffHours,
      existingAppointments: [],
      slotIntervalMinutes: 30,
    });

    expect(result).toEqual({
      date: '2026-06-11',
      timezone: 'Asia/Dhaka',
      slots: [
        {
          start: '2026-06-11T10:30:00+06:00',
          end: '2026-06-11T11:00:00+06:00',
          staffId: 'staff-1',
        },
        {
          start: '2026-06-11T11:00:00+06:00',
          end: '2026-06-11T11:30:00+06:00',
          staffId: 'staff-1',
        },
        {
          start: '2026-06-11T11:30:00+06:00',
          end: '2026-06-11T12:00:00+06:00',
          staffId: 'staff-1',
        },
      ],
    });
  });

  it('excludes slots that overlap existing active appointments', () => {
    const result = generateAvailableSlots({
      date: '2026-06-11',
      timezone: 'Asia/Dhaka',
      service,
      staff,
      staffServices: assignments,
      businessHours,
      staffHours,
      existingAppointments: [appointment()],
      slotIntervalMinutes: 30,
    });

    expect(result.slots.map((slot) => slot.start)).toEqual([
      '2026-06-11T10:30:00+06:00',
      '2026-06-11T11:30:00+06:00',
    ]);
  });

  it('ignores non-blocking appointment statuses when checking future availability', () => {
    const result = generateAvailableSlots({
      date: '2026-06-11',
      timezone: 'Asia/Dhaka',
      service,
      staff,
      staffServices: assignments,
      businessHours,
      staffHours,
      existingAppointments: [appointment({ status: 'cancelled' })],
      slotIntervalMinutes: 30,
    });

    expect(result.slots).toHaveLength(3);
  });

  it('prevents creating or rescheduling an appointment into a staff/service time conflict', () => {
    const conflict = findAppointmentConflict(
      {
        organizationId: 'org-1',
        locationId: 'loc-1',
        staffId: 'staff-1',
        startTime: '2026-06-11T11:15:00+06:00',
        endTime: '2026-06-11T11:45:00+06:00',
      },
      [appointment()],
    );

    expect(conflict.conflicts).toBe(true);
    expect(conflict.appointment?.id).toBe('appt-1');
    expect(canTransitionAppointmentStatus('confirmed', 'rescheduled')).toBe(true);
  });

  it('scopes slot lookup and conflict checks by organization and location', () => {
    const conflict = findAppointmentConflict(
      {
        organizationId: 'org-2',
        locationId: 'loc-1',
        staffId: 'staff-1',
        startTime: '2026-06-11T11:15:00+06:00',
        endTime: '2026-06-11T11:45:00+06:00',
      },
      [appointment()],
    );

    expect(conflict.conflicts).toBe(false);
    expect(
      appointmentWindowsOverlap(
        appointment(),
        appointment({
          id: 'appt-2',
          startTime: '2026-06-11T11:30:00+06:00',
          endTime: '2026-06-11T12:00:00+06:00',
        }),
      ),
    ).toBe(false);
  });
});
