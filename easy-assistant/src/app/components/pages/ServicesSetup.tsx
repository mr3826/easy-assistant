import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';
import {
  createService,
  deleteService,
  fetchAppointments,
  fetchServices,
  fetchStaff,
  mapServiceStaffFromAppointments,
  updateService,
  type TenantScope,
} from '../../api';
import type { Appointment, Service, Staff } from '../../types';

interface ServiceCard {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
  active: boolean;
  staffNames: string[];
  currency: string;
}

interface ServiceDraft {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  description: string;
  active: boolean;
  staffName: string;
}

const fallbackSeed: ServiceCard[] = [
  {
    id: 'seed-service-1',
    name: 'Haircut & Style',
    category: 'Hair Services',
    durationMinutes: 60,
    price: 45,
    description: 'Precision haircut and styling.',
    active: true,
    staffNames: ['Emily Chen'],
    currency: 'USD',
  },
  {
    id: 'seed-service-2',
    name: 'Hair Coloring',
    category: 'Hair Services',
    durationMinutes: 120,
    price: 95,
    description: 'Root touch-up and full color refresh.',
    active: true,
    staffNames: ['Emily Chen'],
    currency: 'USD',
  },
  {
    id: 'seed-service-3',
    name: 'Medical Consultation',
    category: 'Healthcare',
    durationMinutes: 30,
    price: 75,
    description: 'General consultation and follow-up triage.',
    active: true,
    staffNames: ['Dr. Michael Smith'],
    currency: 'USD',
  },
  {
    id: 'seed-service-4',
    name: 'Follow-up Visit',
    category: 'Healthcare',
    durationMinutes: 15,
    price: 35,
    description: 'Quick review visit after treatment.',
    active: true,
    staffNames: ['Dr. Michael Smith'],
    currency: 'USD',
  },
  {
    id: 'seed-service-5',
    name: 'Full Body Spa',
    category: 'Spa & Wellness',
    durationMinutes: 90,
    price: 120,
    description: 'Full spa treatment with exfoliation.',
    active: true,
    staffNames: ['Lisa Brown'],
    currency: 'USD',
  },
];

function mapServiceCard(service: Service, staffNames: string[]): ServiceCard {
  return {
    id: service.id,
    name: service.name,
    category: service.category ?? 'Uncategorized',
    durationMinutes: service.durationMinutes,
    price: service.price,
    description: service.description ?? '',
    active: service.active,
    staffNames,
    currency: service.currency,
  };
}

function mapFallbackCard(card: ServiceCard): ServiceCard {
  return { ...card, staffNames: [...card.staffNames] };
}

function buildDraft(service?: ServiceCard | null): ServiceDraft {
  return {
    name: service?.name ?? '',
    category: service?.category ?? '',
    durationMinutes: service ? String(service.durationMinutes) : '60',
    price: service ? String(service.price) : '50',
    description: service?.description ?? '',
    active: service?.active ?? true,
    staffName: service?.staffNames[0] ?? '__none__',
  };
}

