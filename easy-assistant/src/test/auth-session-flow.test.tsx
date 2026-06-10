import { authApiState, createAuthSession, resetAuthApiMock } from './auth-api-mock';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '../app/context/AuthContext';
import { click, getByTestId, getByText, render, waitFor } from './test-utils';

function SessionProbe() {
  const { session, isAuthenticated, isLoading, login, logout, refreshSession, signup } = useAuth();
  const [lastAction, setLastAction] = useState('idle');

  return (
    <div>
      <p data-testid="loading-state">{isLoading ? 'loading' : 'ready'}</p>
      <p data-testid="session-state">{isAuthenticated ? 'authenticated' : 'anonymous'}</p>
      <p data-testid="session-user">{session?.user.email ?? 'none'}</p>
      <p data-testid="last-action">{lastAction}</p>
      <button
        type="button"
        onClick={() =>
          void login('owner@example.com', 'password123').then((nextSession) => {
            setLastAction(`login:${nextSession.user.email}`);
          })
        }
      >
        Login
      </button>
      <button
        type="button"
        onClick={() =>
          void signup({
            name: 'New Owner',
            email: 'new-owner@example.com',
            password: 'password123',
            organizationName: 'New Salon',
            timezone: 'Asia/Dhaka',
          }).then((nextSession) => {
            setLastAction(`signup:${nextSession.user.email}`);
          })
        }
      >
        Sign up
      </button>
      <button
        type="button"
        onClick={() =>
          void refreshSession().then((nextSession) => {
            setLastAction(`refresh:${nextSession?.user.email ?? 'none'}`);
          })
        }
      >
        Refresh
      </button>
      <button
        type="button"
        onClick={() => {
          void logout().then(() => setLastAction('logout'));
        }}
      >
        Sign out
      </button>
    </div>
  );
}

describe('auth session flow', () => {
  beforeEach(() => {
    resetAuthApiMock();
    localStorage.clear();
  });

  afterEach(() => {
    resetAuthApiMock();
    localStorage.clear();
  });

  it('hydrates an existing API session and clears it on logout', async () => {
    authApiState.session = createAuthSession();

    const { container } = render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId(container, 'loading-state')).toHaveTextContent('ready');
      expect(getByTestId(container, 'session-state')).toHaveTextContent('authenticated');
      expect(getByTestId(container, 'session-user')).toHaveTextContent('owner@example.com');
    });

    click(getByText(container, 'Sign out'));

    await waitFor(() => {
      expect(getByTestId(container, 'session-state')).toHaveTextContent('anonymous');
      expect(getByTestId(container, 'session-user')).toHaveTextContent('none');
      expect(getByTestId(container, 'last-action')).toHaveTextContent('logout');
    });
  });

  it('routes login, signup, and refreshSession through the API-backed session helpers', async () => {
    const { container } = render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByTestId(container, 'loading-state')).toHaveTextContent('ready');
      expect(getByTestId(container, 'session-state')).toHaveTextContent('anonymous');
    });

    authApiState.loginResponse = createAuthSession({
      user: {
        id: 'user-login',
        name: 'Owner',
        email: 'owner@example.com',
        passwordHash: 'dev:password123',
        status: 'active',
        lastLoginAt: '2026-06-11T00:15:00+06:00',
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:15:00+06:00',
      },
    });

    click(getByText(container, 'Login'));

    await waitFor(() => {
      expect(getByTestId(container, 'session-state')).toHaveTextContent('authenticated');
      expect(getByTestId(container, 'session-user')).toHaveTextContent('owner@example.com');
      expect(getByTestId(container, 'last-action')).toHaveTextContent('login:owner@example.com');
    });

    authApiState.signupResponse = createAuthSession({
      user: {
        id: 'user-signup',
        name: 'New Owner',
        email: 'new-owner@example.com',
        passwordHash: 'dev:password123',
        status: 'active',
        lastLoginAt: null,
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:00:00+06:00',
      },
      organization: {
        id: 'org-signup',
        name: 'New Salon',
        slug: 'new-salon',
        timezone: 'Asia/Dhaka',
        ownerUserId: 'user-signup',
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:00:00+06:00',
      },
      location: {
        id: 'loc-signup',
        organizationId: 'org-signup',
        name: 'Main Location',
        timezone: 'Asia/Dhaka',
        addressLine1: null,
        addressLine2: null,
        city: null,
        region: null,
        country: null,
        phone: null,
        active: true,
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:00:00+06:00',
      },
    });

    click(getByText(container, 'Sign up'));

    await waitFor(() => {
      expect(getByTestId(container, 'session-user')).toHaveTextContent('new-owner@example.com');
      expect(getByTestId(container, 'last-action')).toHaveTextContent('signup:new-owner@example.com');
    });

    authApiState.session = createAuthSession({
      user: {
        id: 'user-refresh',
        name: 'Refreshed Owner',
        email: 'refresh@example.com',
        passwordHash: 'dev:password123',
        status: 'active',
        lastLoginAt: null,
        createdAt: '2026-06-11T00:00:00+06:00',
        updatedAt: '2026-06-11T00:00:00+06:00',
      },
    });

    click(getByText(container, 'Refresh'));

    await waitFor(() => {
      expect(getByTestId(container, 'session-user')).toHaveTextContent('refresh@example.com');
      expect(getByTestId(container, 'last-action')).toHaveTextContent('refresh:refresh@example.com');
    });
  });
});
