// =============================================================================
// Fidelity Compliance Platform — Authentication Logic
// localStorage-based simulation (production requires secure backend)
// =============================================================================

const Auth = {

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
  register(e) {
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

    // Check if email already registered
    const users = PLATFORM.get('users', {});
    if (users[email]) { this.showMsg(msg, 'error', 'An account with this email already exists. Please sign in instead.'); return; }

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    // Simulate slight delay
    setTimeout(() => {
      // Create user record
      const userId = 'u_' + Date.now();
      const now = new Date().toISOString();

      users[email] = {
        id: userId,
        email,
        name,
        // In production: never store plain-text passwords. Use bcrypt server-side.
        // This is a frontend demo — storing hashed would require Web Crypto API.
        // Marked clearly for production upgrade.
        passwordHash: this.simpleHash(pass),
        orgName,
        sector,
        size,
        address: '',
        contactRole: '',
        contactPhone: '',
        registeredAt: now,
        lastLogin: now,
        plan: 'free'
      };

      PLATFORM.store('users', users);

      // Set current session
      const session = { userId, email, orgName, name, loginTime: now };
      PLATFORM.store('currentUser', session);

      // Log activity
      this.logActivity(userId, 'registration', `${orgName} account created`);

      this.showMsg(msg, 'success', 'Account created! Redirecting to your dashboard...');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    }, 600);
  },

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  login(e) {
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

    setTimeout(() => {
      const users = PLATFORM.get('users', {});
      const user  = users[email];

      if (!user || user.passwordHash !== this.simpleHash(password)) {
        this.showMsg(msg, 'error', 'Incorrect email or password. Please try again.');
        btn.textContent = 'Sign In to Dashboard';
        btn.disabled = false;
        return;
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      users[email] = user;
      PLATFORM.store('users', users);

      // Set session
      const session = {
        userId: user.id, email, orgName: user.orgName,
        name: user.name, loginTime: new Date().toISOString()
      };
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
  init() {
    // Check if already logged in
    const user = PLATFORM.get('currentUser');
    if (user) { window.location.href = 'dashboard.html'; return; }

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
