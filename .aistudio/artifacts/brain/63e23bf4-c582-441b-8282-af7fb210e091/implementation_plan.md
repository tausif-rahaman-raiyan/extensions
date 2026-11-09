# Prayer Focus — Premium Islamic Productivity Redesign, Custom Icons & CI Automation

Comprehensive architectural plan to transform Prayer Focus into a modern, multi-section productivity application with custom extension icons (Emerald crescent moon with golden star on dark midnight base across 16x16, 48x48, 128x128), a desktop sidebar navigation, responsive mobile experience, redesigned compact popup, dedicated Quran reading timer, Light/Dark/System theme system, categorized settings, full-screen prayer focus overlay, and a GitHub Actions workflow to build and release the extension ZIP on push.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed and prioritized:

- **Confirmed Custom Extension Icon**: High-resolution icons in 16x16, 48x48, and 128x128 PNG formats (plus vector SVG) featuring an **Emerald crescent moon with a glowing golden star on a dark midnight base**, bundled into `manifest.json`, the extension folder, the downloadable ZIP, web favicon, and application headers.
- **Confirmed GitHub Actions Workflow**: A ready-to-run `.github/workflows/build-extension.yml` workflow will automatically trigger on `push` to `main`/`master` (and tags), validate code syntax, bundle `Prayer-Focus-v2.2.21-Fixed.zip`, upload it as a GitHub Actions workflow artifact, and publish it to GitHub Releases for tag/release pushes.
- **Confirmed Theme Architecture**: Dark theme (`#101A17` midnight navy with emerald and muted gold) set as primary default on first launch, with a full three-way theme switcher (**Dark**, **Light** warm emerald `#F6F8F5`, and **System** OS matching) driven by centralized CSS variables and synchronized across views.
- **Confirmed Quran Reading Section**: A dedicated sidebar navigation section featuring an interactive stopwatch timer, session logging, daily reading goals, and local persistence.
- **10-Section Navigation Structure**:
  1. *Overview* (Default dashboard summary with next-prayer hero, 5 waqt cards, quick actions)
  2. *Prayer Times* (Dedicated vertical timetable, date navigation, sunrise entry, refresh)
  3. *Tahajjud* (Dedicated night breakdown with last-third calculation and countdown)
  4. *Prayer Tracker* (Daily 5-prayer + Tahajjud check-off, monthly calendar, completion percentage)
  5. *Daily Quotes* (Hourly rotating Bengali Hadiths/verses with Arabic script, copy, bookmark, card preview)
  6. *Quran Reading* (Reading timer, stopwatch, session progress)
  7. *Location* (City presets, worldwide coverage, GPS locator)
  8. *Provider Health* (Diagnostics for all 5 providers, 502 cooldown status, latency)
  9. *Settings* (Categorized into General, Appearance, Location, Prayer Calculation, Providers, Notifications, Advanced, About)
  10. *About* (Version v2.2.21, credits, icon showcase, and documentation)
- **Popup Redesign**: Compact ~380px companion with clear **Live / Cached / Unavailable / Cooldown** status indicators, prominent next-prayer card, optional Sunrise row, and top Bengali wisdom banner.

---

## 1. Overview & Core Concept

**Prayer Focus** is evolving from a single-page view into a structured, full-featured desktop & mobile productivity application. It retains all 5 API providers (AlAdhan, IslamicFinder, WaktuSolat, SITP with 502 recovery, and the local astronomical engine), while providing a modular sidebar-driven experience inspired by Apple Human Interface Guidelines and Linear-style interfaces.

---

## 2. User Experience & Visual Design

### Extension Icon Design Specification
- **Icon Composition**:
  - Base: Circular rounded container with dark midnight navy gradient fill (`#090D16` to `#101A17`) and subtle emerald rim stroke (`#059669`).
  - Hero Element: Graceful emerald crescent moon (`#10B981` to `#34D399`) curving from the left.
  - Accent Element: Sparkling eight-pointed golden star (`#F59E0B` / `#D97706`) resting in the crescent cradle.
