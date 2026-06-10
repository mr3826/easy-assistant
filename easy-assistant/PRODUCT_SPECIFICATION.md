# BookingAI — Product Specification & Context Extraction Report

> **Prepared for:** External product architect onboarding
> **Source of truth:** Codebase at `d:\hexabyte\easy-assistant` (repo package `@figma/my-make-file`, internal codename **easy-assistant**)
> **Extraction date:** 2026-06-11
> **Method:** Full read of all 71 `.tsx`/`.ts` source files, routing, auth, config, env, CI, and project docs (`README.md`, `AUDIT_REPORT.md`, `EXECUTION_PLAN.md`).

---

## ⚠️ Critical Framing — Read This First

This repository is a **frontend-only UI prototype generated from Figma Make** (`figmaAssetResolver`, package name `@figma/my-make-file`). Understanding the report requires holding three facts in mind throughout:

1. **There is no backend.** No server, database, ORM, queue, or live API exists in the repo. `VITE_API_BASE_URL` is defined in [src/config/env.ts](src/config/env.ts) (`http://localhost:3000/api`) but is **never imported or called** anywhere in the app.
2. **All data is static mock data** hard-coded as arrays inside each page component. Numbers like "1,284 bookings" or "$12,450 revenue" are literals, not computed values.
3. **Many actions are deliberately disabled in "demo mode."** Buttons for cancel, delete, connect-channel, change-plan, upload, password-change, and account-deletion are rendered `disabled` with tooltips like *"…disabled in demo mode."* Actions that "work" (create booking, send message) only mutate local React state and reset on refresh.

Consequently, sections on **Database, API, Backend, Security, and Multi-Tenancy describe what the UI *implies and the team has *planned*** (per `EXECUTION_PLAN.md`), explicitly distinguished from what is *built*. The product **design and scope are mature; the implementation is a clickable mockup.**

---

## 1. Executive Summary

| Field | Value |
|---|---|
| **Product name (brand)** | **BookingAI** (`LABELS.APP_TITLE = 'BookingAI'`) |
| **Internal codename** | easy-assistant / `@figma/my-make-file` |
| **Product purpose** | AI-powered appointment scheduling + omnichannel customer-communication platform for appointment-based service businesses |
| **Current stage** | **Interactive UI prototype / pre-MVP** (design-complete, backend-absent) |

**One-paragraph description.** BookingAI is a SaaS admin dashboard that lets an appointment-based business (salon, clinic, spa, gym, consultancy, etc.) manage its bookings, staff, services, and availability while an AI assistant fields customer conversations across WhatsApp, Facebook Messenger, Telegram, and a web chat widget — answering questions, proposing times, and booking/rescheduling appointments automatically, with a human-takeover path when needed. The dashboard adds marketing automation (reminders, follow-ups, campaigns), analytics, billing/subscription management, and support tooling. In its current form it is a fully navigable React single-page application that demonstrates the entire intended product surface using mock data, ahead of backend implementation.

**Primary problem solved.** Service businesses lose revenue to (a) missed/slow responses on messaging channels, (b) manual back-and-forth scheduling, and (c) no-shows. BookingAI centralizes every booking channel into one AI-handled inbox that converts conversations into confirmed appointments and automatically reminds customers.

**Key differentiators (as positioned by the UI).**
- **AI-first booking** across multiple messaging channels, not just a web calendar.
- **Omnichannel inbox** (WhatsApp / Messenger / Telegram / Web widget / planned Mobile SDK) unified in one conversation view.
- **Human-in-the-loop** "Take Over" on any AI conversation.
- **Configurable AI persona** (tone, language, greeting, creativity, fallback behavior) + **knowledge-base training** (upload FAQs/policies).
- **Vertical-agnostic** templates spanning beauty, healthcare, wellness, fitness, hospitality, and consulting.

**Maturity.** Design/UX: **Production-grade prototype.** Engineering: **Foundation only** — clean TypeScript build, lazy-loaded routes, 44 shadcn/Radix UI components, CI pipeline, starter tests; **0% of data/business logic is backed by a server.**

---

## 2. Target Customers

The intended verticals are explicit in the signup/business-category selectors and the seeded service/staff data.

**Business-category options** — [SignupPage.tsx](src/app/components/pages/SignupPage.tsx) (8 options) and [SettingsPage.tsx](src/app/components/pages/SettingsPage.tsx) (5 options):
Doctor / Medical · Hotel / Hospitality · Salon / Beauty · Spa / Wellness · Fitness / Gym · Restaurant · Consulting · Other.

**Service categories seeded** — [ServicesSetup.tsx](src/app/components/pages/ServicesSetup.tsx): Hair Services · Spa & Wellness · Massage · Healthcare · Fitness.

| Segment | Business type | Representative use cases | Expected size | Pain points solved |
|---|---|---|---|---|
| **Salon / Beauty** | Hair, nails, beauty studios | Book "Haircut & Style", "Hair Coloring"; assign stylists; reduce no-shows | Solo → small chain (1–20 staff) | Phone tag, DM overload, no-shows |
| **Spa & Wellness** | Day spas, wellness centers | "Full Body Spa", "Aromatherapy"; long-duration slot management | Small → mid | Multi-room/therapist scheduling |
| **Massage** | Massage therapy clinics | "Deep Tissue", "Swedish", "Sports Massage" | Solo → small | Repeat booking, therapist availability |
| **Healthcare / Medical** | Clinics, consultants, doctors | "Medical Consultation", "Follow-up Visit" | Solo practice → clinic | Triage FAQs, consultation scheduling, follow-ups |
| **Fitness / Gym** | Trainers, studios | "Personal Training" sessions | Solo trainer → studio | Session booking, class slots |
| **Hospitality** | Hotels, hospitality | Appointment/amenity bookings | Mid → large | Inbound guest requests |
| **Consulting** | Consultants, agencies | Consultation scheduling | Solo → boutique | Lead-to-meeting conversion |
| **Restaurant** | Restaurants (signup option) | Reservation-style bookings | Small → mid | Inbound reservation handling |

**Ideal customer profile (inferred):** an owner-operated or small-team, appointment-driven local service business that receives bookings through chat apps and wants to automate response + scheduling without hiring a receptionist. Pricing ($29–$199/mo, USD, card-based) and US time-zone defaults point to a **Western / English-first SMB** initial market.

> Note: the request template referenced bKash/SSLCommerz and segments like "Agency." This codebase is **USD / card-centric** (Stripe-style "Visa ending 4242"); no Bangladeshi payment rails appear. Treat those template items as not applicable to BookingAI as built.

