import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import {
  createAppointment,
  fetchAppointments,
  fetchCustomers,
  fetchServices,
  fetchStaff,
  updateAppointment,
  type TenantScope,
} from '../../api';
import type { Appointment, Customer, Service, Staff } from '../../types';

interface AppointmentCard {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: string;
  status: Appointment['status'];
  notes: string;
}

interface AppointmentDraft {
  customerId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: Appointment['status'];
  notes: string;
}

type ActionTone = 'success' | 'error' | 'info';

function buildDraft(appointment?: AppointmentCard | null, defaults?: { customerId?: string; serviceId?: string; staffId?: string }): AppointmentDraft {
  return {
    customerId: defaults?.customerId ?? '',
    serviceId: defaults?.serviceId ?? '',
    staffId: defaults?.staffId ?? '',
    date: appointment?.date ?? new Date().toISOString().slice(0, 10),
    time: appointment?.time ?? '10:00',
    status: appointment?.status ?? 'confirmed',
    notes: appointment?.notes ?? '',
  };
}

function formatDateInput(iso: string | null | undefined) {
  if (!iso) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso.slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function formatTimeInput(iso: string | null | undefined) {
  if (!iso) {
    return '10:00';
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '10:00';
  }

  return parsed.toTimeString().slice(0, 5);
}

function formatTimeLabel(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }

  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso.slice(0, 10);
  }

  return parsed.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
}

function durationLabel(startTime: string, endTime: string, t: (path: string) => string) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const minutes = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.round((end - start) / 60_000)) : 0;
  return `${minutes} ${t('appointments.minutes')}`;
}

function statusClasses(status: Appointment['status']) {
  if (status === 'confirmed' || status === 'completed') {
    return 'bg-green-100 text-green-700 hover:bg-green-100';
  }

  if (status === 'pending' || status === 'rescheduled') {
    return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
  }

  return 'bg-red-100 text-red-700 hover:bg-red-100';
}

function appointmentStatusLabel(status: Appointment['status'], t: (path: string) => string) {
  switch (status) {
    case 'confirmed':
      return t('appointments.confirmed');
    case 'pending':
      return t('appointments.pending');
    case 'cancelled':
      return t('appointments.cancelled');
    case 'completed':
      return t('appointments.completed');
    case 'rescheduled':
      return t('appointments.rescheduled');
    case 'no_show':
      return t('appointments.noShow');
    default:
      return String(status).replace(/_/g, ' ');
  }
}

function mapAppointments(
  appointments: Appointment[],
  servicesById: Map<string, Service>,
  staffById: Map<string, Staff>,
  customersById: Map<string, Customer>,
  t: (path: string) => string,
) {
  return appointments.map<AppointmentCard>((appointment) => ({
    id: appointment.id,
    customerName: customersById.get(appointment.customerId)?.name ?? t('appointments.unknownCustomer'),
    customerEmail: customersById.get(appointment.customerId)?.email ?? t('appointments.noEmail'),
    serviceName: servicesById.get(appointment.serviceId)?.name ?? t('appointments.unknownService'),
    staffName: staffById.get(appointment.staffId)?.name ?? t('appointments.unknownStaff'),
    date: formatDateLabel(appointment.startTime),
    time: formatTimeLabel(appointment.startTime),
    duration: durationLabel(appointment.startTime, appointment.endTime, t),
    status: appointment.status,
    notes: appointment.notes ?? '',
  }));
}

