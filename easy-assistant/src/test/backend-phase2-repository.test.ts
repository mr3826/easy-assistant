import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const serverDir = join(testDir, '..', '..', 'server');
const schemaUrl = pathToFileURL(join(serverDir, 'schema.mjs')).href;
const repositoryUrl = pathToFileURL(join(serverDir, 'repository.mjs')).href;
const phase2Url = pathToFileURL(join(serverDir, 'phase2.mjs')).href;

function runScenario() {
  const script = `
    const { DatabaseSync } = await import('node:sqlite');
    const { schemaSql } = await import(${JSON.stringify(schemaUrl)});
    const { createRepository } = await import(${JSON.stringify(repositoryUrl)});
    const { createPhase2Service } = await import(${JSON.stringify(phase2Url)});

    const db = new DatabaseSync(':memory:');
    db.exec(schemaSql);
    const repository = createRepository(db);
    const phase2 = createPhase2Service(repository);
    const now = Date.UTC(2026, 5, 11, 0, 0, 0);
    const scope = { organizationId: 'org-1', locationId: 'loc-1', timezone: 'UTC' };

    repository.createUser({
      id: 'user-1',
      name: 'Ada',
      email: 'ada@example.com',
      passwordHash: 'hash',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    repository.createOrganization({
      id: 'org-1',
      name: 'Clinic One',
      slug: 'clinic-one',
      timezone: 'UTC',
      ownerUserId: 'user-1',
      createdAt: now,
      updatedAt: now,
    });
    repository.createLocation({
      id: 'loc-1',
      organizationId: 'org-1',
      name: 'Downtown',
      timezone: 'UTC',
      createdAt: now,
      updatedAt: now,
    });
    repository.createMembership({
      id: 'mem-1',
      organizationId: 'org-1',
      userId: 'user-1',
      role: 'owner',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const service = repository.createService({
      id: 'svc-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: 'Consultation',
      category: 'General',
      description: null,
      durationMinutes: 30,
      bufferMinutes: 0,
      price: 1500,
      currency: 'BDT',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    const updatedService = phase2.updateService(scope, 'svc-1', { name: 'Consultation Plus' });

    repository.createStaff({
      id: 'staff-1',
      organizationId: 'org-1',
      locationId: 'loc-1',
      name: 'Nadia',
      roleTitle: 'Coordinator',
      email: 'nadia@example.com',
      phone: null,
      avatarUrl: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    phase2.assignStaffService(scope, 'staff-1', { serviceId: 'svc-1' });
    phase2.replaceAvailabilityBusinessHours(scope, {
      hours: [{ weekday: 4, openTime: '09:00', closeTime: '10:00' }],
    });
    phase2.replaceStaffHours(scope, 'staff-1', {
      hours: [{ weekday: 4, startTime: '09:00', endTime: '10:00' }],
    });

    const customer = phase2.createCustomer(scope, {
      name: 'Mina',
      phone: '+8801000000000',
      email: 'mina@example.com',
      sourceChannel: 'manual',
      consentStatus: 'unknown',
    });

    const availability = phase2.getAvailabilitySlots(scope, {
      serviceId: 'svc-1',
      date: '2026-06-11',
    });

    const appointment = phase2.createAppointment(scope, {
      customerId: customer.customer.id,
      serviceId: 'svc-1',
      staffId: 'staff-1',
      startTime: '2026-06-11T09:00:00.000Z',
      endTime: '2026-06-11T09:30:00.000Z',
      status: 'confirmed',
      createdBy: 'manual',
    });

    const narrowedAvailability = phase2.getAvailabilitySlots(scope, {
      serviceId: 'svc-1',
      date: '2026-06-11',
    });

    const deletedService = phase2.deleteService(scope, 'svc-1');
    const servicesAfterDelete = phase2.listServices(scope);

    console.log(JSON.stringify({
      serviceName: service.name,
      updatedServiceName: updatedService.service.name,
      customerPhone: customer.customer.phone,
      availabilityStarts: availability.slots.map((slot) => slot.start),
      appointmentStatus: appointment.appointment.status,
      narrowedAvailabilityStarts: narrowedAvailability.slots.map((slot) => slot.start),
      deletedServiceActive: deletedService.service.active,
      servicesAfterDelete: servicesAfterDelete.items.length,
    }));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8',
  }).trim();

  return JSON.parse(output);
}

describe('phase 2 backend persistence', () => {
  it('persists tenant-scoped CRUD and availability settings', () => {
    const result = runScenario();

    expect(result).toMatchObject({
      serviceName: 'Consultation',
      updatedServiceName: 'Consultation Plus',
      customerPhone: '+8801000000000',
      appointmentStatus: 'confirmed',
      deletedServiceActive: false,
      servicesAfterDelete: 0,
    });
    expect(result.availabilityStarts).toEqual([
      '2026-06-11T09:00:00+00:00',
      '2026-06-11T09:15:00+00:00',
      '2026-06-11T09:30:00+00:00',
    ]);
    expect(result.narrowedAvailabilityStarts).toEqual([
      '2026-06-11T09:30:00+00:00',
    ]);
  });
});
