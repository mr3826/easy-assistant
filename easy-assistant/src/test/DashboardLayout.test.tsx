import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from '../app/components/layout/DashboardLayout';
import AuthGuard from '../app/components/guards/AuthGuard';
import { AuthProvider } from '../app/context/AuthContext';
import { getByTestId, getByText, render, waitFor } from './test-utils';

const AUTH_STORAGE_KEY = 'easy_assistant_auth';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function pointerDown(element: Element) {
  act(() => {
    const event = new Event('pointerdown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'button', { value: 0 });
    Object.defineProperty(event, 'ctrlKey', { value: false });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    element.dispatchEvent(event);
  });
}

function clickElement(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('logs out and returns to login from the user menu', async () => {
    const { container } = render(
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
                  <DashboardLayout>
                    <h1>Private dashboard</h1>
                  </DashboardLayout>
                </AuthGuard>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    const accountButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('John Doe'),
    );

    if (!accountButton) {
      throw new Error('Expected account menu trigger to render.');
    }

    pointerDown(accountButton);
    clickElement(accountButton);

    await waitFor(() => {
      expect(getByText(document.body, 'Logout')).toBeInTheDocument();
    });

    clickElement(getByText(document.body, 'Logout'));

    await waitFor(() => {
      expect(getByText(container, 'Login')).toBeInTheDocument();
      expect(getByTestId(container, 'location')).toHaveTextContent('/login');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBe('true');
    });
  });
});
