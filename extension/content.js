/**
 * Prayer Focus v2.2.22 — Content Script
 * Displays Prayer Arrival Reminder and 5-minute Focus Mode on any active website tab.
 */

const DHIKRS = [
  { ar: 'سُبْحَانَ اللَّهِ', translit: 'SubhanAllah', bn: 'আল্লাহ অতি পবিত্র' },
  { ar: 'الْحَمْدُ لِلَّهِ', translit: 'Alhamdulillah', bn: 'সকল প্রশংসা আল্লাহর জন্য' },
  { ar: 'اللَّهُ أَكْبَرُ', translit: 'Allahu Akbar', bn: 'আল্লাহ সর্বশ্রেষ্ঠ' },
  { ar: 'أَسْتَغْفِرُ اللَّهَ', translit: 'Astaghfirullah', bn: 'আমি আল্লাহর কাছে ক্ষমা চাই' }
];

let focusInterval = null;
let currentSeconds = 300;
let tasbihCount = 0;
let activeDhikrIdx = 0;

function removeExistingModals() {
  const rem = document.getElementById('pf-reminder-root');
  if (rem) rem.remove();
  const foc = document.getElementById('pf-focus-root');
  if (foc) foc.remove();
  if (focusInterval) {
    clearInterval(focusInterval);
    focusInterval = null;
  }
}

function showPrayerReminder(data) {
  removeExistingModals();

  const root = document.createElement('div');
  root.id = 'pf-reminder-root';

  const prayerName = data.prayerName || 'Namaz';
  const timeWindow = data.timeWindow || '';
  const quote = data.quote || {
    arabic: 'إِنَّ أَوَّلَ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ مِنْ عَمَلِهِ صَلاَتُهُ',
    bengali: 'কিয়ামতের দিন সর্বপ্রথম মানুষের সালাতের হিসাব নেওয়া হবে। তা ঠিক থাকলে সে কামিয়াব হবে এবং মুক্তি পাবে।',
    ref: 'সুনান আত-তিরমিযী ৪১৩'
  };

  root.innerHTML = `
    <div class="pf-backdrop">
      <div class="pf-card">
        <div class="pf-header">
          <span class="pf-badge">Prayer Alert · সালাতের সময়</span>
          <span style="font-size:12px; color:#94a3b8;">${timeWindow}</span>
        </div>
        <h2 class="pf-title">It's ${prayerName} Namaz Time!</h2>
        <div style="font-size:12px; color:#34d399; margin-top:2px;">এখন ${prayerName} সালাত আদায়ের ওয়াক্ত</div>

        <div class="pf-quote-box">
          ${quote.arabic ? `<div class="pf-quote-arabic">${quote.arabic}</div>` : ''}
          <div class="pf-quote-bn">"${quote.bengali}"</div>
          <div class="pf-quote-ref">— ${quote.ref}</div>
        </div>

        <div class="pf-actions">
          <button class="pf-btn pf-btn-primary" id="pf-btn-prayed">
            ✓ Prayed (সালাত আদায় করেছি)
          </button>
          <button class="pf-btn pf-btn-later" id="pf-btn-later">
            ⏰ Pray later (Remind in 10 minutes)
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  document.getElementById('pf-btn-prayed')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'PRAYER_COMPLETED', prayerName });
    removeExistingModals();
  });

  document.getElementById('pf-btn-later')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'SNOOZE_REMINDER', prayerName, minutes: 10 });
    removeExistingModals();
  });
}

function showFocusMode(prayerName = 'Namaz') {
  removeExistingModals();

  currentSeconds = 300;
  tasbihCount = 0;
  activeDhikrIdx = 0;

  const root = document.createElement('div');
  root.id = 'pf-focus-root';

  const renderTimerText = () => {
    const m = Math.floor(currentSeconds / 60);
    const s = currentSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  root.innerHTML = `
    <div class="pf-fullscreen-focus">
      <div style="display:flex; justify-content:space-between; width:100%; max-width:600px; align-items:center;">
        <div>
          <h2 style="font-size:18px; font-weight:800; color:#fff; margin:0;">Prayer Focus Mode</h2>
          <div style="font-size:12px; color:#94a3b8;">Entering ${prayerName} Namaz · Mindful Connection</div>
        </div>
        <button id="pf-focus-close" style="background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
      </div>

      <div style="text-align:center; margin:auto 0;">
        <div class="pf-focus-timer" id="pf-timer-val">${renderTimerText()}</div>
        <div style="font-size:13px; color:#34d399; margin-bottom:16px;">5-Minute Tranquility Window</div>

        <div class="pf-tasbih-card">
          <div style="font-size:22px; color:#6ee7b7; font-family:serif; margin-bottom:4px;" id="pf-dhikr-ar">${DHIKRS[0].ar}</div>
          <div style="font-size:12px; color:#cbd5e1; margin-bottom:12px;" id="pf-dhikr-bn">${DHIKRS[0].bn}</div>
          <button id="pf-tasbih-tap" style="width:100%; padding:14px; background:#059669; color:#fff; border:none; border-radius:12px; font-size:16px; font-weight:700; cursor:pointer;">
            Tap Tasbih: <span id="pf-count">0</span> / 33
          </button>
        </div>

        <div style="font-size:12px; color:#94a3b8; max-width:400px; margin:0 auto; font-style:italic;">
          "হে আমার রব! আমাকে সালাত কায়েমকারী করুন এবং আমার সন্তানদের মধ্য থেকেও।" (সূরা ইব্রাহিম : ৪০)
        </div>
      </div>

      <div style="display:flex; gap:12px;">
        <button id="pf-focus-done" style="padding:12px 24px; background:#10b981; color:#022c22; font-weight:800; border:none; border-radius:12px; cursor:pointer; font-size:13px;">
          ✓ Mark ${prayerName} as Prayed & Exit
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  focusInterval = setInterval(() => {
    if (currentSeconds > 0) {
      currentSeconds--;
      const el = document.getElementById('pf-timer-val');
      if (el) el.textContent = renderTimerText();
    } else {
      clearInterval(focusInterval);
    }
  }, 1000);

  document.getElementById('pf-tasbih-tap')?.addEventListener('click', () => {
    tasbihCount++;
    const countEl = document.getElementById('pf-count');
    if (countEl) countEl.textContent = String(tasbihCount);

    if (tasbihCount >= 33) {
      tasbihCount = 0;
      activeDhikrIdx = (activeDhikrIdx + 1) % DHIKRS.length;
      const arEl = document.getElementById('pf-dhikr-ar');
      const bnEl = document.getElementById('pf-dhikr-bn');
      if (arEl) arEl.textContent = DHIKRS[activeDhikrIdx].ar;
      if (bnEl) bnEl.textContent = DHIKRS[activeDhikrIdx].bn;
      if (countEl) countEl.textContent = '0';
    }
  });

  document.getElementById('pf-focus-done')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'PRAYER_COMPLETED', prayerName });
    removeExistingModals();
  });

  document.getElementById('pf-focus-close')?.addEventListener('click', () => {
    removeExistingModals();
  });
}

// Listen to messages from background service worker or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'OPEN_PRAYER_REMINDER') {
    showPrayerReminder(msg);
    sendResponse({ status: 'shown' });
  } else if (msg.action === 'OPEN_FOCUS_MODE') {
    showFocusMode(msg.prayerName || 'Namaz');
    sendResponse({ status: 'shown' });
  }
});
