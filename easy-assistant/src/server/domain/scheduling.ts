import type {
  Appointment,
  AvailabilitySlot,
  BusinessHour,
  EntityId,
  ISODateString,
  Service,
  Staff,
  StaffHour,
  StaffService,
  TimeOfDayString,
  TimeZoneString,
  Weekday,
} from "../../app/types";
import { hasAppointmentConflict } from "./appointments";

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

interface LocalDateTimeParts extends LocalDateParts {
  hour: number;
  minute: number;
  second: number;
}

interface MinuteRange {
  startMinute: number;
  endMinute: number;
}

export interface GenerateAvailableSlotsInput {
  date: ISODateString;
  timezone: TimeZoneString;
  service: Service;
  staff: readonly Staff[];
  staffServices: readonly StaffService[];
  businessHours: readonly BusinessHour[];
  staffHours: readonly StaffHour[];
  existingAppointments: readonly Appointment[];
  staffId?: EntityId;
  slotIntervalMinutes?: number;
  bufferMinutes?: number;
}

export interface GenerateAvailableSlotsResult {
  date: ISODateString;
  timezone: TimeZoneString;
  slots: AvailabilitySlot[];
}

export function generateAvailableSlots(input: GenerateAvailableSlotsInput): GenerateAvailableSlotsResult {
  const slotIntervalMinutes = input.slotIntervalMinutes ?? 15;
  const serviceDurationMinutes = input.service.durationMinutes + (input.bufferMinutes ?? input.service.bufferMinutes);

  if (!input.service.active || input.service.durationMinutes <= 0 || slotIntervalMinutes <= 0) {
    return emptyAvailability(input.date, input.timezone);
  }

  const weekday = getWeekday(input.date);
  const businessRanges = rangesForBusinessHours(input.businessHours, input.service, weekday);

  if (businessRanges.length === 0) {
    return emptyAvailability(input.date, input.timezone);
  }

  const candidateStaff = getCandidateStaff(input);
  const slots = candidateStaff.flatMap((staffMember) => {
    const staffRanges = rangesForStaffHours(input.staffHours, staffMember, weekday);
    const workingRanges = intersectRanges(businessRanges, staffRanges);

    return workingRanges.flatMap((range) =>
      slotsForRange({
        range,
        date: input.date,
        timezone: input.timezone,
        organizationId: input.service.organizationId,
        locationId: input.service.locationId,
        staffId: staffMember.id,
        serviceDurationMinutes,
        slotIntervalMinutes,
        existingAppointments: input.existingAppointments,
      }),
    );
  });

  return {
    date: input.date,
    timezone: input.timezone,
    slots: slots.sort((first, second) => first.start.localeCompare(second.start) || first.staffId.localeCompare(second.staffId)),
  };
}

function emptyAvailability(date: ISODateString, timezone: TimeZoneString): GenerateAvailableSlotsResult {
  return { date, timezone, slots: [] };
}

function getCandidateStaff(input: GenerateAvailableSlotsInput): Staff[] {
  const assignedStaffIds = new Set(
    input.staffServices
      .filter((assignment) =>
        assignment.active
        && assignment.organizationId === input.service.organizationId
        && assignment.locationId === input.service.locationId
        && assignment.serviceId === input.service.id,
      )
      .map((assignment) => assignment.staffId),
  );

  return input.staff.filter((staffMember) =>
    staffMember.active
    && staffMember.organizationId === input.service.organizationId
    && staffMember.locationId === input.service.locationId
    && assignedStaffIds.has(staffMember.id)
    && (input.staffId === undefined || input.staffId === staffMember.id),
  );
}

function rangesForBusinessHours(hours: readonly BusinessHour[], service: Service, weekday: Weekday): MinuteRange[] {
  return hours
    .filter((hour) =>
      hour.active
      && hour.organizationId === service.organizationId
      && hour.locationId === service.locationId
      && hour.weekday === weekday,
    )
    .map((hour) => normalizeRange(parseTimeToMinutes(hour.openTime), parseTimeToMinutes(hour.closeTime)))
    .filter(hasPositiveDuration);
}

function rangesForStaffHours(hours: readonly StaffHour[], staff: Staff, weekday: Weekday): MinuteRange[] {
  return hours
    .filter((hour) =>
      hour.active
      && hour.organizationId === staff.organizationId
      && hour.locationId === staff.locationId
      && hour.staffId === staff.id
      && hour.weekday === weekday,
    )
    .map((hour) => normalizeRange(parseTimeToMinutes(hour.startTime), parseTimeToMinutes(hour.endTime)))
    .filter(hasPositiveDuration);
}

function normalizeRange(startMinute: number, endMinute: number): MinuteRange {
  return {
    startMinute,
    endMinute: endMinute <= startMinute ? endMinute + 24 * 60 : endMinute,
  };
}

