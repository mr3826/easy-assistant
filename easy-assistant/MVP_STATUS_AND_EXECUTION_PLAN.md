# MVP Status And Execution Plan

Status date: 2026-06-20
Owner lane: integrated Codex execution wave with parallel Worker A/B/C lanes

## Current Read

The repository now has its first real backend/auth foundation instead of a frontend-only prototype. Phase 1 introduced an executable server runtime, cookie-based sessions, SQLite persistence, and API-backed auth flows wired into the frontend.

The app shell is also more MVP-focused: primary navigation now emphasizes the WhatsApp booking core modules, deferred modules are hidden from primary routing, and Privacy/Terms pages now carry launch-ready MVP copy for compliance preparation.

Phase 2 is now visible in the repo as a booking-data foundation: service, staff, customer, appointment, and availability contract surfaces are modeled in types/schema lists and are covered by focused backend tests, while the remaining work is still the persistent CRUD and handler wiring.

Phase 6 has now landed in the repo as well: AI settings are persisted on the backend, the receptionist flow can classify messages, validate availability, create real appointments, write AI audit logs, and hand off to a human when needed, with matching contract and runtime coverage.

Phase 7 is also live now: reminders and dashboard aggregation are backed by real data and tests, so the launch story can stay centered on booking operations instead of placeholder analytics.

Launch-readiness cleanup has narrowed the app around the first pilot market: WhatsApp-first booking operations for Bangladesh businesses. Redundant analytics and broad-channel surfaces are deferred, setup progress is now based on live account state, services/staff archive instead of destructive-looking deletes, staff-service assignment is persisted, and availability shows the customer-facing booking preview.

## Acceptance Criteria Status

| Brief area | Status | Evidence in repo | Missing to reach MVP | Next phase |
|---|---|---|---|---|
| Signup, login, logout, sessions | Implemented | Backend server, SQLite session store, cookie auth, and API-backed frontend session handling | Production hardening: rate limiting, audit logging, and deployment wiring | Phase 1 complete |
| Organization/location tenant model | Implemented | Signup now creates user, organization, location, membership, and session records together | Tenant-scoped CRUD for the rest of the MVP modules | Phase 1 complete |
| Services CRUD | Implemented | Services page is API-backed with validation and archive-safe deactivation | Add stronger appointment guardrails before broader rollout | Launch polish |
| Staff CRUD and service assignment | Implemented | Staff page is API-backed and persists staff-service assignments | Add richer staff-hours editing when pilots need per-person schedules | Launch polish |
| Availability settings | Implemented | Business hours load/save through the API and show a customer-facing preview | Holiday/exception support remains post-MVP | Launch polish |
| Availability engine | Partial | `src/server/domain/scheduling.ts` generates slots using service duration, staff assignment, business/staff hours, timezone, buffers, and appointment conflicts | API route implementation, persistence, holiday/exception support, transactional booking integration | Phase 3 |
| Appointment lifecycle | Partial | Appointments page exists; status helpers and route contract samples are in tests | Persistent appointments, statuses, create/cancel/reschedule/complete/no-show APIs | Phase 2 |
| Conflict prevention | Partial | `src/server/domain/appointments.ts` detects blocking appointment overlaps by organization, location, and staff | Database transaction enforcement during create/reschedule | Phase 3 |
| Customers | Partial | Customer type/schema list entries and route contract samples exist | Customer table, phone dedupe, consent fields, export/delete | Phase 2 |
| Conversations | Implemented | Conversations page now hydrates from the API, conversation/channel state is persisted, and human takeover/manual replies are wired | WhatsApp-native inbound ingestion, webhook persistence, and outbound send flows | Phase 4 complete |
| WhatsApp integration | Implemented | Channel patch/update now stores encrypted access tokens and hashed verify tokens; webhook verification and inbound ingest persist WhatsApp conversations/messages; outbound replies are queued with consent checks | Provider delivery sync and template hardening | Phase 5 complete |
| AI receptionist workflow | Implemented | AI settings page, persisted settings routes, and receptionist runtime/tests exist | Confidence threshold tuning and richer intent coverage | Phase 6 complete |
| Reminders | Implemented | Reminder queue, template payloads, and delivery log coverage are present in backend tests | Reminder delivery hardening and production scheduling polish | Phase 7 complete |
| Dashboard real metrics | Implemented | Dashboard now reflects real appointment/conversation/reminder data | None for MVP scope | Phase 7 complete |
| Basic AI settings | Implemented | AI Settings page now persists live MVP settings and removes demo-only controls | None for MVP scope | Phase 6 complete |
| Public booking link | Missing | No public booking route found | Public service list, slot picker, customer form, confirmation | Next phase after core MVP |
| Privacy/compliance hooks | Partial | `/privacy` and `/terms` launch-ready MVP pages exist; customer consent and audit log fields exist in domain/migration | Customer export/delete UI/API, retention settings, opt-out handling | Phase 8 |
| Security acceptance | Partial | Password hashing, HttpOnly cookie sessions, and API auth are in place | Rate limits, webhook verification, deployment secret hygiene, and broader authorization hardening | Phase 1 and Phase 5 |
| Quality gates | Partial | Vitest harness, auth tests, scheduling/conflict tests, and phase-2 booking-data contract tests exist | Service/staff CRUD, webhook, AI tool-call, migration/seed coverage | All phases |