- **Dimensions Generated**:
  - `extension/icons/icon16.png` (Toolbar button)
  - `extension/icons/icon48.png` (Extensions management page)
  - `extension/icons/icon128.png` (Chrome Web Store & installer)
  - `extension/icons/icon.svg` (Lossless vector asset)

### Desktop Sidebar Layout (1440px baseline)
- **Left Sidebar (240px fixed)**:
  - Header: Crescent & golden star icon, brand title "Prayer Focus", and subtle version badge `v2.2.21`.
  - Nav Items: 10 structured sections with Lucide icons and active emerald highlights.
  - Bottom Footer: Theme quick-switch, active location shortcut, and mini-widget popout trigger.
- **Main Viewport (Flexible)**:
  - Top Contextual Bar: Current active section title, Gregorian + Hijri date, and Extension ZIP download button.
  - Pinned Top Wisdom Banner: Hourly rotating Bengali Hadith/quote with Arabic text and verified reference.
  - Active Section Body: Seamless view switching without full page reloads.

### Mobile Navigation Layout (<768px)
- Fixed bottom navigation bar for primary tabs (*Overview*, *Times*, *Tahajjud*, *Tracker*, *More*).
- "More" opens a clean slide-up drawer for *Quran Reading*, *Location*, *Provider Health*, *Settings*, and *About*.
- Touch-friendly card padding and zero horizontal overflow.

### Compact Popup Redesign (380px–400px)
- **Header**: Custom crescent icon, brand lockup, theme toggle, and expand-to-dashboard button.
- **Data Freshness Strip**: Explicit badges for `Live (Synced)`, `Cached (Offline Safe)`, `Cooldown (502 Recovered)`, or `Unavailable`.
- **Hero Next Prayer Card**: Prominent waqt name, time, live digital countdown, and progress bar.
- **Waqt Timetable**: 5 obligatory prayers + distinct optional Sunrise row with active/completed highlighting.
- **Tahajjud Preview**: Quick indicator for Last Third window and remaining time.
- **Top Bengali Wisdom Banner**: Compact hourly quote snippet.

### Design Tokens & Color Palettes
- **Light Theme**: Warm cream/white background (`#F6F8F5`), crisp card surface (`#FFFFFF`), primary text (`#18251F`), secondary text (`#728078`), deep emerald (`#16845B`), soft accent gold (`#C59B52`), and subtle border (`#E4EBE5`).
- **Dark Theme**: Midnight navy background (`#101A17`), rich slate/emerald card surface (`#1B2B24`), primary text (`#F0F5F1`), secondary text (`#A1B1A7`), vibrant emerald (`#48B889`), and gold accent (`#D6B46F`).
- **Shared Variables**: Centralized CSS tokens via `:root`, `.light`, and `.dark` selectors with smooth 150ms transitions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vector-Generated High-Fidelity PNG Icons**
  - *Approach*: Generate crisp PNG binary icons via pure Canvas rasterization in a Node utility script, producing genuine 16x16, 48x48, and 128x128 PNG files.
  - *Why*: Eliminates placeholder 1x1 base64 icons and provides beautiful Chrome toolbar branding.
- **Decision 2: Sectional Single-Page Router vs Browser URL Hash**
  - *Approach*: Implement active section state (`activeSection: 'overview' | 'times' | 'tahajjud' | ...`) synchronized with URL hash.
  - *Why*: Allows direct bookmarking and back/forward browser navigation without requiring external heavy routing libraries in a Chrome extension.
- **Decision 3: Categorized Settings Hierarchy**
  - *Approach*: Split settings into 8 dedicated sub-panels (General, Appearance, Location, Prayer Calculation, Providers, Notifications, Advanced, About) with search and live preview.
  - *Why*: Eliminates long, unorganized modal scrolling and makes configuring providers or notifications intuitive.
