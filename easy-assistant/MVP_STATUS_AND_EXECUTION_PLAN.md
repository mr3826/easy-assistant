# MVP Status And Execution Plan

Status date: 2026-06-11
Owner lane: integrated Codex execution wave with parallel Worker A/B/C lanes

## Current Read

The repository now has its first real backend/auth foundation instead of a frontend-only prototype. Phase 1 introduced an executable server runtime, cookie-based sessions, SQLite persistence, and API-backed auth flows wired into the frontend.

The app shell is also more MVP-focused: primary navigation now emphasizes the WhatsApp booking core modules, deferred modules are hidden from primary routing, and Privacy/Terms placeholder pages exist for launch-readiness and compliance preparation.

## Acceptance Criteria Status

| Brief area | Status | Evidence in repo | Missing to reach MVP | Next phase |
|---|---|---|---|---|
| Signup, login, logout, sessions | Implemented | Backend server, SQLite session store, cookie auth, and API-backed frontend session handling | Production hardening: rate limiting, audit logging, and deployment wiring | Phase 1 complete |
| Organization/location tenant model | Implemented | Signup now creates user, organization, location, membership, and session records together | Tenant-scoped CRUD for the rest of the MVP modules | Phase 1 complete |
| Services CRUD | Partial | Services page exists | Persistent service model, CRUD API, validation, delete guard for active appointments | Phase 2 |
| Staff CRUD and service assignment | Partial | Staff page exists | Persistent staff model, staff_services join, API, validation | Phase 2 |
| Availability engine | Partial | `src/server/domain/scheduling.ts` generates slots using service duration, staff assignment, business/staff hours, timezone, buffers, and appointment conflicts | API route implementation, persistence, holiday/exception support, transactional booking integration | Phase 3 |
| Appointment lifecycle | Partial | Appointments page exists | Persistent appointments, statuses, create/cancel/reschedule/complete/no-show APIs | Phase 2 |
| Conflict prevention | Partial | `src/server/domain/appointments.ts` detects blocking appointment overlaps by organization, location, and staff | Database transaction enforcement during create/reschedule | Phase 3 |
| Customers | Missing | No customer domain/API found | Customer table, phone dedupe, consent fields, export/delete | Phase 2 |
| Conversations | Partial | Conversations page exists | Persistent conversations/messages, human takeover, manual replies | Phase 4 |
| WhatsApp integration | Missing | Channels page exists | Secure credential storage, webhook verify/ingest/send/templates | Phase 5 |
| AI receptionist workflow | Missing | AI settings page exists | Intent detection, tool-calling booking flow, AI action logs, guardrails | Phase 6 |
| Reminders | Missing | No queue/reminder domain found | Reminder settings, queue, WhatsApp templates, delivery log | Phase 7 |
| Dashboard real metrics | Partial | Dashboard UI exists | Metrics from real appointment/conversation data only | Phase 7 |
| Basic AI settings | Partial | AI Settings page exists | Persisted MVP settings and removal/hiding of non-MVP controls | Phase 6 |
| Public booking link | Missing | No public booking route found | Public service list, slot picker, customer form, confirmation | Next phase after core MVP |
| Privacy/compliance hooks | Partial | `/privacy` and `/terms` placeholder pages exist; customer consent and audit log fields exist in domain/migration | Customer export/delete UI/API, retention settings, localized privacy copy, opt-out handling | Phase 8 |
| Security acceptance | Partial | Password hashing, HttpOnly cookie sessions, and API auth are in place | Rate limits, webhook verification, deployment secret hygiene, and broader authorization hardening | Phase 1 and Phase 5 |
| Quality gates | Partial | Vitest harness, auth tests, and scheduling/conflict tests exist | Service/staff CRUD, webhook, AI tool-call, migration/seed coverage | All phases |

## Verification Coverage Status

| Coverage area required by brief | Status | Notes |
|---|---|---|
| Auth | Partial | Existing tests cover current localStorage auth behavior, which is explicitly not MVP-compliant and should be replaced when real auth lands. |
| Scheduling slot generation | Covered at domain level | `src/test/scheduling-domain.test.ts` verifies business/staff hours, staff-service assignment, timezone output, and conflict exclusion. |
| Appointment conflict prevention | Covered at domain level | `src/test/scheduling-domain.test.ts` verifies overlap detection, non-blocking statuses, and tenant/location scoping. |
| Service CRUD | Missing | Add tests when persistent service API/domain exists. |
| Staff CRUD | Missing | Add tests when persistent staff API/domain exists. |
| WhatsApp webhook handling | Missing | Add tests when webhook routes and signature validation exist. |
| AI tool-call appointment creation | Missing | Add tests when AI tool orchestration and appointment creation service exist. |

## Execution Roadmap

### Phase 1: Foundation And Security

