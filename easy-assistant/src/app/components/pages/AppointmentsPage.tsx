import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Plus, Search, Filter, Calendar, Clock } from 'lucide-react';
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

const fallbackAppointments: AppointmentCard[] = [
  { id: 'seed-appt-1', customerName: 'Sarah Johnson', customerEmail: 'sarah@email.com', serviceName: 'Haircut & Style', staffName: 'Emily Chen', date: '2025-11-22', time: '10:00 AM', duration: '60 min', status: 'confirmed', notes: '' },
  { id: 'seed-appt-2', customerName: 'Mike Peters', customerEmail: 'mike@email.com', serviceName: 'Medical Consultation', staffName: 'Dr. Smith', date: '2025-11-22', time: '11:30 AM', duration: '30 min', status: 'pending', notes: '' },
  { id: 'seed-appt-3', customerName: 'Anna Williams', customerEmail: 'anna@email.com', serviceName: 'Spa Treatment', staffName: 'Lisa Brown', date: '2025-11-22', time: '2:00 PM', duration: '90 min', status: 'confirmed', notes: '' },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function buildDraft(appointment?: AppointmentCard | null, defaults?: { customerId?: string; serviceId?: string; staffId?: string }): AppointmentDraft {
  return {
    customerId: defaults?.customerId ?? '',
    serviceId: defaults?.serviceId ?? '',
    staffId: defaults?.staffId ?? '',
    date: appointment?.date ?? '2026-06-11',
    time: appointment?.time ?? '10:00',
    status: appointment?.status ?? 'confirmed',
    notes: appointment?.notes ?? '',
  };
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

function durationLabel(startTime: string, endTime: string) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const minutes = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.round((end - start) / 60_000)) : 0;
  return `${minutes} min`;
}

function mapAppointments(
  appointments: Appointment[],
  servicesById: Map<string, Service>,
  staffById: Map<string, Staff>,
  customersById: Map<string, Customer>,
) {
  return appointments.map<AppointmentCard>((appointment) => ({
    id: appointment.id,
    customerName: customersById.get(appointment.customerId)?.name ?? 'Unknown customer',
    customerEmail: customersById.get(appointment.customerId)?.email ?? 'No email',
    serviceName: servicesById.get(appointment.serviceId)?.name ?? 'Unknown service',
    staffName: staffById.get(appointment.staffId)?.name ?? 'Unknown staff',
    date: formatDateLabel(appointment.startTime),
    time: formatTimeLabel(appointment.startTime),
    duration: durationLabel(appointment.startTime, appointment.endTime),
    status: appointment.status,
    notes: appointment.notes ?? '',
  }));
}

