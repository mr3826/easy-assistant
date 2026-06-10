import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  twoFactorCode: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits.').optional().or(z.literal('')),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    twoFactorCode: '',
    rememberMe: false,
  });

  const updateFormData = <Field extends keyof LoginFormData>(
    field: Field,
    value: LoginFormData[Field],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    const nextErrors: Partial<Record<keyof LoginFormData, string>> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormData | undefined;
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
    }

    if (enable2FA && !formData.twoFactorCode) {
      nextErrors.twoFactorCode = 'Code is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      twoFactorCode: '',
      rememberMe: false,
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const session = await login(formData.email, formData.password);
      resetForm();
      const nextPath = session.nextRoute ?? (session.requiresOnboarding ? '/onboarding' : session.memberships.length > 0 ? '/dashboard' : '/onboarding');
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Unable to sign in with those credentials.');
      } else {
        setFormError('Unable to sign in right now.');
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
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your BookingAI account</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(event) => updateFormData('email', event.target.value)}
                aria-invalid={!!errors.email}
                className={errors.email ? 'border-red-500' : 'bg-white'}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(event) => updateFormData('password', event.target.value)}
                  aria-invalid={!!errors.password}
                  className={errors.password ? 'border-red-500' : 'bg-white pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="2fa"
                checked={enable2FA}
                onCheckedChange={(checked: boolean) => setEnable2FA(Boolean(checked))}
              />
              <Label htmlFor="2fa" className="cursor-pointer">
                Enable Two-Factor Authentication
              </Label>
            </div>

            {enable2FA && (
              <div className="space-y-2">
                <Label htmlFor="2fa-code">2FA Code</Label>
                <Input
                  id="2fa-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={formData.twoFactorCode}
                  onChange={(event) => updateFormData('twoFactorCode', event.target.value)}
                  aria-invalid={!!errors.twoFactorCode}
                  className={errors.twoFactorCode ? 'border-red-500' : 'bg-white'}
                />
                {errors.twoFactorCode && <p className="text-sm text-red-500">{errors.twoFactorCode}</p>}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked: boolean) => updateFormData('rememberMe', Boolean(checked))}
                />
                <Label htmlFor="remember" className="cursor-pointer">
                  Remember me
                </Label>
              </div>
              <Link to="#" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>

            <p className="text-center text-gray-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
