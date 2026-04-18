// =============================================================================
// Fidelity Compliance Platform — Supabase Database Adapter
// Falls back to localStorage when Supabase is not configured.
// =============================================================================

const DB = {
  _client: null,

  // -------------------------------------------------------------------------
  // Initialize — called from main.js DOMContentLoaded
  // -------------------------------------------------------------------------
  init() {
    if (typeof supabase === 'undefined') {
      console.info('[DB] Supabase SDK not loaded — running in localStorage mode.');
      return;
    }
    if (!SUPABASE_CONFIG || SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID')) {
      console.info('[DB] Supabase not configured — running in localStorage mode.');
      return;
    }
    try {
      this._client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.info('[DB] Supabase connected.');
    } catch (e) {
      console.warn('[DB] Init failed:', e.message);
    }
  },

  // -------------------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------------------
  async signUp(email, password) {
    const { data, error } = await this._client.auth.signUp({
      email, password,
      options: { emailRedirectTo: null }
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await this._client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  async signOut() {
    if (!this._client) return;
    await this._client.auth.signOut();
  },

  async getSession() {
    if (!this._client) return null;
    const { data: { session } } = await this._client.auth.getSession();
    return session;
  },

  // -------------------------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------------------------
  async getProfile(userId) {
    const { data, error } = await this._client
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', userId)
      .single();
    return error ? null : data;
  },

  async createProfile(userId, email, fullName, orgId, role, status, extras = {}) {
    const { data, error } = await this._client
      .from('profiles')
      .insert({ id: userId, email, full_name: fullName, org_id: orgId, role, status, ...extras })
      .select('*, organizations(*)')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(userId, updates) {
    // Accept both camelCase (legacy) and snake_case field names
    const m = {};
    if (updates.full_name    !== undefined) m.full_name    = updates.full_name;
    if (updates.name         !== undefined) m.full_name    = updates.name;
    if (updates.status       !== undefined) m.status       = updates.status;
    if (updates.role         !== undefined) m.role         = updates.role;
    if (updates.plan         !== undefined) m.plan         = updates.plan;
    if (updates.last_login   !== undefined) m.last_login   = updates.last_login;
    if (updates.contact_role !== undefined) m.contact_role = updates.contact_role;
    if (updates.contactRole  !== undefined) m.contact_role = updates.contactRole;
    if (updates.contact_phone !== undefined) m.contact_phone = updates.contact_phone;
    if (updates.contactPhone !== undefined) m.contact_phone = updates.contactPhone;
    if (updates.invited_by   !== undefined) m.invited_by   = updates.invited_by;
    const { data, error } = await this._client
      .from('profiles').update(m).eq('id', userId)
      .select('*, organizations(*)').single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await this._client
      .from('profiles')
      .select('*, organizations(*)')
      .order('created_at', { ascending: false });
    return error ? [] : (data || []);
  },

  async deleteProfile(userId) {
    const { error } = await this._client.from('profiles').delete().eq('id', userId);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // ORGANIZATIONS
  // -------------------------------------------------------------------------
  async createOrg(name, sector, size, address, plan = 'free') {
    const { data, error } = await this._client
      .from('organizations')
      .insert({ name, sector, size_category: size, address, plan })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateOrg(orgId, updates) {
    const m = {};
    if (updates.name          !== undefined) m.name             = updates.name;
    if (updates.orgName       !== undefined) m.name             = updates.orgName;
    if (updates.sector        !== undefined) m.sector           = updates.sector;
    if (updates.size          !== undefined) m.size_category    = updates.size;
    if (updates.size_category !== undefined) m.size_category    = updates.size_category;
    if (updates.address       !== undefined) m.address          = updates.address;
    if (updates.fiscalYearStart !== undefined) m.fiscal_year_start = updates.fiscalYearStart;
    if (updates.fiscal_year_start !== undefined) m.fiscal_year_start = updates.fiscal_year_start;
    if (updates.plan          !== undefined) m.plan             = updates.plan;
    const { data, error } = await this._client
      .from('organizations').update(m).eq('id', orgId).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  // -------------------------------------------------------------------------
  // AUDITS
  // -------------------------------------------------------------------------
  async getLatestAudit(userId) {
    const { data } = await this._client
      .from('audits').select('*').eq('user_id', userId)
      .order('started_at', { ascending: false }).limit(1).maybeSingle();
    return data || null;
  },

  async saveAudit(userId, orgId, answers, notes, completedAt) {
    const existing = await this.getLatestAudit(userId);
    if (existing && !existing.completed_at) {
      const { data, error } = await this._client
        .from('audits').update({ answers, notes, completed_at: completedAt || null })
        .eq('id', existing.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await this._client
        .from('audits').insert({ user_id: userId, org_id: orgId, answers, notes, completed_at: completedAt || null })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  },

  async getAllAudits() {
    const { data, error } = await this._client
      .from('audits')
      .select('*, profiles(id, email, full_name, org_id, plan), organizations(name, sector)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    return error ? [] : (data || []);
  },

  async markAuditReviewed(auditId) {
    await this._client.from('audits')
      .update({ reviewed: true, reviewed_at: new Date().toISOString() }).eq('id', auditId);
  },

  // -------------------------------------------------------------------------
  // OFFICER REQUESTS
  // -------------------------------------------------------------------------
  async createOfficerRequest(orgId, requestedById, orgName, name, email) {
    const { data, error } = await this._client
      .from('officer_requests')
      .insert({ org_id: orgId, requested_by: requestedById, org_name: orgName, name, email })
      .select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getPendingRequestsForOrg(orgId) {
    const { data } = await this._client.from('officer_requests')
      .select('*').eq('org_id', orgId).eq('status', 'pending')
      .order('created_at', { ascending: false });
    return data || [];
  },

  async getAllPendingRequests() {
    const { data } = await this._client.from('officer_requests')
      .select('*').eq('status', 'pending').order('created_at', { ascending: false });
    return data || [];
  },

  async resolveOfficerRequest(reqId, status) {
    const { error } = await this._client.from('officer_requests')
      .update({ status, resolved_at: new Date().toISOString() }).eq('id', reqId);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // QUARTERLY CHECK-INS
  // -------------------------------------------------------------------------
  async getCheckins(userId) {
    const { data } = await this._client
      .from('quarterly_checkins').select('*').eq('user_id', userId);
    return (data || []).map(c => ({
      quarterId: c.quarter_id, completedAt: c.completed_at,
      method: c.method, score: c.score
    }));
  },

  async saveCheckin(userId, quarterId, score, method = 'manual') {
    const { error } = await this._client.from('quarterly_checkins').upsert(
      { user_id: userId, quarter_id: quarterId, score, method, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,quarter_id' }
    );
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // ACTIVITY LOG
  // -------------------------------------------------------------------------
  async logActivity(userId, type, description) {
    if (!userId || !this._client) return;
    await this._client.from('activity_log').insert({ user_id: userId, type, description }).catch(() => {});
  },

  async getActivity(userId) {
    const { data } = await this._client.from('activity_log').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    return (data || []).map(a => ({ type: a.type, description: a.description, time: a.created_at }));
  },

  // -------------------------------------------------------------------------
  // NEWS ITEMS
  // -------------------------------------------------------------------------
  async getNewsItems() {
    const { data } = await this._client.from('news_items').select('*')
      .order('sort_order', { ascending: false }).order('created_at', { ascending: false });
    return (data || []).map(n => ({
      id: n.id, date: n.date_label, badge: n.badge, badgeClass: n.badge_class,
      title: n.title, body: n.body, link: n.link, linkText: n.link_text, published: n.published
    }));
  },

  async saveNewsItem(item) {
    const row = {
      date_label: item.date, badge: item.badge, badge_class: item.badgeClass,
      title: item.title, body: item.body, link: item.link || null,
      link_text: item.linkText || null, published: item.published !== false
    };
    // If id looks like a real UUID (not a localStorage-generated 'n_...' string)
    const isUUID = item.id && /^[0-9a-f-]{36}$/i.test(item.id);
    if (isUUID) {
      const { data, error } = await this._client.from('news_items').update(row).eq('id', item.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await this._client.from('news_items').insert(row).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  },

  async deleteNewsItem(id) {
    await this._client.from('news_items').delete().eq('id', id);
  },

  // -------------------------------------------------------------------------
  // DOCUMENTS
  // -------------------------------------------------------------------------
  async getDocuments() {
    const { data } = await this._client.from('documents').select('*')
      .order('created_at', { ascending: false });
    return (data || []).map(d => ({
      id: d.id, title: d.title, desc: d.description,
      type: d.doc_type, url: d.url, date: d.doc_date
    }));
  },

  async saveDocument(doc) {
    const row = {
      title: doc.title, description: doc.desc || doc.description,
      doc_type: doc.type, url: doc.url, doc_date: doc.date || null
    };
    const isUUID = doc.id && /^[0-9a-f-]{36}$/i.test(doc.id);
    if (isUUID) {
      const { data, error } = await this._client.from('documents').update(row).eq('id', doc.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await this._client.from('documents').insert(row).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
  },

  async deleteDocument(id) {
    await this._client.from('documents').delete().eq('id', id);
  },

  // -------------------------------------------------------------------------
  // PLATFORM SETTINGS
  // -------------------------------------------------------------------------
  async getSettings() {
    const { data } = await this._client.from('platform_settings').select('*');
    if (!data || !data.length) return {};
    return data.reduce((acc, row) => {
      // Supabase stores values as JSONB — unwrap primitives
      acc[row.key] = typeof row.value === 'string' ? row.value : row.value;
      return acc;
    }, {});
  },

  async saveSettings(settings) {
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await this._client.from('platform_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------------------------------
  // DATA NORMALIZERS (DB → legacy app format)
  // -------------------------------------------------------------------------
  normalizeProfile(p) {
    if (!p) return null;
    const org = p.organizations || {};
    return {
      id:              p.id,
      email:           p.email,
      name:            p.full_name  || '',
      orgName:         org.name     || '',
      orgId:           p.org_id     || p.id,
      sector:          org.sector   || '',
      size:            org.size_category || '',
      address:         org.address  || '',
      plan:            p.plan       || org.plan || 'free',
      status:          p.status     || 'active',
      role:            p.role       || 'company_admin',
      registeredAt:    p.created_at,
      lastLogin:       p.last_login,
      contactRole:     p.contact_role  || '',
      contactPhone:    p.contact_phone || '',
      fiscalYearStart: org.fiscal_year_start || null
    };
  },

  normalizeAudit(a) {
    if (!a) return null;
    return {
      id:          a.id,
      answers:     a.answers     || {},
      notes:       a.notes       || {},
      startedAt:   a.started_at,
      completedAt: a.completed_at || null,
      reviewed:    a.reviewed    || false
    };
  }
};