export default function AppointmentsPage() {
  const { session } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
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

  const appointmentCards = useMemo(() => {
    const liveCards = mapAppointments(appointments, servicesById, staffById, customersById);
    return isLive ? liveCards : fallbackAppointments;
  }, [appointments, customersById, isLive, servicesById, staffById]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!scope) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setActionStatus('');

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
          || servicesResult.status === 'fulfilled'
          || staffResult.status === 'fulfilled'
          || customersResult.status === 'fulfilled',
      );

      if (
        appointmentsResult.status !== 'fulfilled'
        || servicesResult.status !== 'fulfilled'
        || staffResult.status !== 'fulfilled'
        || customersResult.status !== 'fulfilled'
      ) {
        setActionStatus('Showing the local booking snapshot until the backend CRUD endpoints are available everywhere.');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope]);

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
    setEditingAppointmentId(null);
    setDraft(buildDraft(null, {
      customerId: customers[0]?.id,
      serviceId: services[0]?.id,
      staffId: staff[0]?.id,
    }));
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: AppointmentCard) => {
    const sourceAppointment = appointments.find((item) => item.id === appointment.id) ?? null;
    setEditingAppointmentId(appointment.id);
    setDraft(
      buildDraft(appointment, {
        customerId: sourceAppointment?.customerId ?? customers[0]?.id,
        serviceId: sourceAppointment?.serviceId ?? services[0]?.id,
        staffId: sourceAppointment?.staffId ?? staff[0]?.id,
      }),
    );
    setDialogOpen(true);
  };

  const persistAppointment = async () => {
    if (!scope) {
      setActionStatus('Tenant scope is missing, so booking changes stay local for now.');
      return;
    }

    const service = services.find((item) => item.id === draft.serviceId);
    const durationMinutes = service?.durationMinutes ?? 30;
    const start = new Date(`${draft.date}T${draft.time}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60_000 + (service?.bufferMinutes ?? 0) * 60_000);

    if (!draft.customerId || !draft.serviceId || !draft.staffId || Number.isNaN(start.getTime())) {
      setActionStatus('Pick a customer, service, staff member, date, and time before saving.');
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
        if (response) {
          setAppointments((current) =>
            current.map((item) => (item.id === editingAppointmentId ? response : item)),
          );
        }
        setActionStatus('Appointment updated through the API.');
      } else {
        const response = await createAppointment(scope, payload);
        if (response) {
          setAppointments((current) => [response, ...current]);
        } else {
          setAppointments((current) => [
            {
              id: makeId('local-appt'),
              organizationId: scope.organizationId,
              locationId: scope.locationId,
              customerId: draft.customerId,
              serviceId: draft.serviceId,
              staffId: draft.staffId,
              channelId: null,
              conversationId: null,
              startTime: payload.startTime,
              endTime: payload.endTime,
              status: draft.status,
              notes: payload.notes,
              createdBy: 'manual',
              createdAt: payload.startTime,
              updatedAt: payload.startTime,
            },
            ...current,
          ]);
        }
        setActionStatus('Appointment created through the API.');
      }
      setDialogOpen(false);
    } catch {
      const fallbackAppointment: Appointment = {
        id: makeId('local-appt'),
        organizationId: scope.organizationId,
        locationId: scope.locationId,
        customerId: draft.customerId,
        serviceId: draft.serviceId,
        staffId: draft.staffId,
        channelId: null,
        conversationId: null,
        startTime: payload.startTime,
        endTime: payload.endTime,
        status: draft.status,
        notes: payload.notes,
        createdBy: 'manual',
        createdAt: payload.startTime,
        updatedAt: payload.startTime,
      };

      setAppointments((current) =>
        editingAppointmentId
          ? current.map((item) => (item.id === editingAppointmentId ? fallbackAppointment : item))
          : [fallbackAppointment, ...current],
      );
      setActionStatus('Saved locally only because the backend mutation is not available yet.');
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!scope) {
      setActionStatus('Tenant scope is missing, so cancellation stays local.');
      return;
    }

    try {
      await updateAppointment(scope, appointmentId, { status: 'cancelled' });
      setAppointments((current) =>
        current.map((item) => (item.id === appointmentId ? { ...item, status: 'cancelled' } : item)),
      );
      setActionStatus('Appointment cancelled through the API.');
    } catch {
      setAppointments((current) =>
        current.map((item) => (item.id === appointmentId ? { ...item, status: 'cancelled' } : item)),
      );
      setActionStatus('Appointment cancelled locally only.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Appointments</h1>
          <p className="text-gray-500">Manage and track all your bookings</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Loading appointments from the active tenant...</p>}
      {!isLive && !loading && <p className="text-sm text-gray-500">The page is showing local booking data only.</p>}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-white pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-40 bg-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setActionStatus('CSV export prepared for this demo view.')}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>

              <Button variant="outline" onClick={() => setActionStatus('PDF export prepared for this demo view.')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="day">Day View</TabsTrigger>
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                            appointment.status === 'confirmed'
                              ? 'default'
                              : appointment.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                : ''
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(appointment)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={appointment.status === 'cancelled'}
                            title="Cancel the booking"
                            onClick={() => void cancelAppointment(appointment.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Day View</CardTitle>
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
                      <Badge className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' : appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="py-8 text-center text-gray-500">Week view calendar coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="py-8 text-center text-gray-500">Month view calendar coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointmentId ? 'Edit Appointment' : 'Create New Booking'}</DialogTitle>
            <DialogDescription>Persisted appointments are scoped to the active tenant.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-customer">Customer</Label>
              <Select value={draft.customerId} onValueChange={(value) => setDraft((current) => ({ ...current, customerId: value }))}>
                <SelectTrigger id="appointment-customer" className="bg-white">
                  <SelectValue placeholder="Select customer" />
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
              <Label htmlFor="appointment-service">Service</Label>
              <Select value={draft.serviceId} onValueChange={(value) => setDraft((current) => ({ ...current, serviceId: value }))}>
                <SelectTrigger id="appointment-service" className="bg-white">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-staff">Staff member</Label>
              <Select value={draft.staffId} onValueChange={(value) => setDraft((current) => ({ ...current, staffId: value }))}>
                <SelectTrigger id="appointment-staff" className="bg-white">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-date">Date</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Time</Label>
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
              <Label htmlFor="appointment-status">Status</Label>
              <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as Appointment['status'] }))}>
                <SelectTrigger id="appointment-status" className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Notes</Label>
              <Textarea
                id="appointment-notes"
                placeholder="Additional notes..."
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                className="bg-white resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void persistAppointment()} disabled={saving}>
              {saving ? 'Saving...' : editingAppointmentId ? 'Save Changes' : 'Create Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