export default function ServicesSetup() {
  const { session } = useAuth();
  const [services, setServices] = useState<ServiceCard[]>(fallbackSeed);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ServiceDraft>(buildDraft());

  const scope = useMemo<TenantScope | null>(() => {
    if (!session?.organization?.id || !session?.location?.id) {
      return null;
    }

    return {
      organizationId: session.organization.id,
      locationId: session.location.id,
    };
  }, [session]);

  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);

  const serviceView = useMemo(
    () =>
      services.map((service) => ({
        ...service,
        staffNames:
          service.staffNames.length > 0
            ? service.staffNames
            : mapServiceStaffFromAppointments(service.id, appointments, staffById),
      })),
    [appointments, services, staffById]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      if (!scope) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setActionStatus('');

      const [servicesResult, staffResult, appointmentsResult] = await Promise.allSettled([
        fetchServices(scope),
        fetchStaff(scope),
        fetchAppointments(scope),
      ]);

      if (!active) {
        return;
      }

      const serviceRows =
        servicesResult.status === 'fulfilled'
          ? servicesResult.value.map((service) => mapServiceCard(service, []))
          : fallbackSeed.map(mapFallbackCard);
      const staffRows = staffResult.status === 'fulfilled' ? staffResult.value : [];
      const appointmentRows = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : [];

      setServices(serviceRows);
      setStaff(staffRows);
      setAppointments(appointmentRows);
      setIsLive(servicesResult.status === 'fulfilled' || staffResult.status === 'fulfilled' || appointmentsResult.status === 'fulfilled');

      if (servicesResult.status !== 'fulfilled' || staffResult.status !== 'fulfilled' || appointmentsResult.status !== 'fulfilled') {
        setActionStatus('Live service data is not available yet, so this screen is showing the local fallback snapshot.');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope]);

  const stats = useMemo(() => {
    const total = serviceView.length;
    const activeCount = serviceView.filter((service) => service.active).length;
    const avgDuration = total > 0 ? Math.round(serviceView.reduce((sum, service) => sum + service.durationMinutes, 0) / total) : 0;
    const avgPrice = total > 0 ? Math.round(serviceView.reduce((sum, service) => sum + service.price, 0) / total) : 0;

    return { total, activeCount, avgDuration, avgPrice };
  }, [serviceView]);

  const openCreateDialog = () => {
    setEditingServiceId(null);
    setDraft(buildDraft());
    setServiceDialogOpen(true);
  };

  const openEditDialog = (service: ServiceCard) => {
    setEditingServiceId(service.id);
    setDraft(buildDraft(service));
    setServiceDialogOpen(true);
  };

  const saveService = async () => {
    if (!scope) {
      setActionStatus('Sign in context is missing tenant scope, so the form cannot save yet.');
      return;
    }

    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim() || null,
      durationMinutes: Number(draft.durationMinutes),
      price: Number(draft.price),
      description: draft.description.trim() || null,
      active: draft.active,
    };

    if (!payload.name) {
      setActionStatus('Service name is required.');
      return;
    }

    setSaving(true);

    try {
      if (editingServiceId) {
        const response = await updateService(scope, editingServiceId, payload);
        const updated = response ?? null;
        if (updated) {
          setServices((current) =>
            current.map((service) =>
              service.id === editingServiceId
                ? mapServiceCard(updated, service.staffNames)
                : service
            )
          );
        }
        setActionStatus('Service updated through the API.');
      } else {
        const response = await createService(scope, payload);
        if (response) {
          setServices((current) => [
            mapServiceCard(response, draft.staffName !== '__none__' ? [draft.staffName] : []),
            ...current,
          ]);
        } else {
          setServices((current) => [
            {
              id: `local-${Date.now()}`,
              name: payload.name,
              category: payload.category ?? 'Uncategorized',
              durationMinutes: payload.durationMinutes,
              price: payload.price,
              description: payload.description ?? '',
              active: payload.active,
              staffNames: draft.staffName !== '__none__' ? [draft.staffName] : [],
              currency: 'USD',
            },
            ...current,
          ]);
        }
        setActionStatus('Service created through the API.');
      }

      setServiceDialogOpen(false);
    } catch {
      setServices((current) => {
        if (editingServiceId) {
          return current.map((service) =>
            service.id === editingServiceId
              ? {
                  ...service,
                  ...payload,
                  category: payload.category ?? 'Uncategorized',
                  description: payload.description ?? '',
                }
              : service
          );
        }

        return [
          {
            id: `local-${Date.now()}`,
            name: payload.name,
            category: payload.category ?? 'Uncategorized',
            durationMinutes: payload.durationMinutes,
            price: payload.price,
            description: payload.description ?? '',
            active: payload.active,
            staffNames: draft.staffName !== '__none__' ? [draft.staffName] : [],
            currency: 'USD',
          },
          ...current,
        ];
      });
      setActionStatus('Saved locally only because the backend mutation is not ready yet.');
      setServiceDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const removeService = async (service: ServiceCard) => {
    if (!scope) {
      setActionStatus('Tenant scope is not available yet, so delete remains local-only.');
      return;
    }

    const confirmed = window.confirm(`Delete ${service.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteService(scope, service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
      setActionStatus(`${service.name} deleted through the API.`);
    } catch {
      setServices((current) => current.filter((item) => item.id !== service.id));
      setActionStatus(`${service.name} removed locally only.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Services Setup</h1>
          <p className="text-gray-500">Manage your services, pricing, and availability</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {actionStatus && (
        <p className="text-sm text-green-700" role="status" aria-live="polite">
          {actionStatus}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Loading services from the current tenant...</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">Live API data is not available yet, so the local snapshot is still visible.</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avg. Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPrice}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceView.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.description || 'API-backed service record'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {service.durationMinutes} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {service.currency} {service.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {service.staffNames.length > 0 ? (
                        service.staffNames.map((staffName) => (
                          <Badge key={staffName} variant="secondary" className="text-xs">
                            {staffName}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={service.active ? 'default' : 'secondary'}
                      className={service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {service.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(service)}
                        aria-label={`Edit ${service.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void removeService(service)}
                        aria-label={`Delete ${service.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? 'Update the service record and save it back to the API.' : 'Create a new service for the current location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g., Haircut, Massage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-category">Category</Label>
              <Select value={draft.category} onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}>
                <SelectTrigger id="service-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hair Services">Hair Services</SelectItem>
                  <SelectItem value="Spa & Wellness">Spa & Wellness</SelectItem>
                  <SelectItem value="Massage">Massage</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-duration">Duration (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="5"
                  step="5"
                  value={draft.durationMinutes}
                  onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-price">Price</Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.price}
                  onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder="Service description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-staff">Preview Staff Link</Label>
              <Select value={draft.staffName} onValueChange={(value) => setDraft((current) => ({ ...current, staffName: value }))}>
                <SelectTrigger id="service-staff">
                  <SelectValue placeholder="Preview staff link" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Staff assignment is shown locally until the backend exposes the join model write endpoint.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => void saveService()} disabled={saving}>
              {saving ? 'Saving...' : editingServiceId ? 'Save Changes' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
