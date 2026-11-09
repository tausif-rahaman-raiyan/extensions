/**
 * Prayer Focus v2.2.22 — Background Service Worker
 * Handles alarm intervals, hourly quote rotation, prayer arrival alerts, and snooze reminders.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Prayer Focus] Service worker installed v2.2.22');
  // Set up hourly quote rotation alarm
  chrome.alarms.create('hourly_quote_rotation', { periodInMinutes: 60 });
  // Set up daily prayer refresh alarm (every 6 hours)
  chrome.alarms.create('prayer_sync', { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourly_quote_rotation') {
    chrome.storage.local.set({ lastQuoteRotated: Date.now() });
  } else if (alarm.name.startsWith('snooze_')) {
    // Notify active tabs about snoozed prayer
    const prayerName = alarm.name.replace('snooze_', '');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'OPEN_PRAYER_REMINDER',
          prayerName,
          timeWindow: 'Snooze Alert'
        });
      }
    });
  }
});

// Runtime messages from content script or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'PRAYER_COMPLETED') {
    const today = new Date().toISOString().split('T')[0];
    const key = `prayer_focus_completed_${today}`;
    chrome.storage.local.get([key], (res) => {
      const current = res[key] || {};
      current[msg.prayerName?.toLowerCase() || 'fajr'] = true;
      chrome.storage.local.set({ [key]: current });
    });
    sendResponse({ success: true });
  } else if (msg.action === 'SNOOZE_REMINDER') {
    const alarmName = `snooze_${msg.prayerName || 'prayer'}`;
    chrome.alarms.create(alarmName, { delayInMinutes: msg.minutes || 10 });
    sendResponse({ success: true, snoozed: true });
  }
});
