---
name: frontend-ui-refinement
description: Summary of the UI/UX refinement pass — what was added, changed, and the design principles adopted
metadata:
  type: project
---

Comprehensive UI/UX refinement completed July 2026. The goal was to make Merge feel premium, calm, and professional (inspired by Linear/Vercel) without redesigning existing screens.

**Why:** Product needs to feel like a serious engineering formation platform, not a gamified EdTech app. First impressions matter.

**How to apply:** Any future screens should follow these patterns — no gamified animations (no bounce/pulse for decoration), consistent `animate-fade-in` on page mount, AuthLayout for all auth-flow screens.

---

## What was created

- **`KnowledgeGraph.jsx`** — Animated SVG with 20 nodes + 38 edges. Uses CSS keyframes `kg-node` and `kg-line` for slow opacity pulsing. Color: `#adc6ff` (primary token). This is Merge's signature visual.

- **`AuthLayout.jsx`** — Two-column layout for all auth screens. Left panel: dark `#0b0e15` bg, KnowledgeGraph fills it, rotating messages cycle every 5s with fade transition, logo at top-left, tagline at bottom. Right panel: form area on `#10131a` bg. On mobile, collapses to single column with logo above form.

## What was changed

- **LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen** — All now use `AuthLayout`. Forms unchanged in function; improved typography (mono labels), consistent input styling (`bg-[#0b0e15]`, `border-[#424754]`, `focus:border-[#adc6ff]`), structured error messages with icon.

- **GeminiTokenSetupScreen** — Matched new typography style, cleaner header bar, `animate-fade-up` on content.

- **OnboardingScreen** — Matched typography, `animate-fade-up`, smaller logo (`height=22`).

- **DashboardScreen** — `animate-fade-in` on load. XpPacingIndicator replaced (removed bouncing triangles) with subtle dot + text. Formation Status section: replaced centered school icon with horizontal pill showing active stage and XP gate. Promotion button: removed gamified gradient, now solid blue. Cards have `transition-colors hover:border-[#424754]`.

- **All other screens** — `animate-fade-in` added to outermost div for consistent page transitions.

- **StagePromotionScreen** — Removed gradient from promotion button, removed `animate-bounce` from celebration icon, removed `animate-pulse` from arrow.

## CSS additions (index.css)

- `@keyframes kg-node` — slow opacity cycle for graph nodes
- `@keyframes kg-line` — slow opacity cycle for graph edges  
- `@keyframes fadeUp` — 240ms translateY(10px)→0 entry
- `@keyframes fadeIn` — 220ms opacity 0→1 entry
- `.animate-fade-in`, `.animate-fade-up`, `.animate-slide-in` — utility classes
- `:focus-visible` — global 1.5px `#adc6ff` ring
- `@media (prefers-reduced-motion)` — disables all animations

## Design rules established

- No `animate-bounce`, `animate-pulse` for decoration — only for legitimate loading/pending states
- No gradient backgrounds on buttons — solid `#3B82F6` / `#2563EB` hover
- No confetti, no dramatic celebrations
- Labels in forms: `font-mono-code text-[10px] uppercase tracking-widest text-[#c2c6d6]`
- Inputs: `bg-[#0b0e15] border-[#424754] focus:border-[#adc6ff]`
- Error states: warning icon + mono text, subtle border glow
- All screens: `animate-fade-in` on outermost wrapper
