# Easy Assistant / BookingAI — Codex Execution Brief

**Role assumption:** Act as the engineering/product execution agent for Easy Assistant.  
**Product positioning:** Easy Assistant is not “just appointment software.” It is the first AI employee for local service businesses — starting with an **AI Receptionist** that converts WhatsApp conversations into appointments.

---

## 0. Current Product Reality

The existing app is a polished frontend-only prototype. Treat the current UI as a product specification, not as a production-ready app.

### Current state

- Frontend UI exists for Dashboard, Appointments, Conversations, Staff, Services, Availability, Channels, Marketing, AI Settings, Billing, Analytics, Support, Settings, and Auth.
- There is no real backend.
- There is no database.
- There is no production authentication.
- There is no AI engine.
- There is no WhatsApp integration.
- There is no scheduling engine.
- There is no billing integration.
- Most data is static mock data inside frontend components.
- Many actions are disabled in demo mode.

### Engineering goal

Convert the frontend prototype into a real MVP that proves the core business value:

> A service business can connect WhatsApp, let an AI receptionist answer customers, check availability, book appointments, and send reminders.

---

## 1. CEO-Level Product Decision

Do not build every module immediately.

The MVP should not be a full SaaS dashboard.  
The MVP should be a working AI receptionist.

### Main product promise

> Never miss another booking. Your AI receptionist works 24/7 on WhatsApp.

### Primary user

Small and medium service businesses:

- Salons
- Beauty studios
- Clinics
- Dental practices
- Spas
- Massage centers
- Fitness trainers
- Consultants

### Primary market focus

Start with Bangladesh and WhatsApp-heavy markets, but architect globally.

---

## 2. Go / No-Go Feature Scope

## 2.1 GO — MVP Features

These must be built first.

### 1. Authentication

Build production authentication.

Required:

- Signup
- Login
- Logout
- Password hashing
- Session management
- Tenant/business creation on signup
- Protected routes
- Basic owner role

Do not keep the current localStorage boolean auth model.

---

### 2. Business / Tenant Model

Implement multi-tenant SaaS from day one.

Recommended structure:

```txt
Organization
 └── Location
      └── Staff
      └── Services
      └── Availability
      └── Appointments
      └── Conversations
```

If time is limited, support one location per organization initially, but design the schema so multiple locations can be added later.

Required:

- Organization table
- Location table
- User table
- Membership / role table
- Every business record must be scoped by organization_id and location_id where appropriate.

---

### 3. Services

Replace mock services with persistent CRUD.

Required fields:

- id
- organization_id
- location_id
- name
- category
- description
- duration_minutes
- price
- active
- created_at
- updated_at

Required UI behavior:

- List services
- Add service
- Edit service
- Activate/deactivate service
- Delete only if no active appointments depend on it

---

### 4. Staff

Replace mock staff with persistent CRUD.

Required fields:

- id
- organization_id
- location_id
- name
- role_title
- email
- phone
- avatar_url
- active
- created_at
- updated_at

Required relationships:

- Staff can perform many services.
- Service can be performed by many staff.

Required UI behavior:

- List staff
- Add staff
- Edit staff
- Assign services to staff
- Activate/deactivate staff

---

### 5. Availability Engine

This is a core system. Do not fake it.

Required availability layers:

1. Business/location opening hours
2. Staff working hours
3. Service duration
4. Existing appointments
5. Time zone
6. Optional buffer time
7. Future holiday/exception dates

Minimum MVP rules:

- Generate available slots for a selected service, date, and optional staff member.
- Prevent double booking.
- Respect staff-service assignment.
- Respect business hours.
- Respect staff hours.
- Respect service duration.
- Store and use the business time zone.

Required API behavior:

```http
GET /api/availability/slots?serviceId=...&date=...&staffId=...
```

Response example:

```json
{
  "date": "2026-06-11",
  "timezone": "Asia/Dhaka",
  "slots": [
    {
      "start": "2026-06-11T10:00:00+06:00",
      "end": "2026-06-11T10:30:00+06:00",
      "staffId": "..."
    }
  ]
}
```

