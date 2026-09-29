import {
  UserProfile,
  CustomRoleDefinition,
  UserPermission,
  LdapConfig,
  SamlConfig,
} from '../types';

export interface PermissionMeta {
  id: UserPermission;
  label: string;
  category: 'Knowledge Base' | 'Troubleshooting & Runbooks' | 'Log Analyzer' | 'Updates & Security' | 'User Management' | 'Enterprise SSO & LDAP';
  description: string;
}

export const ALL_PERMISSIONS: PermissionMeta[] = [
  // Knowledge Base
  {
    id: 'kb:read',
    label: 'Read Knowledge Articles',
    category: 'Knowledge Base',
    description: 'Browse, view, and search all local runbooks, SOPs, and post-mortems.',
  },
  {
    id: 'kb:write',
    label: 'Create & Edit Articles',
    category: 'Knowledge Base',
    description: 'Author new articles and draft changes using the Rich Text editor.',
  },
  {
    id: 'kb:publish',
    label: 'Publish Articles',
    category: 'Knowledge Base',
    description: 'Publish drafts or update live articles visible across the organization.',
  },
  {
    id: 'kb:delete',
    label: 'Delete Articles',
    category: 'Knowledge Base',
    description: 'Permanently remove or archive knowledge base articles.',
  },

  // Troubleshooting & Runbooks
  {
    id: 'troubleshoot:read',
    label: 'View Runbooks & Errors',
    category: 'Troubleshooting & Runbooks',
    description: 'Access curated PAM error codes, root causes, and diagnostic checklists.',
  },
  {
    id: 'troubleshoot:promote_ai',
    label: 'Promote AI Resolutions',
    category: 'Troubleshooting & Runbooks',
    description: 'Approve and promote Gemini-synthesized diagnostics to official curated database.',
  },
  {
    id: 'troubleshoot:export',
    label: 'Export Diagnostic Data',
    category: 'Troubleshooting & Runbooks',
    description: 'Export error lists and runbooks as Word, PDF, or CSV reports.',
  },

  // Log Analyzer
  {
    id: 'logs:analyze',
    label: 'Run Log Sanitization & Analyzer',
    category: 'Log Analyzer',
    description: 'Upload and parse CyberArk logs (itaso001.log, pm_error.log, PSMTrace.log).',
  },
  {
    id: 'logs:save',
    label: 'Save Diagnostic Sessions',
    category: 'Log Analyzer',
    description: 'Save sanitized logs and triage reports to the internal repository.',
  },
  {
    id: 'logs:delete',
    label: 'Delete Diagnostic Sessions',
    category: 'Log Analyzer',
    description: 'Purge historical log triage records.',
  },

  // Updates & Security
  {
    id: 'updates:read',
    label: 'View Advisories & Patches',
    category: 'Updates & Security',
    description: 'Review security CVE bulletins, LTS releases, and upgrade calculators.',
  },
  {
    id: 'updates:sync',
    label: 'Trigger Live Feeds Sync',
    category: 'Updates & Security',
    description: 'Manually poll CyberArk release channels and telemetry endpoints.',
  },

  // User Management
  {
    id: 'users:read',
    label: 'View Team Directory',
    category: 'User Management',
    description: 'View members, assigned roles, and login telemetry.',
  },
  {
    id: 'users:invite',
    label: 'Invite Team Members',
    category: 'User Management',
    description: 'Send onboarding email invitations with assigned role privileges.',
  },
  {
    id: 'users:manage',
    label: 'Manage Users & Permissions',
    category: 'User Management',
    description: 'Change user roles, suspend/activate accounts, and edit custom RBAC mappings.',
  },

  // Enterprise SSO & LDAP
  {
    id: 'auth:configure_ldap',
    label: 'Configure Active Directory / LDAP',
    category: 'Enterprise SSO & LDAP',
    description: 'Set up domain controller connections, bind credentials, and group-to-role mappings.',
  },
  {
    id: 'auth:configure_saml',
    label: 'Configure SAML 2.0 Identity Provider',
    category: 'Enterprise SSO & LDAP',
    description: 'Manage IdP certificates, assertion URLs, and single sign-on metadata.',
  },
];

export const SYSTEM_ROLE_PERMISSIONS: Record<'admin' | 'reader' | 'engineer', UserPermission[]> = {
  admin: ALL_PERMISSIONS.map((p) => p.id),
  reader: [
    'kb:read',
    'troubleshoot:read',
    'troubleshoot:export',
    'updates:read',
    'users:read',
  ],
  engineer: [
    'kb:read',
    'kb:write',
    'kb:publish',
    'troubleshoot:read',
    'troubleshoot:promote_ai',
    'troubleshoot:export',
    'logs:analyze',
    'logs:save',
    'updates:read',
    'updates:sync',
    'users:read',
  ],
};

