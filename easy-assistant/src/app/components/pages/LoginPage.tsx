import { useMemo, useState } from 'react';
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
import { useI18n } from '../../i18n';

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

function buildLoginSchema(t: ReturnType<typeof useI18n>['t']) {
  return z.object({
    email: z.string().email(t('auth.validEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
    rememberMe: z.boolean().default(false),
  });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const loginSchema = useMemo(() => buildLoginSchema(t), [t]);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
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
        setFormError(t('auth.unableToSignIn'));
      } else {
        setFormError(t('auth.unableToSignIn'));
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
            <CardTitle className="text-xl font-bold">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.signInToApp')}</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.emailAddress')}</Label>
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
              <Label htmlFor="password">{t('auth.password')}</Label>
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
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked: boolean) => updateFormData('rememberMe', Boolean(checked))}
                />
                <Label htmlFor="remember" className="cursor-pointer">
                  {t('auth.rememberMe')}
                </Label>
              </div>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signingIn') : t('common.login')}
            </Button>

            <p className="text-center text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                {t('common.signUp')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
