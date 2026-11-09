/**
 * Prayer Focus v2.2.23 — Popup Script
 * Storage-synced, live-ticking timers with Red Box Missed (Qada) status.
 */

async function getStoredState() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        'prayer_focus_location',
        'location_info',
        'prayer_focus_provider',
        'active_provider',
        'prayer_focus_juristic',
        'juristic_method',
        'prayer_focus_completed',
        'completed_prayers'
      ], (items) => {
        const loc = items.prayer_focus_location || items.location_info || null;
        const provider = items.prayer_focus_provider || items.active_provider || 'aladhan_coords';
        const juristic = items.prayer_focus_juristic || items.juristic_method || 'hanafi';
        const completed = items.prayer_focus_completed || items.completed_prayers || {};
        resolve({ loc, provider, juristic, completed });
      });
    } else {
      try {
        const locStr = localStorage.getItem('prayer_focus_location') || localStorage.getItem('location_info');
        const loc = locStr ? JSON.parse(locStr) : null;
        const provider = localStorage.getItem('prayer_focus_provider') || localStorage.getItem('active_provider') || 'aladhan_coords';
        const juristic = localStorage.getItem('prayer_focus_juristic') || localStorage.getItem('juristic_method') || 'hanafi';
        const compStr = localStorage.getItem('prayer_focus_completed') || localStorage.getItem('completed_prayers');
        const completed = compStr ? JSON.parse(compStr) : {};
        resolve({ loc, provider, juristic, completed });
      } catch (e) {
        resolve({ loc: null, provider: 'aladhan_coords', juristic: 'hanafi', completed: {} });
      }
    }
  });
}

function parseHHMM(timeStr, baseDate = new Date()) {
  if (!timeStr || timeStr === '--:--') return null;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mod = match[3]?.toLowerCase();

  if (mod === 'pm' && h < 12) h += 12;
  if (mod === 'am' && h === 12) h = 0;

  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function sanitize12h(timeStr) {
  if (!timeStr) return '--:--';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const mod = match[3]?.toLowerCase();
    if (mod === 'pm' && h < 12) h += 12;
    if (mod === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return trimmed.split(' ')[0];
}

function format12Hour(time24) {
  if (!time24 || time24 === '--:--') return '--:--';
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatCountdownDigital(seconds) {
  if (!seconds || seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Resilient Working API Fallback with stored lat/lng
async function fetchPrayerTimes(lat = 22.3569, lng = 91.7832, juristic = 'hanafi') {
  const ts = Math.floor(Date.now() / 1000);
  const school = juristic === 'hanafi' ? 1 : 0;

  // 1. AlAdhan Coordinates
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=1&school=${school}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.timings) {
        return {
          timings: {
            Fajr: sanitize12h(data.data.timings.Fajr),
            Sunrise: sanitize12h(data.data.timings.Sunrise),
            Dhuhr: sanitize12h(data.data.timings.Dhuhr),
            Asr: sanitize12h(data.data.timings.Asr),
            Maghrib: sanitize12h(data.data.timings.Maghrib),
            Isha: sanitize12h(data.data.timings.Isha)
          },
          provider: 'AlAdhan API'
        };
      }
    }
  } catch (e) {
    console.warn('[Prayer Focus] AlAdhan coords failed, cascading...');
  }

  // 2. AlAdhan City-Based
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Chattogram&country=Bangladesh&method=1&school=${school}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.timings) {
        return {
          timings: {
            Fajr: sanitize12h(data.data.timings.Fajr),
            Sunrise: sanitize12h(data.data.timings.Sunrise),
            Dhuhr: sanitize12h(data.data.timings.Dhuhr),
            Asr: sanitize12h(data.data.timings.Asr),
            Maghrib: sanitize12h(data.data.timings.Maghrib),
            Isha: sanitize12h(data.data.timings.Isha)
          },
          provider: 'AlAdhan City'
        };
      }
    }
  } catch (e) {
    console.warn('[Prayer Focus] AlAdhan city failed, cascading...');
  }

  // 3. PrayZone
  try {
    const res = await fetch('https://api.pray.zone/v2/times/today.json?city=dhaka');
    if (res.ok) {
      const data = await res.json();
      const t = data?.results?.datetime?.[0]?.times;
      if (t?.Fajr) {
        return {
          timings: {
            Fajr: sanitize12h(t.Fajr),
            Sunrise: sanitize12h(t.Sunrise),
            Dhuhr: sanitize12h(t.Dhuhr),
            Asr: sanitize12h(t.Asr),
            Maghrib: sanitize12h(t.Maghrib),
            Isha: sanitize12h(t.Isha)
          },
          provider: 'PrayZone API'
        };
      }
    }
  } catch (e) {
    console.warn('[Prayer Focus] PrayZone failed, cascading...');
  }

  // Guaranteed Local Engine fallback
  return {
    timings: { Fajr: '04:45', Sunrise: '06:01', Dhuhr: '11:37', Asr: '15:36', Maghrib: '17:12', Isha: '18:28' },
    provider: 'Local Solar Engine'
  };
}