---

## 3. User Roles & Permissions

**There is no role-based access control implemented.** Authentication is a single boolean (`isAuthenticated`) with no user object, no role claims, and no per-route role checks. The UI presents exactly one human persona: the **Business Owner / Admin** (hard-coded "John Doe", menu "My Account"). "Roles" elsewhere are **job titles for staff records**, not access permissions, and the AI/human-agent are conversational actors, not authenticated principals.

### Roles as they exist in the system

| Role | How it appears in code | Real access control? |
|---|---|---|
| **Business Owner / Admin** | The only authenticated human; sees all 16 routes; topbar "John Doe" / "My Account" | ✅ Implicit — gated by `AuthGuard` (authenticated = full access) |
| **Staff member** | Data records in [StaffManagement.tsx](src/app/components/pages/StaffManagement.tsx) with `role` = Stylist / Therapist / Consultant / Receptionist | ❌ No login, no permissions — they are scheduled resources, not users |
| **AI Assistant** | Conversational actor (`sender: 'ai'`) in [ConversationsPage.tsx](src/app/components/pages/ConversationsPage.tsx) | ❌ Not an authenticated principal |
| **Human Agent (takeover)** | Triggered by "Take Over" (`isHumanHandled`) — same logged-in admin | ❌ Same session as Owner |
| **Customer / End-user** | Subject of bookings & conversations; never logs into this admin app | ❌ External; booking happens on chat channels |

### Permissions matrix (as built vs. implied)

Legend: ✅ accessible · ⛔ disabled in demo · 🚫 N/A. *All "write" capabilities are local-state only.*

| Module / Action | Owner/Admin (built) | Staff | AI | Customer |
|---|---|---|---|---|
| View Dashboard / Analytics | ✅ | 🚫 | 🚫 | 🚫 |
| Create booking | ✅ (local) | 🚫 | (implied) | (implied via chat) |
| Edit booking | ✅ (demo toast) | 🚫 | (implied) | 🚫 |
| Cancel / reschedule booking | ⛔ demo | 🚫 | (implied) | (implied via chat) |
| Manage staff | ✅ add (local) / ⛔ delete | 🚫 | 🚫 | 🚫 |
| Manage services | ✅ add (local) / ⛔ delete | 🚫 | 🚫 | 🚫 |
| Set availability | ✅ (local) | 🚫 | 🚫 | 🚫 |
| Connect channels | ⛔ demo | 🚫 | 🚫 | 🚫 |
| Configure AI | ✅ (local) | 🚫 | 🚫 | 🚫 |
| Send/reply in conversation | ✅ (local) | 🚫 | ✅ (auto) | ✅ (inbound) |
| Take over conversation | ✅ | 🚫 | 🚫 | 🚫 |
| Billing: view | ✅ | 🚫 | 🚫 | 🚫 |
| Billing: change/cancel plan | ⛔ demo | 🚫 | 🚫 | 🚫 |
| Settings: profile/business/notifications | ✅ (local) | 🚫 | 🚫 | 🚫 |
| Settings: change password / delete account | ⛔ demo | 🚫 | 🚫 | 🚫 |
| Support tickets / chat | ✅ (local) | 🚫 | 🚫 | 🚫 |

**Architectural gap for the architect:** a real role model is needed (at minimum: Owner, Manager/Admin, Staff, plus the implicit AI service identity). None exists today.

---

## 4. Complete Feature Inventory

Status legend: **Built (UI)** = interactive UI present, local/mock data · **Demo-locked** = UI present but action disabled · **Planned** = referenced/implied, no UI logic.

| # | Feature | Description | Status | Dependencies | Module |
|---|---|---|---|---|---|
| 1 | Authentication (login) | Email/password form, Zod validation, optional 2FA field | **Built (stub)** — accepts anything | AuthContext | [LoginPage](src/app/components/pages/LoginPage.tsx) |
| 2 | Signup | 2-step: business info → password | **Built (UI)** | — | [SignupPage](src/app/components/pages/SignupPage.tsx) |
| 3 | Onboarding wizard | 7-step setup → dashboard | **Built (UI)** | AuthContext | [OnboardingWizard](src/app/components/pages/OnboardingWizard.tsx) |
| 4 | Dashboard / KPIs | Stat cards, bookings line chart, channel pie, recent bookings | **Built (mock)** | Recharts | [DashboardHome](src/app/components/pages/DashboardHome.tsx) |
| 5 | Appointments | Searchable/filterable table; New Booking dialog; List/Day views | **Built (mock)**; Week/Month = **Planned** ("coming soon"); Cancel = **Demo-locked** | — | [AppointmentsPage](src/app/components/pages/AppointmentsPage.tsx) |
| 6 | Conversations (AI inbox) | Conversation list, chat thread, AI vs Human badge, Take Over, composer | **Built (mock)** | — | [ConversationsPage](src/app/components/pages/ConversationsPage.tsx) |
| 7 | Staff management | Staff cards, stats, Add Staff dialog | **Built (mock)**; Delete = **Demo-locked** | — | [StaffManagement](src/app/components/pages/StaffManagement.tsx) |
| 8 | Services setup | Service table, stats, Add Service dialog | **Built (mock)**; Delete = **Demo-locked** | — | [ServicesSetup](src/app/components/pages/ServicesSetup.tsx) |
| 9 | Availability | Per-weekday hours + enable toggles | **Built (mock)** | — | [AvailabilityPage](src/app/components/pages/AvailabilityPage.tsx) |
| 10 | Channels | 5 channel cards, status, API-key display/copy, setup steps | **Built (mock)**; Connect = **Demo-locked** | — | [ChannelConnection](src/app/components/pages/ChannelConnection.tsx) |
| 11 | Marketing automation | Reminders, follow-ups, promo campaigns | **Built (mock)** | — | [MarketingPage](src/app/components/pages/MarketingPage.tsx) |
| 12 | AI settings | Tone/language/greeting, capability toggles, voice bot, KB training, advanced | **Built (mock)**; Voice + Upload = **Demo-locked** | — | [AISettings](src/app/components/pages/AISettings.tsx) |
| 13 | Billing | Current plan, usage, 3 plans, payment method, invoices | **Built (mock)**; Change/Upgrade/Cancel = **Demo-locked** | — | [BillingPage](src/app/components/pages/BillingPage.tsx) |
| 14 | Analytics | KPIs, trend/activity/channel/AI charts, summary stats | **Built (mock)** | Recharts | [AnalyticsPage](src/app/components/pages/AnalyticsPage.tsx) |
| 15 | Support | Tickets table, New Ticket dialog, live chat, FAQ accordion | **Built (mock)** | — | [SupportPanel](src/app/components/pages/SupportPanel.tsx) |
| 16 | Settings | Profile / Business / Notifications / Security tabs | **Built (mock)**; password/2FA/delete = **Demo-locked** | — | [SettingsPage](src/app/components/pages/SettingsPage.tsx) |
| 17 | Global search | Topbar search input | **Planned** (input only, no handler) | — | [DashboardLayout](src/app/components/layout/DashboardLayout.tsx) |
| 18 | Notifications bell | Badge "3" | **Planned** (static) | — | DashboardLayout |
| 19 | CSV/PDF export | Buttons on Appointments | **Demo-locked** (toast only) | — | AppointmentsPage |
| 20 | Voice Call Bot | AI phone bookings | **Planned** (Pro/Enterprise gate) | — | AISettings |
| 21 | Mobile SDK (Flutter) | Embed booking AI in mobile apps | **Planned** (disconnected channel) | — | ChannelConnection |
| 22 | Route protection | AuthGuard redirect | **Built** | AuthContext | [AuthGuard](src/app/components/guards/AuthGuard.tsx) |
| 23 | Error boundary / SEO | Crash fallback, Helmet meta | **Built** | — | error/, seo/ |