---

### 6. Appointments

Replace mock appointments with persistent CRUD and real lifecycle.

Required statuses:

- pending
- confirmed
- completed
- cancelled
- no_show
- rescheduled

Required fields:

- id
- organization_id
- location_id
- customer_id
- service_id
- staff_id
- channel_id
- start_time
- end_time
- status
- notes
- created_by
- created_at
- updated_at

Required behavior:

- Create appointment manually
- Create appointment from AI flow
- Confirm appointment
- Cancel appointment
- Mark completed
- Mark no-show
- Reschedule appointment
- Prevent conflicting appointments

---

### 7. Customers

Add customer records. This is needed for conversations, reminders, repeat bookings, and CRM.

Required fields:

- id
- organization_id
- location_id
- name
- phone
- email
- source_channel
- consent_status
- last_seen_at
- created_at
- updated_at

Required behavior:

- Deduplicate customers by phone within the same organization.
- Link conversations and appointments to customer.
- Store consent metadata for messaging.

---

### 8. Conversations

Conversations are the heart of the product.

Required:

- Conversation list
- Message thread
- Channel badge
- AI-handled / human-handled state
- Human takeover
- Send manual reply
- Store all inbound and outbound messages

Message senders:

- customer
- ai
- human
- system

Conversation states:

- ai_handled
- human_handled
- closed

---

### 9. WhatsApp Integration

Build WhatsApp first. Do not build Messenger, Telegram, Mobile SDK, or Voice Bot in MVP.

Required:

- WhatsApp Cloud API setup
- Webhook verification
- Inbound message handling
- Outbound message sending
- Template message support for reminders
- Store WhatsApp business account / phone number metadata
- Never expose secret access tokens in the frontend

Required webhook route:

```http
GET /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
```

Required security:

- Verify webhook signatures where applicable.
- Store tokens encrypted.
- Use environment variables for system-level credentials.
- Tenant-specific credentials must be stored server-side only.

---

### 10. AI Receptionist Workflow

Do not build a generic chatbot. Build a task-oriented booking agent.

Required AI flow:

```txt
Inbound customer message
  ↓
Detect intent
  ↓
If FAQ → answer from business knowledge
If booking → collect service/date/time preference
  ↓
Check availability
  ↓
Offer slots
  ↓
Collect customer name/phone if missing
  ↓
Create appointment
  ↓
Confirm appointment
  ↓
Schedule reminder
```

Required intents:

- book_appointment
- reschedule_appointment
- cancel_appointment
- ask_service_price
- ask_business_hours
- ask_location
- ask_human
- unknown

Required AI tools/functions:

- searchServices
- getBusinessHours
- getAvailableSlots
- createAppointment
- rescheduleAppointment
- cancelAppointment
- getAppointmentByCustomerPhone
- handoffToHuman

Required guardrails:

- AI must not invent unavailable slots.
- AI must not confirm appointments without creating a real appointment record.
- AI must disclose it is an AI assistant when appropriate.
- AI must hand off to a human when confidence is low.
- AI must not answer medical/legal/financial advice beyond business-provided FAQ.

---

### 11. Reminders

Build appointment reminders because this directly reduces no-shows.

Required:

- Reminder template
- Reminder timing
- Reminder job queue
- WhatsApp template message support
- Reminder delivery log

Default reminder:

```txt
Hi {customer_name}, reminder: your {service_name} appointment is on {date} at {time}. Reply RESCHEDULE if you need a different time.
```

---

### 12. Basic Dashboard

Dashboard should use real data only.

MVP metrics:

- Today’s appointments
- Pending appointments
- Confirmed appointments
- Completed appointments
- Cancelled appointments
- No-show count
- WhatsApp conversations
- AI-booked appointments

Do not show fake revenue unless payments exist.

---

### 13. Basic AI Settings

Simplify the current AI Settings module.

MVP settings:

- Assistant name
- Tone: friendly / professional / formal
- Default language
- Greeting message
- Human handoff message
- Auto-confirm bookings: on/off
- Reminder enabled: on/off

Remove or hide:

