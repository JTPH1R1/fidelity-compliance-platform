// =============================================================================
// Fidelity Compliance Platform — Dashboard Logic
// =============================================================================

const Dashboard = {

  user: null,
  userData: null,

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  init() {
    // Auth guard
    const session = PLATFORM.requireAuth();
    if (!session) return;
    this.user = session;

    // Load full user data
    const users = PLATFORM.get('users', {});
    this.userData = users[session.email] || {};

    // Update nav
    document.getElementById('nav-username').textContent = this.userData.orgName || session.orgName || 'Organization';
    document.getElementById('nav-avatar').textContent = PLATFORM.initials(session.name || session.orgName);

    // Update sidebar
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarLogo = document.getElementById('sidebar-logo');
    if (sidebarName) sidebarName.textContent = this.userData.orgName || session.orgName;
    if (sidebarLogo) sidebarLogo.textContent = PLATFORM.initials(this.userData.orgName || session.orgName);

    // Update welcome
    const firstName = (session.name || '').split(' ')[0] || 'Welcome';
    const welcomeEl = document.getElementById('welcome-title');
    if (welcomeEl) {
      const hr = new Date().getHours();
      const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
      welcomeEl.textContent = `${greeting}, ${firstName}!`;
    }

    // Load audit state
    this.loadAuditStats();

    // Load profile
    this.loadProfileSummary();

    // Load activity
    this.loadActivity();

    // Load profile edit fields
    this.populateProfileForm();

    // Show compliance banner if needed
    this.checkComplianceBanner();
  },

  // ---------------------------------------------------------------------------
  // Page navigation (sidebar)
  // ---------------------------------------------------------------------------
  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.remove('hidden');

    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(l => {
      if (l.getAttribute('onclick') && l.getAttribute('onclick').includes("'" + pageId + "'")) {
        l.classList.add('active');
      }
    });

    // Special handling
    if (pageId === 'dpa') window.location.href = 'dpa-2024.html';
    if (pageId === 'audit') window.location.href = 'audit.html';
    if (pageId === 'privacy') window.location.href = 'privacy-policy.html';
  },

  // ---------------------------------------------------------------------------
  // Load Audit Stats for dashboard widgets
  // ---------------------------------------------------------------------------
  loadAuditStats() {
    const auditKey = 'audit_' + this.user.userId;
    const auditState = PLATFORM.get(auditKey);

    if (!auditState || !auditState.completedAt) {
      // No completed audit
      this.updateStatCard('stat-grade', '—', 'No audit yet', 'grade-icon', '📋');
      this.updateStatCard('stat-score', '—', 'Start audit to score', null, null);
      this.updateStatCard('stat-flags', '—', 'High-priority gaps', null, null);
      this.updateStatCard('stat-answered', '—', 'of 65 total questions', null, null);
      return;
    }

    // Calculate score from saved answers
    const score  = this.calcScore(auditState.answers || {});
    const grade  = this.getGrade(score);
    const flags  = this.countCriticalFlags(auditState.answers || {});
    const answered = Object.keys(auditState.answers || {}).length;

    // Update stat cards
    this.updateStatCard('stat-grade', grade.label, grade.badge, 'grade-icon', grade.icon === '✓' ? '✅' : grade.icon === '⚠' ? '⚠️' : '❌');
    this.updateStatCard('stat-score', score + '%', 'Weighted compliance score', null, null);
    this.updateStatCard('stat-flags', String(flags), flags > 0 ? 'Needs immediate action' : 'No critical failures', null, null);
    this.updateStatCard('stat-answered', answered + '/65', 'Questions answered', null, null);

    // Update audit widget
    this.renderAuditWidget(auditState, score, grade);

    // Update flags widget
    this.renderFlagsWidget(auditState.answers || {});

    // Update last audit in profile
    const lastAuditEl = document.getElementById('prof-last-audit');
    if (lastAuditEl) lastAuditEl.textContent = PLATFORM.formatDate(auditState.completedAt);

    // Update audit history
    this.renderAuditHistory(auditState, score, grade);
  },

  updateStatCard(id, value, sub, iconId, iconVal) {
    const valEl = document.getElementById(id);
    if (valEl) valEl.textContent = value;
    const subEl = document.getElementById(id + '-sub');
    if (subEl && sub) subEl.textContent = sub;
    if (iconId && iconVal) {
      const iconEl = document.getElementById(iconId);
      if (iconEl) iconEl.textContent = iconVal;
    }
  },

  // ---------------------------------------------------------------------------
  // Render Audit Status Widget
  // ---------------------------------------------------------------------------
  renderAuditWidget(auditState, score, grade) {
    const body = document.getElementById('audit-widget-body');
    if (!body) return;

    // Section scores
    let sectionRows = '';
    if (typeof CHECKLIST_DATA !== 'undefined') {
      CHECKLIST_DATA.sections.forEach(sec => {
        const { pct, possible } = this.calcSectionScore(sec, auditState.answers || {});
        const pctR = Math.round(pct);
        const color = pctR >= 75 ? '#27ae60' : pctR >= 60 ? '#d68910' : '#c0392b';
        sectionRows += `
          <div class="sec-prog-row">
            <span class="sec-prog-icon">${sec.icon}</span>
            <span class="sec-prog-name">${PLATFORM.esc(sec.title)}</span>
            <div class="sec-prog-bar-wrap">
              <div class="sec-prog-bar-fill" style="width:${possible > 0 ? pctR : 0}%;background:${color}"></div>
            </div>
            <span class="sec-prog-pct">${possible > 0 ? pctR + '%' : 'N/A'}</span>
          </div>
        `;
      });
    }

    body.innerHTML = `
      <div class="grade-display" style="background:${grade.bg};border:1.5px solid ${grade.border}">
        <div class="grade-ring" style="color:${grade.color};border-color:${grade.color}">
          <div class="score" style="color:${grade.color}">${score}</div>
          <div class="label" style="color:${grade.color}">/ 100</div>
        </div>
        <div class="grade-text">
          <div class="grade-name" style="color:${grade.color}">${grade.label}</div>
          <div class="grade-badge" style="color:${grade.color}">${grade.badge}</div>
          <div class="grade-date" style="color:${grade.color}">
            Last assessed: ${PLATFORM.formatDate(auditState.completedAt || auditState.startedAt)}
          </div>
        </div>
      </div>
      <div class="section-progress-list">
        ${sectionRows || '<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:12px">Section data not available.</div>'}
      </div>
    `;
  },

  // ---------------------------------------------------------------------------
  // Render Critical Flags Widget
  // ---------------------------------------------------------------------------
  renderFlagsWidget(answers) {
    const body  = document.getElementById('flags-widget-body');
    const badge = document.getElementById('flags-count-badge');
    if (!body) return;

    const flags = [];
    if (typeof CHECKLIST_DATA !== 'undefined') {
      CHECKLIST_DATA.sections.forEach(sec => {
        sec.items.forEach(item => {
          if (item.critical && answers[`${sec.id}_${item.id}`] === 'no') {
            flags.push({ section: sec.title, question: item.question });
          }
        });
      });
    }

    if (badge) {
      badge.textContent = flags.length;
      badge.style.display = flags.length > 0 ? 'inline-flex' : 'none';
    }

    if (flags.length === 0) {
      body.innerHTML = '<div class="flags-empty">✅ No critical compliance failures detected.</div>';
      return;
    }

    body.innerHTML = flags.slice(0, 6).map(f => `
      <div class="flag-row">
        <span class="flag-indicator"></span>
        <span class="flag-section">${PLATFORM.esc(f.section)}</span>
        <span class="flag-question">${PLATFORM.esc(f.question)}</span>
      </div>
    `).join('') +
    (flags.length > 6 ? `<div style="padding:10px 16px;font-size:0.78rem;color:var(--text-muted)">+ ${flags.length - 6} more flags. <a href="audit.html">View all in audit →</a></div>` : '');
  },

  // ---------------------------------------------------------------------------
  // Load Profile Summary
  // ---------------------------------------------------------------------------
  loadProfileSummary() {
    const u = this.userData;
    const esc = PLATFORM.esc;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };

    set('profile-org-name', u.orgName);
    set('profile-org-sector', [u.sector, u.size].filter(Boolean).join(' — '));
    set('prof-contact', u.name);
    set('prof-email', u.email);
    set('prof-registered', PLATFORM.formatDate(u.registeredAt));

    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = PLATFORM.initials(u.orgName);
  },

  // ---------------------------------------------------------------------------
  // Load Activity Feed
  // ---------------------------------------------------------------------------
  loadActivity() {
    const actList = document.getElementById('activity-list');
    if (!actList) return;
    const log = PLATFORM.get('activity_' + this.user.userId, []);
    if (log.length === 0) return;

    const iconMap = { audit: '📋', login: '🔑', registration: '🎉', report: '📊', flag: '🚨' };
    const classMap = { audit: 'audit', login: 'login', registration: 'audit', report: 'report', flag: 'flag' };

    actList.innerHTML = log.slice(0, 8).map(item => `
      <div class="activity-item">
        <div class="activity-dot ${classMap[item.type] || 'audit'}">${iconMap[item.type] || '📋'}</div>
        <div>
          <div class="activity-text">${PLATFORM.esc(item.description)}</div>
          <div class="activity-time">${PLATFORM.timeAgo(item.time)}</div>
        </div>
      </div>
    `).join('');
  },

  // ---------------------------------------------------------------------------
  // Populate profile edit form
  // ---------------------------------------------------------------------------
  populateProfileForm() {
    const u = this.userData;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('edit-orgname', u.orgName);
    set('edit-sector', u.sector);
    set('edit-size', u.size);
    set('edit-address', u.address);
    set('edit-contact-name', u.name);
    set('edit-contact-role', u.contactRole);
    set('edit-contact-email', u.email);
    set('edit-contact-phone', u.contactPhone);
  },

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------
  saveProfile() {
    const users = PLATFORM.get('users', {});
    const user  = users[this.user.email];
    if (!user) return;

    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

    user.orgName      = val('edit-orgname') || user.orgName;
    user.sector       = val('edit-sector')  || user.sector;
    user.size         = val('edit-size');
    user.address      = val('edit-address');
    user.name         = val('edit-contact-name') || user.name;
    user.contactRole  = val('edit-contact-role');
    user.contactPhone = val('edit-contact-phone');

    users[this.user.email] = user;
    PLATFORM.store('users', users);
    this.userData = user;

    // Update session name
    const session = PLATFORM.get('currentUser');
    if (session) {
      session.orgName = user.orgName;
      session.name    = user.name;
      PLATFORM.store('currentUser', session);
    }

    this.loadProfileSummary();
    Auth.logActivity(this.user.userId, 'profile', 'Company profile updated');
    PLATFORM.toast('✅ Profile saved successfully!');
    this.showPage('overview');
  },

  // ---------------------------------------------------------------------------
  // Compliance deadline banner
  // ---------------------------------------------------------------------------
  checkComplianceBanner() {
    const banner = document.getElementById('compliance-banner');
    if (!banner) return;
    const auditKey = 'audit_' + this.user.userId;
    const auditState = PLATFORM.get(auditKey);
    const hasCompletedAudit = auditState && auditState.completedAt;
    // Show banner if no completed audit or score is failing
    if (!hasCompletedAudit) banner.style.display = 'flex';
    else if (auditState) {
      const score = this.calcScore(auditState.answers || {});
      if (score < 60) banner.style.display = 'flex';
    }
  },

  // ---------------------------------------------------------------------------
  // Print report
  // ---------------------------------------------------------------------------
  printReport() {
    const auditKey = 'audit_' + this.user.userId;
    const auditState = PLATFORM.get(auditKey);
    if (!auditState || !auditState.completedAt) {
      alert('Please complete an audit first before printing a report. Click "Start / Continue Audit" to begin.');
      return;
    }
    window.open('audit.html?print=1', '_blank');
  },

  // ---------------------------------------------------------------------------
  // Render Audit History
  // ---------------------------------------------------------------------------
  renderAuditHistory(auditState, score, grade) {
    const body = document.getElementById('audit-history-body');
    if (!body) return;
    body.innerHTML = `
      <table class="audit-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
            <th>Grade</th>
            <th>Questions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${PLATFORM.formatDate(auditState.completedAt || auditState.startedAt)}</td>
            <td style="font-weight:700;color:${grade.color}">${score}%</td>
            <td><span class="badge" style="background:${grade.bg};color:${grade.color};border:1px solid ${grade.border}">${grade.label}</span></td>
            <td>${Object.keys(auditState.answers || {}).length} / 65</td>
            <td>
              <a href="audit.html" class="btn btn-sm btn-ghost">View / Edit</a>
              <button class="btn btn-sm btn-teal" onclick="window.print()">🖨️ Print</button>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  },

  // ---------------------------------------------------------------------------
  // Account deletion
  // ---------------------------------------------------------------------------
  confirmDeleteAccount() {
    const confirmed = confirm(
      'Are you sure you want to permanently delete your account and all compliance data?\n\n' +
      'This action cannot be undone. All audit records and company data will be permanently removed.\n\n' +
      'Click OK to confirm deletion.'
    );
    if (!confirmed) return;
    const users = PLATFORM.get('users', {});
    delete users[this.user.email];
    PLATFORM.store('users', users);
    PLATFORM.remove('currentUser');
    PLATFORM.remove('audit_' + this.user.userId);
    PLATFORM.remove('activity_' + this.user.userId);
    alert('Your account and all data have been deleted. You will now be redirected to the home page.');
    window.location.href = 'index.html';
  },

  // ---------------------------------------------------------------------------
  // Scoring helpers (mirrored from audit.js)
  // ---------------------------------------------------------------------------
  calcSectionScore(sec, answers) {
    let earned = 0, possible = 0;
    sec.items.forEach(item => {
      const ans = answers[`${sec.id}_${item.id}`];
      if (!ans || ans === 'na') return;
      possible += 2;
      if (ans === 'yes')     earned += 2;
      if (ans === 'partial') earned += 1;
    });
    return { earned, possible, pct: possible > 0 ? (earned / possible) * 100 : 0 };
  },

  calcScore(answers) {
    if (typeof CHECKLIST_DATA === 'undefined') return 0;
    let wSum = 0, wTotal = 0;
    CHECKLIST_DATA.sections.forEach(sec => {
      const { pct, possible } = this.calcSectionScore(sec, answers);
      if (possible === 0) return;
      wSum   += pct * sec.weight;
      wTotal += sec.weight;
    });
    return wTotal > 0 ? Math.round(wSum / wTotal) : 0;
  },

  countCriticalFlags(answers) {
    if (typeof CHECKLIST_DATA === 'undefined') return 0;
    return CHECKLIST_DATA.sections.reduce((t, sec) =>
      t + sec.items.filter(item => item.critical && answers[`${sec.id}_${item.id}`] === 'no').length, 0);
  },

  getGrade(score) {
    if (typeof CHECKLIST_DATA === 'undefined') return { label: '—', badge: '—', color: '#666', bg: '#eee', border: '#ccc', icon: '?' };
    return CHECKLIST_DATA.grades.find(g => score >= g.min) || CHECKLIST_DATA.grades[CHECKLIST_DATA.grades.length - 1];
  }
};

// =============================================================================
// Bootstrap
// =============================================================================
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
