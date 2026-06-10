import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from '../app/context/AuthContext';
import { click, getByTestId, getByText, render, waitFor } from './test-utils';

const AUTH_STORAGE_KEY = 'easy_assistant_auth';

function AuthProbe() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <p data-testid="auth-state">{isAuthenticated ? 'signed in' : 'signed out'}</p>
      <button type="button" onClick={() => void login('user@example.com', 'password')}>
        Login
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('hydrates authentication from localStorage', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');

    const { container } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(getByTestId(container, 'auth-state')).toHaveTextContent('signed in');
  });

  it('updates authentication state when logging in and out', async () => {
    const { container } = render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(getByTestId(container, 'auth-state')).toHaveTextContent('signed out');

    click(getByText(container, 'Login'));

    await waitFor(() => {
      expect(getByTestId(container, 'auth-state')).toHaveTextContent('signed in');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe('true');
    });

    click(getByText(container, 'Logout'));

    await waitFor(() => {
      expect(getByTestId(container, 'auth-state')).toHaveTextContent('signed out');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBe('true');
    });
  });
});
