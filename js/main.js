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
  async requireAuth() {
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const session = await DB.getSession();
        if (session) {
          const profile = await DB.getProfile(session.user.id);
          if (profile) {
            if (profile.role === 'platform_admin') { window.location.href = 'admin.html'; return null; }
            const n = DB.normalizeProfile(profile);
            const u = { userId: n.id, email: n.email, orgName: n.orgName, name: n.name, role: n.role, orgId: n.orgId, loginTime: PLATFORM.get('currentUser')?.loginTime || new Date().toISOString() };
            PLATFORM.store('currentUser', u);
            return u;
          }
        }
      } catch(e) { console.warn('[PLATFORM] requireAuth DB check failed:', e.message); }
      // No valid DB session — clear stale localStorage to break any redirect loop
      PLATFORM.remove('currentUser');
      window.location.href = 'auth.html';
      return null;
    }
    // localStorage fallback
    const user = PLATFORM.get('currentUser');
    if (!user) { window.location.href = 'auth.html'; return null; }
    if (user.isAdmin) { window.location.href = 'admin.html'; return null; }
    return user;
  },

  // --- Admin guard ---
  async requireAdmin() {
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const session = await DB.getSession();
        if (session) {
          const profile = await DB.getProfile(session.user.id);
          if (profile && profile.role === 'platform_admin') {
            const u = { userId: profile.id, email: profile.email, name: profile.full_name || 'Platform Administrator', isAdmin: true, dbAuthenticated: true, loginTime: new Date().toISOString() };
            PLATFORM.store('currentUser', u);
            return u;
          }
          // Logged in as a regular user — send to dashboard
          window.location.href = 'dashboard.html'; return null;
        }
      } catch(e) { console.warn('[PLATFORM] requireAdmin DB check failed:', e.message); }
      // No DB session — fall through to localStorage rather than forcing logout
    }
    // localStorage fallback (covers pre-Supabase admin accounts)
    const user = PLATFORM.get('currentUser');
    if (!user || !user.isAdmin) { window.location.href = 'auth.html'; return null; }
    return { ...user, dbAuthenticated: false };
  },

  // --- Get initials from name ---
  initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  // --- Migrate legacy user records to add role/orgId fields ---
  migrateUsers() {
    const users = this.get('users', {});
    let changed = false;
    Object.values(users).forEach(u => {
      if (!u.role)  { u.role  = 'company_admin'; changed = true; }
      if (!u.orgId) { u.orgId = u.id;            changed = true; }
    });
    if (changed) this.store('users', users);
  },

  // --- Seed default content (runs once) ---
  seedDefaults() {
    if (PLATFORM.get('defaults_seeded')) return;
    // Default platform settings with approval required
    if (!PLATFORM.get('platform_settings')) {
      PLATFORM.store('platform_settings', {
        requireApproval: true, registrationOpen: true,
        platformName: 'Fidelity Compliance Platform',
        supportEmail: 'support@fidelityassessors.mw',
        dpoEmail: 'dpo@fidelityassessors.mw'
      });
    }
    if (!PLATFORM.get('news_items')) {
      PLATFORM.store('news_items', [
        { id: 'n1', date: '3 June 2024', badge: 'Major', badgeClass: 'badge-danger', title: 'Data Protection Act 2024 Officially Commences', body: "Malawi's Data Protection Act came into force on 3 June 2024. MACRA was formally designated as the data protection authority. All organizations processing personal data of Malawian individuals are now legally bound by its provisions.", link: 'https://macra.mw/wpfd_file/data-protection-act-2024/', linkText: 'Read the Act ↗', published: true },
        { id: 'n2', date: '2024–2025', badge: 'Registration', badgeClass: 'badge-warning', title: 'MACRA Opens Registration for Data Controllers & Processors', body: 'Organizations that process data of more than 10,000 individuals, or data of national significance, are required to register with MACRA before processing commences. Failure to register is a criminal offence under the Act.', link: 'https://www.dpa.mw/', linkText: 'Visit DPA Malawi ↗', published: true },
        { id: 'n3', date: '2025', badge: 'Digital Banking', badgeClass: 'badge-teal', title: 'Digital Bank Directive 2025 Includes Data Privacy Requirements', body: "The RBM's Financial Services Directive 2025 mandates that digital banks maintain cybersecurity risk management and data privacy standards aligned with the DPA 2024.", link: 'https://www.rbm.mw/', linkText: 'RBM Website ↗', published: true }
      ]);
    }
    if (!PLATFORM.get('doc_library')) {
      PLATFORM.store('doc_library', [
        { id: 'd1', title: 'Malawi Data Protection Act 2024', desc: 'Official gazette version of the Act as enacted on 3 June 2024.', type: 'Act', url: 'https://macra.mw/wpfd_file/data-protection-act-2024/', date: '2024-06-03' },
        { id: 'd2', title: 'DPA 2024 Compliance Checklist', desc: 'Our comprehensive 65-question compliance audit checklist covering all 12 obligation areas.', type: 'Tool', url: 'audit.html', date: '2025-01-01' },
        { id: 'd3', title: 'Record of Processing Activities (RoPA) Template', desc: 'Standard template for documenting your organization\'s processing activities as required by Section 56 DPA 2024.', type: 'Template', url: '#', date: '2025-01-01' },
        { id: 'd4', title: 'Data Protection Impact Assessment (DPIA) Guide', desc: 'Step-by-step guide for conducting DPIAs for high-risk processing activities under Section 54 DPA 2024.', type: 'Guide', url: '#', date: '2025-01-01' },
        { id: 'd5', title: 'Privacy Notice Template', desc: 'Customizable privacy notice template compliant with transparency requirements of Section 28 DPA 2024.', type: 'Template', url: '#', date: '2025-01-01' },
        { id: 'd6', title: 'Data Breach Response Plan', desc: 'Template incident response plan meeting the 72-hour breach notification requirement under Section 50 DPA 2024.', type: 'Template', url: '#', date: '2025-01-01' }
      ]);
    }
    PLATFORM.store('defaults_seeded', true);
  }
};

// =============================================================================
// Auth state check on page load (for protected pages)
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  PLATFORM.seedDefaults();
  PLATFORM.migrateUsers();
  if (typeof DB !== 'undefined') DB.init();

  const el = document.getElementById('days-elapsed');
  if (el) { el.textContent = PLATFORM.daysSince('2024-06-03') + ' Days'; }

  const todayEl = document.getElementById('today-date');
  if (todayEl) todayEl.textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
});