---

## 5. Booking & Appointment Workflow

### Booking creation
- **In-dashboard (manual):** "New Booking" dialog in [AppointmentsPage.tsx](src/app/components/pages/AppointmentsPage.tsx). Fields: **Customer Name, Email, Service (select), Staff Member (select), Date, Time, Notes.** On submit → local toast "Demo booking created locally." (no persistence).
- **AI-driven (primary intended channel):** demonstrated in [ConversationsPage.tsx](src/app/components/pages/ConversationsPage.tsx) — the AI collects service → preferred time → offers available slots → confirms booking → asks for name/phone. This is **scripted mock dialogue**, not a live engine.
- **Onboarding seed:** Step 2 of the wizard lets the owner pre-load services during setup.

**Validation rules (as built):** Only the login form uses real (Zod) validation. The booking dialog, signup step 2, staff, and service forms have **no validation** (some `required` HTML attributes on signup only).

### Booking states
Observed `status` values across mock data:

| State | Where seen | Visual |
|---|---|---|
| **Pending** | Dashboard, Appointments | Yellow badge |
| **Confirmed** | Dashboard, Appointments | Green badge |
| **Cancelled** | Dashboard, Appointments | Red/destructive badge |
| **Completed** | Analytics only (`completed` series) | — |
| **No-show** | Analytics only (No-Show Rate metric) | — |
| **Rescheduled** | Analytics only (Reschedule Rate metric) | — |

> **Built state machine:** only Pending / Confirmed / Cancelled are represented as record statuses. *Completed, No-show, Rescheduled* exist only as **aggregate analytics metrics**, implying a fuller lifecycle is intended but not modeled on the booking record. The filter dropdown offers All / Confirmed / Pending / Cancelled.

### Booking flow diagram (intended end-to-end)

```
Customer (WhatsApp/Messenger/Telegram/Web)
        │  inbound message
        ▼
  Channel webhook ──► BookingAI (PLANNED backend)
        │
        ▼
  AI Assistant  ── greets, identifies intent
        │            ├─ FAQ? → answer (knowledge base)
        │            └─ Booking intent
        ▼
  Ask service ► ask preferred time ► check availability/staff
        │                                   │ (Availability + Staff + Services)
        ▼                                   ▼
  Offer open slots ◄───────────── slot generation
        │  customer picks slot
        ▼
  Collect name + phone ► create Appointment (status: Pending)
        │
        ├─ Auto-Confirm ON  ► status: Confirmed  (AI setting)
        └─ Auto-Confirm OFF ► Owner approves     (Dashboard "Pending Approvals")
        │
        ▼
  Reminder scheduled (Marketing: e.g. 24h before)
        │
        ▼
  Appointment occurs ► Completed
        │
        ├─ Customer no-show ► No-show
        ├─ Customer reschedules ► Smart Rescheduling (AI offers alt times)
        └─ Follow-up message (Marketing: e.g. 2h after) ► feedback / repeat booking
```

Escalation: at any point the owner clicks **Take Over** → conversation flips to *Human Handled*; or AI **Fallback Behavior** (AI Settings) auto-transfers to a human / retries / apologizes-and-collects-info.

---

## 6. AI Assistant Capabilities

The AI surface is defined by [AISettings.tsx](src/app/components/pages/AISettings.tsx) and demonstrated in [ConversationsPage.tsx](src/app/components/pages/ConversationsPage.tsx). **No LLM/model is wired** — these are configuration switches and scripted demo messages.

| Capability | Description | Trigger | Data used | Limitations (as built) |
|---|---|---|---|---|
| **Answer FAQs** | Respond to common questions | Inbound customer message | Knowledge Base uploads (FAQ/policy docs) | KB upload disabled in demo; no live retrieval |
| **Book appointments** | Conversational slot booking | Booking intent detected | Services, Staff, Availability | Scripted only; no real engine |
| **Reschedule (Smart Rescheduling)** | Suggest alternative times when slot unavailable | Toggle ON; unavailable slot | Availability | Toggle only |
| **Auto-Confirm Bookings** | Confirm without manual approval | Toggle ON | Booking record | Toggle only |
| **Collect customer info** | Gather name/phone to confirm | End of booking flow | Customer fields | Scripted |
| **Conversation Memory** | Remember preferences & history | Toggle ON | Past conversations | Toggle only; no store |
| **Send Reminders** | Automated pre-appointment reminders | Toggle ON | Appointment + template | Overlaps Marketing module |
| **Follow-up Messages** | Post-appointment feedback/repeat nudge | Toggle (OFF default) | Appointment | Toggle only |
| **Route / escalate to human** | Fallback transfer to agent | Fallback = "Transfer to human agent" | — | Config only |
| **Voice Call Bot** | AI phone bookings (natural voice) | Pro/Enterprise plan | — | **Disabled** (paywalled, not built) |
| **Multi-language** | Detect & respond in many languages | Language = "Multi (Auto-detect)" | — | Config only; en/es/fr/de/it/pt + auto |

**Persona controls:** Tone (Friendly · Professional · Warm · Concise · Enthusiastic); Custom greeting message; **Response Creativity** (Precise / Balanced / Creative — i.e., temperature); **Fallback Behavior** (Retry with clarification / Transfer to human / Apologize & collect info).

