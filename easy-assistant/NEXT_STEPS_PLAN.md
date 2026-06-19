# Easy Assistant Next Steps Plan

Status date: 2026-06-20  
Target market: Bangladesh MVP launch  
Planning basis: current `codex/bn-en-i18n` app state, prior audit, and launch-readiness review

## Executive Direction

Easy Assistant should not add another large feature until the core product is trustworthy for a non-technical business owner.

The next work should make the existing app reliable, clear, and simple:

1. No fake saves.
2. No silent demo fallback.
3. No analytics-heavy surfaces before users have reliable booking operations.
4. WhatsApp stays the primary launch channel.
5. BN/EN support stays part of every user-facing flow.

The product promise for MVP is narrow: a local service business can configure services, team, hours, WhatsApp, and assistant replies, then manage customer conversations and bookings without confusion.

## Current State Snapshot

The app currently has the right launch shape:

- Auth is API-backed with cookie sessions.
- Primary routes are narrowed to dashboard, bookings, chats, services, team, hours, WhatsApp, assistant, account, privacy, and terms.
- BN/EN translation infrastructure exists.
- AI assistant settings are persisted.
- Conversations, WhatsApp, reminders, dashboard summary, and booking data have backend coverage.
- Demo seed exists with `demo@easyassistant.local` / `demo12345`.

The main remaining issue is product trust. Some screens still use fallback/demo/local state when API calls fail. That can make a user think data was saved when it was not. This is the first problem to fix.

## Priority Roadmap

| Priority | Workstream | Goal | Ship When |
|---|---|---|---|
| P0 | Trust and persistence cleanup | Remove false-save and silent fallback behavior | Users can always tell live, empty, error, and demo states apart |
| P1 | Existing feature improvements | Make current core pages easier and safer | Booking, service, staff, hours, WhatsApp, and assistant flows feel clear |
| P2 | Production hardening | Prepare deployment and operational safety | Secrets, errors, auth limits, docs, and DB handling are explicit |
| P3 | First-use setup | Help non-technical owners get live quickly | Dashboard checklist guides the first setup path |
| P4 | Next feature after launch readiness | Add public booking link only after core is stable | Customer can self-book through a small public flow |

## P0: Trust And Persistence Cleanup

### Objective

Remove all behavior where the UI appears to save data locally after a failed API write. Demo data may exist only when clearly labelled as demo and never after a failed write that the user expects to persist.

### Pages To Audit And Fix

- Bookings: `AppointmentsPage`
- Services: `ServicesSetup`
- Staff: `StaffManagement`
- Availability: `AvailabilityPage`
- Dashboard: `DashboardHome`

### Required Behavior

Every data-backed page should use the same resource-state model:

| State | Meaning | UI Behavior |
|---|---|---|
| `loading` | Initial fetch in progress | Show loading fallback |
| `live` | API returned usable records | Show records normally |
| `empty` | API returned no records | Show empty state with next action |
| `error` | API failed | Show error state with retry and no fake data |
| `demo` | Explicit demo-only mode | Show demo label clearly |

### Implementation Notes

- Do not create local fake records after failed `POST`, `PATCH`, `PUT`, or `DELETE`.
- Failed writes should keep the form open or keep the user on the same row with an inline error.
- Successful writes should update from the returned API entity when possible.
- If the API returns `null` for a write that should return an entity, treat it as an error.
- Dashboard should not silently fall back to demo metrics after an API failure. It should show either live data, empty data, or an error banner.
- Demo seed data can remain for local demos, but it must be explicit and not mixed with failed production saves.

### Acceptance Criteria

- Creating a service while the API is down does not add a local service row.
- Creating staff while the API is down does not add a local staff row.
- Creating/editing/cancelling a booking while the API is down does not mutate the booking list.
- Saving availability while the API is down shows a clear failure and does not claim success.
- Dashboard API failure shows a clear error and retry path instead of fake metrics.
- All new messages are available in English and Bangla.

### Tests

