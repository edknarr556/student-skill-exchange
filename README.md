# Student Skill Exchange

A university-focused platform where students offer tutoring, request help, and
exchange skills with other students. This repository is the **frontend
prototype** for a software-engineering course assignment: the focus is a
polished, interactive UI backed by browser state, not a production backend.

Built with **Vite + vanilla HTML/CSS/JavaScript**. All prototype data lives in
**LocalStorage**, so there is no database or login to set up.

---

## Features

- **Dashboard** — welcome banner, at-a-glance stats, recommended tutors (matched
  to the skills you want to learn), upcoming sessions, pending requests, and
  quick actions.
- **Browse Skills** — searchable tutor marketplace with filters by subject and
  availability, plus sorting (rating, price, experience). Each tutor card links
  to a profile and a session request.
- **Student Profile** — profile details, skills offered vs. skills wanted,
  availability, tutoring history timeline, and a working **Edit profile** form.
  You can also view other students' profiles.
- **Messaging** — conversation list and a live chat interface. Session
  agreements are embedded as interactive cards inside the chat so students can
  negotiate before approving.
- **Session Requests & Agreements** — request a session, pick a skill and
  date/time, and choose **monetary payment** or **skill exchange**. Track
  pending / confirmed / declined / completed states.
- **My Sessions** — tabbed view of upcoming, pending, completed, and declined
  sessions with status indicators and per-session actions.
- **Appearance** — theme **mode** (Light / Dark / System) and six curated
  **colour presets** (Riverside Blue default, Midnight, Forest, Lavender,
  Sunset, High Contrast). A live preview shows buttons, tags, a tutor card, and
  an agreement status. Preferences persist in LocalStorage and are applied
  before first paint (no flash of the default theme).

### Theming

All colour and shape values are CSS custom properties. Each preset redefines
the full token set for light and dark in `src/styles/theme.css`, so switching a
theme restyles every page consistently — including the required semantic tokens:
`--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--primary`,
`--primary-hover`, `--success`, `--warning`, `--danger` (plus `--on-primary`
and `--focus-ring`).

- Only curated palettes are selectable — there is no arbitrary-hex input, which
  keeps every theme readable.
- Every preset is authored to meet **WCAG AA** contrast (≥ 4.5:1 for normal
  text, ≥ 3:1 for UI/focus indicators); this is enforced by
  `tests/contrast.test.js` across all 12 preset × mode combinations.
- The theme logic lives in `src/store/theme.js`; the resolved theme is written
  to `<html>` as `data-theme-preset` + `data-theme` with a `theme-dark` class.
- Appearance preferences survive a demo-data reset.

### Core business rule

> **A session is only confirmed once _both_ students approve the proposed
> terms.** Until then it stays *pending*, and students can chat and negotiate.

This rule is enforced in one place — `approveSession()` in
`src/store/state.js` — which flips a session to `confirmed` only when every
participant's approval flag is `true`.

---

## Getting started

Requires **Node.js 18+**.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (hot reload)
npm run dev
```

Then open the URL Vite prints (default: http://localhost:5173).

### Other scripts

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm test          # run the interaction + responsive test suite (Vitest)
npm run test:watch
```

### Resetting the demo data

Sample students, chats, and sessions are seeded into LocalStorage on first run.
The app runs in a clearly marked **Demo mode**: open the subtle *Demo mode*
control at the bottom of the sidebar and choose **Reset demo data…** to restore
the original sample content (a confirmation guards this destructive action).
Clearing the browser's site data has the same effect.

### Tests

Interaction and responsive behaviour are covered by a Vitest + jsdom suite in
`tests/`:

- `state.test.js` — session business logic, including the dual-approval rule
  and the snapshot/restore that powers Undo
- `interaction.test.js` — route-safe transient UI (dialogs/panels/menus close
  on navigation), accessible dialog (focus restore, Escape, ARIA), semantic
  radio payment selection, interactive notifications, and action feedback/Undo
- `responsive.test.js` — the mobile drawer state machine (open/close via
  toggle, scrim, route selection, Escape), full nav labels, and the
  de-emphasised demo menu
