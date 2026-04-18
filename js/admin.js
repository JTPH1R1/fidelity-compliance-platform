// =============================================================================
// Fidelity Compliance Platform — Admin Panel
// Access: admin@fidelityassessors.mw / FidelityAdmin@2024!
// =============================================================================

const Admin = {

  currentPage: 'overview',
  editingNewsId: null,
  editingDocId: null,

  // ---------------------------------------------------------------------------
  init() {
    const session = PLATFORM.requireAdmin();
    if (!session) return;
    this.seedDemoData();
    this.showPage('overview');
    this.updatePendingBadge();
  },

  // ---------------------------------------------------------------------------
  // Seed sample organizations + audit data for a realistic stakeholder demo
  // ---------------------------------------------------------------------------
  seedDemoData() {
    if (PLATFORM.get('demo_seeded')) return;
    const h = (p) => {
      let n = 5381;
      for (let i = 0; i < p.length; i++) n = ((n << 5) + n) ^ p.charCodeAt(i);
      return (n >>> 0).toString(36) + '_' + p.length;
    };
    const now = new Date().toISOString();
    const users = PLATFORM.get('users', {});

    const demos = [
      { email: 'compliance@standardbank.mw', orgName: 'Standard Bank Malawi', sector: 'Banking & Finance', size: 'Large (500+ employees)', name: 'Chisomo Banda', plan: 'enterprise', status: 'active', score: 84 },
      { email: 'dpo@mra.mw', orgName: 'Malawi Revenue Authority', sector: 'Government & Public Sector', size: 'Large (500+ employees)', name: 'Takondwa Mvula', plan: 'standard', status: 'active', score: 71 },
      { email: 'privacy@airtel.mw', orgName: 'Airtel Malawi PLC', sector: 'Telecommunications', size: 'Large (500+ employees)', name: 'Wongani Phiri', plan: 'enterprise', status: 'active', score: 91 },
      { email: 'admin@mangocapital.mw', orgName: 'Mango Capital Ltd', sector: 'Banking & Finance', size: 'Medium (51–200 employees)', name: 'Tadala Msiska', plan: 'standard', status: 'pending', score: null },
      { email: 'it@zodiak.mw', orgName: 'Zodiak Broadcasting Station', sector: 'Media & Publishing', size: 'Medium (51–200 employees)', name: 'Limbikani Chirwa', plan: 'standard', status: 'active', score: 56 },
      { email: 'ops@oibm.mw', orgName: 'OIBM Bank', sector: 'Banking & Finance', size: 'Small (11–50 employees)', name: 'Fatsani Gondwe', plan: 'free', status: 'active', score: 43 }
    ];

    demos.forEach((d, i) => {
      if (users[d.email]) return;
      const uid = 'demo_' + (i + 1);
      const reg = new Date(Date.now() - (30 - i * 4) * 86400000).toISOString();
      users[d.email] = { id: uid, email: d.email, name: d.name, passwordHash: h('Demo1234!'), orgName: d.orgName, sector: d.sector, size: d.size, address: 'Lilongwe, Malawi', contactRole: 'Compliance Officer', contactPhone: '', registeredAt: reg, lastLogin: reg, plan: d.plan, status: d.status };

      if (d.score !== null) {
        // Build plausible audit answers based on score level
        const answers = {};
        let filled = 0;
        if (typeof CHECKLIST_DATA !== 'undefined') {
          CHECKLIST_DATA.sections.forEach(sec => {
            sec.items.forEach(item => {
              const key = `${sec.id}_${item.id}`;
              const r = Math.random();
              if (d.score >= 80) answers[key] = r < 0.85 ? 'yes' : r < 0.95 ? 'partial' : 'no';
              else if (d.score >= 65) answers[key] = r < 0.65 ? 'yes' : r < 0.85 ? 'partial' : 'no';
              else answers[key] = r < 0.40 ? 'yes' : r < 0.65 ? 'partial' : 'no';
              filled++;
            });
          });
        }
        const completedAt = new Date(Date.now() - (20 - i * 3) * 86400000).toISOString();
        PLATFORM.store('audit_' + uid, { answers, notes: {}, currentSection: 11, startedAt: reg, completedAt, reviewed: false });
      }
    });

    PLATFORM.store('users', users);
    PLATFORM.store('demo_seeded', true);
  },

  // ---------------------------------------------------------------------------
  // Page navigation
  // ---------------------------------------------------------------------------
  showPage(page) {
    this.currentPage = page;
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    const content = document.getElementById('admin-content');
    const map = { overview: 'renderOverview', users: 'renderUsers', audits: 'renderAudits', content: 'renderContent', documents: 'renderDocuments', settings: 'renderSettings' };
    if (content && map[page]) content.innerHTML = this[map[page]]();
  },

  updatePendingBadge() {
    const users = PLATFORM.get('users', {});
    const n = Object.values(users).filter(u => u.status === 'pending').length;
    const badge = document.getElementById('pending-badge');
    if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'inline-flex' : 'none'; }
  },

  // ---------------------------------------------------------------------------
  // OVERVIEW
  // ---------------------------------------------------------------------------
  renderOverview() {
    const users = PLATFORM.get('users', {});
    const uList = Object.values(users);
    const total = uList.length;
    const pending = uList.filter(u => u.status === 'pending').length;
    const active = uList.filter(u => u.status === 'active').length;
    const audits = this.getAllAudits();
    const completed = audits.length;
    const avgScore = completed ? Math.round(audits.reduce((s, a) => s + a.score, 0) / completed) : 0;
    const grade = this.getGrade(avgScore);
    const recent = uList.sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt)).slice(0, 5);

    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">Platform Overview</h1><div class="page-sub">${PLATFORM.formatDate(new Date().toISOString())} · Live statistics</div></div>
        <a href="index.html" target="_blank" class="btn btn-outline btn-sm">View Live Site ↗</a>
      </div>

      <div class="stats-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
        ${this.statCard('Total Accounts', total, '👥', 'var(--navy)')}
        ${this.statCard('Pending Approval', pending, '⏳', pending > 0 ? 'var(--warning)' : 'var(--text-muted)')}
        ${this.statCard('Active Users', active, '✅', 'var(--teal)')}
        ${this.statCard('Audits Completed', completed, '📋', 'var(--navy-light)')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <!-- Recent Registrations -->
        <div class="card p-0">
          <div class="card-head">👥 Recent Registrations</div>
          <table class="admin-table">
            <thead><tr><th>Organization</th><th>Registered</th><th>Status</th></tr></thead>
            <tbody>
              ${recent.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px">No accounts yet</td></tr>' :
                recent.map(u => `<tr>
                  <td><strong>${PLATFORM.esc(u.orgName)}</strong><div style="font-size:0.75rem;color:var(--text-muted)">${PLATFORM.esc(u.email)}</div></td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${PLATFORM.timeAgo(u.registeredAt)}</td>
                  <td>${this.statusBadge(u.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Audit Summary -->
        <div class="card p-0">
          <div class="card-head">📊 Audit Results Summary</div>
          ${completed === 0 ? '<div style="padding:24px;text-align:center;color:var(--text-muted)">No audits completed yet</div>' : `
          <div style="padding:20px">
            <div style="display:flex;align-items:center;gap:20px;margin-bottom:16px">
              <div style="width:72px;height:72px;border-radius:50%;border:4px solid ${grade.color};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
                <div style="font-size:1.4rem;font-weight:900;color:${grade.color}">${avgScore}</div>
                <div style="font-size:0.58rem;color:${grade.color};font-weight:700">AVG</div>
              </div>
              <div>
                <div style="font-weight:800;color:${grade.color};font-size:1.1rem">${grade.label}</div>
                <div style="font-size:0.8rem;color:var(--text-muted)">Platform average across ${completed} audit${completed>1?'s':''}</div>
              </div>
            </div>
            ${audits.slice(0,4).map(a => {
              const g = this.getGrade(a.score);
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
                <div style="font-size:0.84rem;font-weight:600">${PLATFORM.esc(a.orgName)}</div>
                <div style="font-weight:800;color:${g.color}">${a.score}%</div>
              </div>`;
            }).join('')}
          </div>`}
        </div>
      </div>
    </div>`;
  },

  statCard(label, value, icon, color) {
    return `<div class="card" style="padding:20px;text-align:center">
      <div style="font-size:1.8rem;margin-bottom:4px">${icon}</div>
      <div style="font-size:2rem;font-weight:900;color:${color};line-height:1">${value}</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;font-weight:600">${label}</div>
    </div>`;
  },

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  renderUsers() {
    const users = PLATFORM.get('users', {});
    const list = Object.values(users).sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    const filter = document.getElementById('user-filter') ? document.getElementById('user-filter').value : 'all';

    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">User Management</h1><div class="page-sub">${list.length} registered account${list.length !== 1 ? 's' : ''}</div></div>
        <div style="display:flex;gap:10px">
          <select class="form-control" style="width:auto" onchange="Admin.filterUsers(this.value)" id="user-filter">
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div class="card p-0">
        <table class="admin-table">
          <thead><tr><th>Organization</th><th>Contact</th><th>Sector</th><th>Plan</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${list.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No accounts registered yet</td></tr>' :
              list.map(u => `<tr id="user-row-${u.id}">
                <td>
                  <div style="font-weight:700;color:var(--navy)">${PLATFORM.esc(u.orgName)}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted)">${PLATFORM.esc(u.size || '')}</div>
                </td>
                <td>
                  <div style="font-size:0.85rem">${PLATFORM.esc(u.name)}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted)">${PLATFORM.esc(u.email)}</div>
                </td>
                <td style="font-size:0.82rem">${PLATFORM.esc(u.sector || '—')}</td>
                <td><span class="plan-badge plan-${PLATFORM.esc(u.plan || 'free')}">${(u.plan || 'free').charAt(0).toUpperCase() + (u.plan || 'free').slice(1)}</span></td>
                <td style="font-size:0.78rem;color:var(--text-muted)">${PLATFORM.timeAgo(u.registeredAt)}</td>
                <td>${this.statusBadge(u.status)}</td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${u.status === 'pending' ? `<button class="btn-action btn-approve" onclick="Admin.approveUser('${PLATFORM.esc(u.email)}')">✓ Approve</button>` : ''}
                    ${u.status === 'active' ? `<button class="btn-action btn-warn" onclick="Admin.suspendUser('${PLATFORM.esc(u.email)}')">Suspend</button>` : ''}
                    ${u.status === 'suspended' ? `<button class="btn-action btn-approve" onclick="Admin.activateUser('${PLATFORM.esc(u.email)}')">Activate</button>` : ''}
                    <button class="btn-action btn-danger" onclick="Admin.deleteUser('${PLATFORM.esc(u.email)}')">Delete</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  filterUsers(val) { this.showPage('users'); },

  approveUser(email) {
    const users = PLATFORM.get('users', {});
    if (users[email]) { users[email].status = 'active'; PLATFORM.store('users', users); }
    this.updatePendingBadge();
    this.showPage('users');
    PLATFORM.toast(`✅ ${email} approved and activated.`);
  },

  suspendUser(email) {
    if (!confirm(`Suspend account for ${email}?`)) return;
    const users = PLATFORM.get('users', {});
    if (users[email]) { users[email].status = 'suspended'; PLATFORM.store('users', users); }
    this.showPage('users');
    PLATFORM.toast(`Account suspended.`);
  },

  activateUser(email) {
    const users = PLATFORM.get('users', {});
    if (users[email]) { users[email].status = 'active'; PLATFORM.store('users', users); }
    this.showPage('users');
    PLATFORM.toast(`✅ Account reactivated.`);
  },

  deleteUser(email) {
    if (!confirm(`Permanently delete account for ${email}? This cannot be undone.`)) return;
    const users = PLATFORM.get('users', {});
    const uid = users[email] ? users[email].id : null;
    delete users[email];
    PLATFORM.store('users', users);
    if (uid) PLATFORM.remove('audit_' + uid);
    this.updatePendingBadge();
    this.showPage('users');
    PLATFORM.toast(`Account deleted.`);
  },

  // ---------------------------------------------------------------------------
  // AUDITS
  // ---------------------------------------------------------------------------
  renderAudits() {
    const audits = this.getAllAudits();
    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">Audit Oversight</h1><div class="page-sub">${audits.length} completed audit${audits.length !== 1 ? 's' : ''}</div></div>
      </div>
      <div class="card p-0">
        <table class="admin-table">
          <thead><tr><th>Organization</th><th>Sector</th><th>Score</th><th>Grade</th><th>Completed</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${audits.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No audits completed yet</td></tr>' :
              audits.map(a => {
                const g = this.getGrade(a.score);
                return `<tr>
                  <td><div style="font-weight:700">${PLATFORM.esc(a.orgName)}</div><div style="font-size:0.72rem;color:var(--text-muted)">${PLATFORM.esc(a.email)}</div></td>
                  <td style="font-size:0.82rem">${PLATFORM.esc(a.sector || '—')}</td>
                  <td>
                    <div style="font-weight:900;color:${g.color};font-size:1.1rem">${a.score}%</div>
                    <div style="background:var(--gray-200);height:5px;border-radius:4px;overflow:hidden;width:80px;margin-top:3px">
                      <div style="width:${a.score}%;height:100%;background:${g.color}"></div>
                    </div>
                  </td>
                  <td><span style="font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:20px;background:${g.bg};color:${g.color};border:1px solid ${g.border}">${g.label}</span></td>
                  <td style="font-size:0.78rem;color:var(--text-muted)">${PLATFORM.timeAgo(a.completedAt)}</td>
                  <td>${a.reviewed
                    ? '<span style="font-size:0.72rem;font-weight:700;color:var(--teal);background:var(--teal-pale);padding:3px 9px;border-radius:20px">✓ Reviewed</span>'
                    : '<span style="font-size:0.72rem;font-weight:700;color:var(--warning);background:var(--warning-light);padding:3px 9px;border-radius:20px">Pending Review</span>'}</td>
                  <td>
                    ${!a.reviewed ? `<button class="btn-action btn-approve" onclick="Admin.markReviewed('${a.userId}')">Mark Reviewed</button>` : ''}
                  </td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  getAllAudits() {
    const users = PLATFORM.get('users', {});
    return Object.values(users).map(u => {
      const audit = PLATFORM.get('audit_' + u.id);
      if (!audit || !audit.completedAt) return null;
      const score = this.calcScore(audit.answers || {});
      return { userId: u.id, orgName: u.orgName, email: u.email, sector: u.sector, score, completedAt: audit.completedAt, reviewed: audit.reviewed || false };
    }).filter(Boolean).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));
  },

  markReviewed(userId) {
    const audit = PLATFORM.get('audit_' + userId);
    if (audit) { audit.reviewed = true; PLATFORM.store('audit_' + userId, audit); }
    this.showPage('audits');
    PLATFORM.toast('✅ Audit marked as reviewed.');
  },

  calcScore(answers) {
    if (typeof CHECKLIST_DATA === 'undefined') return 0;
    let total = 0;
    CHECKLIST_DATA.sections.forEach(sec => {
      let earned = 0, possible = 0;
      sec.items.forEach(item => {
        const a = answers[`${sec.id}_${item.id}`];
        if (a === 'na') return;
        possible += 2;
        if (a === 'yes') earned += 2;
        else if (a === 'partial') earned += 1;
      });
      const pct = possible > 0 ? (earned / possible) * 100 : 0;
      total += (pct * sec.weight) / 100;
    });
    return Math.round(total);
  },

  getGrade(score) {
    if (score >= 90) return { label: 'DISTINCTION', color: '#0d7a5f', bg: '#e6f6f2', border: '#a8ddd0', badge: 'Audit Ready' };
    if (score >= 75) return { label: 'PASS', color: '#1e8449', bg: '#eafaf1', border: '#a9dfbf', badge: 'Substantially Compliant' };
    if (score >= 60) return { label: 'CONDITIONAL PASS', color: '#d68910', bg: '#fefaed', border: '#f9e4a0', badge: 'Needs Improvement' };
    if (score >= 40) return { label: 'FAIL', color: '#c0392b', bg: '#fdf1f0', border: '#f5c6c3', badge: 'Non-Compliant' };
    return { label: 'CRITICAL FAIL', color: '#922b21', bg: '#fce8e6', border: '#e8a09a', badge: 'Seriously Non-Compliant' };
  },

  // ---------------------------------------------------------------------------
  // CONTENT / NEWS
  // ---------------------------------------------------------------------------
  renderContent() {
    const items = PLATFORM.get('news_items', []);
    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">News &amp; Regulatory Updates</h1><div class="page-sub">Manage content shown on the landing page</div></div>
        <button class="btn btn-teal btn-sm" onclick="Admin.showNewsForm()">+ Add Update</button>
      </div>

      <!-- Add/Edit Form (hidden by default) -->
      <div class="card" id="news-form-card" style="display:none;margin-bottom:20px">
        <div class="card-head" id="news-form-title">Add Regulatory Update</div>
        <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label class="form-label">Date Label</label>
            <input class="form-control" id="nf-date" placeholder="e.g. January 2025">
          </div>
          <div class="form-group">
            <label class="form-label">Badge Text</label>
            <input class="form-control" id="nf-badge" placeholder="e.g. Major, Registration, Deadline">
          </div>
          <div class="form-group">
            <label class="form-label">Badge Style</label>
            <select class="form-control" id="nf-badge-class">
              <option value="badge-danger">Red — Major/Critical</option>
              <option value="badge-warning">Orange — Registration/Deadline</option>
              <option value="badge-teal">Teal — Update/Guidance</option>
              <option value="badge-navy">Navy — General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Link URL (optional)</label>
            <input class="form-control" id="nf-link" placeholder="https://...">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Title</label>
            <input class="form-control" id="nf-title" placeholder="Update headline">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Body Text</label>
            <textarea class="form-control" id="nf-body" rows="3" placeholder="Full description of the update..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Link Button Text</label>
            <input class="form-control" id="nf-link-text" placeholder="e.g. Read more ↗">
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;padding-top:28px">
            <input type="checkbox" id="nf-published" checked style="width:16px;height:16px">
            <label for="nf-published" style="font-size:0.87rem;font-weight:600;color:var(--text)">Published (visible on site)</label>
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;gap:10px">
          <button class="btn btn-teal btn-sm" onclick="Admin.saveNews()">Save Update</button>
          <button class="btn btn-ghost btn-sm" onclick="Admin.hideNewsForm()">Cancel</button>
        </div>
      </div>

      <!-- News List -->
      <div style="display:flex;flex-direction:column;gap:12px">
        ${items.length === 0 ? '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted)">No updates yet. Add your first regulatory update above.</div>' :
          items.map(n => `
          <div class="card" style="padding:16px 20px;display:flex;align-items:flex-start;gap:16px" id="news-item-${n.id}">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                <span class="badge ${PLATFORM.esc(n.badgeClass)}">${PLATFORM.esc(n.badge)}</span>
                <span style="font-size:0.78rem;color:var(--text-muted)">${PLATFORM.esc(n.date)}</span>
                ${!n.published ? '<span style="font-size:0.7rem;background:var(--gray-100);color:var(--text-muted);padding:2px 8px;border-radius:10px">Draft</span>' : ''}
              </div>
              <div style="font-weight:700;color:var(--navy);margin-bottom:4px">${PLATFORM.esc(n.title)}</div>
              <div style="font-size:0.84rem;color:var(--text-soft)">${PLATFORM.esc(n.body).substring(0, 120)}...</div>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
              <button class="btn-action btn-warn" onclick="Admin.editNews('${n.id}')">Edit</button>
              <button class="btn-action btn-danger" onclick="Admin.deleteNews('${n.id}')">Delete</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  },

  showNewsForm(id) {
    this.editingNewsId = id || null;
    const card = document.getElementById('news-form-card');
    const title = document.getElementById('news-form-title');
    if (!card) return;
    card.style.display = 'block';
    title.textContent = id ? 'Edit Regulatory Update' : 'Add Regulatory Update';
    if (id) {
      const items = PLATFORM.get('news_items', []);
      const n = items.find(x => x.id === id);
      if (n) {
        document.getElementById('nf-date').value = n.date;
        document.getElementById('nf-badge').value = n.badge;
        document.getElementById('nf-badge-class').value = n.badgeClass;
        document.getElementById('nf-title').value = n.title;
        document.getElementById('nf-body').value = n.body;
        document.getElementById('nf-link').value = n.link || '';
        document.getElementById('nf-link-text').value = n.linkText || '';
        document.getElementById('nf-published').checked = n.published !== false;
      }
    } else {
      ['nf-date','nf-badge','nf-title','nf-body','nf-link','nf-link-text'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
      document.getElementById('nf-published').checked = true;
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  hideNewsForm() { const c = document.getElementById('news-form-card'); if(c) c.style.display='none'; this.editingNewsId = null; },

  saveNews() {
    const title = document.getElementById('nf-title').value.trim();
    const body = document.getElementById('nf-body').value.trim();
    if (!title || !body) { PLATFORM.toast('Please fill in the title and body text.'); return; }
    const items = PLATFORM.get('news_items', []);
    const item = {
      id: this.editingNewsId || 'n_' + Date.now(),
      date: document.getElementById('nf-date').value.trim() || new Date().getFullYear().toString(),
      badge: document.getElementById('nf-badge').value.trim() || 'Update',
      badgeClass: document.getElementById('nf-badge-class').value,
      title, body,
      link: document.getElementById('nf-link').value.trim(),
      linkText: document.getElementById('nf-link-text').value.trim() || 'Read more ↗',
      published: document.getElementById('nf-published').checked
    };
    if (this.editingNewsId) {
      const idx = items.findIndex(x => x.id === this.editingNewsId);
      if (idx >= 0) items[idx] = item; else items.push(item);
    } else { items.push(item); }
    PLATFORM.store('news_items', items);
    PLATFORM.toast('✅ Update saved and live on the website.');
    this.showPage('content');
  },

  editNews(id) { this.showPage('content'); setTimeout(() => this.showNewsForm(id), 50); },

  deleteNews(id) {
    if (!confirm('Delete this news update?')) return;
    const items = PLATFORM.get('news_items', []).filter(n => n.id !== id);
    PLATFORM.store('news_items', items);
    this.showPage('content');
    PLATFORM.toast('Update deleted.');
  },

  // ---------------------------------------------------------------------------
  // DOCUMENTS
  // ---------------------------------------------------------------------------
  renderDocuments() {
    const docs = PLATFORM.get('doc_library', []);
    const types = ['Act', 'Guide', 'Template', 'Tool', 'Form', 'Policy'];
    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">Document Library</h1><div class="page-sub">Compliance resources available to all registered users</div></div>
        <button class="btn btn-teal btn-sm" onclick="Admin.showDocForm()">+ Add Document</button>
      </div>

      <!-- Add/Edit Form -->
      <div class="card" id="doc-form-card" style="display:none;margin-bottom:20px">
        <div class="card-head" id="doc-form-title">Add Document</div>
        <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Document Title</label>
            <input class="form-control" id="df-title" placeholder="e.g. DPA 2024 Compliance Checklist">
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-control" id="df-type">
              ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-control" id="df-date" type="date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Description</label>
            <textarea class="form-control" id="df-desc" rows="2" placeholder="Brief description of the document..."></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">URL or Link</label>
            <input class="form-control" id="df-url" placeholder="https://... or internal page like audit.html">
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;gap:10px">
          <button class="btn btn-teal btn-sm" onclick="Admin.saveDoc()">Save Document</button>
          <button class="btn btn-ghost btn-sm" onclick="Admin.hideDocForm()">Cancel</button>
        </div>
      </div>

      <!-- Docs Table -->
      <div class="card p-0">
        <table class="admin-table">
          <thead><tr><th>Title</th><th>Type</th><th>Description</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${docs.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">No documents yet.</td></tr>' :
              docs.map(d => `<tr>
                <td>
                  <div style="font-weight:700">${PLATFORM.esc(d.title)}</div>
                  ${d.url && d.url !== '#' ? `<a href="${PLATFORM.esc(d.url)}" target="_blank" style="font-size:0.72rem;color:var(--teal-light)">Open ↗</a>` : '<span style="font-size:0.72rem;color:var(--text-muted)">No link set</span>'}
                </td>
                <td><span style="font-size:0.72rem;font-weight:700;padding:2px 9px;border-radius:20px;background:var(--gray-100);color:var(--navy)">${PLATFORM.esc(d.type)}</span></td>
                <td style="font-size:0.82rem;color:var(--text-soft);max-width:260px">${PLATFORM.esc(d.desc)}</td>
                <td style="font-size:0.78rem;color:var(--text-muted)">${PLATFORM.formatDate(d.date)}</td>
                <td><div style="display:flex;gap:6px">
                  <button class="btn-action btn-warn" onclick="Admin.editDoc('${d.id}')">Edit</button>
                  <button class="btn-action btn-danger" onclick="Admin.deleteDoc('${d.id}')">Delete</button>
                </div></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  },

  showDocForm(id) {
    this.editingDocId = id || null;
    const card = document.getElementById('doc-form-card');
    if (!card) return;
    card.style.display = 'block';
    document.getElementById('doc-form-title').textContent = id ? 'Edit Document' : 'Add Document';
    if (id) {
      const docs = PLATFORM.get('doc_library', []);
      const d = docs.find(x => x.id === id);
      if (d) {
        document.getElementById('df-title').value = d.title;
        document.getElementById('df-type').value = d.type;
        document.getElementById('df-date').value = d.date;
        document.getElementById('df-desc').value = d.desc;
        document.getElementById('df-url').value = d.url || '';
      }
    } else {
      ['df-title','df-desc','df-url'].forEach(i => { const el = document.getElementById(i); if(el) el.value=''; });
      document.getElementById('df-date').value = new Date().toISOString().split('T')[0];
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  hideDocForm() { const c = document.getElementById('doc-form-card'); if(c) c.style.display='none'; this.editingDocId=null; },

  saveDoc() {
    const title = document.getElementById('df-title').value.trim();
    if (!title) { PLATFORM.toast('Please enter a document title.'); return; }
    const docs = PLATFORM.get('doc_library', []);
    const doc = { id: this.editingDocId || 'd_' + Date.now(), title, type: document.getElementById('df-type').value, date: document.getElementById('df-date').value, desc: document.getElementById('df-desc').value.trim(), url: document.getElementById('df-url').value.trim() || '#' };
    if (this.editingDocId) { const i = docs.findIndex(x => x.id === this.editingDocId); if(i>=0) docs[i]=doc; else docs.push(doc); }
    else docs.push(doc);
    PLATFORM.store('doc_library', docs);
    PLATFORM.toast('✅ Document saved.');
    this.showPage('documents');
  },

  editDoc(id) { this.showPage('documents'); setTimeout(() => this.showDocForm(id), 50); },

  deleteDoc(id) {
    if (!confirm('Remove this document from the library?')) return;
    PLATFORM.store('doc_library', PLATFORM.get('doc_library', []).filter(d => d.id !== id));
    this.showPage('documents');
    PLATFORM.toast('Document removed.');
  },

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------
  renderSettings() {
    const s = PLATFORM.get('platform_settings', {});
    return `
    <div class="app-main-inner">
      <div class="page-header">
        <div><h1 class="page-title">Platform Settings</h1><div class="page-sub">Configuration and access controls</div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

        <div class="card">
          <div class="card-head">🔐 Access Control</div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:18px">
            <div class="setting-row">
              <div>
                <div class="setting-label">Require Admin Approval for New Accounts</div>
                <div class="setting-desc">When ON, newly registered users cannot log in until you approve them from the Users page.</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="s-require-approval" ${s.requireApproval ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label">Open Registration</div>
                <div class="setting-desc">When OFF, the registration form is disabled — useful during maintenance.</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="s-reg-open" ${s.registrationOpen !== false ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">🏢 Platform Identity</div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label">Platform Name</label>
              <input class="form-control" id="s-name" value="${PLATFORM.esc(s.platformName || 'Fidelity Compliance Platform')}">
            </div>
            <div class="form-group">
              <label class="form-label">Support Email</label>
              <input class="form-control" id="s-email" value="${PLATFORM.esc(s.supportEmail || 'support@fidelityassessors.mw')}">
            </div>
            <div class="form-group">
              <label class="form-label">DPO Email</label>
              <input class="form-control" id="s-dpo" value="${PLATFORM.esc(s.dpoEmail || 'dpo@fidelityassessors.mw')}">
            </div>
          </div>
        </div>

        <div class="card" style="grid-column:1/-1">
          <div class="card-head">📊 Platform Statistics</div>
          <div style="padding:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center">
            ${(() => { const u = Object.values(PLATFORM.get('users',{})); const a = this.getAllAudits(); return `
              <div><div style="font-size:1.8rem;font-weight:900;color:var(--navy)">${u.length}</div><div style="font-size:0.78rem;color:var(--text-muted)">Total Users</div></div>
              <div><div style="font-size:1.8rem;font-weight:900;color:var(--teal)">${a.length}</div><div style="font-size:0.78rem;color:var(--text-muted)">Audits Done</div></div>
              <div><div style="font-size:1.8rem;font-weight:900;color:var(--warning)">${u.filter(x=>x.status==='pending').length}</div><div style="font-size:0.78rem;color:var(--text-muted)">Pending Approval</div></div>
              <div><div style="font-size:1.8rem;font-weight:900;color:var(--navy-light)">${PLATFORM.get('doc_library',[]).length}</div><div style="font-size:0.78rem;color:var(--text-muted)">Documents</div></div>
            `; })()}
          </div>
        </div>

      </div>

      <div style="margin-top:20px">
        <button class="btn btn-teal" onclick="Admin.saveSettings()">Save Settings</button>
      </div>

      <div class="card" style="margin-top:24px;border-color:var(--danger)">
        <div class="card-head" style="color:var(--danger)">⚠️ Admin Credentials</div>
        <div style="padding:16px 20px">
          <div style="font-size:0.87rem;color:var(--text-soft);line-height:1.7">
            <strong>Admin Email:</strong> admin@fidelityassessors.mw<br>
            <strong>Admin Password:</strong> FidelityAdmin@2024!<br>
            <span style="font-size:0.78rem;color:var(--text-muted)">Store these credentials securely. Do not share them. For production deployment, migrate to a server-side authentication system.</span>
          </div>
        </div>
      </div>
    </div>`;
  },

  saveSettings() {
    const s = {
      requireApproval: document.getElementById('s-require-approval').checked,
      registrationOpen: document.getElementById('s-reg-open').checked,
      platformName: document.getElementById('s-name').value.trim(),
      supportEmail: document.getElementById('s-email').value.trim(),
      dpoEmail: document.getElementById('s-dpo').value.trim()
    };
    PLATFORM.store('platform_settings', s);
    PLATFORM.toast('✅ Settings saved successfully.');
  },

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  statusBadge(status) {
    const map = { active: ['var(--teal)', 'var(--teal-pale)', 'Active'], pending: ['var(--warning)', 'var(--warning-light)', 'Pending'], suspended: ['var(--danger)', 'var(--danger-pale)', 'Suspended'] };
    const [c, bg, label] = map[status] || map['active'];
    return `<span style="font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:20px;background:${bg};color:${c}">${label}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CHECKLIST_DATA !== 'undefined') Admin.init();
  else { const s = document.createElement('script'); s.src = 'js/checklist-data.js'; s.onload = () => Admin.init(); document.head.appendChild(s); }
});
