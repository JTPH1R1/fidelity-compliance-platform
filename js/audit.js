// =============================================================================
// Fidelity Compliance Platform — Audit Tool (Platform-Integrated)
// =============================================================================

const AuditApp = {

  user:     null,
  orgData:  null,
  AUDIT_KEY: null,
  state: { answers: {}, notes: {}, currentSection: 0, startedAt: null, completedAt: null },

  // ---------------------------------------------------------------------------
  async init() {
    const session = await PLATFORM.requireAuth();
    if (!session) return;
    this.user = session;
    this.AUDIT_KEY = 'audit_' + session.userId;

    // Load saved state: DB-first, localStorage fallback
    if (typeof DB_READY === 'function' && DB_READY()) {
      try {
        const [dbAudit, profile] = await Promise.all([
          DB.getLatestAudit(session.userId),
          DB.getProfile(session.userId)
        ]);
        if (dbAudit) {
          const normalized = DB.normalizeAudit(dbAudit);
          this.state = { ...this.state, ...normalized };
        } else {
          this.state.startedAt = new Date().toISOString();
        }
        if (profile) {
          const n = DB.normalizeProfile(profile);
          this.orgData = { orgName: n.orgName, sector: n.sector, size: n.size };
        }
      } catch(e) {
        console.warn('[Audit] DB load failed:', e.message);
        const saved = PLATFORM.get(this.AUDIT_KEY);
        if (saved) this.state = { ...this.state, ...saved };
        else this.state.startedAt = new Date().toISOString();
      }
    } else {
      const saved = PLATFORM.get(this.AUDIT_KEY);
      if (saved) {
        this.state = { ...this.state, ...saved };
      } else {
        this.state.startedAt = new Date().toISOString();
      }
      const users = PLATFORM.get('users', {});
      const u = users[session.email] || {};
      this.orgData = { orgName: u.orgName || session.orgName, sector: u.sector, size: u.size };
    }

    this.renderNav();
    this.renderSection(this.state.currentSection);
    this.updateProgress();
    this.updateScore();

    if (new URLSearchParams(window.location.search).get('print') === '1') {
      setTimeout(() => { this.showResults(); setTimeout(() => window.print(), 800); }, 400);
    }
  },

  save() {
    PLATFORM.store(this.AUDIT_KEY, this.state);
    // Fire-and-forget DB sync
    if (typeof DB_READY === 'function' && DB_READY()) {
      DB.saveAudit(
        this.user.userId,
        this.user.orgId,
        this.state.answers,
        this.state.notes,
        this.state.completedAt || null
      ).catch(e => console.warn('[Audit] DB save failed:', e.message));
    }
  },

  // ---------------------------------------------------------------------------
  // Sidebar Nav
  // ---------------------------------------------------------------------------
  renderNav() {
    const nav = document.getElementById('audit-nav-list');
    if (!nav) return;
    nav.innerHTML = CHECKLIST_DATA.sections.map((sec, i) => {
      const done    = this.isSectionComplete(sec);
      const active  = i === this.state.currentSection;
      return `
        <button class="audit-nav-item ${active ? 'active' : ''} ${done ? 'done' : ''}"
          onclick="AuditApp.goToSection(${i})">
          <span class="ani-num">${sec.number}</span>
          <span class="ani-label">${sec.title}</span>
          ${done ? '<span class="ani-check">✓</span>' : ''}
        </button>
      `;
    }).join('');
  },

  // ---------------------------------------------------------------------------
  // Render Section
  // ---------------------------------------------------------------------------
  renderSection(idx) {
    const sec = CHECKLIST_DATA.sections[idx];
    if (!sec) return;
    this.state.currentSection = idx;

    const answered = this.countAnswered();
    const total    = this.countTotal();
    const secScore = this.calcSectionScore(sec);
    const pctStr   = secScore.possible > 0 ? Math.round(secScore.pct) + '%' : '—';

    const qs = sec.items.map((item, qi) => {
      const key = `${sec.id}_${item.id}`;
      const ans = this.state.answers[key] || null;
      const selClass = ans ? `s-${ans}` : '';
      return `
        <div class="q-item ${ans ? 'ans-' + ans : ''}" id="qi-${key}">
          <div class="q-head">
            <div class="q-meta">
              <span class="q-num">Q${qi + 1} of ${sec.items.length}</span>
              <div class="q-flags">
                <span class="q-act">${esc(item.actClause)}</span>
                ${item.critical ? '<span class="q-crit-badge">⚠ Critical</span>' : ''}
              </div>
            </div>
            <p class="q-text">${esc(item.question)}</p>
            <button class="q-hint-btn" onclick="toggleHint('qh-${key}',this)">💡 Guidance &amp; Hint ▾</button>
            <div class="q-hint-body" id="qh-${key}">${esc(item.hint)}</div>
          </div>
          <div class="ans-bar">
            <button class="ans-btn ${ans === 'yes'     ? 's-yes'     : ''}" onclick="AuditApp.answer('${key}','yes')">✓ YES</button>
            <button class="ans-btn ${ans === 'partial' ? 's-partial' : ''}" onclick="AuditApp.answer('${key}','partial')">◑ PARTIAL</button>
            <button class="ans-btn ${ans === 'no'      ? 's-no'      : ''}" onclick="AuditApp.answer('${key}','no')">✗ NO</button>
            <button class="ans-btn ${ans === 'na'      ? 's-na'      : ''}" onclick="AuditApp.answer('${key}','na')">— N/A</button>
          </div>
        </div>
      `;
    }).join('');

    const isFirst = idx === 0;
    const isLast  = idx === CHECKLIST_DATA.sections.length - 1;

    document.getElementById('audit-content').innerHTML = `
      <div class="sec-card">
        <div class="sec-card-head">
          <span class="sec-card-icon">${sec.icon}</span>
          <div class="sec-head-text">
            <div class="sec-num-label">Section ${sec.number} of ${CHECKLIST_DATA.sections.length} — Weight: ${sec.weight}%</div>
            <h2 class="sec-title">${esc(sec.title)}</h2>
            <span class="sec-act-badge">📌 ${esc(sec.actRef)}</span>
          </div>
          <div class="sec-score-area">
            <div class="sec-score-num" id="sec-score-val">${pctStr}</div>
            <div class="sec-score-lbl">Section Score</div>
          </div>
        </div>

        <button class="law-acc-btn" onclick="toggleAccordion('law-${sec.id}',this)">
          ⚖️ What the Law Says (${esc(sec.actRef)})
          <span style="font-size:0.75rem;transition:transform 0.2s" class="law-arrow">▾</span>
        </button>
        <div class="law-acc-body" id="law-${sec.id}">
          <blockquote class="law-text">"${esc(sec.lawText)}"</blockquote>
        </div>

        <div class="sec-explain">
          <div class="explain-kicker">📖 Plain English Explanation</div>
          <div class="explain-text">${sec.explanation.replace(/\n/g,'<br>')}</div>
        </div>

        <div class="questions-area">${qs}</div>

        <div class="notes-area">
          <div class="notes-lbl">📝 Assessor Notes (optional)</div>
          <textarea class="notes-textarea"
            id="notes-${sec.id}"
            placeholder="Add observations, evidence references, or context for this section..."
            oninput="AuditApp.saveNote('${sec.id}',this.value)"
          >${esc(this.state.notes[sec.id] || '')}</textarea>
        </div>

        <div class="sec-nav-bar">
          <button class="btn btn-ghost" onclick="AuditApp.goToSection(${idx - 1})" ${isFirst ? 'disabled' : ''}>← Previous</button>
          <span class="sec-nav-info">${answered} of ${total} answered</span>
          <button class="btn btn-teal" onclick="AuditApp.goToSection(${isLast ? idx : idx + 1}); ${isLast ? 'AuditApp.showResults()' : ''}">
            ${isLast ? 'View Results →' : 'Next Section →'}
          </button>
        </div>
      </div>
    `;

    this.renderNav();
    this.updateProgress();
    this.updateScore();
    window.scrollTo(0, 0);
  },

  // ---------------------------------------------------------------------------
  answer(key, val) {
    this.state.answers[key] = val;
    this.save();

    const item = document.getElementById('qi-' + key);
    if (item) {
      item.className = `q-item ans-${val}`;
      item.querySelectorAll('.ans-btn').forEach(b => {
        b.className = 'ans-btn';
        ['yes','partial','no','na'].forEach((v,i) => {
          const btns = item.querySelectorAll('.ans-btn');
          if (btns[i] && v === val) btns[i].classList.add('s-' + v);
        });
      });
      // re-apply all button classes
      const btns = item.querySelectorAll('.ans-btn');
      const vals = ['yes','partial','no','na'];
      btns.forEach((b,i) => { b.className = 'ans-btn' + (vals[i] === val ? ' s-' + val : ''); });
    }

    // Update section score display
    const secEl = document.getElementById('sec-score-val');
    if (secEl) {
      const sec = CHECKLIST_DATA.sections[this.state.currentSection];
      const s = this.calcSectionScore(sec);
      secEl.textContent = s.possible > 0 ? Math.round(s.pct) + '%' : '—';
    }

    this.updateProgress();
    this.updateScore();

    // Show view results button when all answered
    const btnRes = document.getElementById('btn-view-results');
    if (btnRes) btnRes.style.display = this.countAnswered() >= this.countTotal() ? 'inline-flex' : 'none';
  },

  saveNote(secId, val) { this.state.notes[secId] = val; this.save(); },

  goToSection(idx) {
    if (idx < 0 || idx >= CHECKLIST_DATA.sections.length) return;
    this.renderSection(idx);
  },

  // ---------------------------------------------------------------------------
  // Progress & Score
  // ---------------------------------------------------------------------------
  isSectionComplete(sec) { return sec.items.every(i => !!this.state.answers[`${sec.id}_${i.id}`]); },
  countAnswered() { return Object.keys(this.state.answers).length; },
  countTotal()    { return CHECKLIST_DATA.sections.reduce((t,s) => t + s.items.length, 0); },

  calcSectionScore(sec) {
    let earned = 0, possible = 0;
    sec.items.forEach(item => {
      const ans = this.state.answers[`${sec.id}_${item.id}`];
      if (!ans || ans === 'na') return;
      possible += 2;
      if (ans === 'yes')     earned += 2;
      if (ans === 'partial') earned += 1;
    });
    return { earned, possible, pct: possible > 0 ? (earned / possible) * 100 : 0 };
  },

  calcOverall() {
    let wSum = 0, wTotal = 0;
    CHECKLIST_DATA.sections.forEach(sec => {
      const { pct, possible } = this.calcSectionScore(sec);
      if (possible === 0) return;
      wSum   += pct * sec.weight;
      wTotal += sec.weight;
    });
    return wTotal > 0 ? Math.round(wSum / wTotal) : 0;
  },

  getGrade(score) { return CHECKLIST_DATA.grades.find(g => score >= g.min) || CHECKLIST_DATA.grades[CHECKLIST_DATA.grades.length - 1]; },

  updateProgress() {
    const pct = Math.round((this.countAnswered() / this.countTotal()) * 100);
    const fill = document.getElementById('ap-fill');
    const pctEl = document.getElementById('ap-pct');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  },

  updateScore() {
    const score = this.calcOverall();
    const grade = this.getGrade(score);
    const sEl = document.getElementById('ssa-score');
    const gEl = document.getElementById('ssa-grade');
    if (sEl) sEl.textContent = score + '%';
    if (gEl) { gEl.textContent = grade.label; gEl.style.color = grade.color; }
  },

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------
  showResults() {
    this.state.completedAt = new Date().toISOString();
    this.save();

    // Log activity
    const score = this.calcOverall();
    const grade = this.getGrade(score);
    if (typeof DB_READY === 'function' && DB_READY()) {
      DB.logActivity(this.user.userId, 'audit', `Audit completed — ${grade.label} (${score}%)`).catch(() => {});
    } else {
      Auth.logActivity(this.user.userId, 'audit', `Audit completed — ${grade.label} (${score}%)`);
    }

    const content = document.getElementById('audit-content');
    if (!content) return;

    const org = this.orgData || { orgName: this.user.orgName, sector: '', size: '' };

    // Collect critical flags
    const critFlags = [];
    CHECKLIST_DATA.sections.forEach(sec => {
      sec.items.forEach(item => {
        if (item.critical && this.state.answers[`${sec.id}_${item.id}`] === 'no') {
          critFlags.push({ sec: sec.title, q: item.question, ref: item.actClause });
        }
      });
    });

    // Collect recommendations
    const recs = {};
    CHECKLIST_DATA.sections.forEach(sec => {
      const items = [];
      sec.items.forEach(item => {
        const ans = this.state.answers[`${sec.id}_${item.id}`];
        if (ans === 'no')      items.push({ pri: 'high', q: item.question, h: item.hint });
        else if (ans === 'partial') items.push({ pri: 'medium', q: item.question, h: item.hint });
      });
      if (items.length) recs[sec.id] = { title: sec.title, icon: sec.icon, items };
    });

    // Section breakdown rows
    const breakdownRows = CHECKLIST_DATA.sections.map(sec => {
      const { pct, possible } = this.calcSectionScore(sec);
      const pr = Math.round(pct);
      const g  = this.getGrade(pr);
      const bw = possible === 0 ? 0 : pr;
      return `
        <tr>
          <td><div style="font-weight:700">${sec.icon} ${esc(sec.title)}</div><div style="font-size:0.72rem;color:var(--text-muted)">${esc(sec.actRef)}</div></td>
          <td style="text-align:center;font-size:0.8rem;color:var(--text-muted)">${sec.weight}%</td>
          <td style="width:160px"><div style="background:var(--gray-200);height:8px;border-radius:10px;overflow:hidden"><div style="width:${bw}%;height:100%;background:${g.color};border-radius:10px;transition:width 0.5s"></div></div></td>
          <td style="font-weight:800;color:${g.color};text-align:right">${possible > 0 ? pr + '%' : 'N/A'}</td>
          <td><span style="font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:20px;background:${g.bg};color:${g.color};border:1px solid ${g.border}">${possible > 0 ? g.label : 'N/A'}</span></td>
        </tr>
      `;
    }).join('');

    const flagsHtml = critFlags.length === 0 ? '' : `
      <div style="background:#fff5f5;border:1.5px solid #ffbdbd;border-radius:10px;padding:18px 22px;margin-bottom:20px">
        <div style="font-weight:800;color:var(--danger);margin-bottom:12px;font-size:1rem">🚨 Critical Compliance Failures (${critFlags.length})</div>
        <p style="font-size:0.82rem;color:var(--danger);margin-bottom:12px">These high-priority requirements have not been met. Address them immediately regardless of overall score.</p>
        ${critFlags.map(f => `
          <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #ffe0e0;font-size:0.85rem">
            <span style="color:var(--danger);flex-shrink:0;margin-top:3px">●</span>
            <div>
              <span style="font-size:0.7rem;font-weight:700;background:#ffecec;color:var(--danger);padding:2px 8px;border-radius:20px;margin-right:8px">${esc(f.sec)}</span>
              ${esc(f.q)}
              <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${esc(f.ref)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;

    const recsHtml = Object.values(recs).length === 0
      ? '<div style="text-align:center;color:var(--teal);font-weight:700;padding:20px">✅ No gaps — all questions answered YES or N/A. Outstanding!</div>'
      : Object.values(recs).map(rs => `
        <div style="margin-bottom:20px">
          <div style="font-weight:700;color:var(--navy);margin-bottom:10px">${rs.icon} ${esc(rs.title)}</div>
          ${rs.items.map(r => `
            <div style="display:flex;gap:10px;padding:9px 12px;border-radius:6px;margin-bottom:6px;background:${r.pri==='high'?'#fff5f5':'#fffbf0'};border-left:3px solid ${r.pri==='high'?'var(--danger)':'var(--warning)'}">
              <span style="flex-shrink:0">${r.pri==='high'?'🔴':'🟡'}</span>
              <div style="font-size:0.87rem">
                <strong>${r.pri==='high'?'[ACTION REQUIRED]':'[IMPROVE]'}</strong> ${esc(r.q)}
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">${esc(r.h)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('');

    const notesHtml = CHECKLIST_DATA.sections
      .filter(sec => this.state.notes[sec.id] && this.state.notes[sec.id].trim())
      .map(sec => `
        <div style="margin-bottom:12px">
          <div style="font-weight:700;font-size:0.85rem;color:var(--navy);margin-bottom:3px">${sec.icon} ${esc(sec.title)}</div>
          <div style="font-size:0.85rem;color:var(--text);line-height:1.6;padding-left:12px;border-left:3px solid var(--border)">${esc(this.state.notes[sec.id])}</div>
        </div>
      `).join('');

    content.innerHTML = `
      <div style="padding:24px 28px;max-width:960px;margin:0 auto">

        <!-- Report Header -->
        <div style="background:var(--navy);border-radius:14px;padding:0;margin-bottom:22px;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <!-- Top strip: logo + report meta -->
          <div style="padding:24px 32px 20px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap">
            <div style="background:#fff;border-radius:9px;padding:8px 18px;display:inline-flex;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.25)">
              <img src="img/fidelity-logo.png" alt="Fidelity Insurance Assessors" style="height:38px;width:auto;display:block">
            </div>
            <div style="text-align:right">
              <div style="font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Official Compliance Report</div>
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.75)"><strong style="color:#fff">Date:</strong> ${PLATFORM.formatDate(this.state.completedAt)}</div>
              <div style="font-size:0.82rem;color:rgba(255,255,255,0.75)"><strong style="color:#fff">Assessor:</strong> Fidelity Insurance Assessors</div>
              <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);margin-top:3px">Regulated by MACRA / DPA Malawi</div>
            </div>
          </div>
          <!-- Gold divider -->
          <div style="height:3px;background:linear-gradient(90deg,var(--gold) 0%,#f9c55d 50%,var(--gold) 100%)"></div>
          <!-- Report title strip -->
          <div style="padding:18px 32px 22px">
            <div style="font-size:0.68rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Malawi Data Protection Act 2024</div>
            <h2 style="color:#fff;font-size:1.35rem;font-weight:900;margin-bottom:6px;line-height:1.2">Compliance Audit Report</h2>
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
              <div style="font-size:0.92rem;color:rgba(255,255,255,0.75);font-weight:600">${esc(org.orgName || this.user.orgName)}</div>
              ${org.sector ? `<span style="width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.3);flex-shrink:0"></span><div style="font-size:0.82rem;color:rgba(255,255,255,0.5)">${esc(org.sector)}${org.size ? ' · ' + esc(org.size) : ''}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Grade Banner -->
        <div style="background:${grade.bg};border:2px solid ${grade.border};border-radius:14px;padding:24px 28px;margin-bottom:22px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          <div style="width:90px;height:90px;border-radius:50%;border:5px solid ${grade.color};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
            <div style="font-size:2rem;font-weight:900;color:${grade.color};line-height:1">${score}</div>
            <div style="font-size:0.6rem;color:${grade.color};opacity:0.7;font-weight:700">/ 100</div>
          </div>
          <div style="flex:1">
            <div style="font-size:2rem;font-weight:900;color:${grade.color};line-height:1;margin-bottom:4px">${grade.label}</div>
            <div style="font-size:0.85rem;font-weight:700;color:${grade.color};opacity:0.8;margin-bottom:8px">${grade.badge}</div>
            <div style="font-size:0.88rem;color:${grade.color};opacity:0.8;max-width:500px;line-height:1.6">${grade.description}</div>
          </div>
        </div>

        ${flagsHtml}

        <!-- Section Breakdown -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 26px;margin-bottom:20px">
          <h3 style="color:var(--navy);margin-bottom:18px;font-size:1rem;padding-bottom:10px;border-bottom:1px solid var(--border)">📊 Compliance Score by Section</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th style="text-align:left;padding:7px 10px;font-size:0.72rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border)">Section</th>
              <th style="text-align:center;padding:7px 10px;font-size:0.72rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border)">Weight</th>
              <th colspan="2" style="padding:7px 10px;font-size:0.72rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border)">Score</th>
              <th style="padding:7px 10px;font-size:0.72rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border)">Grade</th>
            </tr></thead>
            <tbody>${breakdownRows}</tbody>
            <tfoot><tr style="background:var(--gray-50);font-weight:800;border-top:2px solid var(--border)">
              <td style="padding:10px 10px;font-weight:900;color:var(--navy)">OVERALL SCORE</td>
              <td style="text-align:center;padding:10px;color:var(--navy)">100%</td>
              <td colspan="2" style="padding:10px;font-size:1.1rem;color:${grade.color};font-weight:900">${score}%</td>
              <td style="padding:10px"><span style="font-size:0.78rem;font-weight:700;padding:4px 12px;border-radius:20px;background:${grade.bg};color:${grade.color};border:1px solid ${grade.border}">${grade.label}</span></td>
            </tr></tfoot>
          </table>
        </div>

        <!-- Recommendations -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 26px;margin-bottom:20px">
          <h3 style="color:var(--navy);margin-bottom:14px;font-size:1rem;padding-bottom:10px;border-bottom:1px solid var(--border)">💡 Recommendations &amp; Action Items</h3>
          <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">🔴 <strong>Action Required</strong> = answered No · 🟡 <strong>Improve</strong> = answered Partial</p>
          ${recsHtml}
        </div>

        ${notesHtml ? `<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 26px;margin-bottom:20px"><h3 style="color:var(--navy);margin-bottom:16px;font-size:1rem">📝 Assessor Notes</h3>${notesHtml}</div>` : ''}

        <!-- Disclaimer -->
        <div style="background:var(--gray-50);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin-bottom:20px">
          <p style="font-size:0.75rem;color:var(--text-muted);line-height:1.7">
            <strong style="color:var(--text)">Disclaimer:</strong>
            This report is produced by Fidelity Insurance Assessors as a compliance guidance tool and does not constitute legal advice or regulatory certification.
            Based on the Malawi Data Protection Act 2024 (in force 3 June 2024), regulated by MACRA / DPA Malawi.
            Penalty for non-compliance: up to <strong>MWK 5,000,000</strong> and/or <strong>12 months imprisonment</strong>.
          </p>
        </div>

        <!-- Report Footer (print-visible branding) -->
        <div style="background:var(--navy);border-radius:12px;padding:20px 28px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="background:#fff;border-radius:7px;padding:6px 14px;display:flex;align-items:center">
              <img src="img/fidelity-logo.png" alt="Fidelity Insurance Assessors" style="height:28px;width:auto;display:block">
            </div>
            <div>
              <div style="font-size:0.78rem;font-weight:700;color:#fff">Insurance Assessors</div>
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.45)">Data Protection Compliance Division</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.4)">info@fidelityassessors.mw · dpo@fidelityassessors.mw</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.3);margin-top:2px">This document was generated on ${PLATFORM.formatDate(this.state.completedAt)} and is confidential to the named organization.</div>
          </div>
        </div>

        <!-- Actions (no-print) -->
        <div class="no-print" style="display:flex;gap:12px;justify-content:center;padding-bottom:32px;flex-wrap:wrap">
          <button class="btn btn-navy btn-lg" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn btn-ghost btn-lg" onclick="AuditApp.goToSection(0)">← Edit Answers</button>
          <a href="dashboard.html" class="btn btn-teal btn-lg">Dashboard →</a>
        </div>

      </div>
    `;

    // Show view results button in topnav
    const btnRes = document.getElementById('btn-view-results');
    if (btnRes) btnRes.style.display = 'none';
  }
};

// ---------------------------------------------------------------------------
// Helpers (page-scope to avoid namespace issues in inline HTML)
// ---------------------------------------------------------------------------
function esc(str) { return PLATFORM.esc(str); }
function toggleAccordion(id, btn) {
  const body = document.getElementById(id);
  if (!body) return;
  const open = body.classList.toggle('open');
  const arrow = btn.querySelector('.law-arrow');
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0)';
}
function toggleHint(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const open = el.classList.toggle('open');
  btn.textContent = open ? '💡 Guidance & Hint ▴' : '💡 Guidance & Hint ▾';
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => AuditApp.init());