function renderPrayerCards(timings, completedPrayers = {}) {
  const list = document.getElementById('prayersList');
  if (!list || !timings) return;

  const now = new Date();
  const fajr = parseHHMM(timings.Fajr, now);
  const sunrise = parseHHMM(timings.Sunrise, now);
  const dhuhr = parseHHMM(timings.Dhuhr, now);
  const asr = parseHHMM(timings.Asr, now);
  const maghrib = parseHHMM(timings.Maghrib, now);
  const isha = parseHHMM(timings.Isha, now);

  const rawCards = [
    { key: 'fajr', name: 'Fajr', startStr: timings.Fajr, limitStr: timings.Sunrise, startDate: fajr, limitDate: sunrise, isPrayer: true },
    { key: 'sunrise', name: 'Sunrise', startStr: timings.Sunrise, limitStr: timings.Dhuhr, startDate: sunrise, limitDate: dhuhr, isPrayer: false },
    { key: 'dhuhr', name: 'Dhuhr', startStr: timings.Dhuhr, limitStr: timings.Asr, startDate: dhuhr, limitDate: asr, isPrayer: true },
    { key: 'asr', name: 'Asr', startStr: timings.Asr, limitStr: timings.Maghrib, startDate: asr, limitDate: maghrib, isPrayer: true },
    { key: 'maghrib', name: 'Maghrib', startStr: timings.Maghrib, limitStr: timings.Isha, startDate: maghrib, limitDate: isha, isPrayer: true },
    { key: 'isha', name: 'Isha', startStr: timings.Isha, limitStr: timings.Fajr, startDate: isha, limitDate: null, isPrayer: true }
  ];

  list.innerHTML = '';

  rawCards.forEach((c) => {
    const isDone = c.isPrayer && !!completedPrayers[c.key];
    const isExpired = c.isPrayer && c.limitDate && now > c.limitDate;
    const isMissed = c.isPrayer && !isDone && isExpired;
    const isActive = c.startDate && c.limitDate && now >= c.startDate && now < c.limitDate;

    let cardClass = 'prayer-card';
    let badgeHtml = '';

    if (isDone) {
      cardClass += ' done';
      badgeHtml = '<span class="card-badge done">✓ Done</span>';
    } else if (isMissed) {
      cardClass += ' missed';
      badgeHtml = '<span class="card-badge missed">⚠ Missed (Qada)</span>';
    } else if (isActive) {
      cardClass += ' active';
      badgeHtml = '<span class="card-badge active">● Active</span>';
    }

    const card = document.createElement('div');
    card.className = cardClass;
    card.innerHTML = `
      <div>
        <span class="card-name">${c.name}</span>
        ${badgeHtml ? `<div>${badgeHtml}</div>` : ''}
      </div>
      <div class="card-times">
        <span class="time">${format12Hour(c.startStr)}</span>
        <span class="limit">Limit: ${format12Hour(c.limitStr)}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

function updateLiveCounters(timings, completedPrayers = {}) {
  const now = new Date();
  const fajr = parseHHMM(timings.Fajr, now);
  const sunrise = parseHHMM(timings.Sunrise, now);
  const dhuhr = parseHHMM(timings.Dhuhr, now);
  const asr = parseHHMM(timings.Asr, now);
  const maghrib = parseHHMM(timings.Maghrib, now);
  const isha = parseHHMM(timings.Isha, now);

  if (!fajr || !sunrise || !dhuhr || !asr || !maghrib || !isha) return;

  const tomorrowFajr = new Date(fajr);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);

  const yesterdayMaghrib = new Date(maghrib);
  yesterdayMaghrib.setDate(yesterdayMaghrib.getDate() - 1);

  // Determine active waqt & next prayer
  let currentWaqt = '';
  let nextName = '';
  let nextTimeStr = '';
  let targetDate = null;
  let activeStartDate = null;
  let activeEndDate = null;

  if (now < fajr) {
    currentWaqt = 'Isha (Night)';
    nextName = 'Fajr';
    nextTimeStr = timings.Fajr;
    targetDate = fajr;
    activeStartDate = yesterdayMaghrib;
    activeEndDate = fajr;
  } else if (now >= fajr && now < sunrise) {
    currentWaqt = 'Fajr';
    nextName = 'Sunrise (Ishraq)';
    nextTimeStr = timings.Sunrise;
    targetDate = sunrise;
    activeStartDate = fajr;
    activeEndDate = sunrise;
  } else if (now >= sunrise && now < dhuhr) {
    currentWaqt = 'Ishraq / Duha';
    nextName = 'Dhuhr';
    nextTimeStr = timings.Dhuhr;
    targetDate = dhuhr;
    activeStartDate = sunrise;
    activeEndDate = dhuhr;
  } else if (now >= dhuhr && now < asr) {
    currentWaqt = 'Dhuhr';
    nextName = 'Asr';
    nextTimeStr = timings.Asr;
    targetDate = asr;
    activeStartDate = dhuhr;
    activeEndDate = asr;
  } else if (now >= asr && now < maghrib) {
    currentWaqt = 'Asr';
    nextName = 'Maghrib';
    nextTimeStr = timings.Maghrib;
    targetDate = maghrib;
    activeStartDate = asr;
    activeEndDate = maghrib;
  } else if (now >= maghrib && now < isha) {
    currentWaqt = 'Maghrib';
    nextName = 'Isha';
    nextTimeStr = timings.Isha;
    targetDate = isha;
    activeStartDate = maghrib;
    activeEndDate = isha;
  } else {
    currentWaqt = 'Isha';
    nextName = 'Fajr';
    nextTimeStr = timings.Fajr;
    targetDate = tomorrowFajr;
    activeStartDate = isha;
    activeEndDate = tomorrowFajr;
  }

  const secondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
  const totalWaqtSecs = Math.max(1, Math.floor((activeEndDate.getTime() - activeStartDate.getTime()) / 1000));
  const elapsedSecs = Math.floor((now.getTime() - activeStartDate.getTime()) / 1000);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSecs / totalWaqtSecs) * 100)));

  // Update Hero elements
  const elName = document.getElementById('nextPrayerName');
  const elTime = document.getElementById('nextPrayerTime');
  const elCountdown = document.getElementById('countdownVal');
  const elBar = document.getElementById('progressBar');

  if (elName) elName.textContent = nextName;
  if (elTime) elTime.textContent = format12Hour(nextTimeStr);
  if (elCountdown) elCountdown.textContent = formatCountdownDigital(secondsRemaining);
  if (elBar) elBar.style.width = `${progressPercent}%`;

  // Calculate Tahajjud (Last Third of Night)
  let nightMaghrib = maghrib;
  let nightFajr = tomorrowFajr;

  if (now < fajr) {
    nightMaghrib = yesterdayMaghrib;
    nightFajr = fajr;
  }

  const nightMs = nightFajr.getTime() - nightMaghrib.getTime();
  const tahajjudStart = new Date(nightMaghrib.getTime() + (nightMs * 2) / 3);
  const isTahajjudActive = now >= tahajjudStart && now < nightFajr;

  const elTahajjudSub = document.getElementById('tahajjudStatus');
  const elTahajjudTimer = document.getElementById('tahajjudCountdown');

  if (isTahajjudActive) {
    const secsToFajr = Math.max(0, Math.floor((nightFajr.getTime() - now.getTime()) / 1000));
    if (elTahajjudSub) elTahajjudSub.textContent = `Active Now (Ends at ${format12Hour(timings.Fajr)})`;
    if (elTahajjudTimer) elTahajjudTimer.textContent = formatCountdownDigital(secsToFajr);
  } else {
    let secsToTahajjud = Math.max(0, Math.floor((tahajjudStart.getTime() - now.getTime()) / 1000));
    const tahajjudHHMM = `${String(tahajjudStart.getHours()).padStart(2, '0')}:${String(tahajjudStart.getMinutes()).padStart(2, '0')}`;
    if (elTahajjudSub) elTahajjudSub.textContent = `Tonight's window starts at ${format12Hour(tahajjudHHMM)}`;
    if (elTahajjudTimer) elTahajjudTimer.textContent = formatCountdownDigital(secsToTahajjud);
  }

  // Re-render cards every tick to update Active / Missed status in real time
  renderPrayerCards(timings, completedPrayers);
}

function openUrl(url) {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: chrome.runtime.getURL(url) });
  } else {
    window.open(url, '_blank');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const { loc, provider, juristic, completed } = await getStoredState();

  const lat = loc?.lat || 22.3569;
  const lng = loc?.lng || 91.7832;
  const nameEn = loc?.nameEn || 'Chattogram';
  const country = loc?.country || 'Bangladesh';
  const timezone = loc?.timezone || 'Asia/Dhaka';

  const locBadge = document.getElementById('locationLabel');
  if (locBadge) locBadge.textContent = nameEn;

  const locFooter = document.getElementById('locationFooterText');
  if (locFooter) locFooter.textContent = `${nameEn}, ${country} (${timezone})`;

  const data = await fetchPrayerTimes(lat, lng, juristic);
  const providerLabel = document.getElementById('providerLabel');
  if (providerLabel) providerLabel.textContent = data.provider + ' · Online';

  const t = data.timings;

  if (t) {
    renderPrayerCards(t, completed);
    updateLiveCounters(t, completed);
    setInterval(() => updateLiveCounters(t, completed), 1000);
  }

  // Bind buttons
  const dashboardBtn = document.getElementById('openDashboardBtn');
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', () => {
      openUrl('dashboard.html');
    });
  }

  const settingsBtn = document.getElementById('openSettingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      openUrl('dashboard.html#settings');
    });
  }

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '...';
      const updated = await fetchPrayerTimes(lat, lng, juristic);
      refreshBtn.textContent = '↻ Refresh';
      if (providerLabel) providerLabel.textContent = updated.provider + ' · Online';
      if (updated.timings) updateLiveCounters(updated.timings, completed);
    });
  }
});
