# Implementation Plan: Prayer Focus v2.2.23

Implement new Sujud icon everywhere, update 5-tier working API providers, add direct manual prayer time overrides in Settings, show time limits in Overview, and ensure error-free GitHub Actions extension builds.

---

## 1. Icon Replacement: Use `islamic.png` Everywhere
- User uploaded asset: `/public/assets/aistudio/islamic_031b4178.png` (Sujud / prostration under crescent moon).
- Resize and copy this image to:
  - `public/icons/icon128.png`, `public/icons/icon48.png`, `public/icons/icon16.png`
  - `extension/icons/icon128.png`, `extension/icons/icon48.png`, `extension/icons/icon16.png`
  - Web favicon in `index.html`
- Replace SVG graphics in the UI with this official logo:
  - `Sidebar.tsx` brand header
  - `MiniWidget.tsx` header
  - `AboutView.tsx` hero showcase
  - `extension/popup.html` and `popup.css`

---

## 2. 5-Tier Working API Engine (Completely Eliminating SITP)
- Selected by user:
  1. **AlAdhan Global Coordinates API**: `https://api.aladhan.com/v1/timings` (Primary)
  2. **AlAdhan City-Based API (WaktuSolat)**: `https://api.aladhan.com/v1/timingsByCity` (Secondary)
  3. **PrayZone API**: `https://api.pray.zone/v2/times/today.json` (Tertiary)
  4. **Islamic Network API**: `https://api.aladhan.com/v1/calendarByCity` / `https://api.aladhan.com/v1/timingsByAddress` (Backup)
  5. **Local Astronomical Solar Engine**: 100% offline Jean Meeus equations (Guaranteed zero-network fallback)
- Fix client-side CORS issues in web diagnostics by ensuring every endpoint supports browser CORS or falls back gracefully without console errors.
- Update `ProviderHealthView.tsx`, `ProviderModal.tsx`, `SettingsView.tsx`, and `prayerApi.ts`.

---

## 3. Direct Manual Prayer Time Overrides in Settings
- Add **Manual Prayer Time Adjustment** section in Settings:
  - Toggle: "Enable Manual Prayer Overrides"
  - Inputs: Direct time pickers/entry for each prayer:
    - Fajr: `HH:mm` (e.g. `04:45`)
    - Sunrise: `HH:mm` (e.g. `06:01`)
    - Dhuhr: `HH:mm` (e.g. `11:37`)
    - Asr: `HH:mm` (e.g. `15:36`)
    - Maghrib: `HH:mm` (e.g. `17:12`)
    - Isha: `HH:mm` (e.g. `18:28`)
    - Tahajjud: `HH:mm` (optional custom start)
  - Action buttons: "Save Custom Times", "Revert to API Times".
  - Persisted in `localStorage('prayer_focus_manual_overrides')`.
  - When enabled, prayer calculations and displays prioritize the manual times while preserving night divisions.

---

## 4. Show Waqt Time Limits in Overview View
- In `OverviewView.tsx` Daily Prayer Schedule:
  - Display the full start-to-end time limit for each prayer (e.g. Fajr: `04:45 AM – 06:01 AM`, Dhuhr: `11:37 AM – 03:36 PM`, etc.).
  - Add active and finished badges so users immediately see how much time remains in the current waqt.

---

## 5. GitHub Actions CI Workflow Hardening (`.github/workflows/build-extension.yml`)
- Ensure the workflow runs on Node 22 with `--legacy-peer-deps`.
- Verify packaging of all extension files (including new `icon16.png`, `icon48.png`, `icon128.png`, `content.js`, `content.css`).
- Produce `Prayer-Focus-v2.2.23-Fixed.zip`.

---

## 6. Verification
- Validate extension syntax with `node --check`.
- Co-execute `compile_applet` and `lint_applet` together to verify 0 errors.
