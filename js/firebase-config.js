/* ==========================================================================
   SUPERMART RETAIL - FIREBASE CONFIGURATION & DATABASE HELPERS
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCe4O8XGAri5bbLV0j8NCFN6UqRq9W-fh0",
  authDomain: "play-zone-3e22f.firebaseapp.com",
  databaseURL: "https://play-zone-3e22f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "play-zone-3e22f",
  storageBucket: "play-zone-3e22f.firebasestorage.app",
  messagingSenderId: "26800447077",
  appId: "1:26800447077:web:8e5b22b291a3fa9527308c",
  measurementId: "G-F1D3HP6SD2"
};

let db = null;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    if (db.enablePersistence) {
      db.enablePersistence().catch(err => console.warn("Firestore offline persistence warning:", err));
    }
    console.log("⚡ Firebase Firestore Realtime Database initialized successfully");
  }
} catch (err) {
  console.warn("Firebase initialization warning (fallback to local state):", err);
}

export { db };

// Helper date key YYYY-MM-DD
export function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Toast notification helper
export function showToast(message, type = 'indigo') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const borderColors = {
    emerald: 'border-emerald-500/80 bg-emerald-950/90 text-emerald-200',
    rose: 'border-rose-500/80 bg-rose-950/90 text-rose-200',
    amber: 'border-amber-500/80 bg-amber-950/90 text-amber-200',
    indigo: 'border-indigo-500/80 bg-indigo-950/90 text-indigo-200',
    cyan: 'border-cyan-500/80 bg-cyan-950/90 text-cyan-200'
  };

  const icons = {
    emerald: 'fa-circle-check text-emerald-400',
    rose: 'fa-triangle-exclamation text-rose-400',
    amber: 'fa-circle-exclamation text-amber-400',
    indigo: 'fa-info-circle text-indigo-400',
    cyan: 'fa-location-dot text-cyan-400'
  };

  const styleClass = borderColors[type] || borderColors.indigo;
  const iconClass = icons[type] || icons.indigo;

  toast.className = `toast-item border shadow-2xl rounded-2xl p-3.5 text-xs font-bold flex items-center gap-3 backdrop-blur-xl ${styleClass}`;
  toast.innerHTML = `<i class="fa-solid ${iconClass} text-base"></i> <span class="flex-1">${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
