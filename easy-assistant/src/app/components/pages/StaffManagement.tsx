import { useEffect, useMemo, useState } from 'react';
import { Archive, Plus, Edit, Clock, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import {
  assignStaffService,
  createStaff,
  deleteStaff,
  fetchAppointments,
  fetchServices,
  fetchStaff,
  fetchStaffHours,
  fetchStaffServices,
  updateStaff,
  type TenantScope,
} from '../../api';
import type { Service, Staff, StaffHour, StaffService } from '../../types';

interface StaffCard {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  avatarUrl: string;
  hours: string;
  services: string[];
  serviceIds: string[];
  availability: 'Available' | 'Busy' | 'Inactive';
  bookings: number;
  active: boolean;
}

interface StaffDraft {
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  active: boolean;
  serviceIds: string[];
}

type ActionTone = 'success' | 'error' | 'info';

function mapAvailability(active: boolean, bookings: number): StaffCard['availability'] {
  if (!active) {
    return 'Inactive';
  }

  return bookings > 3 ? 'Busy' : 'Available';
}

function availabilityLabel(status: StaffCard['availability'], t: (path: string) => string) {
  switch (status) {
    case 'Busy':
      return t('staff.busy');
    case 'Inactive':
      return t('staff.inactive');
    default:
      return t('staff.available');
  }
}

function formatHours(hours: StaffHour[], t: (path: string) => string) {
  if (hours.length === 0) {
    return t('staff.scheduleNotConfigured');
  }

  const dayLabels = [
    t('availability.sunday'),
    t('availability.monday'),
    t('availability.tuesday'),
    t('availability.wednesday'),
    t('availability.thursday'),
    t('availability.friday'),
    t('availability.saturday'),
  ];

  return hours
    .slice()
    .sort((left, right) => left.weekday - right.weekday)
    .map((hour) => {
      const day = dayLabels[hour.weekday] ?? String(hour.weekday);
      return `${day}, ${hour.startTime} - ${hour.endTime}`;
    })
    .join(' • ');
}

function mapStaffCard(
  staff: Staff,
  hours: string,
  services: string[],
  serviceIds: string[],
  bookings: number
): StaffCard {
  return {
    id: staff.id,
    name: staff.name,
    roleTitle: staff.roleTitle ?? 'Team Member',
    email: staff.email ?? '',
    phone: staff.phone ?? '',
    avatarUrl: staff.avatarUrl ?? '',
    hours,
    services,
    serviceIds,
    availability: mapAvailability(staff.active, bookings),
    bookings,
    active: staff.active,
  };
}

function buildDraft(staff?: StaffCard | null): StaffDraft {
  return {
    name: staff?.name ?? '',
    roleTitle: staff?.roleTitle ?? '',
    email: staff?.email ?? '',
    phone: staff?.phone ?? '',
    active: staff?.active ?? true,
    serviceIds: staff?.serviceIds ?? [],
  };
}

export default function StaffManagement() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [staff, setStaff] = useState<StaffCard[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionTone, setActionTone] = useState<ActionTone>('info');
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<StaffDraft>(buildDraft());

  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!scope) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setActionStatus('');
      setActionTone('info');

      const [staffResult, appointmentsResult, servicesResult] = await Promise.allSettled([
        fetchStaff(scope),
        fetchAppointments(scope),
        fetchServices(scope),
      ]);

      if (!active) {
        return;
      }

      if (staffResult.status !== 'fulfilled') {
        setStaff([]);
        setIsLive(false);
        setActionStatus(t('staff.liveStaffUnavailable'));
        setActionTone('error');
        setLoading(false);
        return;
      }

      const staffRows = staffResult.value;
      const appointmentRows = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [];
      const serviceRows = servicesResult.status === 'fulfilled' ? servicesResult.value : [];
      setServices(serviceRows);

      const serviceById = new Map(serviceRows.map((service) => [service.id, service]));
      const staffCards = await Promise.all(
        staffRows.map(async (member) => {
          const [memberHoursResult, staffServicesResult] = await Promise.all([
            fetchStaffHours(scope, member.id).catch(() => []),
            fetchStaffServices(scope, member.id).catch(() => [] as StaffService[]),
          ]);
          const hoursText = formatHours(memberHoursResult, t);
          const activeAssignments = staffServicesResult.filter((assignment) => assignment.active);
          const serviceIds = activeAssignments.map((assignment) => assignment.serviceId);
          const servicesText = serviceIds
            .map((serviceId) => serviceById.get(serviceId)?.name)
            .filter((serviceName): serviceName is string => Boolean(serviceName));
          const bookings = appointmentRows.filter((appointment) => appointment.staffId === member.id).length;
          return mapStaffCard(member, hoursText, servicesText, serviceIds, bookings);
        })
      );

      if (!active) {
        return;
      }

      setStaff(staffCards);
      setIsLive(true);

      if (staffCards.length === 0) {
        setActionStatus(t('staff.noStaffYet'));
        setActionTone('info');
      } else if (appointmentsResult.status !== 'fulfilled' || servicesResult.status !== 'fulfilled') {
        setActionStatus(t('staff.partialLinks'));
        setActionTone('error');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope, t]);

  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);

  const stats = useMemo(() => {
    const total = staff.length;
    const availableNow = staff.filter((member) => member.availability === 'Available').length;
    const totalBookings = staff.reduce((sum, member) => sum + member.bookings, 0);
    const avgPerStaff = total > 0 ? Math.round(totalBookings / total) : 0;
    return { total, availableNow, totalBookings, avgPerStaff };
  }, [staff]);

  const openCreateDialog = () => {
    setEditingStaffId(null);
    setDraft(buildDraft());
    setStaffDialogOpen(true);
  };

  const openEditDialog = (member: StaffCard) => {
    setEditingStaffId(member.id);
    setDraft(buildDraft(member));
    setStaffDialogOpen(true);
  };

  const selectedServiceNames = (serviceIds: string[]) => {
    const activeServices = services.filter((service) => service.active);
    const serviceById = new Map(activeServices.map((service) => [service.id, service.name]));
    return serviceIds
      .map((serviceId) => serviceById.get(serviceId))
      .filter((serviceName): serviceName is string => Boolean(serviceName));
  };

  const syncStaffServices = async (tenantScope: TenantScope, staffId: string, serviceIds: string[]) => {
    const selectedIds = new Set(serviceIds);
    await Promise.all(
      services.map((service) =>
        assignStaffService(tenantScope, staffId, {
          serviceId: service.id,
          active: selectedIds.has(service.id),
        })
      )
    );
  };

  const saveStaff = async () => {
    if (!scope) {
      setActionStatus(t('staff.tenantScopeMissing'));
      setActionTone('error');
      return;
    }

    const payload = {
      name: draft.name.trim(),
      roleTitle: draft.roleTitle.trim() || null,
      email: draft.email.trim() || null,
      phone: draft.phone.trim() || null,
      active: draft.active,
    };

    if (!payload.name) {
      setActionStatus(t('staff.memberNameRequired'));
      setActionTone('error');
      return;
    }

    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) {
      setActionStatus(t('staff.emailInvalid'));
      setActionTone('error');
      return;
    }

    if (payload.phone && payload.phone.replace(/\D/g, '').length < 8) {
      setActionStatus(t('staff.phoneInvalid'));
      setActionTone('error');
      return;
    }

    setSaving(true);

    try {
      if (editingStaffId) {
        const response = await updateStaff(scope, editingStaffId, payload);
        if (!response) {
          throw new Error(t('staff.saveFailed'));
        }
        await syncStaffServices(scope, response.id, draft.serviceIds);
        setStaff((current) =>
          current.map((member) =>
            member.id === editingStaffId
              ? {
                  ...member,
                  name: response.name,
                  roleTitle: response.roleTitle ?? t('staff.teamMember'),
                  email: response.email ?? '',
                  phone: response.phone ?? '',
                  avatarUrl: response.avatarUrl ?? '',
                  active: response.active,
                  services: selectedServiceNames(draft.serviceIds),
                  serviceIds: draft.serviceIds,
                  availability: mapAvailability(response.active, member.bookings),
                }
              : member
          )
        );
        setActionStatus(t('staff.memberUpdated'));
        setActionTone('success');
      } else {
        const response = await createStaff(scope, payload);
        if (!response) {
          throw new Error(t('staff.saveFailed'));
        }
        await syncStaffServices(scope, response.id, draft.serviceIds);
        setStaff((current) => [
          mapStaffCard(response, t('staff.scheduleNotConfigured'), selectedServiceNames(draft.serviceIds), draft.serviceIds, 0),
          ...current,
        ]);
        setActionStatus(t('staff.memberAdded'));
        setActionTone('success');
      }

      setStaffDialogOpen(false);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('staff.saveFailed'));
      setActionTone('error');
    } finally {
      setSaving(false);
    }
  };

  const archiveStaff = async (member: StaffCard) => {
    if (!scope) {
      setActionStatus(t('staff.tenantScopeMissing'));
      setActionTone('error');
      return;
    }

    const confirmed = window.confirm(t('staff.archiveConfirm', { name: member.name }));
    if (!confirmed) {
      return;
    }

    try {
      const archived = await deleteStaff(scope, member.id);
      if (!archived) {
        throw new Error(t('staff.archiveFailed', { name: member.name }));
      }
      setStaff((current) =>
        current.map((item) =>
          item.id === member.id
            ? {
                ...item,
                active: archived.active,
                availability: mapAvailability(archived.active, item.bookings),
              }
            : item
        )
      );
      setActionStatus(t('staff.archivedThroughApi', { name: member.name }));
      setActionTone('success');
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('staff.archiveFailed', { name: member.name }));
      setActionTone('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>{t('staff.title')}</h1>
          <p className="text-gray-500">{t('staff.subtitle')}</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('staff.addTeamMember')}
        </Button>
      </div>

      {actionStatus && (
        <p
          className={`text-sm ${actionTone === 'error' ? 'text-red-700' : actionTone === 'success' ? 'text-green-700' : 'text-gray-600'}`}
          role="status"
          aria-live="polite"
        >
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">{t('staff.loading')}</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">{t('staff.noLiveData')}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('staff.teamMembers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('staff.availableNow')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableNow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('staff.totalBookings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('staff.avgPerMember')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerStaff}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className="bg-slate-900 text-white">
                      {member.name
                        .split(' ')
                        .map((token) => token[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.roleTitle}</p>
                    <Badge
                      variant={member.availability === 'Available' ? 'default' : 'secondary'}
                      className={member.availability === 'Available' ? 'mt-2 bg-green-100 text-green-700' : 'mt-2 bg-yellow-100 text-yellow-700'}
                    >
                      {availabilityLabel(member.availability, t)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(member)}
                    aria-label={`${t('common.edit')} ${member.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void archiveStaff(member)}
                    aria-label={`${t('staff.archive')} ${member.name}`}
                  >
                    <Archive className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{member.email || t('staff.noEmail')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone || t('staff.noPhone')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{member.hours}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-600">{t('staff.services')}</p>
                <div className="flex flex-wrap gap-2">
                  {member.services.length > 0 ? (
                    member.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))
                  ) : (
                  <Badge variant="outline">{t('staff.noServices')}</Badge>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('staff.totalBookings')}</span>
                  <span className="font-semibold">{member.bookings}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionStatus(`${member.name} ${t('staff.viewSchedule')}`)}
                >
                  {t('staff.viewSchedule')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionStatus(`${member.name} ${t('staff.editHours')}`)}
                >
                  {t('staff.editHours')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaffId ? t('staff.editTeamMember') : t('staff.addTeamMemberDialog')}</DialogTitle>
            <DialogDescription>
              {editingStaffId ? t('staff.updateMemberDescription') : t('staff.addMemberDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">{t('staff.fullName')}</Label>
              <Input
                id="staff-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g., Nusrat Akter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">{t('staff.role')}</Label>
              <Input
                id="staff-role"
                value={draft.roleTitle}
                onChange={(event) => setDraft((current) => ({ ...current, roleTitle: event.target.value }))}
                placeholder={t('staff.teamMember')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">{t('staff.email')}</Label>
              <Input
                id="staff-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@business.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">{t('staff.phone')}</Label>
              <Input
                id="staff-phone"
                type="tel"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            <div className="space-y-3">
              <Label>{t('staff.assignServices')}</Label>
              {activeServices.length > 0 ? (
                <div className="grid gap-2 rounded-md border border-gray-200 p-3">
                  {activeServices.map((service) => (
                    <label key={service.id} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={draft.serviceIds.includes(service.id)}
                        onCheckedChange={(checked) =>
                          setDraft((current) => ({
                            ...current,
                            serviceIds: checked === true
                              ? Array.from(new Set([...current.serviceIds, service.id]))
                              : current.serviceIds.filter((serviceId) => serviceId !== service.id),
                          }))
                        }
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                  {t('staff.addServicesFirst')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('staff.status')}</Label>
              <Select
                value={draft.active ? 'active' : 'inactive'}
                onValueChange={(value) => setDraft((current) => ({ ...current, active: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('staff.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('staff.active')}</SelectItem>
                  <SelectItem value="inactive">{t('staff.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void saveStaff()} disabled={saving}>
              {saving ? t('staff.saving') : editingStaffId ? t('staff.saveChanges') : t('staff.addMemberAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
