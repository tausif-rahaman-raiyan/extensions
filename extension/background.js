/**
 * Prayer Focus v2.2.21 — Background Service Worker
 * Handles alarm intervals, hourly quote rotation, and daily prayer updates.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Prayer Focus] Service worker installed v2.2.21');
  // Set up hourly quote rotation alarm
  chrome.alarms.create('hourly_quote_rotation', { periodInMinutes: 60 });
  // Set up daily prayer refresh alarm (every 6 hours)
  chrome.alarms.create('prayer_sync', { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourly_quote_rotation') {
    chrome.storage.local.set({ lastQuoteRotated: Date.now() });
  } else if (alarm.name === 'prayer_sync') {
    console.log('[Prayer Focus] Background prayer sync triggered');
  }
});
