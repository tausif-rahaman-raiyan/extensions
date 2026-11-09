# Extension Popup Storage Sync, Dashboard Icon & Missed Prayer Red Box

Synchronize the Extension Popup with the main Dashboard's stored location, provider, and completed prayers state. Update the Popup brand header icon to match the Dashboard's emerald crescent moon icon, and render expired unprayed prayer cards with a distinct red border, rose-tinted background, and "Missed (Qada)" status badge.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following design choices via interactive clarification:
> - **Red Box for Expired Prayers**: Prayer windows that have ended without being marked prayed will render with a red border (`border-rose-500/50`), rose-tinted background (`bg-rose-950/20`), and a `Missed (Qada)` badge.
> - **Shared Storage Sync**: The Extension Popup will read `location_info`, `active_provider`, `juristic_method`, and `completed_prayers` directly from `chrome.storage.local` (synced with the Dashboard), ensuring the popup always reflects the user's selected location and active API provider.
> - **Matching Icon**: Replace the popup header logo with the exact emerald crescent moon & gold star icon from the Dashboard (`MiniWidget.tsx` / `Navbar.tsx`).

## 1. Overview & Core Concept

- **What It Does**: Unifies the browser Extension Popup with the main Dashboard application in storage state, visual brand identity, and status tracking.
- **Key Actions**:
  - Load location (`location_info`), provider (`active_provider`), juristic method (`juristic_method`), and completion records (`completed_prayers`) from `chrome.storage.local`.
  - Display dynamic location in popup header (e.g., `Chattogram`, `Dhaka`, `Sylhet`, etc.) and location footer line (`✦ Chattogram, Bangladesh (Asia/Dhaka)`).
  - Update popup header icon to match the Dashboard crescent moon SVG.
  - Dynamically check each prayer card's end limit time against current time; if expired and unprayed, render in red box with `Missed (Qada)` badge.

## 2. User Experience & Visual Design

- **Prayer Grid Card States in Popup**:
  - **Active Waqt**: Emerald highlight ring (`border-emerald-500 bg-emerald-950/30`), green time display, and `Active` badge.
  - **Finished / Prayed**: Emerald border (`border-emerald-500/40`), green check icon, and `Done` badge.
  - **Missed (Expired Unprayed)**: Red box styling (`border-rose-500/50 bg-rose-950/20`), rose text, and `Missed (Qada)` badge.
  - **Upcoming**: Dark slate card (`border-slate-800 bg-slate-900/60`).

```
┌───────────────────────────┐   ┌───────────────────────────┐
│ Fajr          04:45 AM    │   │ Dhuhr        11:37 AM     │
│ Limit: 06:01 AM   [Done]  │   │ Limit: 03:36 PM  [Active] │
│ (Green Border & Badge)    │   │ (Emerald Highlight Ring)  │
└───────────────────────────┘   └───────────────────────────┘
┌───────────────────────────┐   ┌───────────────────────────┐
│ Asr           03:36 PM    │   │ Maghrib      05:12 PM     │
│ Limit: 05:12 PM  [Missed] │   │ Limit: 06:28 PM [Upcoming]│
│ (Red Box & Rose Badge)    │   │ (Standard Dark Slate Card)│
└───────────────────────────┘   └───────────────────────────┘
```

## 3. Technical Architecture & Component Changes

1. **`extension/popup.html`**:
   - Ensure header icon SVG matches `MiniWidget.tsx` exact paths (emerald crescent `#34D399` with gold star `#F59E0B`).

2. **`extension/popup.js`**:
   - Integrate `chrome.storage.local.get(['location_info', 'active_provider', 'juristic_method', 'completed_prayers'])`.
   - Pass stored coordinates (`lat`, `lng`) and provider settings to `fetchPrayerTimes()`.
   - Pass completion state to prayer cards renderer (`renderPrayerCards`).
   - In `updateLiveCounters()`, re-evaluate card status every second:
     - Check if `now > limitDate` and `!isCompleted`.
     - Apply `.prayer-card.missed` class for red box styling and update status badge text to `Missed (Qada)`.

3. **`extension/popup.css`**:
   - Add `.prayer-card.missed` styles:
     `border-color: rgba(244, 63, 94, 0.5); background: rgba(244, 63, 94, 0.15);`
   - Add `.badge-missed`: `color: #fda4af; background: rgba(244, 63, 94, 0.2); border: 1px solid rgba(244, 63, 94, 0.4);`.

4. **Extension Packaging**:
   - Run `npm run build && node scripts/pack-extension.js` to create updated `Prayer-Focus-v2.2.23-Fixed.zip`.