- Add component or integration tests for failed save behavior on services, staff, bookings, and availability.
- Add a dashboard test proving API failure does not render demo metrics as if live.
- Run:

```bash
npm run typecheck
npm run test:run -- --cache=false
npm run build
```

## P1: Existing Feature Improvements

### Dashboard

Goal: make the dashboard a daily operating screen, not an analytics dashboard.

Improve:

- Prioritize today, upcoming bookings, WhatsApp status, assistant status, and setup checklist.
- Keep chart-heavy analytics out of the MVP dashboard.
- Show clear last-updated time for live data.
- Show setup progress from real account data where possible.
- Show empty states that explain the next action: add service, add staff, set hours, connect WhatsApp.

Defer:

- Pie charts, graph-heavy analytics, revenue charts, conversion funnels, and channel-distribution charts.

Acceptance:

- A business owner can open the dashboard and know what needs attention today.

### Bookings

Goal: make booking operations safe and understandable.

Improve:

- Validate customer name, phone or email, service, staff, date, and time before save.
- Prefer phone as the primary Bangladesh-friendly customer identifier.
- Show service duration and staff assignment in the create/edit form.
- Make cancel/reschedule actions explicit and reversible only where backend supports it.
- Use statuses consistently: `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`, `no_show`.
- Do not expose CSV/PDF export as a fake feature. Hide it or mark as deferred until real export exists.

Acceptance:

- Manual booking create/edit/cancel flows either persist through API or show a clear error.
- No booking can be created without a service, staff member, customer name, and valid time.

### Services

Goal: make service setup simple enough for a non-technical owner.

Improve:

- Required fields: service name, duration, price, active/inactive.
- Optional fields: category and description.
- Use BDT as the default currency.
- Add clear validation for duration and price.
- Replace hard delete with archive/inactive if the service has future appointments.
- Show which staff can perform the service.
- Avoid technical labels like API-backed record in owner-facing copy.

Acceptance:

- A service cannot be saved with blank name, invalid duration, or invalid price.
- Services used in future bookings cannot be silently deleted.

### Staff

Goal: make team setup match how small service businesses operate.

Improve:

- Required fields: full name and active/inactive status.
- Optional fields: role, phone, email.
- Service assignment should be selectable, not comma-separated text.
- Show whether staff has working hours configured.
- Delete should become archive/inactive when future bookings exist.
- Staff are scheduling resources, not login users, unless a future staff-login feature is explicitly planned.

Acceptance:

- A staff member can be added and assigned to services without technical setup.
- A staff member with future bookings cannot be silently deleted.

### Availability

Goal: make working hours reliable for appointment scheduling.

Improve:

- Validate opening and closing times per day.
- Clearly support closed days.
- Add "copy to weekdays" and "copy to all days" only if labels are clear.
- Show a simple preview of bookable hours after saving.
- Do not save invalid ranges such as close time before open time.

Acceptance:

- Invalid hours are blocked client-side and server-side.
- Saved hours are reflected in generated booking slots.

### Conversations

Goal: make WhatsApp conversation handling operationally clear.

Improve:

- Make AI vs human sender labels obvious.
- Make handoff state visible in the thread header.
- Show whether a manual reply was sent or queued.
- Show customer phone prominently.
- Disable reply action when the conversation is closed or customer has opted out.
- Keep the thread focused on booking context, not generic CRM complexity.

Acceptance:

- An owner can identify which chats need human response and safely reply.

### WhatsApp Setup

Goal: keep the launch channel focused.

Improve:

- WhatsApp remains the only primary setup channel.
- Remove or hide Facebook, Telegram, web widget, and other channels from owner-facing launch docs/UI until implemented.
- Show number status, last sync/check time, and setup checklist.
- Do not expose provider secrets or access tokens client-side.

Acceptance:

- A user can see whether WhatsApp is connected and what to do before going live.

### Assistant Settings

Goal: make AI behavior understandable without advanced AI jargon.

Improve:

