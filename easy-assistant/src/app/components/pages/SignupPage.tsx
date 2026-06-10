import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    category: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setFormError(null);
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    void submitSignup();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const submitSignup = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      const session = await signup({
        name: formData.ownerName,
        email: formData.email,
        password: formData.password,
        organizationName: formData.businessName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });

      const nextPath = session.nextRoute ?? (session.requiresOnboarding === false ? '/dashboard' : '/onboarding');
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError('An account with this email already exists.');
      } else {
        setFormError('Unable to create your account right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Step {step} of 2 - {step === 1 ? 'Business Information' : 'Account Security'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateFormData('businessName', e.target.value)}
                    placeholder="Your Business Name"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => updateFormData('ownerName', e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Business Category</Label>
                  <Select value={formData.category} onValueChange={(value: string) => updateFormData('category', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor / Medical</SelectItem>
                      <SelectItem value="hotel">Hotel / Hospitality</SelectItem>
                      <SelectItem value="salon">Salon / Beauty</SelectItem>
                      <SelectItem value="spa">Spa / Wellness</SelectItem>
                      <SelectItem value="fitness">Fitness / Gym</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <div className="flex gap-3 w-full">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {step === 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : isSubmitting ? (
                  'Creating Account...'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
            
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