**Reported AI metrics (mock):** 1,847 conversations/month, 94.2% booking success, 1.2s avg response; Understanding 96.5%, Response Accuracy 97.8%, CSAT 92.1%.

---

## 7. Conversation & Messaging Architecture

### Supported channels
From [ChannelConnection.tsx](src/app/components/pages/ChannelConnection.tsx) and conversation/analytics data:

| Channel | Identifier | Seeded status | Notes |
|---|---|---|---|
| **WhatsApp Business Cloud API** | `whatsapp` | Connected | Highest mock volume (~400–450 bookings) |
| **Facebook Messenger** | `messenger` | Connected | Page-based |
| **Web Chat Widget** | `webchat` | Connected | Embed before `</body>` |
| **Telegram Bot** | `telegram` | Disconnected | Via @BotFather token |
| **Mobile SDK (Flutter)** | `mobile` | Disconnected | **Planned** SDK |

Each channel record carries: `name, icon, color, status, description, apiKey, setupSteps[]`.

### Conversation flow (as modeled in UI)
1. **Inbound** message arrives on a channel (mock: list items tagged WhatsApp/Facebook/Web/Telegram with `unread` counts).
2. **AI responds** automatically (`sender: 'ai'`, labeled "AI Assistant"); conversation badge = **AI Handled**.
3. **Human takeover:** owner clicks **Take Over** → `isHumanHandled = true` → badge flips to **Human Handled**; the disabled state prevents double-takeover.
4. **Composer:** owner can type/send (local append only; `sender: 'user'`).
5. **Escalation logic (config):** AI Settings → Fallback Behavior routes to human / retries / collects info. Conversation entities also imply per-message sender typing (`customer` | `ai` | `user`/human).

**Message model (mock):** `{ id, sender: 'customer'|'ai'|'user', text, time }`. **Conversation model (mock):** `{ id, customer, lastMessage, time, unread, channel }`.

---

## 8. Service Management

Schema from the seeded `services` array in [ServicesSetup.tsx](src/app/components/pages/ServicesSetup.tsx):

```ts
Service {
  id: number
  name: string            // e.g. "Haircut & Style"
  category: string        // Hair Services | Spa & Wellness | Massage | Healthcare | Fitness
  duration: number        // minutes (15, 30, 60, 90, 120 …)
  price: number           // USD
  staff: string[]         // assigned staff names
  active: boolean         // Active | Inactive
  // Add-Service dialog also collects: description (not in seed model)
}
```

- **Categories** (from the Add-Service select): Hair Services, Spa & Wellness, Massage, Healthcare, Fitness.
- **Duration rules:** free integer minutes; dashboard computes **avg duration**; no buffer/padding logic.
- **Pricing model:** flat per-service price in USD (no tiers, taxes, or deposits).
- **Dependencies:** services are **assigned to staff** (many-to-one in seed; Add dialog implies many-to-many intent) and consumed by the **Appointment** record + **Availability** for slotting.
- **Stats shown:** total services, active count, avg duration, avg price.
- **Delete is demo-locked; edit shows a toast.**

Example seed rows: *Haircut & Style (Hair, 60m, $45, Emily Chen)*, *Medical Consultation (Healthcare, 30m, $75, Dr. Smith)*, *Full Body Spa (Spa, 90m, $120, Lisa Brown)*, *Swedish Massage (Massage, 60m, $75, inactive)*.

---

## 9. Staff Management

Schema from [StaffManagement.tsx](src/app/components/pages/StaffManagement.tsx):

```ts
Staff {
  id: number
  name: string
  role: string            // Senior Stylist | Medical Consultant | Spa Therapist | Massage Therapist …
  email: string
  phone: string
  avatar: string          // URL (empty → initials fallback)
  hours: string           // free text, e.g. "Mon-Fri, 9:00 AM - 6:00 PM"
  services: string[]      // services the member performs
  availability: 'Available' | 'Busy'
  bookings: number        // lifetime booking count
}
```

- **Add-Staff dialog fields:** Full Name, Email, Phone, **Role** (Stylist / Therapist / Consultant / Receptionist), Services (comma-separated).
- **Availability logic:** a coarse `Available`/`Busy` status flag — **not** a real calendar; per-staff "View Schedule" / "Edit Hours" are demo toasts.
- **Capacity handling:** none beyond the `bookings` counter; no concurrency/utilization caps.
- **Booking assignment:** the New-Booking dialog has a **Staff Member** select; staff are matched to services via the `services` array. **No automatic staff selection algorithm exists** — assignment is manual in the UI; an AI auto-assignment is implied but unbuilt.
- **Stats:** total staff, available now, total bookings, avg bookings/staff.

---

## 10. Availability & Scheduling Engine

Current implementation is intentionally minimal — [AvailabilityPage.tsx](src/app/components/pages/AvailabilityPage.tsx) + onboarding step 4.

| Concern | As built | Notes / gap |
|---|---|---|
| **Working hours** | Per-weekday (Mon–Sun) enable checkbox + open/close time inputs; default 09:00–17:00, **Sunday off** | Business-level only; **not per-staff** in the engine (staff hours are free-text strings) |
| **Time-slot generation** | ❌ none | No slot computation; AI "available times" are hard-coded in the demo chat |
| **Time-zone handling** | Selected in Settings → Business (ET / CT / MT / PT) | US zones only; not applied to any logic |
| **Conflict prevention** | ❌ none | No double-booking checks |
| **Holiday handling** | ❌ none | No holiday/exception calendar |
| **Buffer times** | ❌ none | No gap between appointments |
| **Actions** | "Apply to All Days", "Save Changes" → local toast | No persistence |

**This is the single biggest engineering gap** for a booking product: a real availability/slotting engine (hours × staff × service duration × existing appointments × buffers × time zone) must be built from scratch.

---

## 11. Marketing Automation

From [MarketingPage.tsx](src/app/components/pages/MarketingPage.tsx) (plus overlapping toggles in AI Settings):

| Sub-feature | Configuration | Status |
|---|---|---|
| **Appointment Reminders** | Enable switch (on); **Timing**: 1h / 3h / 24h (default) / 48h before; **Message template** with variables `{customer} {service} {time} {date} {staff}` | Built (mock) |
| **Follow-up Messages** | Enable switch (off); **Send After**: 1h / 2h (default) / 24h / 48h after | Built (mock) |
| **Promotional Campaigns** | Campaign Name, Message, **Target Audience** (All / Returning / Inactive customers), "Send Campaign" | Built (mock → toast) |

