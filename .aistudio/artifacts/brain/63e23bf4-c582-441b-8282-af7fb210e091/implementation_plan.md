# Extension Popup & Mini Widget Controls Sync

Unify the bottom action controls across both the browser extension popup modal (`extension/popup.html`) and the web application's `MiniWidget.tsx` component so both render identical, functional action controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following design choices via interactive clarification:
> - **Unified Layout**: Both the Chrome Extension Popup modal and the web application's `MiniWidget.tsx` component will feature identical bottom control bars.
> - **Action Items**:
>   1. `[ Open Dashboard ↗ ]` green button (opens `dashboard.html` or main app view).
>   2. `[ Settings ⚙ ]` dark button (navigates to settings view).
>   3. `✦ Chattogram, Bangladesh (Asia/Dhaka)` dynamic location line.
>   4. `[ ↻ Refresh ]` full-width dark action button at the bottom (removes obsolete `Focus Mode (5m)` button).

## 1. Overview & Core Concept

- **What It Does**: Standardizes the popup UI layout when clicking the extension icon in browser toolbar or opening the in-app Mini Widget modal.
- **Key Actions**:
  - Direct navigation to full dashboard (`dashboard.html` / `section=overview`).
  - Direct navigation to settings (`dashboard.html?section=settings`).
  - Live formatted location line matching active location state (`✦ Chattogram, Bangladesh (Asia/Dhaka)`).
  - One-tap data refresh button (`↻ Refresh`) to sync prayer timings across storage.

## 2. User Experience & Visual Design

- **Bottom Action Strip Layout**:
  - **Primary Action Grid**: 2 equal columns:
    - Left: Emerald gradient CTA button `[ Open Dashboard ↗ ]` (`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold`).
    - Right: Dark slate button `[ ⚙ Settings ]` (`bg-slate-900 border border-slate-800 text-slate-200 hover:text-white`).
  - **Location Subtitle Line**: Centered small text with emerald sparkle: `✦ Chattogram, Bangladesh (Asia/Dhaka)` (`text-[11px] text-slate-400 font-medium`).
  - **Full-Width Refresh Button**: Below location line, a full-width dark button `[ ↻ Refresh ]` (`bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 w-full py-2 rounded-xl text-xs font-semibold`).

```
┌────────────────────────────────────────────────────────┐
│ [ Open Dashboard ↗ ]             [ ⚙ Settings ]        │
├────────────────────────────────────────────────────────┤
│           ✦ Chattogram, Bangladesh (Asia/Dhaka)        │
├────────────────────────────────────────────────────────┤
│                     [ ↻ Refresh ]                      │
└────────────────────────────────────────────────────────┘
```

## 3. Technical Architecture & Component Changes

```
┌───────────────────────────┐         ┌───────────────────────────┐
│   extension/popup.html    │         │  src/components/          │
│   extension/popup.js      │         │  MiniWidget.tsx           │
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │                                     │
              └───────────────┬─────────────────────┘
                              ▼
                Identical Bottom Controls:
                - Open Dashboard ↗
                - Settings ⚙
                - ✦ Location line
                - ↻ Refresh (full-width)
```

1. **`extension/popup.html` & `extension/popup.js`**:
   - Update HTML structure: Replace footer buttons `Focus Mode (5m)` and `Refresh` with a full-width `↻ Refresh` button below the location line.
   - Wire event handlers:
     - `openDashboardBtn` -> opens `chrome.tabs.create({ url: 'dashboard.html' })`.
     - `openSettingsBtn` -> opens `chrome.tabs.create({ url: 'dashboard.html?section=settings' })`.
     - `refreshBtn` -> triggers prayer timings sync from active provider and updates popup state.
   - Clean up top header quote/coordinate banners if requested in prior turn.

2. **`src/components/MiniWidget.tsx`**:
   - Add bottom controls matching `popup.html`:
     - `onOpenFullDashboard` button.
     - `onOpenSettings` button.
     - Dynamic location text: `✦ {location.nameEn}, {location.country} ({location.timezone})`.
     - Full-width `Refresh` button calling `onRefresh` handler.

3. **Extension Re-Packaging**:
   - Run `npm run build && node scripts/pack-extension.js` to update `Prayer-Focus-v2.2.23-Fixed.zip`.
