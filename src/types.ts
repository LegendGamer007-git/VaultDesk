export type PamComponent =
  | 'Vault'
  | 'PVWA'
  | 'CPM'
  | 'PSM'
  | 'PTA'
  | 'CCP'
  | 'Conjur'
  | 'Privilege Cloud'
  | 'General';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface SourceLink {
  title: string;
  url: string;
  type: 'Official Docs' | 'KB Article' | 'Community' | 'Release Notes' | 'Community Article' | 'Knowledge Base';
}

export interface ErrorEntry {
  id: string;
  code: string;
  title: string;
  component: PamComponent;
  symptomArea?: string;
  observedSymptoms?: string[];
  description: string;
  cause: string;
  resolutionSteps: string[];
  severity: SeverityLevel;
  affectedVersions: string[];
  sourceLinks: SourceLink[];
  tags: string[];
  lastUpdated: string;
  logsToCheck?: string[];
  helpfulCount: number;
  unhelpfulCount: number;
  isAiGenerated?: boolean;
  verifiedByCommunity?: boolean;
  views30d?: number;
  bookmarks30d?: number;
  views60d?: number;
  bookmarks60d?: number;
  trendVelocity?: string;
  trendDirection?: 'up' | 'down' | 'steady';
  trendVelocity60d?: string;
  trendDirection60d?: 'up' | 'down' | 'steady';
  weeklyActivity?: number[];
  isCommunityResult?: boolean;
  communityArticleId?: string;
  communityUrl?: string;
}

export interface UpdateRelease {
  id: string;
  product: string;
  version: string;
  releaseDate: string;
  type: 'feature' | 'patch' | 'security';
  summary: string;
  breakingChanges: string[];
  keyHighlights: string[];
  sourceUrl: string;
  upgradeImpact: 'High' | 'Medium' | 'Low';
  impactNotes: string;
  deploymentType?: 'Self-Hosted' | 'Privilege Cloud' | 'Component';
  isLatest?: boolean;
  lts?: boolean;
}

export interface SecurityAdvisory {
  id: string;
  bulletinId: string; // Official CyberArk Bulletin ID (e.g., CA26-47)
  cveId: string;
  product: string;
  severity: SeverityLevel;
  cvss: number;
  title: string;
  description: string;
  remediation: string;
  publishDate: string;
  affectedVersions: string[];
  fixedInVersion: string;
  officialUrl: string;
  bulletinUrl?: string;
  trustCenterUrl?: string;
  isRecent30Days?: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  category: 'CPM Plugins' | 'PSM Connection Components' | 'Cloud & DevOps' | 'PTA Sensors' | 'Tools & Integrations';
  description: string;
  vendor: string;
  link: string;
  downloadUrl?: string;
  protocolOrPlatform: string;
  lastSynced: string;
  verified: boolean;
  targetSystems: string[];
  version?: string;
  compatibleWith?: ('Privilege Cloud' | 'Self-Hosted PAM' | 'Both')[];
  rating?: number;
  downloadCount?: number;
}

export interface SavedLogEntry {
  id: string;
  timestamp: string;
  component: PamComponent;
  originalFileName?: string;
  sanitizedLog: string;
  primaryErrorCode: string;
  severity: SeverityLevel;
  summary: string;
  maskingStats: {
    ipsMasked: number;
    usersMasked: number;
    hostsMasked: number;
    safesMasked: number;
    secretsRedacted: number;
  };
}

export interface CommunityThread {
  id: string;
  title: string;
  component: PamComponent;
  snippet: string;
  url: string;
  replyCount: number;
  lastActivity: string;
  author: string;
  isSolved: boolean;
  tags: string[];
  solution?: string;
}

export interface UserBookmark {
  id: string;
  entryId: string;
  entryType: 'error' | 'advisory' | 'marketplace' | 'update' | 'kb';
  title: string;
  code?: string;
  component?: PamComponent | string;
  savedAt: string;
}

export type KbArticleStatus = 'published' | 'draft' | 'under-review' | 'archived';

export type KbSpace =
  | 'Runbooks & SOPs'
  | 'Incident Post-Mortems'
  | 'Architecture & Hardening'
  | 'Upgrade Playbooks'
  | 'Custom Connectors'
  | 'General';

export interface KbAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  content?: string; // base64 or raw text content
}

export interface LocalKbArticle {
  id: string;
  title: string;
  slug: string;
  space: KbSpace;
  component: PamComponent;
  summary: string;
  content: string; // Markdown / formatted text
  author: string;
  authorRole?: string;
  status: KbArticleStatus;
  severity?: SeverityLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  helpfulCount: number;
  attachments: KbAttachment[];
  runbookSteps?: string[];
}