- **Trigger events (implied):** appointment created → schedule reminder at offset; appointment completed → schedule follow-up at offset; manual → broadcast campaign to an audience segment.
- **Templates:** single editable reminder template with variable interpolation; default = *"Hi {customer}, this is a reminder about your {service} appointment tomorrow at {time}."*
- **Stated goal:** reduce no-shows and drive repeat bookings.
- **Delivery channel:** unspecified in code (presumably the same messaging channel as the conversation); no scheduler/queue exists.

---

## 12. Analytics & Reporting

From [AnalyticsPage.tsx](src/app/components/pages/AnalyticsPage.tsx) and [DashboardHome.tsx](src/app/components/pages/DashboardHome.tsx). All values are mock literals. Date-range selector: 7 / 30 / 90 days, This Year (changes label only).

### Booking metrics
- Total Bookings (1,847; +18.2%) · Daily Bookings Trend (bookings vs **completed** vs **cancelled**) · **No-Show Rate** (3.8%) · **Reschedule Rate** (12.4%) · Completion Rate (94.2%) · Busiest Day (Friday) · Peak Hour (2 PM) · Avg Advance Booking (4.2 days) · Dashboard: Total Bookings (1,284), Today's Schedule (24), Pending Approvals (8), Revenue ($12,450).

### AI metrics
- AI Conversations/month (1,847) · Booking Success/Conversion (94.2% / dashboard 68.4%) · Avg Response Time (1.2s–2.4 min) · Understanding Rate (96.5%) · Response Accuracy (97.8%) · Customer Satisfaction (92.1%) · Total Conversations (2,341) · Avg Conversation Duration (2m34s). **Human-takeover rate is *not* tracked** (gap, given the takeover feature exists).

### Channel metrics
- Channel Distribution / Conversion pie (WhatsApp, Facebook, Web Widget, Telegram with booking counts) on both Dashboard and Analytics.

### Customer metrics
- Unique Customers (892; +24.5% new) · New vs Returning (42% / 58%) · Repeat Rate (68%) · **Avg Lifetime Value ($342)** · Customer Activity by hour (bar chart).

---

## 13. Billing & Subscription Model

From [BillingPage.tsx](src/app/components/pages/BillingPage.tsx) and onboarding step 6. **No payment provider is integrated** — card data is static; all mutations demo-locked.

### Plans

| Plan | Price (USD/mo) | Bookings | Channels | AI | Support | Analytics | Extras |
|---|---|---|---|---|---|---|---|
| **Starter** | $29 | 100 / mo | 1 channel | Basic | Email | Basic | — |
| **Professional** *(current/popular)* | $79 | Unlimited | All channels | Advanced | Priority | Advanced | Custom branding |
| **Enterprise** | $199 | Everything in Pro | All | + Custom AI training | Dedicated account manager | — | White-label, **API access**, SLA |

- **Billing cycle:** Monthly only (no annual). Next billing date shown (Dec 1, 2025), status Active.
- **Usage shown:** Bookings this month (854 / unlimited), AI Messages (12,847 / unlimited) — Professional renders both as "Unlimited."
- **Feature gating:** Voice Call Bot is explicitly gated to **Professional/Enterprise** in AI Settings.

### Limits (by plan, as advertised)
- **Booking limit:** Starter 100/mo; Pro/Enterprise unlimited.
- **Channel limit:** Starter 1; Pro/Enterprise all (5).
- **Conversation/AI-message limit:** unlimited on Pro (Starter unstated).
- **Staff limit:** ❌ none defined. **Storage limit:** ❌ none defined (KB upload max 10MB/file mentioned in AI Settings).

### Payment providers
- **As built:** none wired. UI shows a **Stripe-style card** ("Visa ending 4242, exp 12/2026"). Enterprise lists **API access**.
- **Planned (recommended):** Stripe (card + subscriptions + invoices). No bKash/SSLCommerz present.
- **Invoices:** mock list `{ id: INV-00x, date, amount, status: paid, plan }` with per-row + "Download All" (demo).

---

## 14. Notifications

| Notification | Trigger | Channel(s) | Recipient | Status |
|---|---|---|---|---|
| New booking | Customer books | Email (toggle), in-app bell | Owner | Settings toggle (mock) |
| Cancellation | Booking cancelled | Email (toggle) | Owner | Settings toggle (mock) |
| Weekly summary | Weekly cron | Email (toggle) | Owner | Settings toggle (mock) |
| Push notifications | Various | Device push | Owner | Toggle (off) — **Planned** |
| **Appointment reminder** | N hours before appt | Messaging channel (implied) | **Customer** | Marketing (mock) |
| **Follow-up** | N hours after appt | Messaging channel (implied) | **Customer** | Marketing (mock) |
| **Promo campaign** | Manual send | Messaging channel (implied) | **Customer** segment | Marketing (mock) |
| In-app alerts | — | Topbar bell (badge "3") | Owner | Static placeholder |
| Toasts | Local UI actions | In-app (`sonner`/inline) | Owner | Built |

**Channels referenced:** Email, Push, in-app, and customer-facing messaging (WhatsApp/etc.). **No SMS** provider appears. None are actually dispatched (no backend).

---

## 15. Integrations

| Integration | Purpose | Status (as built) | Required credentials (per UI setup steps) | Data exchanged (intended) |
|---|---|---|---|---|
| **WhatsApp Business Cloud API** | Receive/reply to bookings | UI "Connected" (mock key `wa_live_…`); **not wired** | FB Business acct, WA Business number, API key | Inbound msgs, outbound replies, templates |
| **Facebook Messenger** | Page-based bookings | UI "Connected" (mock `fb_page_…`) | FB Page, Messenger enabled, app authorization | Messages, automated responses |
| **Telegram Bot** | Bot bookings | UI "Disconnected" | @BotFather token | Messages |
| **Web Chat Widget** | On-site chatbot | UI "Connected" (mock `widget_…`) | Embed snippet before `</body>` | Messages |
| **Mobile SDK (Flutter)** | In-app booking | **Planned** (disconnected) | API key, package install | Booking flow |
| **Stripe (or equiv.)** | Subscriptions/payments | **Planned** (card UI only) | Publishable/secret keys | Subscriptions, invoices, card |
| **LLM provider (AI engine)** | Power the assistant | **Planned/absent** | — | Prompts, completions, embeddings |
| **Google Calendar** | (Template-suggested) | **Not present** in code | — | — |
| **Voice telephony** (e.g., for Voice Bot) | AI phone bookings | **Planned** (paywalled) | — | Calls/audio |