Goal: replace prototype-only foundations with production-safe app structure.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Backend foundation | Backend framework, database, ORM, migrations, env loading | Frontend API client lane |
| Auth | Signup/login/logout/session, password hashing, owner role | Tenant schema lane after base tables agreed |
| Tenant model | Organization, location, user, membership, scoped access helpers | Auth lane |
| Frontend API shell | API client, domain types, auth provider replacement | Backend foundation after route contracts |
| Quality harness | Update tests from localStorage auth to server-backed session behavior | Auth lane |

Exit checks: auth/session tests pass, tenant records created on signup, no localStorage boolean auth remains.

### Phase 2: Core Booking Data

Goal: persist the entities that scheduling and AI booking need.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Services | Service model/API/UI wiring/tests | Staff lane |
| Staff | Staff model/API/UI wiring/tests | Services lane |
| Staff-service assignment | Join model and assignment flows | After Services and Staff route shape stabilizes |
| Customers | Customer model, phone dedupe, consent fields | Appointments lane |
| Appointments | CRUD, statuses, lifecycle routes | Customers lane |
| Availability settings | Business hours and staff hours persistence | Services/Staff lanes |

Exit checks: services/staff/customers/appointments are persistent, tenant-scoped, and covered by CRUD tests.

### Phase 3: Scheduling Engine

Goal: provide a domain service that the UI, public booking link, WhatsApp, and AI can trust.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Slot generation | Business hours, staff hours, service duration, timezone | Conflict lane after shared types |
| Conflict prevention | Overlap detection for create/reschedule, cancelled status rules | Slot lane |
| API route | `GET /api/availability/slots` | Domain lanes |
| Tests | Convert pending scheduling contract tests into executable unit/integration tests | Domain lanes |

Exit checks: available slots exclude conflicts, staff-service assignments are respected, appointment creation/reschedule cannot double book.

### Phase 4: Conversations

Goal: make inbound and manual conversations real.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Conversation data | Conversations and messages tables/API | UI lane |
| Inbox UI wiring | Replace mock threads with API state | Data lane |
| Human takeover | State transitions and manual reply endpoint | Message API lane |
| Tests | Conversation list/thread/takeover coverage | Data and UI lanes |

Exit checks: messages are stored, visible in the UI, and can switch between AI and human handling.

### Phase 5: WhatsApp

Goal: receive and send WhatsApp messages securely.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Credentials | Tenant WhatsApp metadata and encrypted token storage | Webhook lane |
| Webhooks | Verify route, signature checks, inbound message ingestion | Credentials lane |
| Outbound send | Manual reply and template send service | Webhook lane |
| Compliance | Consent/opt-out handling and policy docs | Outbound lane |
| Tests | Webhook verification, inbound persistence, outbound error handling | All WhatsApp lanes |

Exit checks: no token reaches frontend, inbound WhatsApp creates messages, outbound replies use server-side credentials.

### Phase 6: AI Receptionist

Goal: turn messages into real bookings through constrained tools.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Intent classifier | Booking/reschedule/cancel/FAQ/handoff intents | Tool lane |
| Tool layer | search services, get slots, create/reschedule/cancel appointment | Classifier lane |
| Orchestrator | Conversation state, slot offers, confirmations, handoff | Tool lane |
| Guardrails | No invented slots, no fake confirmations, safe fallback | Orchestrator lane |
| Tests | AI tool-call appointment creation and low-confidence handoff | Tool and orchestrator lanes |

Exit checks: AI can create a real appointment only through validated scheduling tools and logs the action.

### Phase 7: Reminders And Real Dashboard

Goal: reduce no-shows and make operational metrics trustworthy.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Reminder queue | Scheduling, template payloads, delivery log | Dashboard lane |
| WhatsApp templates | Approved reminder template send path | Reminder queue lane |
| Dashboard summary | Real appointment/conversation metrics | Reminder lane |
| Tests | Reminder scheduling and dashboard aggregation | All Phase 7 lanes |

Exit checks: confirmed appointments schedule reminders, delivery attempts are logged, dashboard shows real data only.

### Phase 8: Launch Readiness

Goal: remove prototype risk and prepare a usable MVP demo/onboarding path.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| MVP navigation | Hide/defer non-MVP modules | Docs lane |
| Legal/compliance | Privacy, terms, retention docs, audit logs | Security lane |
| Seeds/setup | Demo business, services, staff, env docs | QA lane |
| QA gates | lint, typecheck, tests, build, targeted workflow QA | All lanes |
| Release docs | README, env example, known limitations | QA lane |

Exit checks: setup docs are current, quality commands pass, and deferred modules do not distract from WhatsApp booking.

## Immediate Next Tasks

1. Complete tenant-scoped CRUD for services, staff, customers, and appointments on top of the new backend foundation.
2. Expose `GET /api/availability/slots` using the scheduling domain and enforce conflict checks in appointment create/reschedule.
3. Add seed data and demo workflows for the new backend so the MVP can be exercised end to end.
4. Expand the quality gates around the new API surface, especially auth/session and route-contract coverage.