export interface AiDiagnosisResult {
  query: string;
  code?: string;
  title: string;
  component: PamComponent;
  severity: SeverityLevel;
  summary: string;
  possibleCauses: string[];
  resolutionSteps: string[];
  relevantLogs: string[];
  safetyWarnings: string[];
  groundingSources: { title: string; url: string }[];
  modelUsed: string;
  synthesizedAt: string;
}

export interface UserPreferences {
  followedComponents: PamComponent[];
  notifyOnCriticalCve: boolean;
  notifyOnPatchRelease: boolean;
  enableGeminiGrounding: boolean;
  defaultView: 'troubleshooting' | 'updates';
  theme?: 'light' | 'dark' | 'system';
}

// User Management, Authentication & RBAC Control Types
export type UserRole = 'admin' | 'reader' | 'engineer' | 'custom';
export type AuthSource = 'local' | 'ldap' | 'saml';
export type UserStatus = 'active' | 'invited' | 'suspended';

export type UserPermission =
  | 'kb:read'
  | 'kb:write'
  | 'kb:delete'
  | 'kb:publish'
  | 'troubleshoot:read'
  | 'troubleshoot:promote_ai'
  | 'troubleshoot:export'
  | 'logs:analyze'
  | 'logs:save'
  | 'logs:delete'
  | 'updates:read'
  | 'updates:sync'
  | 'users:read'
  | 'users:manage'
  | 'users:invite'
  | 'auth:configure_ldap'
  | 'auth:configure_saml'
  | 'connectors:read'
  | 'connectors:manage';

export interface CustomRoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: UserPermission[];
  isSystem?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customRoleId?: string;
  customRoleName?: string;
  permissions: UserPermission[];
  authSource: AuthSource;
  status: UserStatus;
  department?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  invitationToken?: string;
  invitationExpiresAt?: string;
  invitationNote?: string;
}

export interface LdapConfig {
  enabled: boolean;
  serverUrl: string;
  bindDn: string;
  bindPassword?: string;
  baseSearchDn: string;
  userSearchFilter: string;
  groupSearchFilter: string;
  useTls: boolean;
  roleMappings: {
    ldapGroup: string;
    role: UserRole;
    customRoleId?: string;
  }[];
  syncIntervalMinutes: number;
  lastTestedAt?: string;
  lastStatus?: 'success' | 'failed' | 'idle';
  lastStatusMessage?: string;
}

export interface SamlConfig {
  enabled: boolean;
  idpIssuer: string;
  ssoUrl: string;
  x509Certificate: string;
  spEntityId: string;
  acsUrl: string;
  signRequests: boolean;
  jitEnabled: boolean;
  defaultJitRole: UserRole;
  lastTestedAt?: string;
  lastStatus?: 'success' | 'failed' | 'idle';
  lastStatusMessage?: string;
}

// PSM Web-Based Custom Connector & WebForm Field Types
export type WebFormFieldSearchBy =
  | 'id'
  | 'name'
  | 'class'
  | 'xpath'
  | 'tag'
  | 'css'
  | 'text';

export type WebFormFieldActionType =
  | 'username'
  | 'password'
  | 'button'
  | 'click'
  | 'text'
  | 'select'
  | 'checkbox'
  | 'validation'
  | 'wait'
  | 'clear';

export interface WebFormField {
  id: string;
  target: string;
  actionType: WebFormFieldActionType;
  value: string;
  searchBy: WebFormFieldSearchBy;
  comment?: string;
  optional?: boolean;
  elementSnippet?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface PsmWebConnector {
  id: string;
  name: string;
  connectionComponentId: string;
  targetUrl: string;
  clientUrl?: string;
  browserType: 'Chrome' | 'Edge' | 'Chromium';
  browserPath?: string;
  dispatcher: 'CyberArk.Extensions.Plugin.WebAppDispatcher' | 'AutoIt' | 'Selenium';
  runMode: 'Normal' | 'Headless';
  lockAppWindow: boolean;
  enforceCertValidation: boolean;
  actionTimeout: number;
  fields: WebFormField[];
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author?: string;
  isTemplate?: boolean;
  validationRule?: string;
}

export interface WebFormAnalysisResult {
  detectedUrl: string;
  pageTitle?: string;
  formCount: number;
  fields: WebFormField[];
  suggestedComponentId: string;
  suggestedName: string;
  suggestedCategory: string;
  analysisMethod: 'live_fetch' | 'gemini_ai' | 'heuristic_parser' | 'template_match';
  securityWarnings: string[];
  rawHtmlSnippet?: string;
  statusCode?: number;
  liveFetchStatus?: string;
  detectedInputsCount?: number;
  detectedButtonsCount?: number;
}