- Creativity slider
- Advanced model controls
- Voice bot
- Complex fallback modes

---

## 2.2 NO-GO — Do Not Build in MVP

Do not spend MVP time on these unless core WhatsApp booking is already working.

### 1. Voice Bot

Reason:

- High complexity
- Expensive
- Requires telephony infrastructure
- Not needed to prove MVP

---

### 2. Telegram

Reason:

- Lower priority for target SMBs than WhatsApp

---

### 3. Facebook Messenger

Reason:

- Useful later, but WhatsApp is the wedge

---

### 4. Mobile SDK

Reason:

- Not relevant before API and core booking are stable

---

### 5. Advanced Analytics

Reason:

- Users do not buy analytics first
- Users buy bookings and less admin work

Keep only basic operational metrics.

---

### 6. Full Billing UI

Reason:

- Use Stripe/Paddle dashboard manually at first if needed
- Do not delay MVP for subscription-management polish

---

### 7. Support Module

Reason:

- Use WhatsApp, Crisp, Intercom, or email for support initially
- Internal support dashboard is unnecessary pre-PMF

---

### 8. Promotional Campaigns

Reason:

- Can create compliance risk
- Reminder messages are enough for MVP

---

## 3. Features to Add Beyond Current List

## 3.1 Customer Booking Link

Add public booking link:

```txt
/e/{business-slug}
```

or

```txt
/{business-slug}
```

Example:

```txt
easyassistant.ai/glow-salon
```

Required:

- Public service list
- Slot picker
- Customer info form
- Appointment creation
- Confirmation page

This link can be shared in Facebook bio, Instagram bio, WhatsApp status, Google Business Profile, and QR codes.

---

## 3.2 Google Calendar Sync

Add after MVP core is stable.

Required:

- Connect Google Calendar
- Push appointments to Google Calendar
- Optional two-way conflict detection
- Per-staff calendar mapping later

---

## 3.3 Review Collection

After appointment completion, send:

```txt
Thanks for visiting {business_name}. Could you leave us a review?
{google_review_link}
```

This is high-value for SMBs.

---

## 3.4 Missed Call Recovery

Future growth feature.

Flow:

```txt
Missed phone call
  ↓
AI sends WhatsApp message
  ↓
Customer books appointment
```

This can become a major differentiator.

---

## 3.5 Vertical Templates

Add templates to reduce setup time.

Templates:

- Salon
- Dental clinic
- Medical clinic
- Spa
- Massage center
- Fitness trainer
- Consultant

Each template should preload:

- Services
- Service categories
- Suggested staff roles
- AI greeting
- FAQ prompts
- Reminder template
- Booking policies

---

## 4. Brand Direction

## 4.1 Positioning

Do not position the product as:

```txt
Appointment Management Software
```

Do not position it as:

```txt
AI Chatbot
```

Position it as:

```txt
The AI Receptionist for Service Businesses
```

## 4.2 Core Message

Use one of these:

- Never miss another booking.
- Your AI receptionist works 24/7.
- Turn WhatsApp chats into confirmed appointments.
- Hire an AI receptionist for less than a part-time employee.
- More bookings. Fewer no-shows. Less admin work.

## 4.3 Brand Personality

Brand should feel:

- Helpful
- Trustworthy
- Local-business friendly
- Simple
- Fast
- Human, not robotic

Avoid:

- Overly technical AI language
- Enterprise jargon
- Complicated setup language

## 4.4 Naming

Current names:

- Easy Assistant
- BookingAI
- easy-assistant

Codex task:

Recommend one canonical product name across:

- UI
- README
- package metadata
- localStorage keys
- environment variables
- SEO metadata
- landing page copy

Preferred direction:

```txt
Easy Assistant
```

Sub-positioning:

```txt
AI Receptionist for WhatsApp Bookings
```

---

## 5. Marketing & Growth Execution

## 5.1 Launch Wedge

Start with one vertical and one channel.

Recommended first wedge:

```txt
WhatsApp AI receptionist for salons and clinics in Bangladesh.
```

Why:

- High WhatsApp usage
- Clear booking need
- Local founder advantage
- Easy customer interviews
- Fast manual onboarding

---

## 5.2 ICP

Initial Ideal Customer Profile:

- 1–20 staff
- Receives bookings on WhatsApp
- Owner or receptionist replies manually
- Misses messages after hours
- Has repeat customers
- Has appointment no-shows
- Not deeply technical

---

## 5.3 Growth Channels

### 1. Founder-led sales

Visit or contact:

- Salons
- Dental clinics
- Skin clinics
- Spas
- Diagnostic centers
- Fitness studios

Goal:

- First 10 paying customers before scaling ads.

### 2. Demo videos

Create short videos showing:

```txt
Customer: Can I book tomorrow?
AI: Sure. We have 3 PM or 5 PM. Which works for you?
Customer: 3 PM
AI: Great. You're booked for 3 PM with Sarah.
```

Use:

- Facebook
- TikTok
- Instagram Reels
- LinkedIn
- YouTube Shorts

### 3. Agency partner program

Target agencies that already serve SMBs.

Offer:

- Referral commission
- White-label later
- Client dashboard access later

### 4. SEO pages

Create landing pages:

- AI receptionist for salons
- AI receptionist for clinics
- WhatsApp booking software
- AI appointment booking Bangladesh
- WhatsApp chatbot for salons
- AI receptionist for dental clinics

### 5. Local reseller program

Train local digital marketers and software sellers to onboard customers.

---

## 6. Legal, Compliance, and Regulation Requirements

This is not legal advice. Codex should implement privacy-by-design and prepare compliance hooks.

## 6.1 Global Privacy Requirements

Design for GDPR-level privacy even if starting in Bangladesh.

Required product capabilities:

- Privacy policy link
- Terms of service link
- Data processing notice
- Customer consent tracking
- Delete customer data
- Export customer data
- Role-based access control
- Audit logs for sensitive actions
- Data retention settings
- Secure token storage
- Encryption in transit
- Encryption at rest where possible

GDPR-relevant user rights to support:

- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to restrict processing

## 6.2 Bangladesh Requirements

Bangladesh has moved toward formal personal data protection regulation, including the Personal Data Protection Ordinance / Act direction. Build as if personal-data rights, lawful processing, consent, data security, and data-controller/data-processor obligations apply.

Required BD-readiness:

- Store consent basis for customer messaging
- Allow customer data deletion
- Allow customer data export
- Keep audit logs
- Localize privacy copy later
- Avoid collecting unnecessary sensitive data
- Avoid medical advice unless business-approved FAQ is provided

## 6.3 WhatsApp / Meta Compliance

Required:

- Use approved WhatsApp templates for outbound reminders outside active conversation windows.
- Store opt-in / consent status.
- Provide clear opt-out language where needed.
- Do not spam promotional messages.
- Keep business-initiated messaging compliant.
- Prepare for WhatsApp policy/API changes.
- Do not expose WhatsApp access tokens client-side.

## 6.4 AI Compliance / Trust

Required:

- Disclose AI assistant identity where appropriate.
- Log AI actions.
- Log which tool/function created or changed an appointment.
- Allow human takeover.
- Do not let AI make unsupported claims.
- Add safe fallback when AI confidence is low.
- Do not train global models on tenant data without explicit permission.

---

## 7. Recommended Technical Architecture

## 7.1 Backend

Recommended stack:

- Node.js backend
- PostgreSQL database
- Prisma or Drizzle ORM
- Redis-backed queue for reminders and webhooks
- REST API first
- WebSocket or Server-Sent Events later for live inbox

Codex may propose alternatives, but must justify tradeoffs.

---

## 7.2 Frontend

Keep current React frontend but refactor:

- Extract domain types into `/src/app/types`
- Replace mock arrays with API hooks
- Add service layer under `/src/app/api`
- Add loading/error/empty states
- Add form validation to all create/edit forms
- Remove demo-mode disabled behavior where backend exists

Suggested client data library:

- TanStack Query

---

## 7.3 AI System

Recommended architecture:

