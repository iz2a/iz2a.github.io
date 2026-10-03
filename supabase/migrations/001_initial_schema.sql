-- ============================================================
-- MIRSAD: Complete Database Schema
-- Run via: supabase db push OR paste into Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES (extends Supabase auth.users) ──────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','grc_manager','analyst','viewer')),
  organization_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORGANIZATIONS ────────────────────────────────────────────
CREATE TABLE public.organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  sector TEXT NOT NULL DEFAULT 'financial',
  country TEXT NOT NULL DEFAULT 'SA',
  license_number TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_org_fk
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- ── FRAMEWORKS ───────────────────────────────────────────────
CREATE TABLE public.frameworks (
  id TEXT PRIMARY KEY, -- e.g., NCA_ECC, SAMA_CSF
  short_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'SA',
  version TEXT,
  color TEXT DEFAULT '#00C896',
  rating_scale JSONB NOT NULL, -- ["N/A","Partially Implemented","Fully Implemented"]
  rating_colors JSONB NOT NULL,
  rating_descriptions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FRAMEWORK DOMAINS ────────────────────────────────────────
CREATE TABLE public.framework_domains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  framework_id TEXT REFERENCES public.frameworks(id) ON DELETE CASCADE,
  domain_ref TEXT NOT NULL, -- e.g., "1-1", "CS-3", "A.8"
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTROLS ─────────────────────────────────────────────────
CREATE TABLE public.controls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  framework_id TEXT REFERENCES public.frameworks(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.framework_domains(id) ON DELETE CASCADE,
  control_ref TEXT NOT NULL, -- e.g., "1-1-1", "CS-3.1"
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSESSMENTS ──────────────────────────────────────────────
CREATE TABLE public.assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework_id TEXT REFERENCES public.frameworks(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('draft','in_progress','completed','archived')),
  assessment_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  lead_assessor_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTROL RATINGS ──────────────────────────────────────────
CREATE TABLE public.control_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  control_id UUID REFERENCES public.controls(id) ON DELETE CASCADE,
  rating TEXT NOT NULL, -- "Fully Implemented" / "Level 3" etc.
  rating_index INT NOT NULL DEFAULT 0,
  evidence_description TEXT,
  evidence_files JSONB DEFAULT '[]', -- [{name, url, uploaded_at}]
  ai_rating TEXT,
  ai_confidence INT,
  ai_reasoning TEXT,
  ai_gaps JSONB DEFAULT '[]',
  ai_recommendations JSONB DEFAULT '[]',
  notes TEXT,
  rated_by UUID REFERENCES public.profiles(id),
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, control_id)
);

