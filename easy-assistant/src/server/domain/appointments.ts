import type { Appointment, AppointmentStatus, ISODateTimeString } from "../../app/types";
import { APPOINTMENT_STATUSES } from "../../app/types";

export { APPOINTMENT_STATUSES };

export const BLOCKING_APPOINTMENT_STATUSES = ["pending", "confirmed", "rescheduled"] as const satisfies readonly AppointmentStatus[];

export const TERMINAL_APPOINTMENT_STATUSES = ["completed", "cancelled", "no_show"] as const satisfies readonly AppointmentStatus[];

export type AppointmentTimeWindow = Pick<
  Appointment,
  "organizationId" | "locationId" | "staffId" | "startTime" | "endTime"
> & {
  id?: string;
  status?: AppointmentStatus;
};

export interface AppointmentConflictOptions {
  ignoreAppointmentId?: string;
  blockingStatuses?: readonly AppointmentStatus[];
}

export interface AppointmentConflictResult {
  conflicts: boolean;
  appointment: Appointment | null;
}

const APPOINTMENT_STATUS_TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  pending: ["confirmed", "cancelled", "rescheduled"],
  confirmed: ["completed", "cancelled", "no_show", "rescheduled"],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: ["confirmed", "cancelled"],
};

export function isBlockingAppointmentStatus(
  status: AppointmentStatus,
  blockingStatuses: readonly AppointmentStatus[] = BLOCKING_APPOINTMENT_STATUSES,
): boolean {
  return blockingStatuses.includes(status);
}

export function canTransitionAppointmentStatus(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertValidAppointmentWindow(startTime: ISODateTimeString, endTime: ISODateTimeString): void {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new Error("Appointment startTime and endTime must be valid ISO date-time values.");
  }

  if (start >= end) {
    throw new Error("Appointment endTime must be after startTime.");
  }
}

export function appointmentWindowsOverlap(first: AppointmentTimeWindow, second: AppointmentTimeWindow): boolean {
  assertValidAppointmentWindow(first.startTime, first.endTime);
  assertValidAppointmentWindow(second.startTime, second.endTime);

  return new Date(first.startTime).getTime() < new Date(second.endTime).getTime()
    && new Date(first.endTime).getTime() > new Date(second.startTime).getTime();
}

export function findAppointmentConflict(
  candidate: AppointmentTimeWindow,
  appointments: readonly Appointment[],
  options: AppointmentConflictOptions = {},
): AppointmentConflictResult {
  assertValidAppointmentWindow(candidate.startTime, candidate.endTime);

  const blockingStatuses = options.blockingStatuses ?? BLOCKING_APPOINTMENT_STATUSES;
  const appointment = appointments.find((existing) => {
    if (existing.id === options.ignoreAppointmentId) {
      return false;
    }

    if (existing.organizationId !== candidate.organizationId || existing.locationId !== candidate.locationId) {
      return false;
    }

    if (existing.staffId !== candidate.staffId) {
      return false;
    }

    if (!isBlockingAppointmentStatus(existing.status, blockingStatuses)) {
      return false;
    }

    return appointmentWindowsOverlap(existing, candidate);
  });

  return {
    conflicts: appointment !== undefined,
    appointment: appointment ?? null,
  };
}

export function hasAppointmentConflict(
  candidate: AppointmentTimeWindow,
  appointments: readonly Appointment[],
  options: AppointmentConflictOptions = {},
): boolean {
  return findAppointmentConflict(candidate, appointments, options).conflicts;
}