- Keep assistant name, tone, default language, greeting, handoff message, auto-confirm, and reminders.
- Show a preview of the customer-facing message in BN/EN.
- Avoid advanced controls that imply unavailable AI training or knowledge-base upload.
- Add warnings that AI confirmation only happens through valid booking tools.

Acceptance:

- A user can configure the assistant without understanding prompt engineering or backend tools.

### Account And Settings

Goal: keep account settings minimal and support-driven for MVP.

Improve:

- Keep business name, phone, address, timezone, and owner identity.
- Keep advanced password/account changes support-driven until full account-management flows exist.
- Avoid exposing settings that are not implemented.

Acceptance:

- Account page shows only useful launch-time information and does not promise unavailable controls.

### Documentation

Goal: make repo docs match the product that actually exists now.

Update:

- `README.md`
- `PRODUCT_SPECIFICATION.md`
- `MVP_STATUS_AND_EXECUTION_PLAN.md`
- `AUDIT_REPORT.md` or replace with a newer audit report

Remove or clearly mark as deferred:

- old onboarding wizard references;
- billing page references;
- analytics page references;
- multi-channel launch claims;
- frontend-only mock/stub auth statements that are no longer accurate.

Acceptance:

- A new engineer can read the docs and understand the current MVP without following stale prototype assumptions.

## P2: Production Hardening

### Security And Backend

Required improvements:

- Add basic rate limiting for login, signup, and WhatsApp webhook routes.
- Add structured server error logging without leaking passwords, cookies, access tokens, or WhatsApp secrets.
- Confirm tenant scoping on all CRUD endpoints.
- Add consistent authorization errors for missing/invalid tenant scope.
- Fix duplicate `whatsappCredentialSecret` definitions in `server/config.mjs`; the later definition currently overrides the earlier fallback.
- Ensure production requires real secret values instead of silently using development defaults.

Acceptance:

- Auth abuse is rate-limited.
- Production cannot accidentally run with weak/default secrets.
- Server logs are useful for debugging but do not leak credentials.

### Environment And Deployment

Document required variables:

- `APP_SECRET`
- `WHATSAPP_CREDENTIAL_SECRET`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- `SESSION_COOKIE_DOMAIN`
- `CORS_ORIGIN`
- `EASY_ASSISTANT_DB_PATH`
- `DEFAULT_TIMEZONE`
- `PORT`
- `VITE_API_BASE_URL`

Add deployment checklist:

- create production database path;
- configure secure cookies;
- configure allowed frontend origin;
- run migrations or schema bootstrap;
- seed demo only in non-production;
- verify `/api/health`;
- verify login/logout/session;
- verify WhatsApp webhook verification;
- verify assistant settings save.

### Data Safety

Required decisions before real customer launch:

- Continue SQLite only for controlled MVP pilots, or choose a managed Postgres target.
- Define backup frequency.
- Define restore process.
- Define retention policy for customers, messages, audit logs, and reminders.

Default recommendation:

- SQLite is acceptable for local demo and very small controlled pilots.
- Use managed Postgres before onboarding real paying businesses at scale.

## P3: First-Use Setup

### Objective

Replace the removed onboarding route with a lightweight setup checklist on the dashboard. This avoids a separate wizard while still guiding non-technical users.

### Checklist Items

1. Add business details.
2. Add first service.
3. Add first staff member.
4. Set working hours.
5. Connect WhatsApp.
6. Test assistant reply.

### Behavior

- Each item links to the existing page.
- Each item is marked complete based on real account data where possible.
- Checklist remains visible until all launch-critical items are complete.
- Checklist copy should be short, practical, and translated.

Acceptance:

- A new user can reach a usable booking setup without asking where to start.

## P4: Next Feature After Launch Readiness

### Recommended Feature: Public Booking Link

This is the highest-value next feature after P0-P3 because it directly creates booking value and reuses existing services, staff, availability, and appointment logic.

### MVP Scope

Public route:

