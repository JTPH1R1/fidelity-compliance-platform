-- =============================================================================
-- Fidelity Compliance Platform — Supabase Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  sector            TEXT,
  size_category     TEXT,
  address           TEXT,
  plan              TEXT        DEFAULT 'free',
  fiscal_year_start INTEGER     CHECK (fiscal_year_start BETWEEN 1 AND 12),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email         TEXT        UNIQUE NOT NULL,
  full_name     TEXT,
  org_id        UUID        REFERENCES organizations(id),
  role          TEXT        DEFAULT 'company_admin'
                            CHECK (role IN ('company_admin','compliance_officer','platform_admin')),
  contact_role  TEXT,
  contact_phone TEXT,
  plan          TEXT        DEFAULT 'free',
  status        TEXT        DEFAULT 'pending'
                            CHECK (status IN ('pending','active','suspended')),
  invited_by    UUID        REFERENCES profiles(id),
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id       UUID        REFERENCES organizations(id),
  answers      JSONB       DEFAULT '{}',
  notes        JSONB       DEFAULT '{}',
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reviewed     BOOLEAN     DEFAULT FALSE,
  reviewed_by  UUID        REFERENCES profiles(id),
  reviewed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS officer_requests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id),
  org_name     TEXT,
  requested_by UUID        NOT NULL REFERENCES profiles(id),
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  status       TEXT        DEFAULT 'pending'
                           CHECK (status IN ('pending','approved','rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quarterly_checkins (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quarter_id   TEXT        NOT NULL,
  method       TEXT        DEFAULT 'manual' CHECK (method IN ('audit','manual')),
  score        INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quarter_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date_label  TEXT,
  badge       TEXT,
  badge_class TEXT,
  title       TEXT        NOT NULL,
  body        TEXT,
  link        TEXT,
  link_text   TEXT,
  published   BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  doc_type    TEXT,
  url         TEXT,
  doc_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key   TEXT  PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org_id    ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id     ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_org_id      ON audits(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_user_id   ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id   ON quarterly_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_org_id    ON officer_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_requests_status    ON officer_requests(status);

-- ============================================================
-- GRANTS (required before RLS policies take effect)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings  ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a platform admin?
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin'
  );
$$;

-- Helper: get the current user's org_id
CREATE OR REPLACE FUNCTION my_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR org_id = my_org_id() OR is_platform_admin());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR is_platform_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_platform_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (is_platform_admin());

-- ORGANIZATIONS
CREATE POLICY "orgs_select" ON organizations FOR SELECT
  USING (id = my_org_id() OR is_platform_admin());
CREATE POLICY "orgs_insert" ON organizations FOR INSERT
  WITH CHECK (TRUE);  -- registration creates org before profile exists
CREATE POLICY "orgs_update" ON organizations FOR UPDATE
  USING (id = my_org_id() OR is_platform_admin());
CREATE POLICY "orgs_delete" ON organizations FOR DELETE
  USING (is_platform_admin());

-- AUDITS
CREATE POLICY "audits_select" ON audits FOR SELECT
  USING (user_id = auth.uid() OR org_id = my_org_id() OR is_platform_admin());
CREATE POLICY "audits_insert" ON audits FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "audits_update" ON audits FOR UPDATE
  USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY "audits_delete" ON audits FOR DELETE
  USING (user_id = auth.uid() OR is_platform_admin());

-- OFFICER REQUESTS
CREATE POLICY "requests_select" ON officer_requests FOR SELECT
  USING (org_id = my_org_id() OR is_platform_admin());
CREATE POLICY "requests_insert" ON officer_requests FOR INSERT
  WITH CHECK (org_id = my_org_id());
CREATE POLICY "requests_update" ON officer_requests FOR UPDATE
  USING (is_platform_admin());

-- QUARTERLY CHECK-INS
CREATE POLICY "checkins_all" ON quarterly_checkins FOR ALL
  USING (user_id = auth.uid() OR is_platform_admin());

-- ACTIVITY LOG
CREATE POLICY "activity_select" ON activity_log FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY "activity_insert" ON activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_platform_admin());

-- NEWS ITEMS (all authenticated users read; admin writes)
CREATE POLICY "news_select" ON news_items FOR SELECT
  USING (published = TRUE OR is_platform_admin());
