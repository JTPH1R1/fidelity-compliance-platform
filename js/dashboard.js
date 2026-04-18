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

    // Render compliance schedule widget (if fiscal year is configured)
    this.renderComplianceScheduleWidget();

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

    // Redirects to other pages
    if (pageId === 'dpa')     { window.location.href = 'dpa-2024.html';       return; }
    if (pageId === 'audit')   { window.location.href = 'audit.html';          return; }
    if (pageId === 'privacy') { window.location.href = 'privacy-policy.html'; return; }

    // Dynamic renders
    if (pageId === 'flags')    this.renderFlagsPage();
    if (pageId === 'team')     this.renderTeamPage();
    if (pageId === 'calendar') this.renderCalendarPage();
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
    if (u.fiscalYearStart) set('edit-fiscal-start', String(u.fiscalYearStart));
  },

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------
  saveProfile() {
    const users = PLATFORM.get('users', {});
    const user  = users[this.user.email];
    if (!user) return;

    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

    user.orgName        = val('edit-orgname') || user.orgName;
    user.sector         = val('edit-sector')  || user.sector;
    user.size           = val('edit-size');
    user.address        = val('edit-address');
    user.name           = val('edit-contact-name') || user.name;
    user.contactRole    = val('edit-contact-role');
    user.contactPhone   = val('edit-contact-phone');
    const fy = document.getElementById('edit-fiscal-start');
    if (fy && fy.value) user.fiscalYearStart = parseInt(fy.value);

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
  // Compliance Calendar helpers
  // ---------------------------------------------------------------------------
  getFiscalStart() {
    const m  = parseInt(this.userData.fiscalYearStart) || 1; // 1–12
    const now = new Date();
    const yr  = (now.getMonth() + 1 >= m) ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(yr, m - 1, 1);
  },

  getQuarters() {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const base   = this.getFiscalStart();
    return [0, 1, 2, 3].map(q => {
      const s = new Date(base); s.setMonth(s.getMonth() + q * 3);
      const e = new Date(s);    e.setMonth(e.getMonth() + 3); e.setDate(0);
      return {
        id:        s.toISOString().slice(0, 7),
        qNum:      q + 1,
        label:     `Q${q + 1}`,
        dateRange: `${months[s.getMonth()]} ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getFullYear()}`,
        startDate: s,
        endDate:   e
      };
    });
  },

  getQuarterStatus(quarter) {
    const today = new Date();
    const { startDate, endDate } = quarter;

    // Check for completed audit within this quarter window
    const auditState = PLATFORM.get('audit_' + this.user.userId);
    if (auditState && auditState.completedAt) {
      const d = new Date(auditState.completedAt);
      if (d >= startDate && d <= endDate) {
        const score = this.calcScore(auditState.answers || {});
        const g = this.getGrade(score);
        return { done: true, icon: '✅', color: g.color, label: 'Audited', score, gradeLabel: g.label, completedDate: auditState.completedAt };
      }
    }

    // Check for manual check-in
    const checkins = PLATFORM.get('chk_' + this.user.userId, []);
    const checkin  = checkins.find(c => c.quarterId === quarter.id);
    if (checkin) {
      return { done: true, icon: '✅', color: 'var(--teal)', label: 'Reviewed', score: checkin.score, gradeLabel: '', completedDate: checkin.completedAt };
    }

    if (today < startDate) return { done: false, icon: '🔵', color: '#5b8dd9',       label: 'Upcoming' };
    if (today > endDate)   return { done: false, icon: '❌', color: 'var(--danger)',  label: 'Overdue'  };

    const pct = Math.round((today - startDate) / (endDate - startDate) * 100);
    if (pct > 75) return { done: false, icon: '⚠️', color: 'var(--warning)', label: 'Due Soon',   pct };
    return          { done: false, icon: '🔄', color: 'var(--navy)',   label: 'In Progress', pct };
  },

  logManualCheckin(quarterId) {
    const checkins = PLATFORM.get('chk_' + this.user.userId, []);
    const idx = checkins.findIndex(c => c.quarterId === quarterId);
    const entry = { quarterId, completedAt: new Date().toISOString(), method: 'manual', score: null };
    if (idx >= 0) checkins[idx] = entry; else checkins.push(entry);
    PLATFORM.store('chk_' + this.user.userId, checkins);
    Auth.logActivity(this.user.userId, 'audit', `Logged manual compliance check-in for ${quarterId}`);
    PLATFORM.toast('✅ Manual check-in recorded.');
    this.renderCalendarPage();
    this.renderComplianceScheduleWidget();
  },

  // ---------------------------------------------------------------------------
  // Render Compliance Calendar Page
  // ---------------------------------------------------------------------------
  renderCalendarPage() {
    const body = document.getElementById('calendar-page-body');
    if (!body) return;

    const fiscalStart = parseInt(this.userData.fiscalYearStart) || 0;
    if (!fiscalStart) {
      body.innerHTML = `
        <div class="card" style="max-width:520px;padding:36px;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:12px">📅</div>
          <div style="font-weight:800;color:var(--navy);font-size:1.1rem;margin-bottom:8px">Set Your Financial Year Start</div>
          <div style="color:var(--text-muted);font-size:0.87rem;margin-bottom:20px">To generate your quarterly compliance schedule, tell us when your financial year begins. This takes 10 seconds.</div>
          <button class="btn btn-teal" onclick="Dashboard.showPage('profile')">Set in Company Profile →</button>
        </div>`;
      return;
    }

    const quarters = this.getQuarters();
    const fyStart  = this.getFiscalStart();
    const MONTH    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const fyEnd    = new Date(fyStart); fyEnd.setFullYear(fyEnd.getFullYear() + 1); fyEnd.setDate(fyEnd.getDate() - 1);
    const fyLabel  = `${MONTH[fyStart.getMonth()]} ${fyStart.getFullYear()} – ${MONTH[fyEnd.getMonth()]} ${fyEnd.getFullYear()}`;

    const statuses  = quarters.map(q => this.getQuarterStatus(q));
    const doneCount = statuses.filter(s => s.done).length;
    const overdueCount = statuses.filter(s => !s.done && s.label === 'Overdue').length;
    const dueCount     = statuses.filter(s => !s.done && s.label === 'Due Soon').length;
    const overallStatus = overdueCount > 0 ? `<span style="color:var(--danger);font-weight:700">${overdueCount} check-in${overdueCount > 1 ? 's' : ''} overdue</span>` :
                          dueCount     > 0 ? `<span style="color:var(--warning);font-weight:700">${dueCount} due soon</span>` :
                          doneCount === 4  ? `<span style="color:var(--teal);font-weight:700">All quarters completed ✓</span>` :
                          `<span style="color:var(--navy);font-weight:600">On track</span>`;

    const qCard = (q, st) => {
      const barBg  = st.done ? 'var(--teal-pale)' : st.label === 'Overdue' ? 'var(--danger-pale)' : st.label === 'Due Soon' ? 'var(--warning-light)' : 'var(--gray-100)';
      const border = st.done ? 'var(--teal)' : st.label === 'Overdue' ? 'var(--danger)' : 'var(--border)';
      return `
      <div style="background:var(--surface);border:2px solid ${border};border-radius:var(--radius-md);padding:22px;text-align:center;display:flex;flex-direction:column;gap:8px">
        <div style="font-size:1.7rem">${st.icon}</div>
        <div style="font-size:1.4rem;font-weight:900;color:var(--navy)">${q.label}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);line-height:1.4">${q.dateRange}</div>
        <span style="font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:20px;background:${barBg};color:${st.color};align-self:center">${st.label}</span>
        ${st.done ? `
          <div style="font-weight:900;color:${st.color};font-size:1.3rem">${st.score !== null ? st.score + '%' : '—'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${PLATFORM.formatDate(st.completedDate)}</div>
          <div style="font-size:0.7rem;font-style:italic;color:var(--text-muted)">${st.gradeLabel}</div>` : ''}
        ${!st.done && st.pct !== undefined ? `
          <div style="background:var(--gray-200);height:4px;border-radius:4px;overflow:hidden">
            <div style="width:${st.pct}%;height:100%;background:${st.color}"></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted)">${st.pct}% of quarter elapsed</div>` : ''}
        ${!st.done && new Date() >= q.startDate ? `
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">
            <a href="audit.html" class="btn btn-teal btn-sm" style="font-size:0.73rem">Run Audit Now</a>
            <button onclick="Dashboard.logManualCheckin('${q.id}')" class="btn btn-ghost btn-sm" style="font-size:0.7rem">Log Manual Check-in</button>
          </div>` : ''}
        ${!st.done && new Date() < q.startDate ? `<div style="font-size:0.73rem;color:var(--text-muted);margin-top:4px">Starts ${PLATFORM.formatDate(q.startDate.toISOString())}</div>` : ''}
      </div>`;
    };

    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px 20px;background:var(--gray-50);border:1px solid var(--border);border-radius:var(--radius-md)">
        <span style="font-size:1.4rem">📅</span>
        <div style="flex:1">
          <div style="font-weight:800;color:var(--navy)">Fiscal Year: ${fyLabel}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${doneCount}/4 check-ins completed · ${overallStatus}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Dashboard.showPage('profile')">Change Fiscal Year</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
        ${quarters.map((q, i) => qCard(q, statuses[i])).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

        <div class="card">
          <div class="card-head">📋 What Each Quarterly Review Should Cover</div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px;font-size:0.86rem">
              <div style="display:flex;gap:10px"><span>🔄</span><div><strong>Data inventory review</strong> — Have any new data flows, systems, or third-party processors been added since last quarter?</div></div>
              <div style="display:flex;gap:10px"><span>📝</span><div><strong>Policy currency check</strong> — Are privacy notices, consent forms, and processing agreements still accurate?</div></div>
              <div style="display:flex;gap:10px"><span>👥</span><div><strong>Staff access audit</strong> — Are only authorized people accessing personal data? Have leavers been removed?</div></div>
              <div style="display:flex;gap:10px"><span>🚨</span><div><strong>Incident log review</strong> — Were there any near-misses or breaches (even minor) in the quarter?</div></div>
              <div style="display:flex;gap:10px"><span>📊</span><div><strong>DPIA status</strong> — Any new high-risk processing planned that needs a Data Protection Impact Assessment before it starts?</div></div>
              <div style="display:flex;gap:10px"><span>🏛️</span><div><strong>Regulatory monitoring</strong> — Any new MACRA guidance or enforcement action in your sector?</div></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">⚖️ Why Quarterly Cadence Matters Legally</div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px;font-size:0.86rem">
              <div style="display:flex;gap:10px"><span>🛡️</span><div><strong>Demonstrable due diligence</strong> — In any MACRA investigation or enforcement action, a documented compliance history is your strongest defence. One-time compliance is not sufficient.</div></div>
              <div style="display:flex;gap:10px"><span>⏱️</span><div><strong>72-hour breach window</strong> — If a breach occurs, your quarterly audit trail shows MACRA you were actively managing risk, not negligent.</div></div>
              <div style="display:flex;gap:10px"><span>🔄</span><div><strong>Data processing evolves</strong> — Businesses change. New systems, new staff, new partners — each creates new data flows that must be assessed before they start, not after.</div></div>
              <div style="display:flex;gap:10px"><span>📈</span><div><strong>Improvement tracking</strong> — Quarterly scores show your compliance is improving over time — critical for board reporting and investor due diligence.</div></div>
            </div>
          </div>
        </div>

      </div>`;
  },

  // ---------------------------------------------------------------------------
  // Render Compliance Schedule Widget (overview page)
  // ---------------------------------------------------------------------------
  renderComplianceScheduleWidget() {
    const widget = document.getElementById('compliance-schedule-widget');
    const body   = document.getElementById('compliance-schedule-body');
    if (!widget || !body) return;

    const fiscalStart = parseInt(this.userData.fiscalYearStart) || 0;
    if (!fiscalStart) { widget.style.display = 'none'; return; }

    widget.style.display = 'block';
    const quarters = this.getQuarters();
    const MONTH    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px">
        ${quarters.map(q => {
          const st = this.getQuarterStatus(q);
          const border = st.done ? 'var(--teal)' : st.label === 'Overdue' ? 'var(--danger)' : st.label === 'Due Soon' ? 'var(--warning)' : 'var(--border)';
          return `
          <div style="border:2px solid ${border};border-radius:8px;padding:14px;text-align:center">
            <div style="font-size:1.3rem">${st.icon}</div>
            <div style="font-weight:800;color:var(--navy)">${q.label}</div>
            <div style="font-size:0.68rem;color:var(--text-muted)">${q.dateRange}</div>
            ${st.done
              ? `<div style="font-weight:700;color:${st.color};margin-top:4px">${st.score !== null ? st.score + '%' : '✓'}</div>`
              : `<div style="font-size:0.68rem;font-weight:700;color:${st.color};margin-top:4px">${st.label}</div>`}
            ${!st.done && new Date() >= q.startDate
              ? `<a href="audit.html" style="display:block;margin-top:6px;font-size:0.65rem;font-weight:700;color:var(--teal)">Run now →</a>`
              : ''}
          </div>`;
        }).join('')}
      </div>`;
  },

  // ---------------------------------------------------------------------------
  // Render Critical Flags Page
  // ---------------------------------------------------------------------------
  renderFlagsPage() {
    const body = document.getElementById('flags-page-body');
    if (!body) return;

    const auditState = PLATFORM.get('audit_' + this.user.userId);
    const answers = auditState ? (auditState.answers || {}) : {};

    if (!auditState || !auditState.completedAt) {
      body.innerHTML = `
        <div class="card" style="text-align:center;padding:48px">
          <div style="font-size:2.5rem;margin-bottom:12px">📋</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:8px">No Audit Completed Yet</div>
          <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px">Complete a compliance audit to see any critical flags here.</div>
          <a href="audit.html" class="btn btn-teal">Start Your First Audit →</a>
        </div>`;
      return;
    }

    const flags = [];
    if (typeof CHECKLIST_DATA !== 'undefined') {
      CHECKLIST_DATA.sections.forEach(sec => {
        sec.items.forEach(item => {
          if (item.critical && answers[`${sec.id}_${item.id}`] === 'no') {
            flags.push({ section: sec.title, icon: sec.icon || '⚠️', question: item.question, clause: item.clause || '' });
          }
        });
      });
    }

    if (flags.length === 0) {
      body.innerHTML = `
        <div class="card" style="text-align:center;padding:48px">
          <div style="font-size:2.5rem;margin-bottom:12px">✅</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--teal);margin-bottom:8px">No Critical Flags</div>
          <div style="color:var(--text-muted);font-size:0.9rem">Your audit shows no critical compliance failures. Keep up the good work.</div>
        </div>`;
      return;
    }

    body.innerHTML = `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;background:var(--danger-pale);border-color:var(--danger)">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:1.6rem">🚨</span>
          <div style="flex:1">
            <div style="font-weight:800;color:var(--danger);font-size:1rem">${flags.length} Critical Flag${flags.length !== 1 ? 's' : ''} Found</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">These requirements are legally mandatory under the DPA 2024 and must be addressed immediately.</div>
          </div>
          <a href="audit.html" class="btn btn-sm" style="background:var(--danger);color:#fff;border-color:var(--danger);flex-shrink:0">Fix in Audit →</a>
        </div>
      </div>
      <div class="card p-0">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
          <thead>
            <tr style="background:var(--gray-50)">
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border);width:36px">#</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Section</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Critical Requirement</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Act Reference</th>
            </tr>
          </thead>
          <tbody>
            ${flags.map((f, i) => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:12px 16px;color:var(--danger);font-weight:800">${i + 1}</td>
                <td style="padding:12px 16px">
                  <span style="background:var(--danger-pale);color:var(--danger);font-size:0.73rem;font-weight:700;padding:2px 9px;border-radius:20px;white-space:nowrap">${PLATFORM.esc(f.icon)} ${PLATFORM.esc(f.section)}</span>
                </td>
                <td style="padding:12px 16px;font-weight:600;color:var(--navy)">${PLATFORM.esc(f.question)}</td>
                <td style="padding:12px 16px;font-size:0.78rem;color:var(--text-muted)">${PLATFORM.esc(f.clause)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ---------------------------------------------------------------------------
  // Render Team Page
  // ---------------------------------------------------------------------------
  renderTeamPage() {
    const body = document.getElementById('team-page-body');
    if (!body) return;

    const users      = PLATFORM.get('users', {});
    const orgId      = this.userData.orgId || this.user.userId;
    const myRole     = this.userData.role  || 'company_admin';
    const canManage  = myRole === 'company_admin';

    // All members of this org
    const teamMembers = Object.values(users).filter(u => (u.orgId || u.id) === orgId);

    // Pending officer requests for this org
    const requests = PLATFORM.get('officer_requests', []).filter(r => r.orgId === orgId && r.status === 'pending');

    const roleChip = (role) => {
      const isAdmin = role === 'company_admin';
      return `<span style="font-size:0.72rem;font-weight:700;padding:2px 9px;border-radius:20px;background:${isAdmin ? 'var(--gold-pale)' : '#e8eef5'};color:${isAdmin ? 'var(--gold-dark)' : 'var(--navy-light)'}">${isAdmin ? '⭐ Company Admin' : '👤 Compliance Officer'}</span>`;
    };

    body.innerHTML = `
      ${canManage ? `
      <div class="card" style="margin-bottom:20px">
        <div class="card-head">➕ Request to Add Compliance Officer</div>
        <div style="padding:20px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="officer-name" placeholder="e.g. Jane Mwanza">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="officer-email" placeholder="jane@yourcompany.com">
            </div>
          </div>
          <div style="margin-top:12px;display:flex;gap:10px;align-items:center">
            <button class="btn btn-teal btn-sm" onclick="Dashboard.submitOfficerRequest()">Submit Request to Admin</button>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">The platform admin will review and create the account. You will see the request below once submitted.</div>
        </div>
      </div>` : ''}

      ${requests.length > 0 ? `
      <div class="card" style="margin-bottom:20px">
        <div class="card-head">⏳ Pending Requests (${requests.length})</div>
        <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
          ${requests.map(r => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--warning-light);border:1px solid #f0d080;border-radius:8px">
            <div>
              <div style="font-weight:700;color:var(--navy)">${PLATFORM.esc(r.name)}</div>
              <div style="font-size:0.78rem;color:var(--text-muted)">${PLATFORM.esc(r.email)} · Requested ${PLATFORM.timeAgo(r.createdAt)}</div>
            </div>
            <span style="font-size:0.72rem;font-weight:700;color:var(--warning);background:#fff;padding:3px 9px;border-radius:20px;border:1px solid #f0d080;white-space:nowrap">Awaiting Admin Approval</span>
          </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="card p-0">
        <div class="card-head">👥 Team Members (${teamMembers.length})</div>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
          <thead>
            <tr style="background:var(--gray-50)">
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Member</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Role</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Status</th>
              <th style="padding:10px 16px;text-align:left;font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.4px;border-bottom:2px solid var(--border)">Joined</th>
            </tr>
          </thead>
          <tbody>
            ${teamMembers.length === 0 ? '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--text-muted)">No team members found.</td></tr>' :
              teamMembers.map(m => {
                const isMe = m.email === this.user.email;
                const statusColor = m.status === 'active' ? 'var(--teal)' : 'var(--warning)';
                const statusBg    = m.status === 'active' ? 'var(--teal-pale)' : 'var(--warning-light)';
                return `<tr style="border-bottom:1px solid var(--border)${isMe ? ';background:rgba(13,122,95,0.04)' : ''}">
                  <td style="padding:12px 16px">
                    <div style="font-weight:700;color:var(--navy)">${PLATFORM.esc(m.name)}${isMe ? ' <span style="font-size:0.7rem;font-weight:600;color:var(--teal)">(you)</span>' : ''}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${PLATFORM.esc(m.email)}</div>
                  </td>
                  <td style="padding:12px 16px">${roleChip(m.role || 'company_admin')}</td>
                  <td style="padding:12px 16px"><span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:20px;background:${statusBg};color:${statusColor}">${m.status === 'active' ? 'Active' : 'Pending'}</span></td>
                  <td style="padding:12px 16px;font-size:0.78rem;color:var(--text-muted)">${PLATFORM.formatDate(m.registeredAt)}</td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ---------------------------------------------------------------------------
  // Submit officer add request
  // ---------------------------------------------------------------------------
  submitOfficerRequest() {
    const name  = (document.getElementById('officer-name')  || {}).value || '';
    const email = (document.getElementById('officer-email') || {}).value || '';
    const trimName  = name.trim();
    const trimEmail = email.trim().toLowerCase();

    if (!trimName || !trimEmail) { PLATFORM.toast('Please enter both name and email.'); return; }
    if (!trimEmail.includes('@')) { PLATFORM.toast('Please enter a valid email address.'); return; }

    const users = PLATFORM.get('users', {});
    if (users[trimEmail]) { PLATFORM.toast('An account with this email already exists.'); return; }

    const orgId = this.userData.orgId || this.user.userId;
    const requests = PLATFORM.get('officer_requests', []);

    if (requests.some(r => r.email === trimEmail && r.status === 'pending')) {
      PLATFORM.toast('A pending request for this email already exists.'); return;
    }

    requests.push({
      id: 'req_' + Date.now(),
      orgId,
      orgName: this.userData.orgName || this.user.orgName,
      requestedBy: this.user.email,
      name: trimName,
      email: trimEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    PLATFORM.store('officer_requests', requests);
    Auth.logActivity(this.user.userId, 'team', `Requested to add ${trimName} as compliance officer`);
    PLATFORM.toast('✅ Request submitted — awaiting admin approval.');
    this.renderTeamPage();
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
