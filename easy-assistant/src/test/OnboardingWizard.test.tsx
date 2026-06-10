import { authApiState, createAuthSession, resetAuthApiMock } from './auth-api-mock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OnboardingWizard from '../app/components/pages/OnboardingWizard';
import AuthGuard from '../app/components/guards/AuthGuard';
import { AuthProvider } from '../app/context/AuthContext';
import { click, getByTestId, getByText, render, waitFor } from './test-utils';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function getButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (!button) {
    throw new Error(`Unable to find button with text "${text}".`);
  }
  return button;
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    resetAuthApiMock();
    authApiState.session = createAuthSession();
  });

  afterEach(() => {
    resetAuthApiMock();
  });

  it('establishes demo auth before redirecting to the guarded dashboard', async () => {
    const { container } = render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/onboarding']}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <h1>Private dashboard</h1>
                  <LocationProbe />
                </AuthGuard>
              }
            />
            <Route path="/login" element={<h1>Login</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(getByText(container, 'Next')).toBeInTheDocument();
    });

    for (let step = 1; step < 7; step += 1) {
      click(getButton(container, 'Next'));
    }

    click(getButton(container, 'Go to Dashboard'));

    await waitFor(() => {
      expect(getByText(container, 'Private dashboard')).toBeInTheDocument();
      expect(getByTestId(container, 'location')).toHaveTextContent('/dashboard');
    });
  });
});