-- ── RISKS ────────────────────────────────────────────────────
CREATE TABLE public.risks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  risk_ref TEXT, -- auto-generated RSK-001
  title TEXT NOT NULL,
  description TEXT,
  framework_id TEXT REFERENCES public.frameworks(id),
  domain_ref TEXT,
  category TEXT NOT NULL DEFAULT 'Technical' CHECK (category IN ('Technical','Operational','Third-Party','People','Compliance','Financial')),
  likelihood INT NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact INT NOT NULL CHECK (impact BETWEEN 1 AND 5),
  risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
  risk_level TEXT GENERATED ALWAYS AS (
    CASE WHEN likelihood * impact >= 15 THEN 'Critical'
         WHEN likelihood * impact >= 10 THEN 'High'
         WHEN likelihood * impact >= 6 THEN 'Medium'
         ELSE 'Low' END
  ) STORED,
  treatment TEXT DEFAULT 'Mitigate' CHECK (treatment IN ('Mitigate','Accept','Transfer','Avoid')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Mitigated','Accepted','Closed')),
  owner_id UUID REFERENCES public.profiles(id),
  owner_name TEXT,
  due_date DATE,
  servicenow_sys_id TEXT,
  jira_issue_key TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-increment risk_ref
CREATE SEQUENCE risk_seq START 1;
CREATE OR REPLACE FUNCTION set_risk_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_ref IS NULL THEN
    NEW.risk_ref := 'RSK-' || LPAD(nextval('risk_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER risk_ref_trigger BEFORE INSERT ON public.risks FOR EACH ROW EXECUTE FUNCTION set_risk_ref();

-- ── FINDINGS ─────────────────────────────────────────────────
CREATE TABLE public.findings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  finding_ref TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Critical','High','Medium','Low','Informational')),
  framework_id TEXT REFERENCES public.frameworks(id),
  domain_ref TEXT,
  control_ref TEXT,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Accepted','Closed')),
  assignee_id UUID REFERENCES public.profiles(id),
  assignee_name TEXT,
  evidence_files JSONB DEFAULT '[]',
  ai_rating TEXT,
  ai_confidence INT,
  ai_gaps JSONB DEFAULT '[]',
  ai_recommendations JSONB DEFAULT '[]',
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  jira_issue_key TEXT,
  servicenow_incident_id TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE finding_seq START 1;
CREATE OR REPLACE FUNCTION set_finding_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finding_ref IS NULL THEN
    NEW.finding_ref := 'FND-' || LPAD(nextval('finding_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER finding_ref_trigger BEFORE INSERT ON public.findings FOR EACH ROW EXECUTE FUNCTION set_finding_ref();

-- ── DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- Policy, Procedure, Standard, Plan, Template
  framework_id TEXT REFERENCES public.frameworks(id),
  language TEXT DEFAULT 'English',
  content TEXT NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Review','Approved','Archived')),
  generated_by_ai BOOLEAN DEFAULT TRUE,
  author_id UUID REFERENCES public.profiles(id),
  approved_by_id UUID REFERENCES public.profiles(id),
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INTEGRATION CONFIGS ──────────────────────────────────────
CREATE TABLE public.integration_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('servicenow','jira','siem','email','active_directory','splunk')),
  display_name TEXT,
  base_url TEXT,
  username TEXT,
  encrypted_token TEXT, -- store encrypted in production
  additional_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  sync_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, integration_type)
);

-- ── AUDIT LOG ────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Org-scoped policies
CREATE POLICY "org_risks" ON public.risks FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "org_findings" ON public.findings FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "org_documents" ON public.documents FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "org_integrations" ON public.integration_configs FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "org_assessments" ON public.assessments FOR ALL USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Frameworks are public read
CREATE POLICY "frameworks_read" ON public.frameworks FOR SELECT USING (TRUE);
CREATE POLICY "domains_read" ON public.framework_domains FOR SELECT USING (TRUE);
CREATE POLICY "controls_read" ON public.controls FOR SELECT USING (TRUE);

-- ── SEED FRAMEWORKS ──────────────────────────────────────────
INSERT INTO public.frameworks (id, short_name, full_name, issuer, country, version, color, rating_scale, rating_colors, rating_descriptions) VALUES
('NCA_ECC', 'NCA ECC', 'Essential Cybersecurity Controls', 'National Cybersecurity Authority', 'SA', 'v2.0 2020', '#00C896',
 '["N/A","Partially Implemented","Fully Implemented"]',
 '["#FF4444","#FFB020","#00C896"]', NULL),
('NCA_DCC', 'NCA DCC', 'Data Cybersecurity Controls', 'National Cybersecurity Authority', 'SA', 'v1.0 2021', '#3B9EFF',
 '["N/A","Partially Implemented","Fully Implemented"]',
 '["#FF4444","#FFB020","#3B9EFF"]', NULL),
('SAMA_CSF', 'SAMA CSF', 'Cyber Security Framework', 'Saudi Central Bank (SAMA)', 'SA', 'v1.0 2017', '#FFB020',
 '["Level 1","Level 2","Level 3","Level 4","Level 5"]',
 '["#FF4444","#FF6B35","#FFB020","#7FD160","#00C896"]',
 '["Initial","Developing","Defined","Managed","Optimized"]'),
('ISO_27001', 'ISO 27001', 'Information Security Management', 'ISO/IEC', 'INT', '2022 Edition', '#A855F7',
 '["N/A","Partially Implemented","Fully Implemented"]',
 '["#FF4444","#FFB020","#A855F7"]', NULL),
('NIST_CSF', 'NIST CSF', 'Cybersecurity Framework 2.0', 'NIST', 'INT', 'v2.0 2024', '#FF6B35',
 '["Partial","Risk Informed","Repeatable","Adaptive"]',
 '["#FF4444","#FFB020","#7FD160","#00C896"]', NULL);
