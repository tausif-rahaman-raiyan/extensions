# Implementation Plan: Auto-Qada Status, Clean Timetable & Refresh Feedback

Implement automatic Qada status indicators for expired prayer windows, remove redundant bottom breakdown tables in PrayerTimesView, and provide floating toast feedback upon clicking Refresh Timings.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 interactive clarification:

- **Confirmed Decision 1**: **Auto-Qada Display**: When a prayer window expires without being marked completed, display an "Unfinished (Missed)" red status badge with a prominent "Mark (Qada)" button in both Overview and Prayer Times.
- **Confirmed Decision 2**: **Clean Single-Grid Timetable**: Remove the duplicate bottom vertical table ("Complete Waqt Windows & Night Breakdown") in `PrayerTimesView.tsx` so only the top card grid ("Daily Prayer Schedule Cards") displays the schedule and limits.
- **Confirmed Decision 3**: **Floating Toast Feedback on Refresh**: Show a floating toast notification displaying the active provider name and status upon successful or failed timing refresh.

---

## 1. Overview & Core Concept

This update streamlines `PrayerTimesView` by eliminating duplicate tables, automatically flagging expired prayer windows as Qada in Overview and Prayer Times, and adding clear toast feedback when refreshing timings.

---

## 2. User Experience & Visual Design

- **Overview & Prayer Times Cards**:
  - Unprayed expired prayers automatically show the red `Unfinished (Missed)` badge and `Mark (Qada)` action button.
- **Streamlined Timetable**:
  - `PrayerTimesView` contains a single responsive 6-card grid displaying start times, explicit limit ranges, status badges, and completion buttons.
- **Refresh Feedback Toast**:
  - Clicking "Refresh Timings" displays a floating toast notification in the bottom right corner (e.g. `✓ Timings refreshed successfully from AlAdhan Global Coordinates API`).

---

## 3. Technical Architecture & Component Changes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRAYER TIMES VIEW ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
      ┌────────────────────────────────┴────────────────────────────────┐
      ▼                                                                 ▼
┌───────────────────────────────┐                     ┌───────────────────────────────┐
│     PrayerTimesView Cards     │                     │     Refresh Toast Feedback    │
│ • Single 6-Card Grid          │                     │ • Floating Success/Error Toast│
│ • Start & Limit Range         │                     │ • Displays Active Provider    │
│ • Auto-Qada Red Status Badges │                     │ • Auto-dismiss in 3 seconds   │
└───────────────────────────────┘                     └───────────────────────────────┘
```

### 1. `src/components/views/PrayerTimesView.tsx`
- Remove lines 195–277 (`Complete Waqt Windows & Night Breakdown`).
- Add toast message state (`toastMsg`) to `handleRefreshClick`.
- Render a floating toast notification when refresh succeeds or fails.

### 2. `src/components/views/OverviewView.tsx`
- Ensure cards reflect expired waqts with `Unfinished (Missed)` status badges and `Mark (Qada)` actions.

---

## 4. Implementation Steps & Verification Plan

1. **`src/components/views/PrayerTimesView.tsx`**:
   - Remove duplicate bottom table block.
   - Add toast feedback to `handleRefreshClick`.

2. **`src/components/views/OverviewView.tsx`**:
   - Verify Qada badge and button rendering on expired waqts.

3. **Build & Package**:
   - Run `npm run build && node scripts/pack-extension.js`.
   - Co-execute `compile_applet` and `lint_applet` to verify zero errors.