function hasPositiveDuration(range: MinuteRange): boolean {
  return range.endMinute > range.startMinute;
}

function intersectRanges(firstRanges: readonly MinuteRange[], secondRanges: readonly MinuteRange[]): MinuteRange[] {
  const intersections: MinuteRange[] = [];

  for (const first of firstRanges) {
    for (const second of secondRanges) {
      const startMinute = Math.max(first.startMinute, second.startMinute);
      const endMinute = Math.min(first.endMinute, second.endMinute);

      if (endMinute > startMinute) {
        intersections.push({ startMinute, endMinute });
      }
    }
  }

  return intersections;
}

function slotsForRange(input: {
  range: MinuteRange;
  date: ISODateString;
  timezone: TimeZoneString;
  organizationId: EntityId;
  locationId: EntityId;
  staffId: EntityId;
  serviceDurationMinutes: number;
  slotIntervalMinutes: number;
  existingAppointments: readonly Appointment[];
}): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];

  for (
    let startMinute = input.range.startMinute;
    startMinute + input.serviceDurationMinutes <= input.range.endMinute;
    startMinute += input.slotIntervalMinutes
  ) {
    const endMinute = startMinute + input.serviceDurationMinutes;
    const start = zonedMinuteToUtc(input.date, startMinute, input.timezone);
    const end = zonedMinuteToUtc(input.date, endMinute, input.timezone);
    const startTime = formatZonedIso(start, input.timezone);
    const endTime = formatZonedIso(end, input.timezone);

    if (!hasAppointmentConflict(
      {
        organizationId: input.organizationId,
        locationId: input.locationId,
        staffId: input.staffId,
        startTime,
        endTime,
      },
      input.existingAppointments,
    )) {
      slots.push({ start: startTime, end: endTime, staffId: input.staffId });
    }
  }

  return slots;
}

function parseTimeToMinutes(time: TimeOfDayString): number {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid time of day: ${time}`);
  }

  return hour * 60 + minute;
}

function getWeekday(date: ISODateString): Weekday {
  const parts = parseLocalDate(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() as Weekday;
}

function parseLocalDate(date: ISODateString): LocalDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (match === null) {
    throw new Error(`Invalid local date: ${date}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error(`Invalid local date: ${date}`);
  }

  return { year, month, day };
}

function addDays(date: ISODateString, days: number): ISODateString {
  const parts = parseLocalDate(date);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

function zonedMinuteToUtc(date: ISODateString, minuteOfDate: number, timezone: TimeZoneString): Date {
  const dayOffset = Math.floor(minuteOfDate / (24 * 60));
  const minuteInDay = minuteOfDate - dayOffset * 24 * 60;
  const shiftedDate = addDays(date, dayOffset);
  const hour = Math.floor(minuteInDay / 60);
  const minute = minuteInDay % 60;
  return zonedTimeToUtc({ ...parseLocalDate(shiftedDate), hour, minute, second: 0 }, timezone);
}

function zonedTimeToUtc(local: LocalDateTimeParts, timezone: TimeZoneString): Date {
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  let offsetMinutes = getTimeZoneOffsetMinutes(new Date(localAsUtc), timezone);
  let utc = new Date(localAsUtc - offsetMinutes * 60_000);
  const refinedOffsetMinutes = getTimeZoneOffsetMinutes(utc, timezone);

  if (refinedOffsetMinutes !== offsetMinutes) {
    offsetMinutes = refinedOffsetMinutes;
    utc = new Date(localAsUtc - offsetMinutes * 60_000);
  }

  return utc;
}

function getTimeZoneOffsetMinutes(date: Date, timezone: TimeZoneString): number {
  const parts = getZonedParts(date, timezone);
  const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((zonedAsUtc - date.getTime()) / 60_000);
}

function formatZonedIso(date: Date, timezone: TimeZoneString): string {
  const parts = getZonedParts(date, timezone);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timezone);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);

  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}${sign}${pad2(
    Math.floor(absoluteOffset / 60),
  )}:${pad2(absoluteOffset % 60)}`;
}

function getZonedParts(date: Date, timezone: TimeZoneString): LocalDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = new Map(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const year = requiredNumericPart(parts, "year");
  const month = requiredNumericPart(parts, "month");
  const day = requiredNumericPart(parts, "day");
  const hour = requiredNumericPart(parts, "hour");
  const minute = requiredNumericPart(parts, "minute");
  const second = requiredNumericPart(parts, "second");

  return { year, month, day, hour, minute, second };
}

function requiredNumericPart(parts: ReadonlyMap<string, string>, key: string): number {
  const value = parts.get(key);

  if (value === undefined) {
    throw new Error(`Unable to resolve ${key} for timezone conversion.`);
  }

  return Number(value);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
