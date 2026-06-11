# BookingAI Admin Dashboard

**BookingAI** is an AI-powered appointment scheduling and customer communication platform. This repository contains the admin dashboard — a React + Vite + Tailwind CSS single-page application for managing bookings, staff, customers, channels, billing, and AI assistant settings.

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

## Features

| Module | Description |
|---|---|
| **Dashboard** | Overview stats, bookings chart, channel distribution, recent bookings table |
| **Appointments** | Search, filter, and manage all booking records |
| **Conversations** | AI chat log viewer with conversation list and message panel |
| **Staff Management** | Team roster with roles, contact info, availability, and booking count |
| **Services Setup** | Service catalog with duration, pricing, and category |
| **Availability** | Per-day working hours configuration |
| **Channels** | WhatsApp, Facebook, Telegram, Web Widget connection status |
| **Marketing** | Appointment reminder automation with message templates |
| **AI Settings** | AI assistant tone, language, and training configuration |
| **Billing** | Current plan, usage metrics, available plans, payment method, invoice history |
| **Analytics** | KPI cards, booking trends, no-show rate, channel breakdown, AI performance |
| **Support** | Ticket management, live chat widget, FAQ accordion |
| **Settings** | Profile, business, notifications, and security tabs |
| **Authentication** | Login / Signup / Onboarding wizard with AuthGuard route protection |

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

Starts the phase-1 backend server on **http://localhost:3000** by default.
Keep `API_BASE_URL` and `VITE_API_BASE_URL` pointed at the same `/api` prefix.
The focused backend test harness now also covers the phase-2 booking-data contract surface for services, staff, availability, customers, and appointments.

### Type Check

```bash
npx tsc --noEmit
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

### Test

```bash
npm run test:run
```

### Backend Checks

```bash
npm run backend:test
```

Runs the focused auth/session and backend contract tests that verify the
phase-1 foundation and the phase-2 booking-data surface.

### Preview Production Build

```bash
npm run preview
```

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
| `/dashboard` | `DashboardHome` | `AuthGuard` |
| `/appointments` | `AppointmentsPage` | `AuthGuard` |
| `/conversations` | `ConversationsPage` | `AuthGuard` |
| `/staff` | `StaffManagement` | `AuthGuard` |
| `/services` | `ServicesSetup` | `AuthGuard` |
| `/availability` | `AvailabilityPage` | `AuthGuard` |
| `/channels` | `ChannelConnection` | `AuthGuard` |
| `/marketing` | `MarketingPage` | `AuthGuard` |
| `/ai-settings` | `AISettings` | `AuthGuard` |
| `/billing` | `BillingPage` | `AuthGuard` |
| `/analytics` | `AnalyticsPage` | `AuthGuard` |
| `/support` | `SupportPanel` | `AuthGuard` |
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

## Audit Report

**Date:** 2026-05-23  
**Scope:** Full codebase — config, UI components (44), pages (16), layout, guards, contexts, hooks, styles  
**Build:** `npm run build` **0 errors** · `npx tsc --noEmit` **0 errors** · `npm run dev` **HTTP 200**

---

### Build & Type Safety ✅

| Check | Status | Notes |
|---|---|---|
| `npx tsc --noEmit` | ✅ **0 errors** | Strict mode, `noUnusedLocals`, `noUnusedParameters` all passing |
| `npm run build` | ✅ **0 errors** | 37s build, 26 chunks, 16 routes bundled |
| `npm run dev` | ✅ **HTTP 200** | HMR + React Refresh live, Vite v6.3.5 |
| `dangerouslySetInnerHTML` | ✅ **None** | No XSS surface |
| Orphaned `console.error` | ✅ **1** | `ErrorBoundary.tsx:27` — intentional, acceptable in error boundary |

---

### Architecture

| Layer | Files | Status |
|---|---|---|
| Entry | `src/main.tsx` | ✅ Clean, 5-line `createRoot` |
| Routing | `src/app/App.tsx` | ✅ 16 lazy-loaded routes, Suspense, AuthGuard wrapping |
| Layout | `DashboardLayout.tsx` | ✅ Bespoke sidebar + topbar; `useState`-driven mobile drawer |
| auth | `AuthContext.tsx` | ✅ API-backed session hydration, login, logout, and signup |
| Guards | `AuthGuard.tsx`, `index.tsx` | ✅ Redirect-to-login + `ProtectedRoute` + `LoadingFallback` |
| Hooks | 4 custom hooks | ✅ `useDebounce`, `useLocalStorage`, `useMediaQuery`, `useOnClickOutside` |
| Constants | `LABELS`, `ROUTES` | ✅ `as const` inference |
| Shadcn UI | 44 components | ✅ All Radix-primitive wrapped, consistent `cn()` pattern |

---

### UI Components Audit

| Finding | Severity | Detail |
|---|---|---|
| `tabs.tsx` — `data-state` not forwarded | 🟠 High | `TabsTrigger` does not pass `data-state` from Radix props; CSS selectors targeting `[data-slot=tabs-trigger][data-state=active]` silently fail. Fix: add `data-state` to `...props` spread or explicitly map it. |
| `chart.tsx` — `as any` cluster | 🟡 Medium | 10x `(item as any).value/name/dataKey/payload` casts in `ChartTooltipContent` and `ChartLegendContent`. Root cause: recharts does not export `Payload<ValueType, NameType>`. Acceptable for now; consider adding `type ChartPayload = Record<string, unknown>` locally if stricter typing is needed. |
| `error/DashboardLayout.tsx` — unused route | 🟡 Medium | `AlertDialog` route was an unimplemented plan item (`/orca`); removed during this session. |
| `index.css` — `globals.css` loaded after `default_theme.css` | 🟡 Medium | `default_theme.css` is the single source of truth per its `KEEP_IN_SYNC` comment, but imported *first* — `globals.css` redeclares the same variables with different values and overrides it. Risk: silent token drift. Fix: remove the conflicting block from `globals.css` or swap the import order. |
| `ImageWithFallback.tsx` — `data-original-url` attribute on fallback `[src]` | 🟢 Low | `data-original-url={src}` on the fallback SVG `img` tag — harmless but leaks the failed URL into the DOM. Consider removing it. |

---

### Page Components Audit

| Finding | Severity | Detail |
|---|---|---|
| `LoginPage` — empty `catch {}` | 🟡 Medium | `onSubmit: catch { /* handle error */ }` — swallows any API failure silently. At minimum add `console.error(err)` or an error toast. |
| `LoginPage` — manual password toggle button | 🟢 Low | Password visibility toggle is a plain `<button>` rather than using the `Input` suffix pattern. Not a bug — stylistic inconsistency. |
| `SignupPage/ServicesSetup/StaffManagement` — no validation | 🟢 Low | Password fields, select fields, and contact fields have no Zod schema. UI-only stub data. |
| `DashboardLayout` — hardcoded user "John Doe" | 🟢 Low | Avatar/name is still hardcoded instead of reading from `AuthContext`. |
| All pages — placeholder data | 🟢 Info | All 16 pages render static mock arrays; no API layer yet. |

---

### Styling Audit

| Finding | Severity | Detail |
|---|---|---|
| `default_theme.css` vs `globals.css` duplicate `--primary` | 🔴 High | `default_theme.css` sets `--primary: #030213` (near-black); `globals.css` sets `--primary: #2563eb` (blue). The blue wins at runtime. This was almost certainly unintentional — pick one file. |
| `@theme inline` naming mismatch in `globals.css` | 🟡 Medium | Sidebar tokens in `globals.css` define `--sidebar-foreground: oklch(0.205 0 0)` while `default_theme.css` defines `--sidebar-foreground: oklch(0.145 0 0)`. Same race condition; whichever imports last wins. |
| `globals.css` `@custom-variant dark` | 🟢 Info | Correctly scoped and matches Tailwind 4. |

