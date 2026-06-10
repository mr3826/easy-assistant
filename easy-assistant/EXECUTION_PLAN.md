# BookingAI Admin Dashboard Execution Plan

## Current Baseline

The app is a React 18 + Vite + TypeScript single-page admin dashboard. The UI shell is broad and buildable, with routes for authentication, onboarding, dashboard, appointments, conversations, staff, services, availability, channels, marketing, AI settings, billing, analytics, support, and settings.

Current validation baseline:

- TypeScript: `npx tsc --noEmit` passes.
- Production build: `npm run build` passes.
- Tests: `npm run test:run` fails because no test files exist.
- Lint: `npm run lint` fails because the script uses ESLint 9-incompatible flags.
- Product data: mostly static arrays inside page components.
- Authentication: local-only boolean state in `localStorage`.
- Backend integration: env placeholder exists, but no API client is wired.

## Parallel Execution Model

Work should run in parallel only where write scopes are independent. Later product phases depend on a stable workflow, API contract, and backend choice, so this plan uses phased waves.

### Wave 1: Stabilize The Foundation

Runs immediately in parallel.

| Lane | Owner | Scope | Deliverable | Acceptance Check |
|---|---|---|---|---|
| A | Developer Workflow | `package.json`, `eslint.config.js`, `.eslintignore` | ESLint script and config work with ESLint 9 + React JSX runtime | `npm run lint` runs and reports only genuine source issues |
| B | Test Harness | `src/test/**`, new `*.test.tsx` files | Starter Vitest coverage for auth/routing/smoke behavior | `npm run test:run` passes with real tests |
| C | Design Tokens | `src/styles/**` | Single source of truth for CSS variables and global styles | `npm run build` passes; no duplicate token override |
| D | API Contract | Read-only source review | Endpoint/model/service plan | Endpoint list and frontend module plan approved |
| E | Product Workflow | Read-only source review | Page-by-page functionality inventory | MVP workflow checklist approved |

## Phase 1: Developer Workflow Stabilization

Goal: make the local and CI feedback loop trustworthy.

Tasks:

1. Fix ESLint scripts for flat config.
2. Update ESLint React rules for the modern JSX runtime.
3. Remove duplicate legacy ESLint config if it is no longer used.
4. Add starter tests so empty test suite no longer masks risk.
5. Confirm `npx tsc --noEmit`, `npm run lint`, `npm run test:run`, and `npm run build`.

Deliverables:

- Clean or intentionally triaged lint output.
- Passing tests with at least smoke coverage.
- Documented validation commands.

Exit criteria:

- A new developer can run all core commands successfully.
- Remaining quality issues are source issues, not broken tooling.

## Phase 2: UI And Design System Cleanup

Goal: make the current prototype visually and structurally reliable before data wiring.

Tasks:

1. Resolve `default_theme.css` and `globals.css` token duplication.
2. Confirm intended brand color and sidebar/dashboard visual language.
3. Audit responsive layout for dashboard, tables, forms, dialogs, and mobile navigation.
4. Fix obvious static UI bugs, dead controls, and inconsistent empty/loading states.
5. Add minimal visual smoke QA using browser screenshots after major layout changes.

Deliverables:

- Stable CSS token ownership.
- Responsive UI pass list.
- Known UI gaps documented by page.

Exit criteria:

- The app looks consistent across desktop and mobile.
- Core controls do not overlap, resize unexpectedly, or appear broken.

## Phase 3: Backend And API Contract

Goal: convert the static dashboard into a data-backed product plan.

Tasks:

1. Define core entities: User, Business, Staff, Service, Appointment, Customer, Conversation, Message, Channel, Availability, Reminder, AISettings, Plan, Invoice, SupportTicket, AnalyticsMetric.
2. Decide backend provider and auth/session mechanism.
3. Define REST or RPC endpoints for each entity.
4. Add frontend API module structure and shared TypeScript types.
5. Define error, pagination, filtering, and optimistic-update conventions.

Recommended frontend structure:

```text
src/app/api/
  client.ts
  auth.ts
  appointments.ts
  staff.ts
  services.ts
  availability.ts
  channels.ts
  conversations.ts
  billing.ts
  analytics.ts
  settings.ts
src/app/types/
  domain.ts
  api.ts
```