```txt
Message Ingestion
  ↓
Conversation Orchestrator
  ↓
Intent Classifier
  ↓
Tool-Calling Agent
  ↓
Business Rules / Scheduling Engine
  ↓
Outbound Message
```

Required AI components:

- Prompt templates per organization
- Tool/function calling
- Conversation state
- Human handoff
- Knowledge base retrieval later
- AI action logs

---

## 7.4 Scheduling Engine

Build as a domain service, not as UI logic.

Suggested module:

```txt
/src/server/domain/scheduling
```

Responsibilities:

- Slot generation
- Conflict detection
- Staff filtering
- Service duration handling
- Time zone handling
- Buffers
- Future holiday exceptions

---

## 8. Database Tables — Minimum MVP

Codex should implement or propose migrations for these tables.

Required:

- users
- organizations
- locations
- memberships
- services
- staff
- staff_services
- business_hours
- staff_hours
- customers
- appointments
- channels
- conversations
- messages
- ai_settings
- reminders
- reminder_logs
- audit_logs

Optional but recommended:

- knowledge_base_documents
- subscriptions
- invoices
- notification_settings
- public_booking_pages

---

## 9. API Routes — Minimum MVP

Codex should implement or propose these APIs.

### Auth

```http
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Services

```http
GET    /api/services
POST   /api/services
GET    /api/services/:id
PATCH  /api/services/:id
DELETE /api/services/:id
```

### Staff

```http
GET    /api/staff
POST   /api/staff
GET    /api/staff/:id
PATCH  /api/staff/:id
DELETE /api/staff/:id
```

### Availability

```http
GET /api/availability/business-hours
PUT /api/availability/business-hours
GET /api/availability/staff-hours/:staffId
PUT /api/availability/staff-hours/:staffId
GET /api/availability/slots
```

### Appointments

```http
GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id
POST   /api/appointments/:id/cancel
POST   /api/appointments/:id/reschedule
POST   /api/appointments/:id/complete
POST   /api/appointments/:id/no-show
```

### Customers

```http
GET   /api/customers
POST  /api/customers
GET   /api/customers/:id
PATCH /api/customers/:id
```

### Conversations

```http
GET  /api/conversations
GET  /api/conversations/:id
GET  /api/conversations/:id/messages
POST /api/conversations/:id/messages
POST /api/conversations/:id/takeover
POST /api/conversations/:id/close
```

### WhatsApp

```http
GET  /api/webhooks/whatsapp
POST /api/webhooks/whatsapp
POST /api/channels/whatsapp/connect
GET  /api/channels
```

### AI

```http
GET  /api/ai/settings
PUT  /api/ai/settings
POST /api/ai/process-message
```

### Reminders

```http
GET  /api/reminders/settings
PUT  /api/reminders/settings
POST /api/reminders/test
```

### Dashboard

```http
GET /api/dashboard/summary
```

---

## 10. Frontend Refactor Tasks

## 10.1 Remove Mock Data From Pages

For each page:

- Move mock data to seed files or remove entirely.
- Add API loading state.
- Add empty state.
- Add error state.
- Add real create/edit behavior.

Priority pages:

1. Services
2. Staff
3. Availability
4. Appointments
5. Conversations
6. Dashboard
7. AI Settings
8. Channels

---

## 10.2 Add Validation

Use Zod + React Hook Form.

Required forms:

- Signup
- Login
- Service create/edit
- Staff create/edit
- Appointment create/edit
- Business settings
- AI settings
- Availability settings

---

## 10.3 Simplify Navigation for MVP

MVP nav should show:

- Dashboard
- Conversations
- Appointments
- Services
- Staff
- Availability
- Channels
- AI Settings
- Settings

Hide or defer:

- Marketing
- Billing
- Advanced Analytics
- Support

---

## 11. Acceptance Criteria

Codex delivery is complete only when all conditions are met.

## 11.1 Core Product Acceptance

A user can:

1. Sign up as a business owner.
2. Create a business/organization.
3. Add services.
4. Add staff.
5. Assign services to staff.
6. Configure business hours.
7. Configure staff hours.
8. View available appointment slots.
9. Create an appointment manually.
10. Connect or configure WhatsApp credentials in a secure backend-backed way.
11. Receive an inbound WhatsApp message in the system.
12. See the message in Conversations.
13. Let AI identify booking intent.
14. Let AI offer available slots.
15. Let AI create a real appointment.
16. Send a confirmation message.
17. Schedule a reminder.
18. Take over the conversation manually.
19. View real dashboard stats.

---

## 11.2 Security Acceptance

Must have:

- No plaintext secrets in frontend.
- No localStorage boolean auth.
- Passwords hashed.
- Server-side tenant enforcement.
- API authorization checks.
- Environment variables documented.
- Webhook verification.
- Basic rate limiting on auth and webhook routes.
- Audit log for appointment create/update/cancel by AI or human.

---

## 11.3 Compliance Acceptance

Must have:

- Privacy policy placeholder page/link.
- Terms placeholder page/link.
- Customer consent field.
- Customer deletion capability.
- Customer export capability.
- AI disclosure configurable message.
- WhatsApp opt-out handling plan.
- Data retention configuration documented, even if not fully automated.

---

## 11.4 Quality Acceptance

Must pass:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also required:

- No TypeScript errors.
- No dead demo-only buttons on MVP features.
- Clear README setup instructions.
- `.env.example` updated.
- Database migration files included.
- Seed script included.
- At least basic tests for:
  - Auth
  - Scheduling slot generation
  - Appointment conflict prevention
  - Service CRUD
  - Staff CRUD
  - WhatsApp webhook handling
  - AI tool-call appointment creation

---

## 12. Suggested Implementation Order

### Phase 1 — Foundation

1. Decide backend structure.
2. Add database.
3. Add migrations.
4. Add auth.
5. Add organization/location tenancy.
6. Add API client layer in frontend.

### Phase 2 — Core Booking Data

1. Services CRUD.
2. Staff CRUD.
3. Staff-service assignment.
4. Business hours.
5. Staff hours.
6. Appointment CRUD.

### Phase 3 — Scheduling Engine

1. Slot generation.
2. Conflict prevention.
3. Time zone handling.
4. Staff filtering.
5. Appointment status lifecycle.

### Phase 4 — Conversations

1. Conversation tables.
2. Message tables.
3. Conversation UI backed by API.
4. Human takeover.
5. Manual replies.

### Phase 5 — WhatsApp

1. Connect credentials securely.
2. Webhook verification.
3. Inbound messages.
4. Outbound messages.
5. Template message support.

### Phase 6 — AI Receptionist

1. Intent detection.
2. Tool-calling flow.
3. Service selection.
4. Slot selection.
5. Appointment creation.
6. Confirmation message.
7. Human handoff.

### Phase 7 — Reminders & Dashboard

1. Reminder settings.
2. Reminder queue.
3. Reminder delivery log.
4. Dashboard real metrics.

### Phase 8 — Cleanup & Launch Readiness

1. Hide deferred modules.
2. Add legal links.
3. Add error handling.
4. Add tests.
5. Update docs.
6. Prepare demo seed data.

---

## 13. Do Not Do These

Codex must avoid:

- Building more mock UI instead of real backend behavior.
- Adding Telegram before WhatsApp works.
- Adding Voice Bot before text booking works.
- Building advanced analytics before real booking data exists.
- Exposing WhatsApp tokens to frontend.
- Letting AI create fake appointments.
- Letting AI offer unavailable slots.
- Ignoring tenant isolation.
- Keeping demo-mode disabled behavior for MVP features.
- Adding unnecessary enterprise complexity before first paying customers.

---

## 14. Final Delivery Format

When done, Codex should provide:

1. Summary of implemented changes.
2. Files changed.
3. Database migrations added.
4. New environment variables.
5. API routes added.
6. How to run locally.
7. How to test.
8. Known limitations.
9. Recommended next tasks.

---

## 15. North Star

The product succeeds when a business owner can say:

> “I connected WhatsApp, added my services and staff, and now the AI books appointments for me while I sleep.”

Everything else is secondary.