> Security note: mock API keys are rendered in plaintext `<Input readOnly>` with a copy button — acceptable for mock data, but the real implementation must **never expose secret keys client-side**.

---

## 16. Database Architecture

**No database exists.** The following entity model is **reverse-engineered from the mock data shapes and forms** and aligns with the entities the team enumerated in `EXECUTION_PLAN.md` (Phase 3). Use it as the proposed schema.

### Entity list
User · Business (tenant) · Staff · Service · Appointment · Customer · Conversation · Message · Channel · Availability(/BusinessHours) · Reminder/Automation · AISettings · Plan/Subscription · Invoice · SupportTicket · AnalyticsMetric · KnowledgeBaseDocument.

### Key fields & relationships (proposed, grounded in UI)

```
Business (TENANT root)
  id, name, category(enum), address, city, zip, description, timezone, planId
  └─1:N Users, Staff, Services, Appointments, Customers, Conversations,
        Channels, AISettings(1:1), Subscription(1:1), Invoices, SupportTickets, KBDocuments

User            id, businessId, firstName, lastName, email, phone, bio, role*, passwordHash, twoFactorEnabled
Staff           id, businessId, name, role(title), email, phone, avatar, workingHours, availability, bookingCount
                └─ M:N Services
Service         id, businessId, name, category, durationMin, price, description, active
                └─ M:N Staff
Customer        id, businessId, name, email, phone, isReturning, lifetimeValue
Appointment     id, businessId, customerId, serviceId, staffId, date, time, durationMin,
                status(pending|confirmed|completed|cancelled|no_show|rescheduled), notes, channelId
Conversation    id, businessId, customerId, channelId, lastMessage, unreadCount, handledBy(ai|human), updatedAt
                └─1:N Messages
Message         id, conversationId, sender(customer|ai|user), text, sentAt
Channel         id, businessId, type(whatsapp|messenger|telegram|webchat|mobile), status, credentials(secure), config
BusinessHours   id, businessId, dayOfWeek, enabled, openTime, closeTime   (+ future: per-staff, holidays, buffers)
AISettings      businessId, tone, language, greeting, autoConfirm, smartReschedule, memory,
                sendReminders, followUps, voiceBot, creativity, fallbackBehavior
KBDocument      id, businessId, filename, size, uploadedAt
Automation      id, businessId, type(reminder|followup|campaign), enabled, offset, template, audience
Subscription    businessId, planId(starter|professional|enterprise), cycle, status, nextBillingDate
Plan            id, name, price, limits{bookings, channels, ...}, features[]
Invoice         id, businessId, date, amount, status, planName
SupportTicket   id, businessId, subject, category, priority, status, description, createdAt
```
*`role` = the access role to be introduced (see §3).

**Relationships summary:** Business is the tenant aggregate root; everything hangs off `businessId`. Appointment is the hub (Customer × Service × Staff × Channel). Conversation 1:N Message. Staff M:N Service.

---

## 17. API Architecture

