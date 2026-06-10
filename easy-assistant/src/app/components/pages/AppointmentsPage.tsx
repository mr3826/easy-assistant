import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Download, FileText, Plus, Search, Filter } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const appointments = [
  { id: 1, customer: 'Sarah Johnson', email: 'sarah@email.com', service: 'Haircut & Style', staff: 'Emily Chen', date: '2025-11-22', time: '10:00 AM', duration: '60 min', status: 'confirmed' },
  { id: 2, customer: 'Mike Peters', email: 'mike@email.com', service: 'Medical Consultation', staff: 'Dr. Smith', date: '2025-11-22', time: '11:30 AM', duration: '30 min', status: 'pending' },
  { id: 3, customer: 'Anna Williams', email: 'anna@email.com', service: 'Spa Treatment', staff: 'Lisa Brown', date: '2025-11-22', time: '2:00 PM', duration: '90 min', status: 'confirmed' },
  { id: 4, customer: 'John Davis', email: 'john@email.com', service: 'Massage Therapy', staff: 'Mark Wilson', date: '2025-11-23', time: '9:00 AM', duration: '60 min', status: 'confirmed' },
  { id: 5, customer: 'Emma Thompson', email: 'emma@email.com', service: 'Facial Treatment', staff: 'Sarah Lee', date: '2025-11-23', time: '4:00 PM', duration: '45 min', status: 'cancelled' },
  { id: 6, customer: 'Robert Garcia', email: 'robert@email.com', service: 'Personal Training', staff: 'Coach Mike', date: '2025-11-24', time: '7:00 AM', duration: '60 min', status: 'confirmed' },
];

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionStatus, setActionStatus] = useState('');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Appointments</h1>
            <p className="text-gray-500">Manage and track all your bookings</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>Add a new appointment to the calendar</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input placeholder="Enter customer name" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="customer@email.com" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="haircut">Haircut & Style</SelectItem>
                      <SelectItem value="consultation">Medical Consultation</SelectItem>
                      <SelectItem value="spa">Spa Treatment</SelectItem>
                      <SelectItem value="massage">Massage Therapy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emily">Emily Chen</SelectItem>
                      <SelectItem value="smith">Dr. Smith</SelectItem>
                      <SelectItem value="lisa">Lisa Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" className="bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional notes..." className="bg-white resize-none" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActionStatus('Demo booking created locally.')}
                  >
                    Create Booking
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

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => setActionStatus('CSV export prepared for this demo view.')}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                
                <Button variant="outline" onClick={() => setActionStatus('PDF export prepared for this demo view.')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View Tabs */}
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
                    {filteredAppointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div>
                            <p>{apt.customer}</p>
                            <p className="text-xs text-gray-500">{apt.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{apt.service}</TableCell>
                        <TableCell>{apt.staff}</TableCell>
                        <TableCell>{apt.date}</TableCell>
                        <TableCell>{apt.time}</TableCell>
                        <TableCell>{apt.duration}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              apt.status === 'confirmed' ? 'default' : 
                              apt.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                            className={
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                              apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                              ''
                            }
                          >
                            {apt.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionStatus(`${apt.customer} opened in demo edit mode.`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Appointment cancellation is disabled in demo mode"
                              aria-label={`Cancel appointment for ${apt.customer} unavailable in demo mode`}
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
                <CardTitle>Day View - November 22, 2025</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments.filter(a => a.date === '2025-11-22').map((apt) => (
                    <div key={apt.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{apt.time} - {apt.customer}</p>
                          <p className="text-sm text-gray-600">{apt.service} with {apt.staff}</p>
                          <p className="text-xs text-gray-500 mt-1">{apt.duration}</p>
                        </div>
                        <Badge 
                          className={
                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }
                        >
                          {apt.status}
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
                <p className="text-center text-gray-500 py-8">Week view calendar coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">Month view calendar coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
  );
}
