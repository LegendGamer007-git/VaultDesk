import {
  UserProfile,
  CustomRoleDefinition,
  UserPermission,
} from '../types';

export interface PermissionMeta {
  id: UserPermission;
  label: string;
  category: 'Knowledge Base' | 'Troubleshooting & Runbooks' | 'Log Analyzer' | 'Updates & Security' | 'User Management' | 'PSM Web Connectors';
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
    description: 'Change user roles, approve new user registrations, suspend accounts, and edit RBAC mappings.',
  },

  // PSM Web Connectors
  {
    id: 'connectors:read',
    label: 'View PSM Web Connectors',
    category: 'PSM Web Connectors',
    description: 'Browse, inspect, and export PSM Web Universal Connection Components and WebForm definitions.',
  },
  {
    id: 'connectors:manage',
    label: 'Create & Edit PSM Connectors',
    category: 'PSM Web Connectors',
    description: 'Generate WebForm fields from URL, build custom dispatchers, and deploy connection components.',
  },
];

export const SYSTEM_ROLE_PERMISSIONS: Record<'superadmin' | 'admin' | 'engineer' | 'operator' | 'reader', UserPermission[]> = {
  superadmin: ALL_PERMISSIONS.map((p) => p.id),
  admin: ALL_PERMISSIONS.map((p) => p.id),
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
    'connectors:read',
    'connectors:manage',
  ],
  operator: [
    'kb:read',
    'troubleshoot:read',
    'troubleshoot:export',
    'logs:analyze',
    'updates:read',
    'connectors:read',
  ],
  reader: [
    'kb:read',
    'troubleshoot:read',
    'updates:read',
    'connectors:read',
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
];

// Single Admin Account in local Firebase database (All demo accounts removed)
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-admin-primary',
    name: 'Administrator',
    email: '1393ndsd@gmail.com',
    role: 'superadmin',
    permissions: ALL_PERMISSIONS.map((p) => p.id),
    authSource: 'firebase',
    status: 'active',
    department: 'PAM Architecture & SecOps',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastLoginAt: '2026-10-01T00:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'usr-breakglass-superadmin',
    name: 'Breakglass Superadmin',
    email: 'breakglass@vaultdesk.internal',
    role: 'superadmin',
    permissions: ALL_PERMISSIONS.map((p) => p.id),
    authSource: 'local',
    status: 'active',
    department: 'Emergency SecOps & Disaster Recovery',
    lastLoginAt: '2026-10-01T00:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
  },
];
