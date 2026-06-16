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
import { useI18n } from '../../i18n';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useI18n();
  const businessCategories = [
    { value: 'doctor', label: t('auth.categoryDoctor') },
    { value: 'hotel', label: t('auth.categoryHotel') },
    { value: 'salon', label: t('auth.categorySalon') },
    { value: 'spa', label: t('auth.categorySpa') },
    { value: 'fitness', label: t('auth.categoryFitness') },
    { value: 'restaurant', label: t('auth.categoryRestaurant') },
    { value: 'consulting', label: t('auth.categoryConsulting') },
    { value: 'other', label: t('auth.categoryOther') },
  ] as const;
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
      setFormError(t('auth.passwordsDoNotMatch'));
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

      const nextPath = session.nextRoute === '/dashboard' ? session.nextRoute : '/dashboard';
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(t('auth.emailExists'));
      } else {
        setFormError(t('auth.unableToCreate'));
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
            <CardTitle>{t('auth.createYourAccount')}</CardTitle>
            <CardDescription>
              {t('auth.stepOfTwo', { step, section: step === 1 ? t('auth.businessInformation') : t('auth.accountSecurity') })}
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('auth.businessName')}</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => updateFormData('businessName', e.target.value)}
                    placeholder={t('auth.businessNamePlaceholder')}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">{t('auth.ownerName')}</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => updateFormData('ownerName', e.target.value)}
                    placeholder={t('auth.ownerNamePlaceholder')}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.emailAddress')}</Label>
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
                  <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+880 17XX XXXXXX"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t('auth.businessCategory')}</Label>
                  <Select value={formData.category} onValueChange={(value: string) => updateFormData('category', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('auth.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">{t('auth.passwordMin')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
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
                    {t('auth.termsConsent')}
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
                  {t('common.back')}
                </Button>
              )}
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {step === 1 ? (
                  <>
                    {t('auth.next')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : isSubmitting ? (
                  t('auth.creatingAccount')
                ) : (
                  t('auth.createAccount')
                )}
              </Button>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
            
            <p className="text-center text-gray-600">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                {t('common.signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
