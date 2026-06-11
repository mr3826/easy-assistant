import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Clock, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../context/AuthContext';
import {
  createStaff,
  deleteStaff,
  fetchAppointments,
  fetchServices,
  fetchStaff,
  fetchStaffHours,
  mapStaffServicesFromAppointments,
  updateStaff,
  type TenantScope,
} from '../../api';
import type { Staff, StaffHour } from '../../types';

interface StaffCard {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  avatarUrl: string;
  hours: string;
  services: string[];
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
}

const fallbackSeed: StaffCard[] = [
  {
    id: 'seed-staff-1',
    name: 'Emily Chen',
    roleTitle: 'Senior Stylist',
    email: 'emily@bookingai.com',
    phone: '+1 (555) 123-4567',
    avatarUrl: '',
    hours: 'Mon-Fri, 9:00 AM - 6:00 PM',
    services: ['Haircut', 'Coloring', 'Styling'],
    availability: 'Available',
    bookings: 124,
    active: true,
  },
  {
    id: 'seed-staff-2',
    name: 'Dr. Michael Smith',
    roleTitle: 'Medical Consultant',
    email: 'msmith@bookingai.com',
    phone: '+1 (555) 234-5678',
    avatarUrl: '',
    hours: 'Mon-Thu, 8:00 AM - 5:00 PM',
    services: ['General Consultation', 'Follow-ups'],
    availability: 'Busy',
    bookings: 89,
    active: true,
  },
  {
    id: 'seed-staff-3',
    name: 'Lisa Brown',
    roleTitle: 'Spa Therapist',
    email: 'lisa@bookingai.com',
    phone: '+1 (555) 345-6789',
    avatarUrl: '',
    hours: 'Tue-Sat, 10:00 AM - 7:00 PM',
    services: ['Spa Treatment', 'Aromatherapy', 'Body Massage'],
    availability: 'Available',
    bookings: 156,
    active: true,
  },
  {
    id: 'seed-staff-4',
    name: 'Mark Wilson',
    roleTitle: 'Massage Therapist',
    email: 'mark@bookingai.com',
    phone: '+1 (555) 456-7890',
    avatarUrl: '',
    hours: 'Mon-Sat, 9:00 AM - 8:00 PM',
    services: ['Deep Tissue', 'Swedish Massage', 'Sports Massage'],
    availability: 'Available',
    bookings: 201,
    active: true,
  },
];

function mapAvailability(active: boolean, bookings: number): StaffCard['availability'] {
  if (!active) {
    return 'Inactive';
  }

  return bookings > 3 ? 'Busy' : 'Available';
}

function formatHours(hours: StaffHour[]) {
  if (hours.length === 0) {
    return 'Schedule not configured';
  }

  return hours
    .slice()
    .sort((left, right) => left.weekday - right.weekday)
    .map((hour) => {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][hour.weekday];
      return `${day}, ${hour.startTime} - ${hour.endTime}`;
    })
    .join(' • ');
}

function mapStaffCard(
  staff: Staff,
  hours: string,
  services: string[],
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
  };
}