**No API is implemented.** `EXECUTION_PLAN.md` (Phase 3) proposes a REST contract and a frontend `src/app/api/` client layer. Proposed endpoints (grounded in the screens' needs):

### Public / auth APIs
| Method | Route | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Create business + owner | none |
| POST | `/api/auth/login` | Authenticate, issue session/JWT | none |
| POST | `/api/auth/logout` | Invalidate session | session |
| POST | `/api/auth/2fa/verify` | Verify 6-digit code | partial |
| GET | `/api/auth/session` | Resolve current session/user | session |
| POST | `/api/webhooks/{channel}` | Inbound message ingestion (WhatsApp/Messenger/Telegram/Web) | signature |

### Internal (tenant-scoped, authenticated) APIs
| Resource | Endpoints |
|---|---|
| Appointments | `GET/POST /api/appointments`, `GET/PATCH/DELETE /api/appointments/:id`, filters: status/date/q |
| Staff | `GET/POST /api/staff`, `GET/PATCH/DELETE /api/staff/:id`, `GET /api/staff/:id/schedule` |
| Services | `GET/POST /api/services`, `PATCH/DELETE /api/services/:id` |
| Availability | `GET/PUT /api/availability` |
| Channels | `GET /api/channels`, `POST /api/channels/:id/connect`, `DELETE /api/channels/:id` |
| Conversations | `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST .../messages`, `POST .../takeover` |
| AI settings | `GET/PUT /api/ai-settings`, `POST /api/ai/kb-documents`, `DELETE …/:id` |
| Marketing | `GET/PUT /api/automations`, `POST /api/campaigns` |
| Billing | `GET /api/billing/subscription`, `POST /api/billing/change-plan`, `GET /api/invoices`, `GET /api/invoices/:id/pdf` |
| Analytics | `GET /api/analytics?range=7d|30d|90d|year` |
| Settings | `GET/PUT /api/settings/profile|business|notifications`, `POST /api/settings/password` |
| Support | `GET/POST /api/support/tickets`, `POST /api/support/chat` |

**Conventions to define (per plan):** error envelope, pagination, filtering, optimistic updates, auth header/cookie. Frontend `env.API_BASE_URL` already reserved.

---

## 18. Frontend Architecture

| Aspect | Implementation |
|---|---|
| **Framework** | React 18.3 + React DOM 18.3, **Vite 6.3**, **TypeScript 5.6** (strict, `noUnusedLocals/Parameters`) |
| **Styling** | **Tailwind CSS 4.1** via `@tailwindcss/vite`, CSS-variable token system (`@theme inline`) |
| **UI library** | **Radix UI primitives + shadcn-style** wrappers — 44 components in [src/app/components/ui/](src/app/components/ui/) (button, card, dialog, table, tabs, select, accordion, chart, etc.) |
| **Icons** | Lucide React |
| **Charts** | Recharts 2.15 |
| **Forms / validation** | React Hook Form 7.55 + **Zod 3.23** (`@hookform/resolvers`) — only LoginPage uses Zod today |
| **Routing** | **React Router DOM 7** (`BrowserRouter`), 16 routes, **all lazy-loaded** via `React.lazy` + `Suspense` ([App.tsx](src/app/App.tsx)) |
| **State management** | Local `useState` + React Context (Auth) + `localStorage`. **No Redux/Zustand/React Query / server-state lib.** |
| **Custom hooks** | `useDebounce`, `useLocalStorage`, `useMediaQuery`, `useOnClickOutside` ([hooks/index.ts](src/app/hooks/index.ts)) |
| **Animation / misc** | Motion 12, Sonner (toasts), Embla (carousel), cmdk (command), Vaul (drawer), next-themes |
| **Resilience / SEO** | `ErrorBoundary`, `Helmet` meta, `ImageWithFallback`, `LoadingFallback` (a11y `role=status`) |
| **Path alias** | `@/*` → `src/app/*` (tsconfig + vite) |

### Layout structure
`DashboardLayout` = fixed left **sidebar** (12 nav items + Support link, mobile drawer) + sticky **topbar** (search, notifications bell, user dropdown w/ Profile/Settings/Billing/Logout).

### Page hierarchy
```
/(redirect → /login)
├── Public:  /login · /signup · /onboarding(7-step wizard)
└── Protected (AuthGuard → DashboardLayout):
    /dashboard · /appointments · /conversations · /staff · /services ·
    /availability · /channels · /marketing · /ai-settings · /billing ·
    /analytics · /support · /settings
```

---

## 19. Backend Architecture

**Not implemented — greenfield.** No server, DB, ORM, queue, jobs, or cache exist. Only artifact: `VITE_API_BASE_URL=http://localhost:3000/api` placeholder (unused) suggesting an intended Node API on port 3000.

`EXECUTION_PLAN.md` leaves provider/stack **undecided** (Phase 3: "Decide backend provider and auth/session mechanism"). Recommended targets given the frontend:

| Concern | Recommendation (greenfield) |
|---|---|
| Framework | Node.js (Express/NestJS/Fastify) or serverless; must serve the proposed REST API |
| Database | PostgreSQL (relational; multi-tenant via `businessId`) |
| ORM | Prisma / Drizzle |
| Auth | JWT or session cookies; real password hashing; TOTP for the existing 2FA UI |
| Queue / jobs | For reminders, follow-ups, campaigns, webhook processing (e.g., BullMQ/Cloud Tasks) |
| Realtime | WebSocket/SSE for live conversations & takeover |
| AI | LLM provider + retrieval over KB documents; per-business prompt config from AISettings |
| Caching | Standard (Redis) for sessions/rate-limiting; none required by current UI |

---

## 20. Security Model

| Area | Current state | Risk / required work |
|---|---|---|
| **Authentication** | **Stub** — `login()` always returns `true`, sets `isAuthenticated`; persisted as boolean in `localStorage['easy_assistant_auth']` ([AuthContext.tsx](src/app/context/AuthContext.tsx)). Any/empty credentials pass. | Replace with real credential verification + tokens/sessions |
| **2FA** | UI only — 6-digit Zod-validated field on login; not enforced | Wire to TOTP/OTP backend |
| **Authorization** | **None** — single boolean gates all 16 routes via `AuthGuard`; no roles/scopes | Introduce RBAC + per-tenant scoping |
| **Tenant isolation** | **None** (no backend) | Enforce `businessId` row-scoping server-side |
| **Secrets handling** | Channel API keys shown in plaintext client-side (mock) | Never ship real secrets to the client; store server-side |
| **Transport/headers** | No CSP (noted as acceptable for local dev) | Add CSP + security headers in prod |
| **XSS surface** | ✅ No `dangerouslySetInnerHTML` anywhere | Maintain |
| **Session** | `localStorage` boolean; no expiry | Use httpOnly cookies / token expiry/refresh |

---

## 21. SaaS Multi-Tenancy Design

- **Tenant unit:** the **Business** (created at signup/onboarding: name, category, address, timezone, description). Each owner account maps to one business.
- **Ownership model:** signup captures **Business Name + Owner Name** → the owner is the account principal; staff are sub-resources without logins.
- **Isolation strategy:** **not implemented.** Intended: every domain entity carries `businessId`; all queries scoped by the authenticated business; plan/subscription attached to the business.
- **Single-tenant-per-account today; no org/multi-location/multi-brand** concept (no workspace switching, no team invitations, no location entity). A future need (e.g., chains/franchises) would require a Location layer under Business.

---

## 22. Development Status Assessment

### ✅ Completed
- Full **UI shell** for all 16 modules (design-complete, responsive, accessible patterns).
- **Routing** (lazy + Suspense), **AuthGuard** redirect, **ErrorBoundary**, **Helmet** SEO.
- **44-component** Radix/shadcn design system; Tailwind 4 token system.
- **Stub auth** flow (login/logout/onboarding) with localStorage persistence.
- **Login Zod validation**; **2FA UI**; password visibility toggle.
- **Tooling:** TS strict (0 errors), Vite build (0 errors), ESLint 9 flat config, **CI** (lint/typecheck/test/build on main+develop), Vitest + RTL with 5 starter test suites (`AuthContext`, `AuthGuard`, `DashboardLayout`, `LoginPage`, `OnboardingWizard`).

### 🟡 In progress / partial
- **Data layer:** 100% mock arrays; no fetch/persistence.
- **Forms:** only login validated; booking/staff/service/signup-step-2 unvalidated.
- **Appointments:** List/Day views built; **Week/Month "coming soon."**
- **Design tokens:** historical `default_theme.css` vs `globals.css` duplication (per AUDIT_REPORT) — single source of truth to confirm.

### ❌ Missing (not started)
- **Entire backend** (API, DB, ORM, auth, queue, jobs, realtime).
- **AI engine** (LLM, knowledge-base retrieval, conversation orchestration).
- **Availability/slotting engine** (slot generation, conflict checks, buffers, holidays, per-staff hours, timezone application).
- **Channel integrations** (WhatsApp/Messenger/Telegram/Web/Mobile webhooks + sending).
- **Payments** (Stripe subscriptions/invoices/webhooks).
- **Notification dispatch** (email/push/SMS + customer messaging delivery).
- **RBAC & tenant isolation**; staff logins; team invitations.
- **Real analytics aggregation**; **search**; **export (CSV/PDF)**; **file uploads**.
- **Reschedule/no-show/completed** as first-class booking states on the record.

### Technical debt / risks
- Auth stub is a **security placeholder**, not a foundation — must be replaced wholesale.
- Mock data hard-coded **inside components** → significant refactor to API-backed hooks.
- No domain `types/` module yet (shapes live implicitly in components).
- Overlapping reminder logic between **Marketing** and **AI Settings** (single ownership needed).
- CSS token duplication risk; `tabs.tsx` `data-state` forwarding nuance (per audit).
- Provider/stack decisions (backend, DB, AI, payments) **still open**, blocking Phases 3–8.

---

## 23. Recommended MVP Scope

Goal: turn the prototype into a business that can actually take and manage AI-driven bookings on **one** channel.

### Must have
- Real **auth** (signup/login/session, password hashing, route protection) + tenant (`businessId`) scoping.
- Persistent **Services, Staff, Availability, Appointments** CRUD (replace mock arrays).
- A genuine **availability/slotting engine** (hours × duration × existing bookings; basic conflict prevention; timezone).
- **One channel end-to-end** (recommend **WhatsApp** — highest mock volume) with inbound webhook + outbound send.
- **AI booking flow** wired to a real LLM: intent → service → slot offer → confirm → create Pending/Confirmed appointment; **human takeover**.
- **Appointment lifecycle**: pending → confirmed → completed/cancelled/no-show.
- **Reminders** (the core no-show lever) via a scheduled job.
- Dashboard/Appointments showing **real** data.

### Should have
- **Stripe** subscriptions (Starter/Pro) + plan limits enforcement (bookings/channels).
- Additional channels (**Messenger**, **Web widget**).
- **Knowledge-base** upload + retrieval for FAQ answering.
- Real **analytics** aggregation; notifications (email at least).
- Form validation across all create/edit dialogs; CSV export.

### Nice to have
- Telegram + **Mobile SDK**; **Voice Call Bot**.
- Follow-ups & promotional campaigns; multi-language.
- RBAC beyond owner (Manager/Staff logins); per-staff calendars, buffers, holidays.
- Week/Month calendar views; conversation memory; white-label/branding; SLA tooling.

---

## 24. Product Roadmap Recommendation

### Phase 1 — Foundation & Single-Channel MVP *(highest priority)*
Backend stack decision → DB schema (entities in §16) → real auth + tenancy → CRUD for Services/Staff/Availability/Appointments → **availability engine** → **WhatsApp** integration → **AI booking** + takeover → reminders.
*Reasoning:* delivers the core value proposition (AI books appointments, reduces no-shows) for one segment on one channel; everything else is additive. Unblocks `EXECUTION_PLAN` Phases 3–6.

### Phase 2 — Monetization & Multi-Channel
Stripe billing + plan-limit enforcement → Messenger + Web widget → knowledge-base retrieval → real analytics + email notifications → full form validation, search, export.
*Reasoning:* makes it a sellable SaaS (can charge, can serve customers on the channels they use) and gives owners the operational/insight tooling to retain.

### Phase 3 — Scale, Differentiation & Enterprise
Telegram + Mobile SDK + Voice Bot → follow-ups & campaigns + multi-language → RBAC/staff logins, per-staff calendars, buffers/holidays, Week/Month views → white-label, API access, SLA (Enterprise tier) → conversation memory, advanced AI tuning.
*Reasoning:* unlocks Enterprise pricing ($199) and harder-to-copy moats once the core loop is proven and monetized.

---

## 25. Final Product Summary

**What it is.** BookingAI is an AI-powered, omnichannel appointment-scheduling SaaS delivered as a polished React admin dashboard. It is currently a **design-complete, frontend-only prototype** (generated via Figma Make) covering 16 product modules with realistic mock data and a "demo mode" that disables destructive/external actions.

**Who it serves.** Appointment-based local service SMBs — salons, spas, massage/wellness, medical/dental clinics, fitness trainers, hospitality, and consultants — primarily English-first / Western markets at $29–$199/month.

**How it works (intended).** Customers message the business on WhatsApp/Messenger/Telegram/web; a configurable AI assistant answers FAQs and books/reschedules appointments against the business's services, staff, and availability, auto-confirming and sending reminders to cut no-shows, with one-click human takeover. Owners manage everything — bookings, staff, services, hours, channels, marketing, AI behavior, billing, analytics, and support — from the dashboard.

**Core differentiators.** AI-first conversational booking across multiple chat channels (not a plain web calendar); unified omnichannel inbox; human-in-the-loop; deeply configurable AI persona + knowledge-base training; vertical-flexible.

**Maturity.** **Pre-MVP.** UX/UI and product scope are mature and coherent; engineering is a clean foundation (typed build, component system, routing, CI, starter tests) with **no backend, no real auth, no AI, no integrations, and no persistence**. Everything data-related is mocked.

**Biggest risks.**
1. **Build-from-zero backend** — auth, DB, AI orchestration, availability engine, channel integrations, payments, and notifications are all unbuilt; the visible "completeness" can mask that ~all business logic remains.
2. **Security placeholder** — current auth accepts any credentials; must be fully replaced before any real use.
3. **Availability/scheduling engine** — the technically hardest core piece does not exist yet.
4. **Open platform decisions** (backend/AI/payments providers) blocking execution.
5. **AI reliability & channel-API compliance** (esp. WhatsApp templates/policy) once live.

**Biggest opportunities.**
1. **Validated, comprehensive UX** dramatically de-risks product/design — the team can focus purely on backend execution against a clear contract (already drafted in `EXECUTION_PLAN.md`).
2. **Clear monetization** with three sensible tiers and natural gating (channels, bookings, Voice Bot, white-label/API).
3. **Multi-vertical reach** from one codebase.
4. **Strong wedge** (AI booking on WhatsApp to kill no-shows) that can land one segment fast, then expand channels/verticals/Enterprise features per the roadmap.

---

### Appendix A — Source-of-truth file map
- Routing/auth: [App.tsx](src/app/App.tsx) · [AuthContext.tsx](src/app/context/AuthContext.tsx) · [AuthGuard.tsx](src/app/components/guards/AuthGuard.tsx) · [guards/index.tsx](src/app/components/guards/index.tsx)
- Shell: [DashboardLayout.tsx](src/app/components/layout/DashboardLayout.tsx) · constants [config/constants.ts](src/app/config/constants.ts) · env [config/env.ts](src/config/env.ts)
- Pages: [src/app/components/pages/](src/app/components/pages/) (16 files)
- Design system: [src/app/components/ui/](src/app/components/ui/) (44 files)
- Project docs: [README.md](README.md) · [AUDIT_REPORT.md](AUDIT_REPORT.md) · [EXECUTION_PLAN.md](EXECUTION_PLAN.md)
- CI: [.github/workflows/ci.yml](.github/workflows/ci.yml) · Tests: [src/test/](src/test/) (5 suites)

### Appendix B — Naming note
Brand **"BookingAI"** (UI) vs. repo/codename **"easy-assistant" / `@figma/my-make-file`** vs. localStorage key `easy_assistant_auth`. Confirm the canonical product name before external materials.