export const INITIAL_CUSTOM_ROLES: CustomRoleDefinition[] = [
  {
    id: 'role-auditor',
    name: 'Compliance & Security Auditor',
    description: 'Auditing role for viewing triage reports, runbooks, and CVE updates without modification rights.',
    permissions: [
      'kb:read',
      'troubleshoot:read',
      'troubleshoot:export',
      'updates:read',
      'users:read',
    ],
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'role-runbook-author',
    name: 'Runbook Technical Lead',
    description: 'Technical author dedicated to publishing, maintaining, and drafting enterprise SOPs and recovery playbooks.',
    permissions: [
      'kb:read',
      'kb:write',
      'kb:publish',
      'kb:delete',
      'troubleshoot:read',
      'troubleshoot:export',
      'updates:read',
      'users:read',
    ],
    createdAt: '2026-09-05T10:30:00Z',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-1',
    name: 'Alexander Ward',
    email: 'admin@vaultdesk.internal',
    role: 'admin',
    permissions: SYSTEM_ROLE_PERMISSIONS.admin,
    authSource: 'local',
    status: 'active',
    department: 'PAM Architecture & SecOps',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastLoginAt: '2026-09-28T08:15:00Z',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'usr-reader-1',
    name: 'Sarah Chen (Reader)',
    email: 'reader@vaultdesk.internal',
    role: 'reader',
    permissions: SYSTEM_ROLE_PERMISSIONS.reader,
    authSource: 'local',
    status: 'active',
    department: 'IT Compliance & Audit',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastLoginAt: '2026-09-27T16:40:00Z',
    createdAt: '2026-08-15T11:20:00Z',
  },
  {
    id: 'usr-eng-1',
    name: 'Marcus Vance (Engineer)',
    email: 'engineer@vaultdesk.internal',
    role: 'engineer',
    permissions: SYSTEM_ROLE_PERMISSIONS.engineer,
    authSource: 'local',
    status: 'active',
    department: 'Privileged Access Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastLoginAt: '2026-09-28T07:50:00Z',
    createdAt: '2026-08-20T14:10:00Z',
  },
  {
    id: 'usr-ldap-1',
    name: 'Dmitri Pavlov',
    email: 'dmitri.pavlov@corp.internal',
    role: 'engineer',
    permissions: SYSTEM_ROLE_PERMISSIONS.engineer,
    authSource: 'ldap',
    status: 'active',
    department: 'Infrastructure SecOps',
    lastLoginAt: '2026-09-26T12:00:00Z',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'usr-invited-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@cyberark-partner.internal',
    role: 'admin',
    permissions: SYSTEM_ROLE_PERMISSIONS.admin,
    authSource: 'local',
    status: 'invited',
    department: 'Principal PAM Architect',
    createdAt: '2026-09-27T10:00:00Z',
    invitationToken: 'inv-tok-9842f1a8',
    invitationExpiresAt: '2026-10-04T10:00:00Z',
    invitationNote: 'Welcome to the VaultDesk PAM Operations Portal. Please set up your administrator credentials.',
  },
];

export const DEFAULT_LDAP_CONFIG: LdapConfig = {
  enabled: true,
  serverUrl: 'ldaps://ad.corp.internal:636',
  bindDn: 'CN=svc-vaultdesk,OU=ServiceAccounts,DC=corp,DC=internal',
  bindPassword: '••••••••••••••••',
  baseSearchDn: 'DC=corp,DC=internal',
  userSearchFilter: '(&(objectClass=user)(sAMAccountName={username}))',
  groupSearchFilter: '(&(objectClass=group)(member={userDn}))',
  useTls: true,
  roleMappings: [
    { ldapGroup: 'CN=PAM_Vault_Admins,OU=SecurityGroups,DC=corp,DC=internal', role: 'admin' },
    { ldapGroup: 'CN=PAM_Engineers,OU=SecurityGroups,DC=corp,DC=internal', role: 'engineer' },
    { ldapGroup: 'CN=SecOps_Auditors,OU=SecurityGroups,DC=corp,DC=internal', role: 'reader' },
  ],
  syncIntervalMinutes: 60,
  lastTestedAt: '2026-09-28T06:30:00Z',
  lastStatus: 'success',
  lastStatusMessage: 'Connected to Active Directory DC01.corp.internal (TLS handshake verified, 1,420 user records indexed).',
};

// Sample non-production mock X.509 IdP Certificate for test assertions and UI preview only
// # gitleaks:allow
export const DEFAULT_SAML_CONFIG: SamlConfig = {
  enabled: true,
  idpIssuer: 'https://cyberark-identity.corp.internal/saml/metadata',
  ssoUrl: 'https://cyberark-identity.corp.internal/saml/sso',
  // # gitleaks:allow
  x509Certificate: `-----BEGIN CERTIFICATE-----
MIIDpDCCAoygAwIBAgIGAXv4fL7+MA0GCSqGSIb3DQEBCwUAMIGQMQswCQYDVQQGEwJV
UzELMAkGA1UECBMCQ0ExEjAQBgNVBAcTCVN1bm55dmFsZTEbMBkGA1UEChMSQ3liZXJB
cmsgSWRlbnRpdHkxGzAZBgNVBAsTElByaXZpbGVnZSBDbG91ZDEhMB8GA1UEAxMYVmF1
bHREZXNrIFNBTUwgUHJvdmlkZXIwHhcNMjYwMTAxMDAwMDAwWhcNMzAwMTAxMDAwMDAw
WjCBkDELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNB...
-----END CERTIFICATE-----`,
  spEntityId: 'https://vaultdesk.internal/saml/metadata',
  acsUrl: 'https://vaultdesk.internal/api/auth/saml/acs',
  signRequests: true,
  jitEnabled: true,
  defaultJitRole: 'reader',
  lastTestedAt: '2026-09-28T07:15:00Z',
  lastStatus: 'success',
  lastStatusMessage: 'SAML 2.0 metadata verified. IdP assertion certificate valid until 2030.',
};
