import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react';

const services = [
  { id: 1, name: 'Haircut & Style', category: 'Hair Services', duration: 60, price: 45, staff: ['Emily Chen'], active: true },
  { id: 2, name: 'Hair Coloring', category: 'Hair Services', duration: 120, price: 95, staff: ['Emily Chen'], active: true },
  { id: 3, name: 'Medical Consultation', category: 'Healthcare', duration: 30, price: 75, staff: ['Dr. Michael Smith'], active: true },
  { id: 4, name: 'Follow-up Visit', category: 'Healthcare', duration: 15, price: 35, staff: ['Dr. Michael Smith'], active: true },
  { id: 5, name: 'Full Body Spa', category: 'Spa & Wellness', duration: 90, price: 120, staff: ['Lisa Brown'], active: true },
  { id: 6, name: 'Aromatherapy', category: 'Spa & Wellness', duration: 60, price: 80, staff: ['Lisa Brown'], active: true },
  { id: 7, name: 'Deep Tissue Massage', category: 'Massage', duration: 60, price: 90, staff: ['Mark Wilson'], active: true },
  { id: 8, name: 'Swedish Massage', category: 'Massage', duration: 60, price: 75, staff: ['Mark Wilson'], active: false },
];

export default function ServicesSetup() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Services Setup</h1>
            <p className="text-gray-500">Manage your services, pricing, and availability</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>Create a new service offering</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input placeholder="e.g., Haircut, Massage" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hair">Hair Services</SelectItem>
                      <SelectItem value="spa">Spa & Wellness</SelectItem>
                      <SelectItem value="massage">Massage</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input type="number" placeholder="60" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input type="number" placeholder="50" className="bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Service description..." className="bg-white resize-none" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Assign Staff</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select staff members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emily">Emily Chen</SelectItem>
                      <SelectItem value="smith">Dr. Michael Smith</SelectItem>
                      <SelectItem value="lisa">Lisa Brown</SelectItem>
                      <SelectItem value="mark">Mark Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActionStatus('Service added locally for this demo.')}
                  >
                    Add Service
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {actionStatus && (
          <p className="text-sm text-green-700" role="status" aria-live="polite">
            {actionStatus}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Active Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.filter(s => s.active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Avg. Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length)} min
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Avg. Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
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
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {service.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        {service.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {service.staff.map((staff, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {staff}
                          </Badge>
                        ))}
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
                          onClick={() => setActionStatus(`${service.name} opened in demo edit mode.`)}
                          aria-label={`Edit ${service.name} in demo mode`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Service deletion is disabled in demo mode"
                          aria-label={`Delete ${service.name} unavailable in demo mode`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
  );
}