export default function AppointmentsPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionTone, setActionTone] = useState<ActionTone>('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Appointment['status']>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<AppointmentDraft>(buildDraft());

  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const servicesById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);
  const customersById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);
  const activeStaff = useMemo(() => staff.filter((member) => member.active), [staff]);
  const canCreateBooking = isLive && customers.length > 0 && activeServices.length > 0 && activeStaff.length > 0;

  const appointmentCards = useMemo(() => {
    const liveCards = mapAppointments(appointments, servicesById, staffById, customersById, t);
    return isLive ? liveCards : [];
  }, [appointments, customersById, isLive, servicesById, staffById, t]);

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

      const [appointmentsResult, servicesResult, staffResult, customersResult] = await Promise.allSettled([
        fetchAppointments(scope),
        fetchServices(scope),
        fetchStaff(scope),
        fetchCustomers(scope),
      ]);

      if (!active) {
        return;
      }

      setAppointments(appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : []);
      setServices(servicesResult.status === 'fulfilled' ? servicesResult.value : []);
      setStaff(staffResult.status === 'fulfilled' ? staffResult.value : []);
      setCustomers(customersResult.status === 'fulfilled' ? customersResult.value : []);
      setIsLive(
        appointmentsResult.status === 'fulfilled'
          && servicesResult.status === 'fulfilled'
          && staffResult.status === 'fulfilled'
          && customersResult.status === 'fulfilled',
      );

      if (
        appointmentsResult.status !== 'fulfilled'
        || servicesResult.status !== 'fulfilled'
        || staffResult.status !== 'fulfilled'
        || customersResult.status !== 'fulfilled'
      ) {
        setActionStatus(t('appointments.loadSnapshot'));
        setActionTone('error');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope, t]);

  const filteredAppointments = useMemo(
    () =>
      appointmentCards.filter((appointment) => {
        const haystack = `${appointment.customerName} ${appointment.customerEmail} ${appointment.serviceName} ${appointment.staffName}`.toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [appointmentCards, filterStatus, searchTerm],
  );

  const openCreateDialog = () => {
    if (!canCreateBooking) {
      setActionStatus(t('appointments.missingSetup'));
      setActionTone('error');
      return;
    }

    setEditingAppointmentId(null);
    setDraft(buildDraft(null, {
      customerId: customers[0]?.id,
      serviceId: activeServices[0]?.id,
      staffId: activeStaff[0]?.id,
    }));
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: AppointmentCard) => {
    const sourceAppointment = appointments.find((item) => item.id === appointment.id) ?? null;
    setEditingAppointmentId(appointment.id);
    setDraft(
      buildDraft(appointment, {
        customerId: sourceAppointment?.customerId ?? customers[0]?.id,
        serviceId: sourceAppointment?.serviceId ?? activeServices[0]?.id,
        staffId: sourceAppointment?.staffId ?? activeStaff[0]?.id,
      }),
    );
    if (sourceAppointment) {
      setDraft((current) => ({
        ...current,
        date: formatDateInput(sourceAppointment.startTime),
        time: formatTimeInput(sourceAppointment.startTime),
        status: sourceAppointment.status,
        notes: sourceAppointment.notes ?? '',
      }));
    }
    setDialogOpen(true);
  };

  const persistAppointment = async () => {
    if (!scope) {
      setActionStatus(t('appointments.tenantScopeMissing'));
      setActionTone('error');
      return;
    }

    const service = services.find((item) => item.id === draft.serviceId);
    const durationMinutes = service?.durationMinutes ?? 30;
    const start = new Date(`${draft.date}T${draft.time}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60_000 + (service?.bufferMinutes ?? 0) * 60_000);

    if (!draft.customerId || !draft.serviceId || !draft.staffId || Number.isNaN(start.getTime())) {
      setActionStatus(t('appointments.pickRequiredFields'));
      setActionTone('error');
      return;
    }

    if (!service) {
      setActionStatus(t('appointments.serviceNotSelected'));
      setActionTone('error');
      return;
    }

    setSaving(true);

    const payload = {
      customerId: draft.customerId,
      serviceId: draft.serviceId,
      staffId: draft.staffId,
      channelId: null,
      conversationId: null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: draft.status,
      notes: draft.notes || null,
      createdBy: 'manual' as const,
    };

    try {
      if (editingAppointmentId) {
        const response = await updateAppointment(scope, editingAppointmentId, payload);
        if (!response) {
          throw new Error(t('appointments.saveFailed'));
        }
        setAppointments((current) =>
          current.map((item) => (item.id === editingAppointmentId ? response : item)),
        );
        setActionStatus(t('appointments.savedThroughApi'));
        setActionTone('success');
      } else {
        const response = await createAppointment(scope, payload);
        if (!response) {
          throw new Error(t('appointments.saveFailed'));
        }
        setAppointments((current) => [response, ...current]);
        setActionStatus(t('appointments.savedThroughApi'));
        setActionTone('success');
      }
      setDialogOpen(false);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('appointments.saveFailed'));
      setActionTone('error');
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!scope) {
      setActionStatus(t('appointments.tenantScopeMissing'));
      setActionTone('error');
      return;
    }

    const confirmed = window.confirm(t('appointments.cancelConfirm'));
    if (!confirmed) {
      return;
    }

    try {
      await updateAppointment(scope, appointmentId, { status: 'cancelled' });
      setAppointments((current) =>
        current.map((item) => (item.id === appointmentId ? { ...item, status: 'cancelled' } : item)),
      );
      setActionStatus(t('appointments.cancelledThroughApi'));
      setActionTone('success');
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('appointments.cancelFailed'));
      setActionTone('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>{t('appointments.title')}</h1>
          <p className="text-gray-500">{t('appointments.subtitle')}</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog} disabled={!canCreateBooking}>
          <Plus className="mr-2 h-4 w-4" />
          {t('appointments.newBooking')}
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
      {loading && <p className="text-sm text-gray-500">{t('appointments.loading')}</p>}
      {!isLive && !loading && <p className="text-sm text-gray-500">{t('appointments.noLiveData')}</p>}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('appointments.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-white pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-40 bg-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder={t('appointments.filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('appointments.allStatuses')}</SelectItem>
                  <SelectItem value="confirmed">{t('appointments.confirmed')}</SelectItem>
                  <SelectItem value="pending">{t('appointments.pending')}</SelectItem>
                  <SelectItem value="cancelled">{t('appointments.cancelled')}</SelectItem>
                  <SelectItem value="completed">{t('appointments.completed')}</SelectItem>
                  <SelectItem value="rescheduled">{t('appointments.rescheduled')}</SelectItem>
                  <SelectItem value="no_show">{t('appointments.noShow')}</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">{t('appointments.list')}</TabsTrigger>
          <TabsTrigger value="day">{t('appointments.dayView')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.allBookings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('appointments.customer')}</TableHead>
                    <TableHead>{t('appointments.service')}</TableHead>
                    <TableHead>{t('appointments.staff')}</TableHead>
                    <TableHead>{t('appointments.date')}</TableHead>
                    <TableHead>{t('appointments.time')}</TableHead>
                    <TableHead>{t('appointments.duration')}</TableHead>
                    <TableHead>{t('appointments.statusLabel')}</TableHead>
                    <TableHead>{t('appointments.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <p>{appointment.customerName}</p>
                          <p className="text-xs text-gray-500">{appointment.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.serviceName}</TableCell>
                      <TableCell>{appointment.staffName}</TableCell>
                      <TableCell>{appointment.date}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === 'confirmed' || appointment.status === 'completed'
                              ? 'default'
                              : appointment.status === 'pending' || appointment.status === 'rescheduled'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={statusClasses(appointment.status)}
                        >
                          {appointmentStatusLabel(appointment.status, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(appointment)}>
                            {t('appointments.edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={appointment.status === 'cancelled'}
                            title={t('appointments.cancel')}
                            onClick={() => void cancelAppointment(appointment.id)}
                          >
                            {t('appointments.cancel')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-gray-500">
                        {isLive && appointmentCards.length === 0 ? t('dashboard.noBookingsYet') : t('appointments.noMatches')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="space-y-3 md:hidden">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{appointment.customerName}</p>
                        <p className="text-xs text-gray-500">{appointment.customerEmail}</p>
                      </div>
                      <Badge className={statusClasses(appointment.status)}>
                        {appointmentStatusLabel(appointment.status, t)}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">{t('appointments.service')}</p>
                        <p className="font-medium text-gray-900">{appointment.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('appointments.staff')}</p>
                        <p className="font-medium text-gray-900">{appointment.staffName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('appointments.date')}</p>
                        <p className="font-medium text-gray-900">{appointment.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('appointments.time')}</p>
                        <p className="font-medium text-gray-900">{appointment.time}</p>
                      </div>
                    </div>
                    {appointment.notes && <p className="mt-3 text-sm text-gray-500">{appointment.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(appointment)}>
                        {t('appointments.reschedule')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={appointment.status === 'cancelled'}
                        onClick={() => void cancelAppointment(appointment.id)}
                      >
                        {t('appointments.cancel')}
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAppointments.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    {isLive && appointmentCards.length === 0 ? t('dashboard.noBookingsYet') : t('appointments.addManualOrConnect')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.dayView')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAppointments.slice(0, 4).map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          <Calendar className="mr-2 inline-block h-4 w-4 text-gray-400" />
                          {appointment.date} - {appointment.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <Clock className="mr-2 inline-block h-4 w-4 text-gray-400" />
                          {appointment.time} · {appointment.serviceName} with {appointment.staffName}
                        </p>
                        {appointment.notes && <p className="mt-1 text-xs text-gray-500">{appointment.notes}</p>}
                      </div>
                      <Badge className={statusClasses(appointment.status)}>
                        {appointmentStatusLabel(appointment.status, t)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointmentId ? t('appointments.editBooking') : t('appointments.createBooking')}</DialogTitle>
            <DialogDescription>{t('appointments.addDetails')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-customer">{t('appointments.customer')}</Label>
              <Select value={draft.customerId} onValueChange={(value) => setDraft((current) => ({ ...current, customerId: value }))}>
                <SelectTrigger id="appointment-customer" className="bg-white">
                  <SelectValue placeholder={t('appointments.selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name ?? customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-service">{t('appointments.service')}</Label>
              <Select value={draft.serviceId} onValueChange={(value) => setDraft((current) => ({ ...current, serviceId: value }))}>
                <SelectTrigger id="appointment-service" className="bg-white">
                  <SelectValue placeholder={t('appointments.selectService')} />
                </SelectTrigger>
                <SelectContent>
                  {activeServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-staff">{t('appointments.staff')}</Label>
              <Select value={draft.staffId} onValueChange={(value) => setDraft((current) => ({ ...current, staffId: value }))}>
                <SelectTrigger id="appointment-staff" className="bg-white">
                  <SelectValue placeholder={t('appointments.selectStaff')} />
                </SelectTrigger>
                <SelectContent>
                  {activeStaff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="appointment-date">{t('appointments.date')}</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">{t('appointments.time')}</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={draft.time}
                  onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-status">{t('appointments.statusLabel')}</Label>
              <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as Appointment['status'] }))}>
                <SelectTrigger id="appointment-status" className="bg-white">
                  <SelectValue placeholder={t('appointments.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('appointments.pending')}</SelectItem>
                  <SelectItem value="confirmed">{t('appointments.confirmed')}</SelectItem>
                  <SelectItem value="rescheduled">{t('appointments.rescheduled')}</SelectItem>
                  <SelectItem value="completed">{t('appointments.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('appointments.cancelled')}</SelectItem>
                  <SelectItem value="no_show">{t('appointments.noShow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-notes">{t('appointments.notes')}</Label>
              <Textarea
                id="appointment-notes"
                placeholder={t('appointments.notesPlaceholder')}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                className="bg-white resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void persistAppointment()} disabled={saving}>
              {saving ? t('common.saving') : editingAppointmentId ? t('appointments.saveChanges') : t('appointments.createBooking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
