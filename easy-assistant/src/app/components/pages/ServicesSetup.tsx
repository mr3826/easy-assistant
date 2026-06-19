import { useEffect, useMemo, useState } from 'react';
import { Archive, Plus, Edit, Clock, DollarSign } from 'lucide-react';
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
import { useI18n } from '../../i18n';
import {
  createService,
  deleteService,
  fetchServices,
  fetchStaff,
  fetchStaffServices,
  updateService,
  type TenantScope,
} from '../../api';
import type { Service } from '../../types';

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
}

type ActionTone = 'success' | 'error' | 'info';

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

function categoryLabel(category: string, t: (path: string) => string) {
  switch (category) {
    case 'Hair Services':
      return t('services.categoryHair');
    case 'Skin Care':
      return t('services.categorySkin');
    case 'Makeup':
      return t('services.categoryMakeup');
    case 'Spa & Wellness':
      return t('services.categorySpaWellness');
    case 'Massage':
      return t('services.categoryMassage');
    case 'Healthcare':
      return t('services.categoryHealthcare');
    case 'Fitness':
      return t('services.categoryFitness');
    case 'Uncategorized':
      return t('services.uncategorized');
    default:
      return category || t('services.uncategorized');
  }
}

function buildDraft(service?: ServiceCard | null): ServiceDraft {
  return {
    name: service?.name ?? '',
    category: service?.category ?? '',
    durationMinutes: service ? String(service.durationMinutes) : '60',
    price: service ? String(service.price) : '1000',
    description: service?.description ?? '',
    active: service?.active ?? true,
  };
}

function formatPrice(amount: number, currency: string) {
  if (currency === 'BDT') {
    return `৳${new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(amount)}`;
  }

  return `${currency} ${new Intl.NumberFormat().format(amount)}`;
}

