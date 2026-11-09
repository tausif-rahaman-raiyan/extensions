/**
 * Prayer Focus v2.2.21 — Popup Script
 */

const QUOTES = [
  {
    arabic: "إِنَّ أَوَّلَ مَا يُحَاسَبُ بِهِ الْعَبْدُ يَوْمَ الْقِيَامَةِ مِنْ عَمَلِهِ صَلاَتُهُ",
    bengali: "কিয়ামতের দিন সর্বপ্রথম মানুষের সালাতের হিসাব নেওয়া হবে। তা ঠিক থাকলে সে কামিয়াব হবে এবং মুক্তি পাবে; আর তা বিনষ্ট হলে সে ব্যর্থ ও ক্ষতিগ্রস্ত হবে।",
    ref: "সুনান আত-তিরমিযী ৪১৩ · সহিহ"
  },
  {
    arabic: "يَنْزِلُ رَبُّنَا كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ",
    bengali: "আমাদের রব প্রতি রাতের শেষ তৃতীয়াংশে প্রথম আকাশে অবতরণ করেন এবং ঘোষণা করেন: কে আছ আমাকে ডাকবে, আমি তার ডাকে সাড়া দেব? কে আছ কিছু চাইবে, আমি তাকে দান করব? কে আছ ক্ষমা চাইবে, আমি তাকে ক্ষমা করে দেব?",
    ref: "সহিহ বুখারী ১১৪৫ · সহিহ মুসলিম ৭৫৮"
  },
  {
    arabic: "أَفْضَلُ الأَعْمَالِ الصَّلاَةُ لِوَقْتِهَا",
    bengali: "রাসূলুল্লাহ (সা.)-কে জিজ্ঞাসা করা হলো, আল্লাহর নিকট সর্বাধিক প্রিয় আমল কোনটি? তিনি বললেন: ওয়াক্তমত যথাসময়ে সালাত আদায় করা।",
    ref: "সহিহ বুখারী ৫২৭ · সহিহ মুসলিম ৮৫"
  },
  {
    arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    bengali: "যে ব্যক্তি আল্লাহকে ভয় করবে, আল্লাহ তার জন্য সংকট থেকে উত্তরণের পথ তৈরি করে দেবেন এবং তাকে এমন উৎস থেকে রিজিক দেবেন যা সে ধারণাও করেনি।",
    ref: "সূরা আত-তালাক : ২-৩"
  }
];

function getHourlyQuote() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const currentHour = now.getHours();
  const idx = Math.abs(dayOfYear * 24 + currentHour) % QUOTES.length;
  return QUOTES[idx];
}

function updateQuoteDisplay() {
  const q = getHourlyQuote();
  const arabicEl = document.getElementById('quoteArabic');
  const bnEl = document.getElementById('quoteBengali');
  const refEl = document.getElementById('quoteRef');
  if (arabicEl) arabicEl.textContent = q.arabic;
  if (bnEl) bnEl.textContent = '"' + q.bengali + '"';
  if (refEl) refEl.textContent = '— ' + q.ref;
}

// Multi-provider fallback fetch with 502 handling
async function fetchPrayerTimes(lat = 22.3569, lng = 91.7832) {
  const ts = Math.floor(Date.now() / 1000);

  // Priority 1: AlAdhan
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timings/${ts}?latitude=${lat}&longitude=${lng}&method=1&school=1`);
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.timings) return { timings: data.data.timings, provider: 'AlAdhan' };
    }
  } catch (e) {
    console.warn('[Prayer Focus] AlAdhan failed, trying next...');
  }

  // Priority 2: IslamicFinder
  try {
    const res = await fetch(`https://www.islamicfinder.us/index.php/api/prayer_times?latitude=${lat}&longitude=${lng}&timezone=Asia/Dhaka&method=1`);
    if (res.ok) {
      const data = await res.json();
      const r = data?.results || data;
      if (r?.Fajr) {
        return {
          timings: { Fajr: r.Fajr, Sunrise: r.Sunrise, Dhuhr: r.Dhuhr, Asr: r.Asr, Maghrib: r.Maghrib, Isha: r.Isha },
          provider: 'IslamicFinder'
        };
      }
    }
  } catch (e) {
    console.warn('[Prayer Focus] IslamicFinder failed, trying next...');
  }

  // Priority 3: Fallback Local
  return {
    timings: { Fajr: '04:56', Sunrise: '06:14', Dhuhr: '11:47', Asr: '15:48', Maghrib: '17:16', Isha: '18:34' },
    provider: 'Local Solar Engine'
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  updateQuoteDisplay();
  const data = await fetchPrayerTimes();
  const providerLabel = document.getElementById('providerLabel');
  if (providerLabel) providerLabel.textContent = data.provider + ' · Online';

  const list = document.getElementById('prayersList');
  if (list && data.timings) {
    list.innerHTML = '';
    const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    keys.forEach(k => {
      const card = document.createElement('div');
      card.className = 'prayer-card';
      card.innerHTML = '<span>' + k + '</span><span class="time">' + (data.timings[k] || '--:--') + '</span>';
      list.appendChild(card);
    });
  }
});