Deliverables:

- API contract.
- TypeScript domain models.
- Mock-to-real migration order.

Exit criteria:

- Every static array has an identified backend resource or deliberate local-only reason.

## Phase 4: Authentication And Tenant Scope

Goal: replace local-only auth with real secure app access.

Tasks:

1. Implement login/signup/session retrieval.
2. Replace `localStorage` boolean auth with token/session-backed auth state.
3. Add loading, expired-session, invalid-login, and logout behavior.
4. Add tenant/business selection or scoping if required.
5. Protect all dashboard routes with real auth checks.

Deliverables:

- Real auth flow.
- Session persistence.
- Protected route behavior covered by tests.

Exit criteria:

- Invalid credentials cannot enter the dashboard.
- Refreshing the app preserves valid sessions and rejects expired sessions.

## Phase 5: Core Data Integration

Goal: wire the highest-value operational screens first.

Suggested order:

1. Dashboard KPIs and recent bookings.
2. Appointments list, create, edit, cancel, and filters.
3. Staff list and staff availability.
4. Services catalog CRUD.
5. Channels status and connection configuration.
6. Conversations and message history.
7. Settings and AI configuration.
8. Billing, analytics, support.

Tasks:

1. Replace page-level arrays with API-backed hooks/services.
2. Add loading, empty, and error states.
3. Add pagination/filter/query parameters for table-heavy pages.
4. Add form submission, validation, and success/error toasts.
5. Add tests for key data flows.

Deliverables:

- API-backed MVP dashboard.
- Data mutation workflows.
- Reliable UI state handling.

Exit criteria:

- A real business can manage appointments, staff, services, availability, and channels.

## Phase 6: Product Workflow Completion

Goal: complete MVP user journeys end to end.

Critical workflows:

1. Signup -> onboarding -> dashboard.
2. Create service -> assign staff -> set availability.
3. Connect channel -> receive customer request -> create booking.
4. View appointment -> update/cancel/reschedule.
5. Configure AI assistant -> save settings -> verify behavior source.
6. View billing plan and invoices.
7. Create support ticket.

Deliverables:

- End-to-end MVP flows.
- Product acceptance checklist.
- Known non-MVP backlog.

Exit criteria:

- Each MVP workflow has an owner, test path, and user-facing success state.

## Phase 7: Quality, Security, And Reliability

Goal: reduce launch risk.

Tasks:

1. Expand unit and integration tests for forms, auth, API services, and route guards.
2. Add error boundary coverage for page-level failures.
3. Review secrets handling and prevent API keys from rendering in plain text.
4. Add logging/monitoring hooks.
5. Validate accessibility basics: labels, focus states, keyboard navigation, color contrast.
6. Run dependency audit and bundle-size review.

Deliverables:

- CI quality gates.
- Security checklist.
- Accessibility checklist.

Exit criteria:

- Build, lint, typecheck, and tests are required gates.
- No known critical security issues remain.

## Phase 8: Deployment And Release

Goal: prepare the app for repeatable production release.

Tasks:

1. Define production env variables.
2. Configure hosting/build output.
3. Add deployment preview and production release process.
4. Write release notes and admin onboarding notes.
5. Add rollback plan.

Deliverables:

- Production deployment.
- Release checklist.
- Rollback instructions.

Exit criteria:

- A tagged release can be deployed, verified, and rolled back.

## Coordination Rules

1. Keep Phase 1 and Phase 2 changes small and mergeable.
2. Do not start broad data wiring until the API contract is accepted.
3. Avoid editing the same files in parallel unless one agent is explicitly integrating.
4. Every worker reports changed files, commands run, and validation result.
5. Integration owner reviews all agent outputs before merging.

## Immediate Next Integration Steps

1. Collect Wave 1 agent outputs.
2. Integrate non-conflicting patches in this order: workflow, tests, design tokens.
3. Re-run `npx tsc --noEmit`, `npm run lint`, `npm run test:run`, and `npm run build`.
4. Use the API contract and workflow inventory to create Phase 3 implementation tickets.