export default function ServicesSetup() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionTone, setActionTone] = useState<ActionTone>('info');
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

  const serviceView = services;

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

      const [servicesResult, staffResult] = await Promise.allSettled([
        fetchServices(scope),
        fetchStaff(scope),
      ]);

      if (!active) {
        return;
      }

      const serviceRows = servicesResult.status === 'fulfilled' ? servicesResult.value : [];
      const staffRows = staffResult.status === 'fulfilled' ? staffResult.value : [];
      const staffNamesByServiceId = new Map<string, string[]>();

      await Promise.all(
        staffRows.map(async (member) => {
          const assignments = await fetchStaffServices(scope, member.id).catch(() => []);
          assignments
            .filter((assignment) => assignment.active)
            .forEach((assignment) => {
              const names = staffNamesByServiceId.get(assignment.serviceId) ?? [];
              staffNamesByServiceId.set(assignment.serviceId, [...names, member.name]);
            });
        })
      );

      setServices(serviceRows.map((service) => mapServiceCard(service, staffNamesByServiceId.get(service.id) ?? [])));
      setIsLive(servicesResult.status === 'fulfilled');

      if (servicesResult.status !== 'fulfilled' || staffResult.status !== 'fulfilled') {
        setActionStatus(t('services.liveServicesUnavailable'));
        setActionTone('error');
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scope, t]);

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
      setActionStatus(t('services.tenantScopeMissing'));
      setActionTone('error');
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
      setActionStatus(t('services.serviceNameRequired'));
      setActionTone('error');
      return;
    }

    if (!Number.isFinite(payload.durationMinutes) || payload.durationMinutes <= 0) {
      setActionStatus(t('services.durationRequired'));
      setActionTone('error');
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
      setActionStatus(t('services.priceRequired'));
      setActionTone('error');
      return;
    }

    setSaving(true);

    try {
      if (editingServiceId) {
        const response = await updateService(scope, editingServiceId, payload);
        const updated = response ?? null;
        if (!updated) {
          throw new Error(t('services.saveFailed'));
        }
        setServices((current) =>
          current.map((service) =>
            service.id === editingServiceId
              ? mapServiceCard(updated, service.staffNames)
              : service
          )
        );
        setActionStatus(t('services.savedThroughApi'));
        setActionTone('success');
      } else {
        const response = await createService(scope, payload);
        if (!response) {
          throw new Error(t('services.saveFailed'));
        }
        setServices((current) => [
          mapServiceCard(response, []),
          ...current,
        ]);
        setActionStatus(t('services.savedThroughApi'));
        setActionTone('success');
      }

      setServiceDialogOpen(false);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('services.saveFailed'));
      setActionTone('error');
    } finally {
      setSaving(false);
    }
  };

  const archiveService = async (service: ServiceCard) => {
    if (!scope) {
      setActionStatus(t('services.tenantScopeMissing'));
      setActionTone('error');
      return;
    }

    const confirmed = window.confirm(t('services.archiveConfirm', { name: service.name }));
    if (!confirmed) {
      return;
    }

    try {
      const archived = await deleteService(scope, service.id);
      if (!archived) {
        throw new Error(t('services.archiveFailed', { name: service.name }));
      }
      setServices((current) =>
        current.map((item) => (item.id === service.id ? mapServiceCard(archived, item.staffNames) : item))
      );
      setActionStatus(t('services.archivedThroughApi', { name: service.name }));
      setActionTone('success');
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : t('services.archiveFailed', { name: service.name }));
      setActionTone('error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>{t('services.title')}</h1>
          <p className="text-gray-500">{t('services.subtitle')}</p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('services.addService')}
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
      {loading && <p className="text-sm text-gray-500">{t('services.loading')}</p>}
      {!isLive && !loading && <p className="text-xs text-gray-500">{t('services.noLiveData')}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('services.totalServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('services.activeServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('services.avgDuration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">{t('services.avgPrice')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{new Intl.NumberFormat('en-BD').format(stats.avgPrice)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('services.allServices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('services.serviceName')}</TableHead>
                <TableHead>{t('services.category')}</TableHead>
                <TableHead>{t('services.duration')}</TableHead>
                <TableHead>{t('services.price')}</TableHead>
                <TableHead>{t('services.staff')}</TableHead>
                <TableHead>{t('services.status')}</TableHead>
                <TableHead>{t('services.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceView.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.description || t('services.apiBackedServiceRecord')}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoryLabel(service.category, t)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {service.durationMinutes} {t('appointments.minutes')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {formatPrice(service.price, service.currency)}
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
                        <Badge variant="secondary" className="text-xs">{t('services.unassigned')}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={service.active ? 'default' : 'secondary'}
                      className={service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {service.active ? t('services.active') : t('services.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(service)}
                        aria-label={`${t('services.editService')} ${service.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void archiveService(service)}
                        aria-label={`${t('services.archiveService')} ${service.name}`}
                      >
                        <Archive className="h-4 w-4 text-gray-500" />
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
            <DialogTitle>{editingServiceId ? t('services.editService') : t('services.addServiceDialog')}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? t('services.editServiceDescription') : t('services.createServiceDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">{t('services.serviceName')}</Label>
              <Input
                id="service-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder={t('services.serviceNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-category">{t('services.category')}</Label>
              <Select value={draft.category} onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}>
                <SelectTrigger id="service-category">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hair Services">{t('services.categoryHair')}</SelectItem>
                  <SelectItem value="Skin Care">{t('services.categorySkin')}</SelectItem>
                  <SelectItem value="Makeup">{t('services.categoryMakeup')}</SelectItem>
                  <SelectItem value="Spa & Wellness">{t('services.categorySpaWellness')}</SelectItem>
                  <SelectItem value="Massage">{t('services.categoryMassage')}</SelectItem>
                  <SelectItem value="Healthcare">{t('services.categoryHealthcare')}</SelectItem>
                  <SelectItem value="Fitness">{t('services.categoryFitness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-duration">{t('services.duration')}</Label>
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
              <Label htmlFor="service-price">{t('services.priceLabel')}</Label>
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
              <Label htmlFor="service-description">{t('services.description')}</Label>
              <Textarea
                id="service-description"
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                placeholder={t('services.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => void saveService()} disabled={saving}>
              {saving ? t('common.saving') : editingServiceId ? t('services.saveChanges') : t('services.addService')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
