// =============================================================================
// Fidelity Compliance Platform — Shared Utilities
// =============================================================================

const PLATFORM = {
  STORAGE_PREFIX: 'fcp_',
  VERSION: '1.0',

  // --- Storage helpers ---
  store(key, val) {
    try { localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(val)); } catch(e) {}
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.STORAGE_PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(this.STORAGE_PREFIX + key); } catch(e) {}
  },

  // --- Date helpers ---
  today() { return new Date().toISOString().split('T')[0]; },
  formatDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }); }
    catch(e) { return iso; }
  },
  formatDateTime(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch(e) { return iso; }
  },
  daysSince(iso) {
    if (!iso) return 0;
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  },
  timeAgo(iso) {
    if (!iso) return '—';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 2)  return 'just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hour${hrs>1?'s':''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} day${days>1?'s':''} ago`;
    return PLATFORM.formatDate(iso);
  },

  // --- HTML escaping ---
  esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  },

  // --- Toast notification ---
  toast(msg, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    el.style.pointerEvents = 'auto';
    clearTimeout(PLATFORM._toastTimer);
    PLATFORM._toastTimer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.pointerEvents = 'none';
    }, duration);
  },

  // --- Auth guard (redirect if not logged in) ---
  requireAuth() {
    const user = PLATFORM.get('currentUser');
    if (!user) { window.location.href = 'auth.html'; return null; }
    return user;
  },

  // --- Get initials from name ---
  initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
};

// =============================================================================
// Auth state check on page load (for protected pages)
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Update nav urgency: days since act came into force
  const el = document.getElementById('days-elapsed');
  if (el) {
    const days = PLATFORM.daysSince('2024-06-03');
    el.textContent = days + ' Days';
  }

  // Set today's date
  const todayEl = document.getElementById('today-date');
  if (todayEl) todayEl.textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
});
