import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Edit, Trash2, Clock, Mail, Phone } from 'lucide-react';

const staffMembers = [
  { 
    id: 1, 
    name: 'Emily Chen', 
    role: 'Senior Stylist', 
    email: 'emily@bookingai.com',
    phone: '+1 (555) 123-4567',
    avatar: '',
    hours: 'Mon-Fri, 9:00 AM - 6:00 PM',
    services: ['Haircut', 'Coloring', 'Styling'],
    availability: 'Available',
    bookings: 124
  },
  { 
    id: 2, 
    name: 'Dr. Michael Smith', 
    role: 'Medical Consultant', 
    email: 'msmith@bookingai.com',
    phone: '+1 (555) 234-5678',
    avatar: '',
    hours: 'Mon-Thu, 8:00 AM - 5:00 PM',
    services: ['General Consultation', 'Follow-ups'],
    availability: 'Busy',
    bookings: 89
  },
  { 
    id: 3, 
    name: 'Lisa Brown', 
    role: 'Spa Therapist', 
    email: 'lisa@bookingai.com',
    phone: '+1 (555) 345-6789',
    avatar: '',
    hours: 'Tue-Sat, 10:00 AM - 7:00 PM',
    services: ['Spa Treatment', 'Aromatherapy', 'Body Massage'],
    availability: 'Available',
    bookings: 156
  },
  { 
    id: 4, 
    name: 'Mark Wilson', 
    role: 'Massage Therapist', 
    email: 'mark@bookingai.com',
    phone: '+1 (555) 456-7890',
    avatar: '',
    hours: 'Mon-Sat, 9:00 AM - 8:00 PM',
    services: ['Deep Tissue', 'Swedish Massage', 'Sports Massage'],
    availability: 'Available',
    bookings: 201
  },
];

export default function StaffManagement() {
  const [actionStatus, setActionStatus] = useState('');

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Staff Management</h1>
            <p className="text-gray-500">Manage your team members and their schedules</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>Enter the details of the new team member</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="Enter name" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@example.com" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stylist">Stylist</SelectItem>
                      <SelectItem value="therapist">Therapist</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Services</Label>
                  <Input placeholder="Enter services (comma separated)" className="bg-white" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActionStatus('Staff member added locally for this demo.')}
                  >
                    Add Staff Member
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
              <CardTitle className="text-sm text-gray-600">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Available Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.filter(s => s.availability === 'Available').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.reduce((sum, s) => sum + s.bookings, 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">Avg. per Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(staffMembers.reduce((sum, s) => sum + s.bookings, 0) / staffMembers.length)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staffMembers.map((staff) => (
            <Card key={staff.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={staff.avatar} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{staff.name}</h3>
                      <p className="text-sm text-gray-500">{staff.role}</p>
                      <Badge 
                        variant={staff.availability === 'Available' ? 'default' : 'secondary'}
                        className={staff.availability === 'Available' ? 'bg-green-100 text-green-700 mt-2' : 'bg-yellow-100 text-yellow-700 mt-2'}
                      >
                        {staff.availability}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActionStatus(`${staff.name} opened in demo edit mode.`)}
                      aria-label={`Edit ${staff.name} in demo mode`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="Staff deletion is disabled in demo mode"
                      aria-label={`Delete ${staff.name} unavailable in demo mode`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{staff.hours}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {staff.services.map((service, idx) => (
                      <Badge key={idx} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Bookings</span>
                    <span className="font-semibold">{staff.bookings}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActionStatus(`${staff.name}'s schedule opened in demo mode.`)}
                  >
                    View Schedule
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActionStatus(`${staff.name}'s hours opened in demo edit mode.`)}
                  >
                    Edit Hours
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
  );
}
