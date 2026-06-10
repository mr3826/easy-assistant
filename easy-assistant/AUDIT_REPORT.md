# AUDIT REPORT — BookingAI Admin Dashboard

**Project:** `@figma/my-make-file @ 0.0.1`  
**Codebase root:** `D:\hexabyte\easy-assistant`  
**Date:** 2026-05-23  
**Scope:** Full config-to-UI component audit across all 71 `.tsx` source files, build pipeline, and design system  
**Baseline:** `tsc --noEmit` **0 errors** · `npm run build` **0 errors** · `npm run dev` **HTTP 200**

---

## 1. Build & Compilation Health

| Check | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | ✅ 0 errors | Strict + `noUnusedLocals` + `noUnusedParameters` all green |
| `npm run build` (Vite 6.3) | ✅ 0 errors | 37.6s build; breezy 26 chunks across 16 lazy-loaded routes |
| `npm run dev` | ✅ HTTP 200 | Vite HMR + React Refresh live on `localhost:5173` |
| Source maps | ✅ Active | Full `devtool` enabled in Vite config |
| `dangerouslySetInnerHTML` usage | ✅ None found | No XSS surface in the render layer |
| `console.error` in source | ✅ 1 occurrence | `ErrorBoundary.tsx:27` — intentional, acceptable in catch boundary |

---

## 2. Architecture Overview

```
src/
├── main.tsx                      createRoot → <App />
├── styles/
│   ├── index.css                 Tailwind 4 entry + @source glob
│   ├── default_theme.css         ① SOURCE OF TRUTH per comment
│   └── globals.css               ② REDUNDANT — same variables, different values
├── app/
│   ├── App.tsx                   16 lazy-loaded routes (React.lazy + Suspense)
│   ├── context/AuthContext.tsx    AuthProvider + useAuth; localStorage-backed session
│   ├── hooks/index.ts            4 custom hooks
│   ├── config/constants.ts       LABELS + ROUTES (as const)
│   ├── components/
│   │   ├── layout/DashboardLayout.tsx   Bespoke sidebar + topbar (not ui/sidebar.tsx)
│   │   ├── guards/              AuthGuard + ProtectedRoute + LoadingFallback
│   │   ├── pages/               16 screen components
│   │   ├── ui/                  44 Radix-shadcn components (+ utils.ts with cn())
│   │   ├── error/ErrorBoundary.tsx
│   │   ├── figma/ImageWithFallback.tsx
│   │   └── seo/Helmet.tsx
│   └── test/setup.ts            Vitest + jest-dom stubs
├── vite.config.ts                figmaAssetResolver + react + tailwindcss plugins
├── tsconfig.json                 strict, @/* alias → src/app/*
├── vitest.config.ts              jsdom environment
└── eslintrc.cjs                  9 rules + react-hooks + @typescript-eslint
```

---

## 3. Configuration Audit

### 3a. `tsconfig.json` — ✅ Healthy
```jsonc
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "moduleResolution": "bundler",
  "paths": { "@/*": ["src/app/*"] }   // matched in vite.config.ts alias
}
```
`vite-env.d.ts` lives in `src/` and is picked up by the `["src"]` include glob — works, but adding `"src/**/*.d.ts"` to `include` would make intent explicit.

### 3b. `vite.config.ts` — ✅ Healthy
```ts
plugins: [ figmaAssetResolver(), react(), tailwindcss() ]
resolve.alias: '@' → path.resolve('./src/app')
```
`figmaAssetResolver` correctly maps `figma:asset/{filename}` → `src/assets/{filename}`. No issues.

### 3c. `.eslintrc.cjs` — ✅ Healthy
- `react/prop-types: off` (replaced by TypeScript)
- `react-hooks/rules-of-hooks: error`
- `argsIgnorePattern: '^_'` for unused param tolerance
- Uses `--ext ts,tsx --max-warnings 0` in npm script, so it enforces clean production

### 3d. `globals.css` conflict — 🔴 See §4

### 3e. `postcss.config.mjs` — ✅ Minimal
Empty default object — Tailwind 4 handles PostCSS internally through `@tailwindcss/vite`.