- **Decision 4: Quran Reading Stopwatch with Session Storage**
  - *Approach*: Built-in reading stopwatch with Start/Pause/Reset, session logging (duration, pages/surah notes), and daily reading streaks persisted in `localStorage`.
  - *Why*: Delivers high daily utility for Islamic lifestyle without requiring external unverified text APIs.
- **Decision 5: GitHub Actions CI Workflow**
  - *Approach*: Create `.github/workflows/build-extension.yml` that checks out code, runs Node.js syntax validation, executes the JSZip pack script, uploads the ZIP as an action artifact, and creates a GitHub Release when tags like `v*` are pushed.
  - *Why*: Satisfies the user's explicit requirement: *"make a Ymal that when i push to github it make a extention zip"*.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PRAYER FOCUS NEW ARCHITECTURE                     │
└────────────────────────────────────────────────────────────────────────┘

 [Top Banner] ──> Hourly Bengali Quote Manager (Rotates every 1 hour)
      │
 [Navigation Shell] ──> Desktop Sidebar (240px) | Mobile Drawer (<768px)
      │
 ┌────┴───────────────────────────┬──────────────────────────────────────┐
 │ 01. Overview                   │ 06. Quran Reading (Timer & Log)      │
 │ 02. Prayer Times (Timetable)   │ 07. Location (Presets & GPS)         │
 │ 03. Tahajjud (Last-Third)      │ 08. Provider Health (502 Diagnostics)│
 │ 04. Prayer Tracker (Checklist) │ 09. Settings (7 Categories)          │
 │ 05. Daily Quotes (Wisdom Card) │ 10. About & Version Credits          │
 └────┬───────────────────────────┴──────────────────────────────────────┘
      │
 [State & Storage Engine]
      ├──> Theme Manager ('dark' | 'light' | 'system' -> CSS tokens)
      ├──> 5-Provider API Service (In-flight dedupe, 502 cooldown, cache)
      ├──> Tahajjud & Solar Astronomical Engine
      └──> Reading Sessions & Prayer Tracker LocalStorage
      │
 [Outputs & Delivery]
      ├──> Interactive Web Applet (AI Studio Port 3000)
      ├──> Custom Extension Icons (16x16, 48x48, 128x128 emerald & gold)
      ├──> Redesigned Popup View (Compact 380px extension popup)
      ├──> Standalone Manifest V3 Files (`/extension`)
      ├──> One-Click UI ZIP Download (`Prayer-Focus-v2.2.21-Fixed.zip`)
      └──> GitHub Actions Workflow (`.github/workflows/build-extension.yml`)
```

### Planned Implementation Steps
1. **GitHub Actions Workflow**: Create `.github/workflows/build-extension.yml` for automated ZIP packaging on push and releases.
2. **High-Res Extension Icons**: Generate `extension/icons/icon16.png`, `icon48.png`, `icon128.png`, and `icon.svg` featuring emerald crescent and golden star.
3. **Design Tokens & Theme CSS**: Expand `src/index.css` with CSS custom variables for Light, Dark, and System palettes.
4. **Sidebar & Mobile Navigation Component**: Create `src/components/Sidebar.tsx` and responsive mobile bar.
5. **Dedicated Section Views**:
   - `src/components/views/OverviewView.tsx`
   - `src/components/views/PrayerTimesView.tsx`
   - `src/components/views/TahajjudView.tsx`
   - `src/components/views/TrackerView.tsx`
   - `src/components/views/QuotesView.tsx`
   - `src/components/views/QuranView.tsx`
   - `src/components/views/LocationView.tsx`
   - `src/components/views/ProviderHealthView.tsx`
   - `src/components/views/SettingsView.tsx`
   - `src/components/views/AboutView.tsx`
6. **Popup Redesign**: Update `src/components/MiniWidget.tsx` and `extension/popup.html`/`popup.js` with live/cached/unavailable status badges, custom icon, and Sunrise row.
7. **Verification**: Compile applet, lint, run JS syntax checks on extension files, and rebuild ZIP.