- service list;
- date/time slot picker;
- customer name;
- customer phone;
- optional note;
- confirmation screen.

Backend:

- public-safe read endpoint for active services and available slots;
- public appointment creation endpoint with validation and abuse protection;
- no staff-login requirement;
- no payment requirement;
- no customer account requirement.

Acceptance:

- A customer can open a link, choose a service, pick a valid slot, enter phone/name, and create a pending or confirmed appointment.

### Defer

- Payments.
- Customer accounts.
- Multi-location chooser.
- Advanced cancellation portal.
- Analytics dashboard.
- Coupons or promotions.

## Explicitly Deferred Features

Do not prioritize these before launch trust and setup are fixed:

- analytics charts and pie charts;
- billing/subscription UI;
- Facebook Messenger;
- Telegram;
- web widget;
- email campaigns;
- complex marketing automation;
- staff logins;
- role-based access control beyond owner/admin basics;
- AI knowledge-base upload;
- voice assistant;
- mobile app;
- payment collection.

## Suggested Sprint Sequence

### Sprint 1: Trust Cleanup

Deliver:

- resource-state model;
- no fake local writes;
- dashboard no silent demo fallback;
- translated error/empty/demo copy;
- tests for failed writes.

Quality gate:

```bash
npm run typecheck
npm run test:run -- --cache=false
npm run build
```

### Sprint 2: Core Feature Polish

Deliver:

- better booking validation;
- service validation and archive behavior;
- staff service assignment improvement;
- availability validation and preview;
- clearer conversation handoff state.

Quality gate:

```bash
npm run typecheck
npm run test:run -- --cache=false
npm run build
```

### Sprint 3: Production Readiness

Deliver:

- rate limiting;
- secret validation;
- config cleanup;
- deployment checklist;
- docs cleanup;
- backup/restore decision.

Quality gate:

```bash
npm run lint
npm run typecheck
npm run test:run -- --cache=false
npm run build
```

### Sprint 4: First-Use Setup

Deliver:

- dashboard setup checklist;
- real completion logic;
- BN/EN setup copy;
- manual QA of first-run flow.

Quality gate:

```bash
npm run typecheck
npm run test:run -- --cache=false
npm run build
```

### Sprint 5: Public Booking Link

Start only after Sprints 1-4 are complete.

Deliver:

- public booking page;
- public slot read endpoint;
- public appointment create endpoint;
- anti-spam/rate-limit protection;
- confirmation state;
- tests for valid and invalid booking attempts.

## Manual QA Checklist

Run this before any release candidate:

1. Seed demo data.
2. Start backend and frontend.
3. Login with demo owner.
4. Switch language to Bangla and English.
5. Confirm dashboard state is clear.
6. Add service.
7. Add staff member.
8. Assign service to staff.
9. Set working hours.
10. Create booking.
11. Reschedule booking.
12. Cancel booking.
13. Open a conversation.
14. Send human reply.
15. Trigger/take over handoff.
16. Check WhatsApp setup status.
17. Edit assistant greeting and preview response.
18. Logout and login again.
19. Stop backend and confirm pages show clear error states, not fake saves.

## Implementation Guardrails

- Keep changes scoped to current launch modules.
- Do not reintroduce removed onboarding, billing, analytics, or multi-channel pages into the primary nav.
- Keep owner-facing language simple.
- Use existing UI components and translation infrastructure.
- Add BN/EN copy with every new visible string.
- Do not expose provider secrets in the frontend.
- Do not add a large abstraction unless multiple pages need the same state/error behavior.
- Treat failed persistence as a product-critical error, not a cosmetic issue.

## Final Launch Acceptance

Easy Assistant is ready for a small controlled Bangladesh pilot when:

- core writes persist or fail clearly;
- no user can mistake demo/local data for saved live data;
- setup path is obvious;
- WhatsApp-first workflow is clear;
- assistant settings are understandable;
- docs match the app;
- production secrets and deployment steps are documented;
- typecheck, tests, and build pass.

