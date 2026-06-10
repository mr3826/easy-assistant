import { describe, expect, it } from 'vitest';
import { API_ROUTES } from '../server/api/contracts';
import { LOCATION_SCOPED_MVP_TABLES, MVP_TABLES, SCOPED_MVP_TABLES } from '../server/data/schema';
import {
  assertValidAppointmentWindow,
  canTransitionAppointmentStatus,
  isBlockingAppointmentStatus,
} from '../server/domain';

describe('backend auth and domain contracts', () => {
  it('keeps the auth/session routes aligned with the MVP contract surface', () => {
    expect(API_ROUTES.signup).toMatchObject({
      method: 'POST',
      path: '/api/auth/signup',
      authRequired: false,
    });
    expect(API_ROUTES.login).toMatchObject({
      method: 'POST',
      path: '/api/auth/login',
      authRequired: false,
    });
    expect(API_ROUTES.logout).toMatchObject({
      method: 'POST',
      path: '/api/auth/logout',
      authRequired: true,
    });
    expect(API_ROUTES.currentUser).toMatchObject({
      method: 'GET',
      path: '/api/auth/me',
      authRequired: true,
    });
  });

  it('keeps session and tenant tables in the phase-1 schema lists', () => {
    expect(MVP_TABLES).toEqual(
      expect.arrayContaining(['organizations', 'locations', 'users', 'sessions', 'memberships']),
    );
    expect(SCOPED_MVP_TABLES).toEqual(
      expect.arrayContaining([
        'locations',
        'memberships',
        'services',
        'staff',
        'staff_services',
        'business_hours',
        'staff_hours',
        'customers',
        'channels',
        'conversations',
        'messages',
        'appointments',
        'ai_settings',
        'reminders',
        'reminder_deliveries',
        'audit_logs',
      ]),
    );
    expect(LOCATION_SCOPED_MVP_TABLES).toEqual(
      expect.arrayContaining([
        'services',
        'staff',
        'staff_services',
        'business_hours',
        'staff_hours',
        'customers',
        'channels',
        'conversations',
        'messages',
        'appointments',
        'ai_settings',
        'reminders',
        'reminder_deliveries',
      ]),
    );
    expect(LOCATION_SCOPED_MVP_TABLES).not.toContain('users');
    expect(LOCATION_SCOPED_MVP_TABLES).not.toContain('sessions');
  });

  it('treats blocking appointment states and invalid windows consistently', () => {
    expect(isBlockingAppointmentStatus('pending')).toBe(true);
    expect(isBlockingAppointmentStatus('rescheduled')).toBe(true);
    expect(isBlockingAppointmentStatus('completed')).toBe(false);
    expect(canTransitionAppointmentStatus('pending', 'confirmed')).toBe(true);
    expect(canTransitionAppointmentStatus('completed', 'confirmed')).toBe(false);
    expect(() =>
      assertValidAppointmentWindow('2026-06-11T10:00:00+06:00', '2026-06-11T10:00:00+06:00'),
    ).toThrow('Appointment endTime must be after startTime.');
    expect(() =>
      assertValidAppointmentWindow('not-a-real-iso-date', '2026-06-11T10:30:00+06:00'),
    ).toThrow('Appointment startTime and endTime must be valid ISO date-time values.');
  });
});