- `theme.test.js` — appearance persistence, system-theme fallback (incl.
  live OS changes while in System mode), keyboard selection in the mode/preset
  radiogroups, and the correct `data-theme*` attributes/class on `<html>`
- `contrast.test.js` — WCAG AA contrast for every preset × mode

Run them with `npm test`.

---

## Project structure

```
student-skill-exchange/
├── index.html              # app mount points + font/icon links
├── vite.config.js
└── src/
    ├── main.js             # entry: registers routes, renders shell, mounts pages
    ├── router.js           # tiny hash router with :params and query strings
    ├── utils.js            # formatting + rendering helpers (dates, avatars, escaping)
    │
    ├── styles/
    │   ├── theme.css         # all colour/shape tokens per preset × light/dark
    │   ├── base.css          # token note, reset, typography, focus ring
    │   ├── layout.css        # app shell: sidebar, topbar, responsive breakpoints
    │   └── components.css    # cards, buttons, badges, chat, modal, appearance, …
    │
    ├── store/
    │   ├── storage.js       # LocalStorage wrapper + change pub/sub
    │   ├── seed.js          # realistic sample students, sessions, chats
    │   ├── theme.js         # appearance presets, persistence, apply, system watch
    │   └── state.js         # data access + ALL business logic (approval rule)
    │
    ├── components/          # reusable UI pieces (framework-free)
    │   ├── layout.js         # sidebar + topbar shell, notifications, demo menu
    │   ├── overlay.js        # transient-UI registry + focus trap helpers
    │   ├── icons.js          # inline SVG icon set
    │   ├── toast.js          # toast notifications (with optional Undo)
    │   ├── modal.js          # accessible modal dialog (focus trap + restore)
    │   ├── tutorCard.js      # tutor card (Browse + Dashboard)
    │   ├── sessionCard.js    # session list row with contextual actions
    │   ├── agreementCard.js  # in-chat agreement card + approve/decline
    │   └── requestModal.js   # request-a-session / propose-terms flow
    │
    └── pages/
        ├── dashboard.js
        ├── browse.js
        ├── profile.js
        ├── messaging.js
        ├── requests.js
        ├── sessions.js
        ├── appearance.js    # theme mode + colour preset selectors + preview
        └── shared.js        # delegated action handlers shared across pages

tests/                       # Vitest + jsdom tests (interaction, responsive,
                             #   theme, contrast, state)
```

### Architecture notes

- **No framework.** Pages are plain functions: a `renderX()` returns an HTML
  string, and a `mountX()` wires up event listeners after it's injected. The
  router re-renders the shell on every navigation so the sidebar badges and
  active state stay in sync.
- **Single source of truth.** Pages never touch LocalStorage directly — every
  read and mutation goes through `src/store/state.js`. This keeps the business
  rules in one place and makes the app easy to extend.
- **Separation of concerns.** Presentation helpers live in `utils.js`,
  persistence in `store/storage.js`, domain logic in `store/state.js`, and
  reusable UI in `components/`.
- **Route-safe transient UI.** Every dialog, popover, and the mobile drawer
  registers a close handler in `components/overlay.js`. The router calls
  `closeAllOverlays()` on every navigation (including browser back/forward), so
  no transient surface can survive a route change.
- **Accessibility.** Dialogs trap focus, close on Escape, are labelled via
  `aria-labelledby`, and restore focus to their opener. Icon-only controls carry
  `aria-label`s, the payment choice uses a real radio-group `<fieldset>`, and
  the mobile drawer exposes `aria-expanded`/`aria-controls`.

---

## Extending this into a real app (later assignments)

The data layer is intentionally the only place that knows about persistence, so
swapping LocalStorage for a real backend is contained:

1. Replace the body of the functions in `src/store/state.js` with API calls
   (e.g. `fetch`/`axios`) to your server — the function signatures can stay the
   same, so the pages don't need to change.
2. Move the seed data in `src/store/seed.js` into database fixtures/migrations.
3. Add real authentication where `CURRENT_USER_ID` is used, and populate the
   current user from a session/token instead of the seed.
4. The dual-approval rule in `approveSession()` should be mirrored and enforced
   **server-side** so it can't be bypassed from the client.

---

*Prototype for a university software-engineering course. Frontend only — no
backend or external authentication at this stage.*
