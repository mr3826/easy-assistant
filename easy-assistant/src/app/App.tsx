/// <reference types="vite/client" />
import { Suspense, lazy, type ReactElement, type ReactNode } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import AuthGuard from "./components/guards/AuthGuard";
import { LoadingFallback } from "./components/guards";
import { AuthProvider } from "./context/AuthContext";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import DashboardLayout from "./components/layout/DashboardLayout";

const LoginPage = lazy(() => import("./components/pages/LoginPage"));
const SignupPage = lazy(() => import("./components/pages/SignupPage"));
const OnboardingWizard = lazy(() => import("./components/pages/OnboardingWizard"));
const DashboardHome = lazy(() => import("./components/pages/DashboardHome"));
const AppointmentsPage = lazy(() => import("./components/pages/AppointmentsPage"));
const ConversationsPage = lazy(() => import("./components/pages/ConversationsPage"));
const StaffManagement = lazy(() => import("./components/pages/StaffManagement"));
const ServicesSetup = lazy(() => import("./components/pages/ServicesSetup"));
const AvailabilityPage = lazy(() => import("./components/pages/AvailabilityPage"));
const ChannelConnection = lazy(() => import("./components/pages/ChannelConnection"));
const AISettings = lazy(() => import("./components/pages/AISettings"));
const SettingsPage = lazy(() => import("./components/pages/SettingsPage"));
const LegalPrivacyPage = lazy(() => import("./components/pages/LegalPrivacyPage"));
const LegalTermsPage = lazy(() => import("./components/pages/LegalTermsPage"));

function PublicPageFrame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="relative min-h-screen">
      {children}
      <div className="fixed bottom-4 left-0 right-0 z-10 flex justify-center gap-3 text-xs text-gray-500">
        <Link to="/privacy" className="rounded bg-gray-50 px-1 hover:text-blue-600 hover:underline">
          Privacy
        </Link>
        <span aria-hidden="true">|</span>
        <Link to="/terms" className="rounded bg-gray-50 px-1 hover:text-blue-600 hover:underline">
          Terms
        </Link>
      </div>
    </div>
  );
}

function DashboardHomeWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <DashboardHome />
    </DashboardLayout>
  );
}

function AppointmentsWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <AppointmentsPage />
    </DashboardLayout>
  );
}

function ConversationsWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <ConversationsPage />
    </DashboardLayout>
  );
}

function StaffWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <StaffManagement />
    </DashboardLayout>
  );
}

function ServicesWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <ServicesSetup />
    </DashboardLayout>
  );
}

function AvailabilityWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <AvailabilityPage />
    </DashboardLayout>
  );
}

function ChannelsWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <ChannelConnection />
    </DashboardLayout>
  );
}

function AISettingsWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <AISettings />
    </DashboardLayout>
  );
}

function SettingsWithLayout(): ReactElement {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/login"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <PublicPageFrame>
                    <LoginPage />
                  </PublicPageFrame>
                </Suspense>
              }
            />
            <Route
              path="/signup"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <PublicPageFrame>
                    <SignupPage />
                  </PublicPageFrame>
                </Suspense>
              }
            />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <LegalPrivacyPage />
                </Suspense>
              }
            />
            <Route
              path="/terms"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <LegalTermsPage />
                </Suspense>
              }
            />
            <Route
              path="/onboarding"
              element={
                <Suspense fallback={<LoadingFallback message="Loading..." />}>
                  <OnboardingWizard />
                </Suspense>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <DashboardHomeWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/appointments"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <AppointmentsWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/conversations"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <ConversationsWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/staff"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <StaffWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/services"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <ServicesWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/availability"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <AvailabilityWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/channels"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <ChannelsWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/marketing"
              element={
                <AuthGuard>
                  <Navigate to="/dashboard" replace />
                </AuthGuard>
              }
            />
            <Route
              path="/ai-settings"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <AISettingsWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
            <Route
              path="/billing"
              element={
                <AuthGuard>
                  <Navigate to="/dashboard" replace />
                </AuthGuard>
              }
            />
            <Route
              path="/analytics"
              element={
                <AuthGuard>
                  <Navigate to="/dashboard" replace />
                </AuthGuard>
              }
            />
            <Route
              path="/support"
              element={
                <AuthGuard>
                  <Navigate to="/dashboard" replace />
                </AuthGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthGuard>
                  <Suspense fallback={<LoadingFallback />}>
                    <SettingsWithLayout />
                  </Suspense>
                </AuthGuard>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
