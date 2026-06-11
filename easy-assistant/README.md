# Easy Assistant Admin Dashboard

**Easy Assistant** is an AI receptionist workspace for local service businesses. This repository contains the admin dashboard - a React + Vite + Tailwind CSS single-page application for managing bookings, staff, services, channels, AI settings, and the launch-readiness surface around them.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Build & Deployment](#build--deployment)
- [Development](#development)
- [Design System](#design-system)

---

## Current MVP Surface

Phase 7 is live in the repo: dashboard metrics now use real appointment/conversation data, and reminder scheduling plus delivery logging are part of the backend MVP surface.

| Module | Description |
|---|---|
| **Dashboard** | Live operational overview with appointment, conversation, and reminder signals |
| **Appointments** | Search, filter, and manage booking records |
| **Conversations** | AI chat log viewer with conversation list, message panel, and handoff state |
| **Staff Management** | Team roster with roles, contact info, availability, and booking count |
| **Services Setup** | Service catalog with duration, pricing, and category |
| **Availability** | Per-day working hours configuration |
| **Channels** | WhatsApp, Facebook, Telegram, and web widget connection status |
| **AI Settings** | Assistant name, tone, language, greeting, handoff, auto-confirm, and reminder settings |
| **Settings** | Profile, business, notifications, and security tabs |
| **Privacy / Terms** | Launch-ready legal pages for the MVP pilot |
| **Authentication** | Login, signup, onboarding, and AuthGuard route protection |

### Non-MVP Redirects

| Route | Behavior |
|---|---|
| **Marketing** | Redirects to `/dashboard` |
| **Billing** | Redirects to `/dashboard` |
| **Analytics** | Redirects to `/dashboard` |
| **Support** | Redirects to `/dashboard` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | React 18.3 + ReactDOM 18.3 |
| **Build tool** | Vite 6.3 |
| **Language** | TypeScript 5.6 |
| **Styling** | Tailwind CSS 4.1 (with `@theme inline` CSS variable system) |
| **UI primitives** | Radix UI (14 packages: accordion, alert-dialog, checkbox, collapsible, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toggle-group, tooltip) |
| **Icons** | Lucide React 0.487 |
| **Forms** | React Hook Form 7.55 + Zod 3.23 |
| **Charts** | Recharts 2.15 |
| **Date picker** | React Day Picker 8.10 |
| **Carousel** | Embla Carousel React 8.6 |
| **Command palette** | cmdk 1.1 |
| **Notifications** | Sonner 2.0 |
| **Animation** | Motion 12 (Framer Motion successor) |
| **Routing** | React Router DOM 7.15 |
| **Priority variants** | class-variance-authority 0.7 |
| **Class merging** | clsx 2.1 + tailwind-merge 3.2 |
| **Drag & drop** | react-dnd 16 |
| **Theming** | next-themes 0.4 |
| **Layout engine** | react-resizable-panels 2.1 |
| **Linting** | ESLint 9 + `@typescript-eslint` 8 + `react-hooks` 5 |
| **Testing** | Vitest 2.1 + jsdom + `@testing-library/react` 16 |
| **Package manager** | npm (lockfile present) |

---

## Project Structure

```
src/
├── main.tsx                      # App entry point (createRoot)
├── styles/
│   ├── index.css                 # Tailwind 4 entry + @source
│   ├── default_theme.css         # Design tokens (--primary, --radius, etc.)
│   └── globals.css               # Typography base layer @layer base
├── app/
│   ├── App.tsx                   # Router, lazy routes, Suspense boundaries
│   ├── context/
│   │   └── AuthContext.tsx       # AuthProvider + useAuth hook
│   ├── config/
│   │   └── constants.ts          # LABELS, ROUTES
│   ├── hooks/
│   │   └── index.ts              # useDebounce, useLocalStorage, useMediaQuery, useOnClickOutside
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx   # Sidebar + topbar layout
│   │   ├── error/
│   │   │   └── ErrorBoundary.tsx
│   │   ├── guards/
│   │   │   ├── AuthGuard.tsx
│   │   │   └── index.tsx          # ProtectedRoute, LoadingFallback, PROTECTED_ROUTES
│   │   ├── pages/                 # 16 lazy-loaded page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OnboardingWizard.tsx
│   │   │   ├── DashboardHome.tsx
│   │   │   ├── AppointmentsPage.tsx
│   │   │   ├── ConversationsPage.tsx
│   │   │   ├── StaffManagement.tsx
│   │   │   ├── ServicesSetup.tsx
│   │   │   ├── AvailabilityPage.tsx
│   │   │   ├── ChannelConnection.tsx
│   │   │   ├── MarketingPage.tsx
│   │   │   ├── AISettings.tsx
│   │   │   ├── BillingPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── SupportPanel.tsx
│   │   ├── ui/                    # 44 shadcn-style Radix UI components
│   │   │   ├── utils.ts           # cn() — clsx + tailwind-merge
│   │   │   ├── button.tsx, card.tsx, input.tsx, …
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── seo/
│   │       └── Helmet.tsx         # SEO meta tags
│   └── components/
├── config/
│   └── constants.ts              # LABELS, ROUTES
├── test/
│   └── setup.ts                  # Vitest + @testing-library/jest-dom setup
├── vite.config.ts                # Vite config with figmaAssetResolver plugin
├── vitest.config.ts              # Test runner config
├── tsconfig.json                 # TS 5.6, strict, @/* → src/app alias
├── eslintrc.cjs                  # ESLint 9 flat config
├── package.json
└── README.md                     # ← you are here
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at **http://localhost:5173**

### Backend Runtime

```bash
npm run backend:dev
```

Starts the backend server on **http://localhost:3000** by default.
Keep `API_BASE_URL` and `VITE_API_BASE_URL` pointed at the same `/api` prefix.

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

Outputs production assets to `dist/`.

### Lint

```bash
npm run lint
```

### Frontend Tests

```bash
npm run test:run
```

### Backend Checks

```bash
npm run backend:test
```

Runs the focused auth/session and backend contract tests that cover the MVP foundation, booking-data contracts, conversation and WhatsApp runtime, AI receptionist flow, and the phase-7 reminder/dashboard surface.

### Preview Production Build

```bash
npm run preview
```

### Demo Setup

Run the demo bootstrap flow, then start the backend and frontend:

```bash
npm run demo:seed
npm run backend:dev
npm run dev
```

Demo login:

- `demo@easyassistant.local`
- `demo12345`

---

## Design System

### Color tokens

All colors are defined as CSS custom properties in `styles/default_theme.css` and mapped to Tailwind 4 via `@theme inline`:

```
--color-background, --color-foreground, --color-card, --color-primary, ...
```

### Radius scale

```
--radius-sm  = calc(var(--radius) - 4px)   → 0.625rem - 4px
--radius-md  = calc(var(--radius) - 2px)   → 0.625rem - 2px
--radius-lg  = var(--radius)               → 0.625rem
--radius-xl  = calc(var(--radius) + 4px)   → 0.625rem + 4px
```

### Sidebar tokens

```
--color-sidebar, --color-sidebar-foreground, --color-sidebar-primary,
--color-sidebar-accent, --color-sidebar-border, --color-sidebar-ring
```

### Typography

Base font: **Inter** (loaded via Google Fonts in `globals.css`).  
H1–H4, `p`, `label`, `button`, `input` size/weight/line-height set via `@layer base` in `globals.css`.

---

## Routing

| Route | Page | Guard |
|---|---|---|
| `/` | Redirect → `/login` | — |
| `/login` | `LoginPage` | Public |
| `/signup` | `SignupPage` | Public |
| `/onboarding` | `OnboardingWizard` | Public |
| `/privacy` | `LegalPrivacyPage` | Public |
| `/terms` | `LegalTermsPage` | Public |
| `/dashboard` | `DashboardHome` | `AuthGuard` |
| `/appointments` | `AppointmentsPage` | `AuthGuard` |
| `/conversations` | `ConversationsPage` | `AuthGuard` |
| `/staff` | `StaffManagement` | `AuthGuard` |
| `/services` | `ServicesSetup` | `AuthGuard` |
| `/availability` | `AvailabilityPage` | `AuthGuard` |
| `/channels` | `ChannelConnection` | `AuthGuard` |
| `/marketing` | Redirect → `/dashboard` | `AuthGuard` |
| `/ai-settings` | `AISettings` | `AuthGuard` |
| `/billing` | Redirect → `/dashboard` | `AuthGuard` |
| `/analytics` | Redirect → `/dashboard` | `AuthGuard` |
| `/support` | Redirect → `/dashboard` | `AuthGuard` |
| `/settings` | `SettingsPage` | `AuthGuard` |

---

## Conventions

- **Import alias**: `@/*` resolves to `src/app/*` (configured in `vite.config.ts` + `tsconfig.json`)
- **UI components**: all in `src/app/components/ui/`, use `cn()` from `./utils` for className merging
- **`data-slot`**: every Radix wrapper sets `data-slot="component-name"` for CSS targeting
- **CVA**: button and badge variants via `class-variance-authority`
- **Forms**: `react-hook-form` + `zod` (`@hookform/resolvers`)
- **Lazy loading**: all pages loaded via `React.lazy` + `Suspense` in `App.tsx`
- **Auth**: `AuthContext` + `AuthGuard` pattern; session is API-backed and cookie-based
- **`as any`**: intentionally placed around recharts `Payload` — `Payload<ValueType, NameType>` is unexported from `recharts` types
- **Figma assets**: `figmaAssetResolver()` in `vite.config.ts` resolves `figma:asset/*` imports to `src/assets/*`

---

## Launch Notes

The remaining non-MVP routes are intentionally redirected back to the dashboard. The launch surface is now centered on the live booking core, conversations, reminders, dashboard metrics, and the legal pages.

## Next Steps

1. Keep the seeded demo flow in sync with future schema changes so it remains a reliable first-run path.
2. Review retention and support copy before any broader production rollout.
3. Avoid reintroducing marketing, billing, analytics, or support modules into the primary navigation until they are intentionally shipped.
