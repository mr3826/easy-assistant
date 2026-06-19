import { authApiState, createAuthSession, resetAuthApiMock } from './auth-api-mock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '../app/components/pages/LoginPage';
import { AuthProvider } from '../app/context/AuthContext';
import AuthGuard from '../app/components/guards/AuthGuard';
import { I18nProvider } from '../app/i18n';
import { click, getByTestId, getByText, render, waitFor } from './test-utils';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function changeInput(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function submitForm(form: HTMLFormElement) {
  act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('LoginPage', () => {
  beforeEach(() => {
    resetAuthApiMock();
  });

  afterEach(() => {
    resetAuthApiMock();
  });

  it('renders the login form and toggles password visibility', () => {
    const { container } = render(
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>,
    );

    const emailInput = container.querySelector<HTMLInputElement>('#email');
    const passwordInput = container.querySelector<HTMLInputElement>('#password');
    const showPasswordButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Show password"]',
    );

    if (!emailInput || !passwordInput || !showPasswordButton) {
      throw new Error('Expected login form controls to render.');
    }

    expect(getByText(container, 'Welcome Back')).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');

    click(showPasswordButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(container.querySelector('button[aria-label="Hide password"]')).toBeInTheDocument();
  });

  it('authenticates before navigating to the guarded dashboard', async () => {
    authApiState.loginResponse = createAuthSession({
      user: {
        id: 'user-login',
        name: 'Owner',
        email: 'demo@example.com',
        passwordHash: 'dev:password',
        status: 'active',
        lastLoginAt: '2026-06-11T00:15:00+06:00',
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:15:00+06:00',
      },
    });

    const { container } = render(
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <h1>Private dashboard</h1>
                    <LocationProbe />
                  </AuthGuard>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>,
    );

    const emailInput = container.querySelector<HTMLInputElement>('#email');
    const passwordInput = container.querySelector<HTMLInputElement>('#password');
    const form = container.querySelector('form');

    if (!emailInput || !passwordInput || !form) {
      throw new Error('Expected login form controls to render.');
    }

    changeInput(emailInput, 'demo@example.com');
    changeInput(passwordInput, 'password');
    submitForm(form);

    await waitFor(() => {
      expect(getByText(container, 'Private dashboard')).toBeInTheDocument();
      expect(getByTestId(container, 'location')).toHaveTextContent('/dashboard');
    });
  });
});