export default function StaffManagement() {
  const { session } = useAuth();
  const [staff, setStaff] = useState<StaffCard[]>(fallbackSeed);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
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

      const [staffResult, appointmentsResult, servicesResult] = await Promise.allSettled([
        fetchStaff(scope),
        fetchAppointments(scope),
        fetchServices(scope),
      ]);

      if (!active) {
        return;
      }

      if (staffResult.status !== 'fulfilled') {
        setStaff(fallbackSeed);
        setIsLive(false);
        setActionStatus('Live staff data is not available yet, so this screen is showing the local fallback snapshot.');
        setLoading(false);
        return;
      }

      const staffRows = staffResult.value;
      const appointmentRows = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [];
      const serviceRows = servicesResult.status === 'fulfilled' ? servicesResult.value : [];

      const serviceById = new Map(serviceRows.map((service) => [service.id, service]));
      const staffCards = await Promise.all(
        staffRows.map(async (member) => {
          const memberHoursResult = await fetchStaffHours(scope, member.id).catch(() => []);
          const hoursText = formatHours(memberHoursResult);
          const servicesText = mapStaffServicesFromAppointments(member.id, appointmentRows, serviceById);
          const bookings = appointmentRows.filter((appointment) => appointment.staffId === member.id).length;
          return mapStaffCard(member, hoursText, servicesText, bookings);
        })
      );

      if (!active) {
        return;
      }

      setStaff(staffCards);
      setIsLive(true);

      if (staffCards.length === 0) {
        setActionStatus('No staff records exist yet for this tenant.');
      } else if (appointmentsResult.status !== 'fulfilled' || servicesResult.status !== 'fulfilled') {
        setActionStatus('Staff records loaded, but related appointment/service links are still partial.');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope]);

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

  const saveStaff = async () => {
    if (!scope) {
      setActionStatus('Tenant scope is missing, so staff edits cannot be saved yet.');
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
      setActionStatus('Staff name is required.');
      return;
    }

    setSaving(true);

    try {
      if (editingStaffId) {
        const response = await updateStaff(scope, editingStaffId, payload);
        if (response) {
          setStaff((current) =>
            current.map((member) =>
              member.id === editingStaffId
                ? {
                    ...member,
                    name: response.name,
                    roleTitle: response.roleTitle ?? 'Team Member',
                    email: response.email ?? '',
                    phone: response.phone ?? '',
                    avatarUrl: response.avatarUrl ?? '',
                    active: response.active,
                    availability: mapAvailability(response.active, member.bookings),
                  }
                : member
            )
          );
        }
        setActionStatus('Staff member updated through the API.');
      } else {
        const response = await createStaff(scope, payload);
        if (response) {
          setStaff((current) => [
            mapStaffCard(response, 'Schedule not configured', [], 0),
            ...current,
          ]);
        } else {
          setStaff((current) => [
            {
              id: `local-${Date.now()}`,
              name: payload.name,
              roleTitle: payload.roleTitle ?? 'Team Member',
              email: payload.email ?? '',
              phone: payload.phone ?? '',
              avatarUrl: '',
              hours: 'Schedule not configured',
              services: [],
              availability: 'Available',
              bookings: 0,
              active: payload.active,
            },
            ...current,
          ]);
        }
        setActionStatus('Staff member created through the API.');
      }

      setStaffDialogOpen(false);
    } catch {
      setStaff((current) => {
        if (editingStaffId) {
          return current.map((member) =>
            member.id === editingStaffId
              ? {
                  ...member,
                  ...payload,
                  roleTitle: payload.roleTitle ?? 'Team Member',
                  email: payload.email ?? '',
                  phone: payload.phone ?? '',
                  active: payload.active,
                  availability: mapAvailability(payload.active, member.bookings),
                }
              : member
          );
        }

        return [
          {
            id: `local-${Date.now()}`,
            name: payload.name,
            roleTitle: payload.roleTitle ?? 'Team Member',
            email: payload.email ?? '',
            phone: payload.phone ?? '',
            avatarUrl: '',
            hours: 'Schedule not configured',
            services: [],
            availability: 'Available',
            bookings: 0,
            active: payload.active,
          },
          ...current,
        ];
      });
      setActionStatus('Saved locally only because the backend mutation is not ready yet.');
      setStaffDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (member: StaffCard) => {
    if (!scope) {
      setActionStatus('Tenant scope is missing, so delete remains local-only.');
      return;
    }

    const confirmed = window.confirm(`Delete ${member.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteStaff(scope, member.id);
      setStaff((current) => current.filter((item) => item.id !== member.id));
      setActionStatus(`${member.name} deleted through the API.`);
    } catch {
      setStaff((current) => current.filter((item) => item.id !== member.id));
      setActionStatus(`${member.name} removed locally only.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Staff Management</h1>
          <p className="text-gray-500">Manage your team members and their schedules</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Loading staff from the current tenant...</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">Live API data is not available yet, so the fallback roster is still visible.</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableNow}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avg. per Staff</CardTitle>
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
                    <AvatarFallback className="bg-blue-600 text-white">
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
                      {member.availability}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(member)}
                    aria-label={`Edit ${member.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeStaff(member)}
                    aria-label={`Delete ${member.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{member.email || 'No email on file'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone || 'No phone on file'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{member.hours}</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-gray-600">Services:</p>
                <div className="flex flex-wrap gap-2">
                  {member.services.length > 0 ? (
                    member.services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Linked service data pending</Badge>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="font-semibold">{member.bookings}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionStatus(`${member.name}'s schedule is being read from the API-backed roster.`)}
                >
                  View Schedule
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionStatus(`${member.name}'s hours are editable through the staff record.`)}
                >
                  Edit Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaffId ? 'Update the staff record and save it back to the API.' : 'Create a new team member for the current tenant.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <Input
                id="staff-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <Input
                id="staff-role"
                value={draft.roleTitle}
                onChange={(event) => setDraft((current) => ({ ...current, roleTitle: event.target.value }))}
                placeholder="Senior Stylist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                type="tel"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={draft.active ? 'active' : 'inactive'}
                onValueChange={(value) => setDraft((current) => ({ ...current, active: value === 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void saveStaff()} disabled={saving}>
              {saving ? 'Saving...' : editingStaffId ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
