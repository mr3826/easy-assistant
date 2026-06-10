import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ArrowLeft, Check, Building, Briefcase, Users, Clock, Share2, CreditCard, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../context/AuthContext';
import { LoadingFallback } from '../guards';

const steps = [
  { id: 1, title: 'Business Information', icon: Building },
  { id: 2, title: 'Services Setup', icon: Briefcase },
  { id: 3, title: 'Staff Setup', icon: Users },
  { id: 4, title: 'Working Hours', icon: Clock },
  { id: 5, title: 'Connect Channels', icon: Share2 },
  { id: 6, title: 'Subscription & Billing', icon: CreditCard },
  { id: 7, title: 'Dashboard', icon: LayoutDashboard },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((value) => value + 1);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((value) => value - 1);
    }
  };

  if (isLoading) {
    return <LoadingFallback message="Loading onboarding..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold">BookingAI Setup</span>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : ''}
                      ${isCurrent ? 'bg-blue-600 border-blue-600 text-white' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-white border-gray-300 text-gray-400' : ''}
                    `}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`
                      absolute -bottom-6 text-xs whitespace-nowrap hidden sm:block
                      ${isCurrent ? 'text-blue-600' : 'text-gray-500'}
                    `}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-2
                      ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <Card className="shadow-lg mt-12">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input placeholder="Your Business Name" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input placeholder="Street Address" className="bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="City" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input placeholder="12345" className="bg-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Description</Label>
                  <Textarea 
                    placeholder="Tell us about your business..." 
                    className="bg-white resize-none" 
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Services Setup */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-gray-600">Add your services and pricing</p>
                
                <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input placeholder="e.g., Haircut, Consultation" className="bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input type="number" placeholder="30" className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" placeholder="50" className="bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic Services</SelectItem>
                        <SelectItem value="premium">Premium Services</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full">+ Add Another Service</Button>
                </div>
              </div>
            )}

            {/* Step 3: Staff Setup */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-600">Add team members who will handle bookings</p>
                
                <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <Label>Staff Name</Label>
                    <Input placeholder="Full Name" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="staff@example.com" className="bg-white" />
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
                  <Button variant="outline" className="w-full">+ Add Another Staff Member</Button>
                </div>
              </div>
            )}

            {/* Step 4: Working Hours */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-gray-600">Set your business operating hours</p>
                
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Checkbox id={day} defaultChecked={day !== 'Sunday'} />
                    <Label htmlFor={day} className="flex-1">{day}</Label>
                    <Input type="time" defaultValue="09:00" className="w-32 bg-white" />
                    <span className="text-gray-500">to</span>
                    <Input type="time" defaultValue="17:00" className="w-32 bg-white" />
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Connect Channels */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <p className="text-gray-600">Choose how customers can book with you</p>
                
                <div className="space-y-3">
                  {[
                    { name: 'WhatsApp Business', desc: 'Accept bookings via WhatsApp' },
                    { name: 'Facebook Messenger', desc: 'Integrate with Facebook Page' },
                    { name: 'Telegram Bot', desc: 'Let customers book via Telegram' },
                    { name: 'Web Chat Widget', desc: 'Add to your website' },
                  ].map((channel) => (
                    <div key={channel.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div>
                        <p>{channel.name}</p>
                        <p className="text-sm text-gray-500">{channel.desc}</p>
                      </div>
                      <Switch />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Subscription & Billing */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <p className="text-gray-600">Choose your plan</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Starter', price: 29, features: ['100 bookings/mo', '1 channel', 'Email support'] },
                    { name: 'Professional', price: 79, features: ['Unlimited bookings', 'All channels', 'Priority support', 'Analytics'], popular: true },
                    { name: 'Enterprise', price: 199, features: ['Everything in Pro', 'Custom AI training', 'Dedicated support', 'White-label'] },
                  ].map((plan) => (
                    <div key={plan.name} className={`
                      p-6 border-2 rounded-lg relative
                      ${plan.popular ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                    `}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">Popular</span>
                        </div>
                      )}
                      <h3 className="font-semibold mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        variant={plan.popular ? 'default' : 'outline'} 
                        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        Select Plan
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Complete */}
            {currentStep === 7 && (
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl">You&apos;re All Set!</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your AI-powered booking assistant is ready to go. Click below to access your dashboard and start managing appointments.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  void handleNext();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === 7 ? 'Go to Dashboard' : 'Next'}
                {currentStep !== 7 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
