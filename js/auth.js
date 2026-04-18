// =============================================================================
// Fidelity Compliance Platform — Authentication Logic
// localStorage-based simulation (production requires secure backend)
// =============================================================================

const Auth = {

  // Admin credentials (demo — production requires server-side auth)
  ADMIN_EMAIL: 'admin@fidelityassessors.mw',
  _adminHash: null,
  getAdminHash() {
    if (!this._adminHash) this._adminHash = this.simpleHash('FidelityAdmin@2024!');
    return this._adminHash;
  },

  // ---------------------------------------------------------------------------
  // Tab switching (Login / Register)
  // ---------------------------------------------------------------------------
  showTab(tab) {
    ['login', 'signup'].forEach(t => {
      document.getElementById('tab-' + t).classList.toggle('active', t === tab);
      document.getElementById('panel-' + t).classList.toggle('active', t === tab);
    });
    // If URL has #signup, switch to register
    if (tab === 'signup') history.replaceState(null, '', '#signup');
    else history.replaceState(null, '', '#login');
  },

  // ---------------------------------------------------------------------------
  // Toggle password visibility
  // ---------------------------------------------------------------------------
  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁';
  },

  // ---------------------------------------------------------------------------
  // Password strength checker
  // ---------------------------------------------------------------------------
  checkPasswordStrength(val) {
    const fill = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    if (!fill || !label) return;
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { pct: '0%',   color: 'transparent', text: '' },
      { pct: '25%',  color: '#e74c3c', text: 'Weak' },
      { pct: '50%',  color: '#e67e22', text: 'Fair' },
      { pct: '75%',  color: '#f4a620', text: 'Good' },
      { pct: '90%',  color: '#27ae60', text: 'Strong' },
      { pct: '100%', color: '#0d7a5f', text: 'Very Strong' }
    ];
    const lvl = levels[Math.min(score, 5)];
    fill.style.width = lvl.pct;
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
  },

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------
  async register(e) {
    e.preventDefault();
    const msg = document.getElementById('signup-message');
    const btn = document.getElementById('signup-btn');

    const orgName  = document.getElementById('reg-orgname').value.trim();
    const sector   = document.getElementById('reg-sector').value;
    const size     = document.getElementById('reg-size').value;
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass     = document.getElementById('reg-password').value;
    const pass2    = document.getElementById('reg-password2').value;
    const terms    = document.getElementById('reg-terms').checked;

    // Validations
    if (!orgName) { this.showMsg(msg, 'error', 'Please enter your organization name.'); return; }
    if (!sector)  { this.showMsg(msg, 'error', 'Please select your sector.'); return; }
    if (!name)    { this.showMsg(msg, 'error', 'Please enter your full name.'); return; }
    if (!email || !email.includes('@')) { this.showMsg(msg, 'error', 'Please enter a valid email address.'); return; }
    if (pass.length < 8) { this.showMsg(msg, 'error', 'Password must be at least 8 characters.'); return; }
    if (pass !== pass2)  { this.showMsg(msg, 'error', 'Passwords do not match.'); return; }
    if (!terms) { this.showMsg(msg, 'error', 'You must accept the Terms of Service and Privacy Policy to proceed.'); return; }

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    // DB path (Supabase)
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const data = await DB.signUp(email, pass);
        // Note: disable email confirmation in Supabase project settings for this flow
        const userId = data.user.id;
        const now = new Date().toISOString();
        const settings = await DB.getSettings();
        const requireApproval = settings.requireApproval === true || settings.requireApproval === 'true';
        const status = requireApproval ? 'pending' : 'active';
        const org = await DB.createOrg(orgName, sector, size, '', 'free');
        await DB.createProfile(userId, email, name, org.id, 'company_admin', status);
        await DB.logActivity(userId, 'registration', `${orgName} account created`);
        if (status === 'pending') {
          this.showMsg(msg, 'success', 'Account created! Pending admin approval — you will be notified when activated.');
          setTimeout(() => { window.location.href = 'auth.html'; }, 2200);
        } else {
          const session = { userId, email, orgName, name, role: 'company_admin', orgId: org.id, loginTime: now };
          PLATFORM.store('currentUser', session);
          this.showMsg(msg, 'success', 'Account created! Redirecting to your dashboard...');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
        }
      } catch(err) {
        this.showMsg(msg, 'error', err.message);
        btn.textContent = 'Create Account'; btn.disabled = false;
      }
      return;
    }

    // localStorage fallback
    const users = PLATFORM.get('users', {});
    if (users[email]) { this.showMsg(msg, 'error', 'An account with this email already exists. Please sign in instead.'); btn.textContent = 'Create Account'; btn.disabled = false; return; }

    setTimeout(() => {
      const userId = 'u_' + Date.now();
      const now = new Date().toISOString();
      const settings = PLATFORM.get('platform_settings', {});
      users[email] = {
        id: userId, email, name,
        passwordHash: this.simpleHash(pass),
        orgName, sector, size,
        address: '', contactRole: '', contactPhone: '',
        registeredAt: now, lastLogin: now,
        plan: 'free',
        status: settings.requireApproval ? 'pending' : 'active',
        role: 'company_admin', orgId: userId
      };
      PLATFORM.store('users', users);
      this.logActivity(userId, 'registration', `${orgName} account created`);
      if (settings.requireApproval) {
        this.showMsg(msg, 'success', 'Account created! Pending admin approval — you will be notified when activated.');
        setTimeout(() => { window.location.href = 'auth.html'; }, 2200);
      } else {
        const session = { userId, email, orgName, name, loginTime: now };
        PLATFORM.store('currentUser', session);
        this.showMsg(msg, 'success', 'Account created! Redirecting to your dashboard...');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
      }
    }, 600);
  },

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async login(e) {
    e.preventDefault();
    const msg = document.getElementById('login-message');
    const btn = document.getElementById('login-btn');

    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('remember-me').checked;

    if (!email || !password) {
      this.showMsg(msg, 'error', 'Please enter your email and password.');
      return;
    }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    // DB path
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const data    = await DB.signIn(email, password);
        const profile = await DB.getProfile(data.user.id);
        if (!profile) throw new Error('Account profile not found. Please contact support.');
        const n = DB.normalizeProfile(profile);
        if (n.status === 'suspended') throw new Error('Your account has been suspended. Contact support@fidelityassessors.mw');
        const settings = await DB.getSettings();
        if (n.status === 'pending' && (settings.requireApproval === true || settings.requireApproval === 'true')) {
          throw new Error('Your account is pending admin approval. You will be notified once activated.');
        }
        await Promise.all([
          DB.updateProfile(data.user.id, { last_login: new Date().toISOString() }),
          DB.logActivity(data.user.id, 'login', 'Signed in')
        ]);
        const session = { userId: n.id, email: n.email, orgName: n.orgName, name: n.name, role: n.role, orgId: n.orgId, loginTime: new Date().toISOString() };
        PLATFORM.store('currentUser', session);
        if (remember) PLATFORM.store('rememberedEmail', email);
        this.showMsg(msg, 'success', n.role === 'platform_admin' ? 'Welcome, Administrator. Redirecting...' : 'Welcome back! Redirecting to your dashboard...');
        setTimeout(() => { window.location.href = n.role === 'platform_admin' ? 'admin.html' : 'dashboard.html'; }, 1000);
      } catch(err) {
        this.showMsg(msg, 'error', err.message || 'Sign in failed. Please check your credentials.');
        btn.textContent = 'Sign In to Dashboard'; btn.disabled = false;
      }
      return;
    }

    // localStorage fallback
    setTimeout(() => {
      // ---- Admin login ----
      if (email === this.ADMIN_EMAIL) {
        if (this.simpleHash(password) !== this.getAdminHash()) {
          this.showMsg(msg, 'error', 'Incorrect admin credentials.');
          btn.textContent = 'Sign In to Dashboard'; btn.disabled = false; return;
        }
        const session = { userId: 'admin_001', email: this.ADMIN_EMAIL, name: 'Platform Administrator', isAdmin: true, loginTime: new Date().toISOString() };
        PLATFORM.store('currentUser', session);
        this.showMsg(msg, 'success', 'Welcome, Administrator. Redirecting to Admin Panel...');
        setTimeout(() => { window.location.href = 'admin.html'; }, 900);
        return;
      }

      // ---- Regular user login ----
      const users = PLATFORM.get('users', {});
      const user  = users[email];

      if (!user || user.passwordHash !== this.simpleHash(password)) {
        this.showMsg(msg, 'error', 'Incorrect email or password. Please try again.');
        btn.textContent = 'Sign In to Dashboard'; btn.disabled = false; return;
      }

      if (user.status === 'suspended') {
        this.showMsg(msg, 'error', 'Your account has been suspended. Contact support@fidelityassessors.mw');
        btn.textContent = 'Sign In to Dashboard'; btn.disabled = false; return;
      }

      const settings = PLATFORM.get('platform_settings', {});
      if (user.status === 'pending' && settings.requireApproval) {
        this.showMsg(msg, 'error', 'Your account is pending admin approval. You will be notified once activated.');
        btn.textContent = 'Sign In to Dashboard'; btn.disabled = false; return;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      users[email] = user;
      PLATFORM.store('users', users);

      const session = { userId: user.id, email, orgName: user.orgName, name: user.name, role: user.role || 'company_admin', orgId: user.orgId || user.id, loginTime: new Date().toISOString() };
      PLATFORM.store('currentUser', session);
      if (remember) PLATFORM.store('rememberedEmail', email);

      this.logActivity(user.id, 'login', 'Signed in');
      this.showMsg(msg, 'success', 'Welcome back! Redirecting to your dashboard...');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    }, 500);
  },

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  logout() {
    PLATFORM.remove('currentUser');
    window.location.href = 'auth.html';
  },

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  showMsg(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message show ' + type;
  },

  // Simple (non-cryptographic) hash for demo only.
  // PRODUCTION: Replace with server-side bcrypt/argon2.
  simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36) + '_' + str.length;
  },

  logActivity(userId, type, description) {
    const key = 'activity_' + userId;
    const log = PLATFORM.get(key, []);
    log.unshift({ type, description, time: new Date().toISOString() });
    PLATFORM.store(key, log.slice(0, 50)); // keep last 50
  },

  // ---------------------------------------------------------------------------
  // Init (auth.html page)
  // ---------------------------------------------------------------------------
  async init() {
    // Check if already logged in via DB session
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const session = await DB.getSession();
        if (session) {
          const profile = await DB.getProfile(session.user.id);
          if (profile) {
            window.location.href = profile.role === 'platform_admin' ? 'admin.html' : 'dashboard.html';
            return;
          }
        }
      } catch(e) {}
    } else {
      const user = PLATFORM.get('currentUser');
      if (user) { window.location.href = user.isAdmin ? 'admin.html' : 'dashboard.html'; return; }
    }

    // Handle URL hash for tab
    if (window.location.hash === '#signup') this.showTab('signup');

    // Pre-fill remembered email
    const remembered = PLATFORM.get('rememberedEmail');
    if (remembered) {
      const el = document.getElementById('login-email');
      if (el) el.value = remembered;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Only run init on auth page
  if (document.getElementById('panel-login')) Auth.init();
});
