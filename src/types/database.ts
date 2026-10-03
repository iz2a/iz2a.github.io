// Auto-generated types matching Supabase schema
// Re-run: supabase gen types typescript --local > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'admin' | 'grc_manager' | 'analyst' | 'viewer'
export type RiskStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Accepted' | 'Closed'
export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational'
export type FindingStatus = 'Open' | 'In Progress' | 'Resolved' | 'Accepted' | 'Closed'
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type RiskTreatment = 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  organization_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  name_ar: string | null
  sector: string
  country: string
  license_number: string | null
  logo_url: string | null
  created_at: string
}

export interface Framework {
  id: string
  short_name: string
  full_name: string
  issuer: string
  country: string
  version: string | null
  color: string
  rating_scale: string[]
  rating_colors: string[]
  rating_descriptions: string[] | null
  is_active: boolean
  created_at: string
}

export interface FrameworkDomain {
  id: string
  framework_id: string
  domain_ref: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Control {
  id: string
  framework_id: string
  domain_id: string
  control_ref: string
  title: string
  description: string | null
  guidance: string | null
  created_at: string
}

export interface Risk {
  id: string
  organization_id: string
  risk_ref: string
  title: string
  description: string | null
  framework_id: string | null
  domain_ref: string | null
  category: string
  likelihood: number
  impact: number
  risk_score: number
  risk_level: RiskLevel
  treatment: RiskTreatment
  status: RiskStatus
  owner_id: string | null
  owner_name: string | null
  due_date: string | null
  servicenow_sys_id: string | null
  jira_issue_key: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Finding {
  id: string
  organization_id: string
  finding_ref: string
  title: string
  description: string | null
  severity: FindingSeverity
  framework_id: string | null
  domain_ref: string | null
  control_ref: string | null
  status: FindingStatus
  assignee_id: string | null
  assignee_name: string | null
  evidence_files: EvidenceFile[]
  ai_rating: string | null
  ai_confidence: number | null
  ai_gaps: string[]
  ai_recommendations: string[]
  due_date: string | null
  resolved_at: string | null
  jira_issue_key: string | null
  servicenow_incident_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EvidenceFile {
  name: string
  url: string
  size: number
  uploaded_at: string
}

export interface Document {
  id: string
  organization_id: string
  title: string
  document_type: string
  framework_id: string | null
  language: string
  content: string
  version: string
  status: string
  generated_by_ai: boolean
  author_id: string | null
  approved_by_id: string | null
  review_date: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationConfig {
  id: string
  organization_id: string
  integration_type: string
  display_name: string | null
  base_url: string | null
  username: string | null
  encrypted_token: string | null
  additional_config: Json
  is_active: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  sync_count: number
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      frameworks: { Row: Framework; Insert: Partial<Framework>; Update: Partial<Framework> }
      framework_domains: { Row: FrameworkDomain; Insert: Partial<FrameworkDomain>; Update: Partial<FrameworkDomain> }
      controls: { Row: Control; Insert: Partial<Control>; Update: Partial<Control> }
      risks: { Row: Risk; Insert: Partial<Risk>; Update: Partial<Risk> }
      findings: { Row: Finding; Insert: Partial<Finding>; Update: Partial<Finding> }
      documents: { Row: Document; Insert: Partial<Document>; Update: Partial<Document> }
      integration_configs: { Row: IntegrationConfig; Insert: Partial<IntegrationConfig>; Update: Partial<IntegrationConfig> }
    }
  }
}