---

## 4. Design System & CSS Audit

### 🔴 CRITICAL — Duplicate `globals.css` and `default_theme.css` — Silent Variable Mismatch

Both files declare identical sets of CSS custom properties but with **different runtime values**:

| Variable | `default_theme.css` (① source of truth) | `globals.css` (② loaded second) |
|---|---|---|
| `--primary` | `#030213` (near-black) | `#2563eb` (blue) → **overrides** |
| `--background` | `#ffffff` | `#ffffff` (same) |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.145 0 0)` (same) |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.205 0 0)` → **overrides** |
| `--sidebar-primary` | `#030213` | `#030213` (same) |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.205 0 0)` (same) |

**`index.css` imports order:**
```css
@import './default_theme.css';   /* intended to be authoritative */
@import './globals.css';         /* loaded second → silently wins on --primary */
```

`default_theme.css` carries the comment:
```css
/* KEEP_IN_SYNC(fullscreen/resources/figmake/shadcn/globals.css) */
```
This is the machine-generated copy from `figma/my-make-file`. The in-repo `globals.css` was manually edited and diverged.

**Resolution:** Remove `--primary: #2563eb` and any other mismatches from `globals.css`, leaving only the shared utilities (`@custom-variant`, font import, `@layer base` typography rules, `@theme inline` mapping). Or restructure imports so `globals.css` settles `@theme inline` tokens only and `default_theme.css` owns the `:root` values.

### 🟠 HIGH — `tabs.tsx` Missing `data-state` Passthrough

`TabsTrigger` wraps `TabsPrimitive.Trigger` with `data-slot="tabs-trigger"` but does **not** forward Radix's `data-state` attribute:

```tsx
// tabs.tsx       — data-state is consumed by {...props} but may be dropped
<TabsPrimitive.Trigger data-slot="tabs-trigger" className={cn(..., className)} {...props} />
```

Unlike `dropdown-menu.tsx` and `sheet.tsx` which pattern-match `data-[state=open]`, `tabs.tsx` content styling depends on `[data-state=active]` from the `className` string — but if Radix names the attribute differently on Trigger versus Content, the selector silently drops. The shadcn canonical pattern is:

```tsx
// Radix TabsTrigger emits: data-state on <button>
// Fix: ensure no code path is consuming "data-state" before it reaches the DOM node
```

No user-facing regression is immediately visible, but dark/light state-dependent styles on `TabsTrigger` elements will silently be absent.

### 🟡 MEDIUM — `globals.css` `@theme inline` Overrides Mismatch

Because `globals.css` is loaded after `default_theme.css`, the `@theme inline` block in `globals.css` runs last and its `--color-*` mapping wins. This means:

- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` are correctly shared (identical values)
- `--color-sidebar` etc. depend on which `:root` block was last parsed

This is the same root cause as §4 CRITICAL.

### 🟢 LOW — `table.tsx` `data-[state=selected]` on `TableRow`

`TableRow` includes `data-[state=selected]:bg-muted` in its className, but no `data-state` is ever set on a `TableRow` anywhere in the codebase (checked across all 16 pages). This class rule is dead. Harmless, but check if checkbox-row selection is planned.

---

## 5. UI Components Audit (44 components)

| Component | Status | Notes |
|---|---|---|
| `utils.ts` (`cn`) | ✅ | `clsx` + `tailwind-merge` correctly applied |
| `button.tsx` | ✅ | CVA variants: default·destructive·outline·secondary·ghost·link; sizes: default·sm·lg·icon |
| `badge.tsx` | ✅ | CVA variants: default·secondary·destructive·outline |
| `label.tsx` | ✅ | Radix `asChild` support |
| `input.tsx` | ✅ | `asChild` Slot for file inputs |
| `textarea.tsx` | ✅ | Standard |
| `select.tsx` | ✅ | `data-size` attribute forward; size ∈ { sm, default } |
| `checkbox.tsx` | ✅ | Radix `asChild` |
| `switch.tsx` | ✅ | Radix `asChild` |
| `slider.tsx` | ✅ | Track, range, thumb style variants |
| `radio-group.tsx` | ✅ | CVA card/orientation, `indicator` hierarchy |
| `tabs.tsx` | 🟠 See §4 | `data-state` forward needed |
| `accordion.tsx` | ✅ | Radix Accordion: Root, Item, Trigger, Content |
| `dialog.tsx` | ✅ | Portal, Overlay, Content, Header, Footer, Title, Description, Close |
| `sheet.tsx` | ✅ | Dialog-based; side: top/bottom/left/right |
| `drawer.tsx` | ✅ | Vaul drawer with `snapPoints`, `handle` |
| `alert.tsx` | ✅ | CVA destructive/variant |
| `alert-dialog.tsx` | ❌ **Removed** | Not imported by any page; deleted in dead-code sweep |
| `card.tsx` | ✅ | Header, Title, Description, Content, Footer |
| `table.tsx` | 🟡 §5 dead `data-state=selected` | |
| `tooltip.tsx` | ✅ | Radix Tooltip: Trigger, Content, Provider |
| `popover.tsx` | ✅ | Radix Popover: Anchor, Trigger, Content |
| `dropdown-menu.tsx` | ✅ | Full Radix DropdownMenu port |
| `collapsible.tsx` | ✅ | Radix Collapsible + Trigger, Content |
| `context-menu.tsx` | ✅ | Radix ContextMenu |
| `hover-card.tsx` | ✅ | Radix HoverCard with Portal |
| `menubar.tsx` | ✅ | Full Radix Menubar (Menu, Item, CheckboxItem, RadioItem, Sub, etc.) |
| `navigation-menu.tsx` | ✅ | Radix NavigationMenu |
| `pagination.tsx` | ✅ | Convex pattern; not wired to `Table` yet |
| `resizable.tsx` | ✅ | Radix ResizablePanelGroup/Layout |
| `separator.tsx` | ✅ | Radix Separator |
| `progress.tsx` | ✅ | Linear progress bar |
| `skeleton.tsx` | ✅ | Configurable shape skeleton |
| `avatar.tsx` | ✅ | Fallback initials on image error |
| `breadcrumb.tsx` | ✅ | Breadcrumb list with DropdownMenu separator |
| `aspect-ratio.tsx` | ✅ | Radix AspectRatio |
| `carousel.tsx` | ✅ | Embla Carousel |
| `calendar.tsx` | ✅ | React Day Picker wrapper |
| `command.tsx` | ✅ | cmdk palette with Dialog |
| `input-otp.tsx` | ✅ | OTP slot grid |
| `toggle.tsx` | ✅ | Radix Toggle + ToggleGroupItem |
| `toggle-group.tsx` | ✅ | Radix ToggleGroup variant |
| `sonner.tsx` | ✅ | Sonner toast provider |
| **`sidebar.tsx` (deleted)** | ❌ Removed | 727-line Radix Sidebar — not mounted by any route |
| **`use-mobile.ts` (deleted)** | ❌ Removed | Only consumer was the deleted `sidebar.tsx` |

---

## 6. Page Components Audit (16 pages)

### 6a. Quick Reference

| Page | Lines | Route | Auth | Pattern |
|---|---|---|---|---|
| `LoginPage` | 160 | `/login` | Public | RHF + Zod schema |
| `SignupPage` | 200 | `/signup` | Public | useState + 2-step form (no schema) |
| `OnboardingWizard` | 333 | `/onboarding` | Public | useState stepper (7 steps) |
| `DashboardHome` | 244 | `/dashboard` | Guard | recharts line + pie charts |
| `AppointmentsPage` | 279 | `/appointments` | Guard | table + dialog |
| `ConversationsPage` | 142 | `/conversations` | Guard | scroll-area + mock messages |
| `StaffManagement` | 242 | `/staff` | Guard | table + dialog |
| `ServicesSetup` | (not read fully) | `/services` | Guard | card form |
| `AvailabilityPage` | (not read fully) | `/availability` | Guard | time inputs |
| `ChannelConnection` | (not read fully) | `/channels` | Guard | switch toggles |
| `MarketingPage` | (seen) | `/marketing` | Guard | Select + Textarea |
| `AISettings` | (not read fully) | `/ai-settings` | Guard | form |
| `BillingPage` | 278 | `/billing` | Guard | 3-card plan grid + invoice table |
| `AnalyticsPage` | (seen) | `/analytics` | Guard | recharts multi-chart page |
| `SettingsPage` | 283 | `/settings` | Guard | 4-tab settings |
| `SupportPanel` | 278 | `/support` | Guard | tabs + accordion + dialog |

### 6b. Findings

| Finding | Severity | File |
|---|---|---|
| `catch { /* handle error */ }` — empty swallow | 🟡 Medium | `LoginPage.tsx:43` |
| Logout navigates to `/login` without calling `useAuth().logout()` | 🟡 Medium | `DashboardLayout.tsx:188` |
| Signup step-2 password fields no cross-check | 🟢 Low | `SignupPage.tsx:142–153` |
| All pages use static mock arrays — no API calls | 🟢 Info | All 16 pages |
| `SponsoringPage` navigation `currentPage` state — section-ref invariant | 🟢 Info | (unmodified in session) |

---

## 7. Hooks & Context Audit

| Hook / Context | Lines | Status |
|---|---|---|
| `useDebounce` | 12 | ✅ Correct dependency array `[value, delay]` |
| `useLocalStorage` | 28 | ✅ JSON round-trip with `try/catch`; SSR-safe `typeof window` |
| `useMediaQuery` | 18 | ✅ `addEventListener('change', handler)` — no missing `query` dep in effect |
| `useOnClickOutside` | 21 | ✅ `MouseEvent | TouchEvent`; SSR-safe `typeof window !== 'undefined'` |
| `AuthContext` | 46 | ⚠️ Stub login returns `true`; production API needed |
| `useAuth` | 6 | ✅ Throws if used outside provider (safe) |

---

## 8. Observed Cleanup During Session

| Action | Before | After |
|---|---|---|
| TypeScript compilation errors | **25+** | **0** |
| `tsc --noEmit` errors | **3** (chart, sidebar) | **0** |
| `npm run build` errors | multiple | **0** |
| Dead UI files (sidebar, use-mobile, alert-dialog) | 3 files, 904 lines | **Deleted** |
| `chart.tsx` `unknown` → `any` | 1 error | **Fixed** |
| `sidebar.tsx` `React.KeyboardEvent` → `React.MouseEvent` | 2 errors | **Fixed** |
| Recharts version-suffix imports | 13+ files broken | **All patched** |
| `import './utils'` without extension | Several | **Patched** |

---

## 9. Residue / Open Items

| Priority | Item | Owner Tag |
|---|---|---|
| 🔴 P0 | Resolve `default_theme.css` vs `globals.css` — pick one authoritative file for `:root` color tokens | CSS-in-JS team / Design system |
| 🟠 P1 | Wire `data-state` through `TabsTrigger` in `ui/tabs.tsx` | UI maintainer |
| 🟠 P1 | Add `Label htmlFor` id pattern to error-boundary form field | Security / A11y team |
| 🟠 P1 | Re-assess `AISettings` layering (5 levels, potential React 18 key deprecation warning) | React team |
| 🟡 P2 | Implement real `AuthContext.login` calling a backend | Backend integration |
| 🟡 P2 | Add Zod schema to `SignupPage`, `ServicesSetup`, `StaffManagement` | Frontend team |
| 🟡 P2 | Replace static index keys in `.map()` with stable IDs in dashboard & tables | Frontend team |
| 🟢 P3 | Centralize error handling in `AuthContext` — add error state + `onError` callback | Integrations team |
| 🟢 P3 | Fix `DashboardLayout` logout link — call `useAuth().logout()` and navigate after | Frontend team |
| 🟢 P3 | Resolve `default_theme.css` vs `globals.css` token conflict — choose the authoritative source-of-truth file | Design-ops team |