---

### Accessibility

| Finding | Severity | Detail |
|---|---|---|
| `DashboardLayout` — `Logout` link uses `to="/login"` | 🟡 Medium | Logout navigates back to login without calling `logout()` from `AuthContext`. Should invoke `useAuth().logout()` on click. |
| `DashboardLayout` — `button` search input | ✅ None | `Input` gives `role="textbox"` automatically via the label pattern |
| `ErrorBoundary` — Refresh button | ✅ None | Actionable fallback; no ARIA gaps |
| `DashboardLayout` — `aria-label="Toggle Sidebar"` on rail | ✅ None | Present and meaningful |
| `LoginPage` — `aria-invalid` and descriptive error text | ✅ None | When `errors.email` or `errors.password` are set |
| `LoadingFallback` — `role="status"` + `aria-label="Loading"` | ✅ None | Correct lazy/suspense fallback |
| `form.tsx` — `FormControl` `aria-describedby` | ✅ None | Includes `-form-item-description` + `-form-item-message` IDs |
| `Input` label pattern | ✅ None | `<Label htmlFor={id}>` + `<Input id={id}>` where paired |
| `environmentScore` due in Helmet `window` | 🟢 Low | `const canonical = typeof window !== 'undefined' ? window.location.href : ''` — always truthy in this SPA context. Not an issue; `Helmet.tsx` usage is minimal. |

---

### Security

| Finding | Severity | Detail |
|---|---|---|
| `HELMET.tsx` — No CSP | 🟢 Info | No `Content-Security-Policy` meta; acceptable for local dev. Consider hardening for production. |
| `ImageWithFallback` — `data-original-url` in DOM | 🟢 Low | Leaks failed URL; not XSS since it's set from `src` |

---

## Code Quality Summary

| Metric | Before Session | After Session |
|---|---|---|
| `tsc --noEmit` errors | 25+ | **0** |
| `npm run build` errors | multiple | **0** |
| Dead UI files | sidebar.tsx + use-mobile.ts + alert-dialog.tsx (904 lines) | **Removed** |
| `as any` usage | many | 10 (all in `chart.tsx`, unit-justified) |

---

## Next Steps

This list is historical context from the pre-phase-1 audit; items 5 and 6 have now been addressed by the backend/auth pass.

1. Resolve the `default_theme.css` vs `globals.css` theme duplication — pick a single source of truth.
2. Wire `data-state` through `TabsTrigger` for reliable active-state styling.
3. Replace `AlertDialog`/`AlertDialogContent` usage with `Dialog` primitives or re-add the missing `alert-dialog.tsx`.
4. Add Zod schemas to `SignupPage`, `ServicesSetup`, `StaffManagement`.
5. Implement real `AuthContext.login` calling a backend endpoint.
6. Connect `Logout` link in `DashboardLayout` to `useAuth().logout()`.
7. Consider adding `onError` telemetry or Sentry integration to `ErrorBoundary`.
8. Wrap `Helmet.tsx` usage in a `<HelmetProvider>` if SSR is ever needed.

---
