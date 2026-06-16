import { authApiState, createAuthSession, resetAuthApiMock } from './auth-api-mock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthGuard from '../app/components/guards/AuthGuard';
import { AuthProvider } from '../app/context/AuthContext';
import { I18nProvider } from '../app/i18n';
import { getByTestId, getByText, queryByText, render, waitFor } from './test-utils';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

describe('AuthGuard', () => {
  beforeEach(() => {
    resetAuthApiMock();
    localStorage.clear();
  });

  afterEach(() => {
    resetAuthApiMock();
    localStorage.clear();
  });

  it('redirects unauthenticated users to login after the session check completes', async () => {
    authApiState.session = null;

    const { container } = render(
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route
                path="/login"
                element={
                  <>
                    <h1>Login</h1>
                    <LocationProbe />
                  </>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <h1>Private dashboard</h1>
                  </AuthGuard>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(getByText(container, 'Login')).toBeInTheDocument();
      expect(queryByText(container, 'Private dashboard')).toBeUndefined();
      expect(getByTestId(container, 'location')).toHaveTextContent('/login');
    });
  });

  it('renders protected content for authenticated users once the session loads', async () => {
    authApiState.session = createAuthSession();

    const { container } = render(
      <I18nProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <h1>Private dashboard</h1>
                  </AuthGuard>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(getByText(container, 'Private dashboard')).toBeInTheDocument();
    });
  });
});