## Verification Coverage Status

| Coverage area required by brief | Status | Notes |
|---|---|---|
| Auth | Partial | Existing tests cover current localStorage auth behavior, which is explicitly not MVP-compliant and should be replaced when real auth lands. |
| Phase 2 booking-data route contracts | Covered at contract level | `src/test/backend-contracts.test.ts` now verifies service, staff, availability, customer, and appointment route metadata plus typed tenant-scoped request/response samples. |
| Scheduling slot generation | Covered at domain level | `src/test/scheduling-domain.test.ts` verifies business/staff hours, staff-service assignment, timezone output, and conflict exclusion. |
| Appointment conflict prevention | Covered at domain level | `src/test/scheduling-domain.test.ts` verifies overlap detection, non-blocking statuses, and tenant/location scoping. |
| Conversation and message lifecycle | Covered at contract/runtime level | `src/test/backend-contracts.test.ts` and `src/test/backend-conversation-lifecycle.test.ts` verify conversation, channel, takeover, close, and message persistence paths. |
| WhatsApp channel runtime | Covered at contract/runtime level | `src/test/backend-contracts.test.ts` and `src/test/backend-whatsapp.test.ts` verify WhatsApp channel patching, webhook verification, inbound ingest, consent updates, queued outbound replies, and opt-out blocking. |
| Service CRUD | Partial | Backend/runtime coverage exists; add focused UI interaction coverage for archive and validation. |
| Staff CRUD | Partial | Backend/runtime coverage exists; add focused UI interaction coverage for staff-service assignment. |
| WhatsApp webhook handling | Missing | Add tests when webhook routes and signature validation exist. |
| AI tool-call appointment creation | Covered at contract/runtime level | `src/test/backend-contracts.test.ts` and `src/test/backend-ai-receptionist.test.ts` verify the AI receptionist booking flow. |

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

Goal: persist the booking-data foundation that scheduling and AI booking need.

Parallel lanes:

| Lane | Scope | Can run with |
|---|---|---|
| Services | Service model/API/UI wiring/tests | Staff lane |
| Staff | Staff model/API/UI wiring/tests | Services lane |
| Staff-service assignment | Join model and assignment flows | After Services and Staff route shape stabilizes |
| Customers | Customer model, phone dedupe, consent fields | Appointments lane |
| Appointments | CRUD, statuses, lifecycle routes | Customers lane |
| Availability settings | Business hours and staff hours persistence | Services/Staff lanes |

Exit checks: services/staff/customers/appointments/availability settings are tenant-scoped across schema, route contracts, and tests, with CRUD handlers ready for scheduling and AI booking.

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

Goal: keep the launch surface grounded in live booking operations.

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

1. Complete the launch-readiness docs and seed/bootstrap flow so the MVP can be demoed with real data quickly.
2. Keep the launch surface narrow: core booking, conversations, WhatsApp, reminders, dashboard, and legal pages only.
3. Ship any remaining hardening needed for retention, support, and account responsibility before broad launch.