CREATE POLICY "news_insert" ON news_items FOR INSERT  WITH CHECK (is_platform_admin());
CREATE POLICY "news_update" ON news_items FOR UPDATE  USING  (is_platform_admin());
CREATE POLICY "news_delete" ON news_items FOR DELETE  USING  (is_platform_admin());

-- DOCUMENTS (any authenticated user reads; admin writes)
CREATE POLICY "docs_select" ON documents FOR SELECT USING (TRUE);
CREATE POLICY "docs_insert" ON documents FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "docs_update" ON documents FOR UPDATE USING  (is_platform_admin());
CREATE POLICY "docs_delete" ON documents FOR DELETE USING  (is_platform_admin());

-- PLATFORM SETTINGS (any authenticated user reads; admin writes)
CREATE POLICY "settings_select" ON platform_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write"  ON platform_settings FOR ALL  USING (is_platform_admin());

-- ============================================================
-- DEFAULT SEED DATA
-- ============================================================

INSERT INTO news_items (date_label, badge, badge_class, title, body, link, link_text, published, sort_order) VALUES
(
  '3 June 2024', 'Major', 'badge-danger',
  'Data Protection Act 2024 Officially Commences',
  'Malawi''s Data Protection Act came into force on 3 June 2024. MACRA was formally designated as the data protection authority. All organizations processing personal data of Malawian individuals are now legally bound by its provisions.',
  'https://macra.mw/wpfd_file/data-protection-act-2024/', 'Read the Act ↗', TRUE, 30
),
(
  '2024–2025', 'Registration', 'badge-warning',
  'MACRA Opens Registration for Data Controllers & Processors',
  'Organizations that process data of more than 10,000 individuals, or data of national significance, are required to register with MACRA before processing commences. Failure to register is a criminal offence under the Act.',
  'https://www.dpa.mw/', 'Visit DPA Malawi ↗', TRUE, 20
),
(
  '2025', 'Digital Banking', 'badge-teal',
  'Digital Bank Directive 2025 Includes Data Privacy Requirements',
  'The RBM''s Financial Services Directive 2025 mandates that digital banks maintain cybersecurity risk management and data privacy standards aligned with the DPA 2024.',
  'https://www.rbm.mw/', 'RBM Website ↗', TRUE, 10
)
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, description, doc_type, url, doc_date) VALUES
  ('Malawi Data Protection Act 2024', 'Official gazette version of the Act as enacted on 3 June 2024.', 'Act', 'https://macra.mw/wpfd_file/data-protection-act-2024/', '2024-06-03'),
  ('DPA 2024 Compliance Checklist', 'Comprehensive 65-question compliance audit checklist covering all 12 obligation areas.', 'Tool', 'audit.html', '2025-01-01'),
  ('Record of Processing Activities (RoPA) Template', 'Standard template for documenting your organization''s processing activities as required by Section 56 DPA 2024.', 'Template', '#', '2025-01-01'),
  ('Data Protection Impact Assessment (DPIA) Guide', 'Step-by-step guide for conducting DPIAs for high-risk processing activities under Section 54 DPA 2024.', 'Guide', '#', '2025-01-01'),
  ('Privacy Notice Template', 'Customizable privacy notice compliant with Section 28 transparency requirements of DPA 2024.', 'Template', '#', '2025-01-01'),
  ('Data Breach Response Plan', 'Template incident response plan meeting the 72-hour breach notification requirement under Section 50 DPA 2024.', 'Template', '#', '2025-01-01')
ON CONFLICT DO NOTHING;

INSERT INTO platform_settings (key, value) VALUES
  ('requireApproval',  'true'),
  ('registrationOpen', 'true'),
  ('platformName',     '"Fidelity Compliance Platform"'),
  ('supportEmail',     '"support@fidelityassessors.mw"'),
  ('dpoEmail',         '"dpo@fidelityassessors.mw"')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ADMIN USER SETUP  (run AFTER the above)
-- ============================================================
-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add user
--         Email: admin@fidelityassessors.mw
--         Password: FidelityAdmin@2024!
--         Tick "Auto Confirm User"
--
-- Step 2: Copy the UUID that Supabase generates for that user.
--
-- Step 3: Run this query (replace the placeholder UUID):
--
-- INSERT INTO profiles (id, email, full_name, role, status)
-- VALUES (
--   'PASTE-ADMIN-USER-UUID-HERE',
--   'admin@fidelityassessors.mw',
--   'Platform Administrator',
--   'platform_admin',
--   'active'
-- );
-- ============================================================
