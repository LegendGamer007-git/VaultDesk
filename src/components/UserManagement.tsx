import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Key,
  Server,
  Globe,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Calendar,
  Clock,
  Send,
  X,
  UserCheck,
  UserX,
  Tag,
  Layers,
  ArrowRight,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  UserStatus,
  AuthSource,
  CustomRoleDefinition,
  UserPermission,
  LdapConfig,
  SamlConfig,
} from '../types';
import { ALL_PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from '../data/rbacData';

interface UserManagementProps {
  currentUser: UserProfile;
  onUserUpdated?: (user: UserProfile) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'rbac' | 'ldap' | 'saml'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRoleDefinition[]>([]);
  const [ldapConfig, setLdapConfig] = useState<LdapConfig | null>(null);
  const [samlConfig, setSamlConfig] = useState<SamlConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Users Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedAuthFilter, setSelectedAuthFilter] = useState<string>('All');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('reader');
  const [inviteCustomRoleId, setInviteCustomRoleId] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('Privileged Access Operations');
  const [inviteNote, setInviteNote] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Add Local User Form State
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('Password123!');
  const [addRole, setAddRole] = useState<UserRole>('reader');
  const [addCustomRoleId, setAddCustomRoleId] = useState('');
  const [addDepartment, setAddDepartment] = useState('SecOps Triage');

  // Create Custom Role Form State
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<UserPermission[]>([
    'kb:read',
    'troubleshoot:read',
  ]);

  // LDAP & SAML Form State
  const [isTestingLdap, setIsTestingLdap] = useState(false);
  const [isTestingSaml, setIsTestingSaml] = useState(false);

  // Permission check for current user
  const canManageUsers = currentUser.role === 'admin' || currentUser.permissions.includes('users:manage');
  const canInviteUsers = currentUser.role === 'admin' || currentUser.permissions.includes('users:invite');
  const canConfigureAuth = currentUser.role === 'admin' || currentUser.permissions.includes('auth:configure_ldap');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial Data Load
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, ldapRes, samlRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/auth/ldap'),
        fetch('/api/auth/saml'),
      ]);

      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u);
      }
      if (rolesRes.ok) {
        const r = await rolesRes.json();
        setCustomRoles(r.customRoles || []);
      }
      if (ldapRes.ok) {
        const l = await ldapRes.json();
        setLdapConfig(l);
      }
      if (samlRes.ok) {
        const s = await samlRes.json();
        setSamlConfig(s);
      }
    } catch (err) {
      console.warn('Error loading user management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRoleFilter !== 'All' && u.role !== selectedRoleFilter) return false;
      if (selectedStatusFilter !== 'All' && u.status !== selectedStatusFilter) return false;
      if (selectedAuthFilter !== 'All' && u.authSource !== selectedAuthFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [users, selectedRoleFilter, selectedStatusFilter, selectedAuthFilter, searchQuery]);

  // Handle Invite User Submit
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
          customRoleId: inviteRole === 'custom' ? inviteCustomRoleId : undefined,
          department: inviteDepartment.trim(),
          note: inviteNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setUsers((prev) => [data.user, ...prev]);
      setGeneratedInviteLink(data.invitationLink);
      showToast(`Invitation created for ${data.user.email}! Link generated.`);
    } catch (err: any) {
      showToast(err.message || 'Error creating invitation');
    }
  };

  // Handle Add Local User Submit
  const handleAddLocalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim() || !addName.trim()) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          role: addRole,
          customRoleId: addRole === 'custom' ? addCustomRoleId : undefined,
          department: addDepartment.trim(),
          status: 'active',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsers((prev) => [data, ...prev]);
      setIsAddUserModalOpen(false);
      setAddName('');
      setAddEmail('');
      showToast(`User ${data.name} created successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Error creating user');
    }
  };

  // Handle Edit User Submit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      if (currentUser.id === data.id && onUserUpdated) {
        onUserUpdated(data);
      }
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      showToast(`User ${data.name} updated.`);
    } catch (err: any) {
      showToast(err.message || 'Error updating user');
    }
  };

  // Handle Toggle User Status (Suspend / Activate)
  const handleToggleUserStatus = async (user: UserProfile) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
        showToast(`User ${data.name} is now ${nextStatus}.`);
      }
    } catch (err) {
      console.warn('Status toggle error:', err);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`User "${user.name}" removed.`);
    } catch (err: any) {
      showToast(err.message || 'Error deleting user');
    }
  };

  // Handle Create Custom Role
  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissions: newRolePermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create role');
      }

      setCustomRoles((prev) => [...prev, data]);
      setIsCreateRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      showToast(`Custom role "${data.name}" created with ${data.permissions.length} permissions.`);
    } catch (err: any) {
      showToast(err.message || 'Error creating custom role');
    }
  };

  // Handle Delete Custom Role
  const handleDeleteCustomRole = async (roleId: string, roleName: string) => {
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomRoles((prev) => prev.filter((r) => r.id !== roleId));
        showToast(`Role "${roleName}" deleted.`);
      }
    } catch (err) {
      console.warn('Error deleting role:', err);
    }
  };

  // Handle Test LDAP
  const handleTestLdap = async () => {
    setIsTestingLdap(true);
    try {
      const res = await fetch('/api/auth/ldap/test', { method: 'POST' });
      const data = await res.json();
      if (ldapConfig) {
        setLdapConfig({
          ...ldapConfig,
          lastTestedAt: data.testedAt,
          lastStatus: 'success',
          lastStatusMessage: data.message,
        });
      }
      showToast('LDAP test succeeded: Connection to Active Directory verified.');
    } catch (err) {
      showToast('LDAP test failed. Please verify server URL & credentials.');
    } finally {
      setIsTestingLdap(false);
    }
  };

  // Handle Save LDAP Config
  const handleSaveLdap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ldapConfig) return;

    try {
      const res = await fetch('/api/auth/ldap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ldapConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setLdapConfig(data);
        showToast('Active Directory & LDAP configuration saved.');
      }
    } catch (err) {
      showToast('Error saving LDAP configuration.');
    }
  };

  // Handle Test SAML
  const handleTestSaml = async () => {
    setIsTestingSaml(true);
    try {
      const res = await fetch('/api/auth/saml/test', { method: 'POST' });
      const data = await res.json();
      if (samlConfig) {
        setSamlConfig({
          ...samlConfig,
          lastTestedAt: data.testedAt,
          lastStatus: 'success',
          lastStatusMessage: data.message,
        });
      }
      showToast('SAML test succeeded: IdP metadata and certificate verified.');
    } catch (err) {
      showToast('SAML test failed. Please verify IdP certificate.');
    } finally {
      setIsTestingSaml(false);
    }
  };

  // Handle Save SAML Config
  const handleSaveSaml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!samlConfig) return;

    try {
      const res = await fetch('/api/auth/saml', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samlConfig),
      });
      const data = await res.json();
      if (res.ok) {
        setSamlConfig(data);
        showToast('Enterprise SAML 2.0 configuration saved.');
      }
    } catch (err) {
      showToast('Error saving SAML configuration.');
    }
  };

  const getRoleBadge = (role: UserRole, customName?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#101E26] text-[#0A84FF] border border-[#0A84FF]/40';
      case 'engineer':
        return 'bg-[#12241A] text-[#30D158] border border-[#30D158]/40';
      case 'reader':
        return 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]';
      case 'custom':
        return 'bg-[#251A30] text-[#BF5AF2] border border-[#BF5AF2]/40';
      default:
        return 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]';
    }
  };

  const getStatusPill = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-[#12241A] text-[#30D158] border border-[#30D158]/40';
      case 'invited':
        return 'bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/40';
      case 'suspended':
        return 'bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/40';
      default:
        return 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]';
    }
  };

  const getAuthSourceBadge = (source: AuthSource) => {
    switch (source) {
      case 'ldap':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[6px] bg-[#12151C] text-[#64D2FF] border border-[#2E3440]">
            <Server className="w-3 h-3 text-[#64D2FF]" />
            <span>Active Directory</span>
          </span>
        );
      case 'saml':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[6px] bg-[#12151C] text-[#BF5AF2] border border-[#2E3440]">
            <Globe className="w-3 h-3 text-[#BF5AF2]" />
            <span>SAML SSO</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[6px] bg-[#12151C] text-[#A6AEC0] border border-[#2E3440]">
            <Key className="w-3 h-3 text-[#A6AEC0]" />
            <span>Local User</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/50 text-xs text-[#30D158] shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#30D158]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-[14px] bg-[#12151C] border border-[#232833] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-center text-[#0A84FF]">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F6F8]">
              User Management & Access Control (RBAC)
            </h1>
          </div>
          <p className="text-xs text-[#A6AEC0]">
            Manage internal PAM operations team members, Active Directory / LDAP synchronization, SAML 2.0 Single Sign-On, and custom role permissions.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canInviteUsers && (
            <button
              onClick={() => {
                setGeneratedInviteLink(null);
                setInviteEmail('');
                setInviteName('');
                setInviteNote('');
                setIsInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Invite via Email</span>
            </button>
          )}

          {canManageUsers && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] text-xs font-semibold border border-[#2E3440] transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#30D158]" />
              <span>Add Local User</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-[12px] bg-[#12151C] border border-[#232833]">
          <span className="text-xs text-[#A6AEC0]">Total Accounts</span>
          <div className="text-2xl font-bold text-[#F5F6F8] mt-1 font-mono">
            {users.length}
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-[#12151C] border border-[#232833]">
          <span className="text-xs text-[#A6AEC0]">Active Users</span>
          <div className="text-2xl font-bold text-[#30D158] mt-1 font-mono">
            {users.filter((u) => u.status === 'active').length}
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-[#12151C] border border-[#232833]">
          <span className="text-xs text-[#A6AEC0]">Pending Invitations</span>
          <div className="text-2xl font-bold text-[#FF9F0A] mt-1 font-mono">
            {users.filter((u) => u.status === 'invited').length}
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-[#12151C] border border-[#232833]">
          <span className="text-xs text-[#A6AEC0]">LDAP & SAML Synced</span>
          <div className="text-2xl font-bold text-[#64D2FF] mt-1 font-mono">
            {users.filter((u) => u.authSource !== 'local').length}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-[#12151C] border border-[#232833] rounded-[10px] overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
              : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Directory & Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'rbac'
              ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
              : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#BF5AF2]" />
          <span>Roles & RBAC Control ({3 + customRoles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ldap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'ldap'
              ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
              : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-[#30D158]" />
          <span>Active Directory / LDAP</span>
          {ldapConfig?.enabled && (
            <span className="w-2 h-2 rounded-full bg-[#30D158]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saml')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'saml'
              ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
              : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#64D2FF]" />
          <span>SAML 2.0 Single Sign-On</span>
          {samlConfig?.enabled && (
            <span className="w-2 h-2 rounded-full bg-[#30D158]" />
          )}
        </button>
      </div>

      {/* TAB 1: TEAM DIRECTORY & USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[12px] bg-[#12151C] border border-[#232833]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6E7787]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team member by name, corporate email, or department..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] placeholder-[#6E7787] focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="engineer">Engineer</option>
                <option value="reader">Reader</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={selectedAuthFilter}
                onChange={(e) => setSelectedAuthFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="All">All Auth Sources</option>
                <option value="local">Local User</option>
                <option value="ldap">Active Directory</option>
                <option value="saml">SAML SSO</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-[14px] bg-[#12151C] border border-[#232833] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#232833] bg-[#0B0E14]/60 text-[#A6AEC0]">
                    <th className="p-3.5 font-semibold">User</th>
                    <th className="p-3.5 font-semibold">Assigned Role</th>
                    <th className="p-3.5 font-semibold">Auth Source</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold hidden md:table-cell">Department</th>
                    <th className="p-3.5 font-semibold hidden lg:table-cell">Last Login</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232833]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#6E7787]">
                        No user accounts match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#1A1E27]/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1A1E27] border border-[#2E3440] flex items-center justify-center text-xs font-bold text-[#F5F6F8] shrink-0 overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-[#F5F6F8] flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.id === currentUser.id && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0A84FF]/20 text-[#0A84FF] font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#6E7787] font-mono">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${getRoleBadge(user.role, user.customRoleName)}`}>
                            {user.role === 'custom' && user.customRoleName ? user.customRoleName : user.role}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {getAuthSourceBadge(user.authSource)}
                        </td>

                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusPill(user.status)}`}>
                            {user.status}
                          </span>
                        </td>

                        <td className="p-3.5 hidden md:table-cell text-[#A6AEC0]">
                          {user.department || '—'}
                        </td>

                        <td className="p-3.5 hidden lg:table-cell text-[#6E7787] font-mono text-[11px]">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canManageUsers && (
                              <button
                                onClick={() => {
                                  setEditingUser({ ...user });
                                  setIsEditUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-[6px] text-[#A6AEC0] hover:text-[#0A84FF] hover:bg-[#1A1E27]"
                                title="Edit user role & department"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {canManageUsers && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className={`p-1.5 rounded-[6px] hover:bg-[#1A1E27] ${
                                  user.status === 'active'
                                    ? 'text-[#A6AEC0] hover:text-[#FF9F0A]'
                                    : 'text-[#FF453A] hover:text-[#30D158]'
                                }`}
                                title={user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                              >
                                {user.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {canManageUsers && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 rounded-[6px] text-[#6E7787] hover:text-[#FF453A] hover:bg-[#1A1E27]"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC & CUSTOM ROLES CONTROL */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-[#12151C] border border-[#232833]">
            <div>
              <h2 className="text-sm font-bold text-[#F5F6F8]">
                Role-Based Access Control (RBAC) System
              </h2>
              <p className="text-xs text-[#A6AEC0]">
                Assign preset roles or build custom roles with specific privileges across runbooks, log analyzer, and administrative settings.
              </p>
            </div>

            {canManageUsers && (
              <button
                onClick={() => setIsCreateRoleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>

          {/* Built-in System Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-[12px] bg-[#12151C] border border-[#232833] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#101E26] text-[#0A84FF] border border-[#0A84FF]/40">
                  Admin (System)
                </span>
                <span className="text-[11px] text-[#6E7787]">All 16 Permissions</span>
              </div>
              <p className="text-xs text-[#A6AEC0] leading-relaxed">
                Full administrative authority. Can author runbooks, invite users, configure Active Directory / SAML, and manage permissions.
              </p>
              <div className="pt-2 border-t border-[#232833] text-[11px] text-[#30D158] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Includes all modules & security controls</span>
              </div>
            </div>

            <div className="p-5 rounded-[12px] bg-[#12151C] border border-[#232833] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#12241A] text-[#30D158] border border-[#30D158]/40">
                  Engineer (System)
                </span>
                <span className="text-[11px] text-[#6E7787]">11 Permissions</span>
              </div>
              <p className="text-xs text-[#A6AEC0] leading-relaxed">
                Operational triage contributor. Can author & publish Local KB runbooks, triage PAM error codes, and sanitize logs.
              </p>
              <div className="pt-2 border-t border-[#232833] text-[11px] text-[#A6AEC0] flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-[#30D158]" />
                <span>Cannot manage users or domain auth</span>
              </div>
            </div>

            <div className="p-5 rounded-[12px] bg-[#12151C] border border-[#232833] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]">
                  Reader (System)
                </span>
                <span className="text-[11px] text-[#6E7787]">5 Permissions</span>
              </div>
              <p className="text-xs text-[#A6AEC0] leading-relaxed">
                Read-only access for auditors and Tier-1 operators. Can view errors, read runbooks, and browse CVE bulletins.
              </p>
              <div className="pt-2 border-t border-[#232833] text-[11px] text-[#FF9F0A] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Cannot author, edit, or delete articles</span>
              </div>
            </div>
          </div>

          {/* Custom Roles List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider">
              Custom RBAC Roles ({customRoles.length})
            </h3>

            {customRoles.length === 0 ? (
              <div className="p-6 rounded-[12px] bg-[#12151C] border border-[#232833] text-center text-xs text-[#6E7787]">
                No custom roles created yet. Click "Create Custom Role" to define granular permissions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map((role) => (
                  <div key={role.id} className="p-4 rounded-[12px] bg-[#12151C] border border-[#232833] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5F6F8]">{role.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase bg-[#251A30] text-[#BF5AF2] border border-[#BF5AF2]/40">
                          Custom
                        </span>
                      </div>
                      {canManageUsers && (
                        <button
                          onClick={() => handleDeleteCustomRole(role.id, role.name)}
                          className="text-[#6E7787] hover:text-[#FF453A]"
                          title="Delete custom role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#A6AEC0]">{role.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#232833]">
                      {role.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#1A1E27] text-[#64D2FF] font-mono border border-[#2E3440]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE DIRECTORY / LDAP */}
      {activeTab === 'ldap' && ldapConfig && (
        <form onSubmit={handleSaveLdap} className="rounded-[14px] bg-[#12151C] border border-[#232833] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232833]">
            <div>
              <h2 className="text-base font-bold text-[#F5F6F8] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#30D158]" />
                <span>Active Directory & LDAP Directory Integration</span>
              </h2>
              <p className="text-xs text-[#A6AEC0] mt-0.5">
                Enable corporate domain users to log into VaultDesk using LDAP / LDAPS bind authentication with automated role mapping.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#F5F6F8]">
                <input
                  type="checkbox"
                  checked={ldapConfig.enabled}
                  onChange={(e) => setLdapConfig({ ...ldapConfig, enabled: e.target.checked })}
                  className="rounded bg-[#1A1E27] border-[#2E3440] text-[#0A84FF] focus:ring-0"
                />
                <span>Enable LDAP Auth</span>
              </label>

              <button
                type="button"
                onClick={handleTestLdap}
                disabled={isTestingLdap}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#30D158] text-xs font-semibold border border-[#30D158]/40 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingLdap ? 'animate-spin' : ''}`} />
                <span>{isTestingLdap ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>

          {ldapConfig.lastStatusMessage && (
            <div className="p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{ldapConfig.lastStatusMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Directory Server URL (LDAP/LDAPS)
              </label>
              <input
                type="text"
                value={ldapConfig.serverUrl}
                onChange={(e) => setLdapConfig({ ...ldapConfig, serverUrl: e.target.value })}
                placeholder="ldaps://ad.corp.internal:636"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Base Search DN
              </label>
              <input
                type="text"
                value={ldapConfig.baseSearchDn}
                onChange={(e) => setLdapConfig({ ...ldapConfig, baseSearchDn: e.target.value })}
                placeholder="DC=corp,DC=internal"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Service Account Bind DN
              </label>
              <input
                type="text"
                value={ldapConfig.bindDn}
                onChange={(e) => setLdapConfig({ ...ldapConfig, bindDn: e.target.value })}
                placeholder="CN=svc-vaultdesk,OU=ServiceAccounts,DC=corp,DC=internal"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Bind Account Password
              </label>
              <input
                type="password"
                value={ldapConfig.bindPassword || ''}
                onChange={(e) => setLdapConfig({ ...ldapConfig, bindPassword: e.target.value })}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                User Search Filter
              </label>
              <input
                type="text"
                value={ldapConfig.userSearchFilter}
                onChange={(e) => setLdapConfig({ ...ldapConfig, userSearchFilter: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Group Membership Filter
              </label>
              <input
                type="text"
                value={ldapConfig.groupSearchFilter}
                onChange={(e) => setLdapConfig({ ...ldapConfig, groupSearchFilter: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
          </div>

          {/* Group to Role Mapping Table */}
          <div className="space-y-3 pt-3 border-t border-[#232833]">
            <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider block">
              Active Directory Group-to-Role Mappings
            </span>
            <div className="space-y-2">
              {ldapConfig.roleMappings.map((map, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs"
                >
                  <span className="font-mono text-[#64D2FF] flex-1 truncate">{map.ldapGroup}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6E7787]" />
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${getRoleBadge(map.role)}`}>
                    {map.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {canConfigureAuth && (
            <div className="flex justify-end pt-4 border-t border-[#232833]">
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Save LDAP Settings
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 4: SAML 2.0 SINGLE SIGN-ON */}
      {activeTab === 'saml' && samlConfig && (
        <form onSubmit={handleSaveSaml} className="rounded-[14px] bg-[#12151C] border border-[#232833] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232833]">
            <div>
              <h2 className="text-base font-bold text-[#F5F6F8] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#64D2FF]" />
                <span>Enterprise SAML 2.0 Single Sign-On (SSO)</span>
              </h2>
              <p className="text-xs text-[#A6AEC0] mt-0.5">
                Integrate with CyberArk Identity, Okta, Microsoft Entra ID (Azure AD), or PingFederate for secure SAML assertion flows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#F5F6F8]">
                <input
                  type="checkbox"
                  checked={samlConfig.enabled}
                  onChange={(e) => setSamlConfig({ ...samlConfig, enabled: e.target.checked })}
                  className="rounded bg-[#1A1E27] border-[#2E3440] text-[#0A84FF] focus:ring-0"
                />
                <span>Enable SAML SSO</span>
              </label>

              <button
                type="button"
                onClick={handleTestSaml}
                disabled={isTestingSaml}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#64D2FF] text-xs font-semibold border border-[#64D2FF]/40 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSaml ? 'animate-spin' : ''}`} />
                <span>{isTestingSaml ? 'Verifying...' : 'Test SAML IdP'}</span>
              </button>
            </div>
          </div>

          {samlConfig.lastStatusMessage && (
            <div className="p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{samlConfig.lastStatusMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Identity Provider (IdP) Entity ID / Issuer
              </label>
              <input
                type="text"
                value={samlConfig.idpIssuer}
                onChange={(e) => setSamlConfig({ ...samlConfig, idpIssuer: e.target.value })}
                placeholder="https://cyberark-identity.corp.internal/saml/metadata"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Single Sign-On (SSO) URL
              </label>
              <input
                type="text"
                value={samlConfig.ssoUrl}
                onChange={(e) => setSamlConfig({ ...samlConfig, ssoUrl: e.target.value })}
                placeholder="https://cyberark-identity.corp.internal/saml/sso"
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Service Provider (SP) Entity ID
              </label>
              <input
                type="text"
                value={samlConfig.spEntityId}
                onChange={(e) => setSamlConfig({ ...samlConfig, spEntityId: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                Assertion Consumer Service (ACS) URL
              </label>
              <input
                type="text"
                value={samlConfig.acsUrl}
                onChange={(e) => setSamlConfig({ ...samlConfig, acsUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#A6AEC0] block">
                IdP X.509 Signature Certificate (PEM)
              </label>
              <textarea
                rows={4}
                value={samlConfig.x509Certificate}
                onChange={(e) => setSamlConfig({ ...samlConfig, x509Certificate: e.target.value })}
                className="w-full p-3 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#64D2FF] font-mono focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#232833]">
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#F5F6F8]">
                <input
                  type="checkbox"
                  checked={samlConfig.jitEnabled}
                  onChange={(e) => setSamlConfig({ ...samlConfig, jitEnabled: e.target.checked })}
                  className="rounded bg-[#1A1E27] border-[#2E3440] text-[#0A84FF] focus:ring-0"
                />
                <span>Enable Just-in-Time (JIT) Provisioning</span>
              </label>

              <div className="flex items-center gap-2 text-[#A6AEC0]">
                <span>Default JIT Role:</span>
                <select
                  value={samlConfig.defaultJitRole}
                  onChange={(e) => setSamlConfig({ ...samlConfig, defaultJitRole: e.target.value as UserRole })}
                  className="px-2 py-1 rounded bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8]"
                >
                  <option value="reader">Reader</option>
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {canConfigureAuth && (
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Save SAML Settings
              </button>
            )}
          </div>
        </form>
      )}

      {/* MODAL 1: INVITE USER VIA EMAIL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-[16px] bg-[#12151C] border border-[#232833] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
                <Mail className="w-5 h-5 text-[#0A84FF]" />
                <span>Invite Team Member via Email</span>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#6E7787] hover:text-[#F5F6F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!generatedInviteLink ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Recipient Email Address <span className="text-[#FF453A]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="engineer@corp.com or partner@external.com"
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A6AEC0] block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g., Jennifer Lee"
                      className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A6AEC0] block">
                      Assigned Role <span className="text-[#FF453A]">*</span>
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="reader">Reader (Read-only)</option>
                      <option value="engineer">Engineer (Runbook Author)</option>
                      <option value="admin">Admin (Full Control)</option>
                      {customRoles.length > 0 && <option value="custom">Custom Role</option>}
                    </select>
                  </div>
                </div>

                {inviteRole === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A6AEC0] block">
                      Select Custom Role
                    </label>
                    <select
                      value={inviteCustomRoleId}
                      onChange={(e) => setInviteCustomRoleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="">-- Choose custom role --</option>
                      {customRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.permissions.length} perms)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Department / Team
                  </label>
                  <input
                    type="text"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Personal Welcome Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={inviteNote}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="Welcome to VaultDesk! You will be assisting our team with PAM runbooks."
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#232833]">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] text-xs font-semibold border border-[#2E3440] text-[#A6AEC0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invitation Email</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Invitation email queued! Direct link is ready for preview:</span>
                </div>

                <div className="p-3 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] space-y-2">
                  <span className="text-[11px] font-semibold text-[#A6AEC0] block">Secure Invitation Link (Expires in 7 days):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full p-2 rounded-[6px] bg-[#0B0E14] border border-[#2E3440] text-[11px] font-mono text-[#64D2FF] select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (generatedInviteLink) {
                          navigator.clipboard.writeText(generatedInviteLink);
                          setCopiedInviteLink(true);
                          setTimeout(() => setCopiedInviteLink(false), 2000);
                        }
                      }}
                      className="px-3 py-2 rounded-[6px] bg-[#0A84FF] text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedInviteLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#232833]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setGeneratedInviteLink(null);
                    }}
                    className="px-4 py-1.5 rounded-[8px] bg-[#1A1E27] text-white text-xs font-semibold border border-[#2E3440]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ADD LOCAL USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-[16px] bg-[#12151C] border border-[#232833] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
                <UserPlus className="w-5 h-5 text-[#30D158]" />
                <span>Create Local User Account</span>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-[#6E7787] hover:text-[#F5F6F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocalUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Full Name <span className="text-[#FF453A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Corporate Email Address <span className="text-[#FF453A]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. dmiller@vaultdesk.internal"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] font-mono focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Assigned Role
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  >
                    <option value="reader">Reader</option>
                    <option value="engineer">Engineer</option>
                    <option value="admin">Admin</option>
                    {customRoles.length > 0 && <option value="custom">Custom Role</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Department
                </label>
                <input
                  type="text"
                  value={addDepartment}
                  onChange={(e) => setAddDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232833]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] text-xs font-semibold border border-[#2E3440] text-[#A6AEC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#30D158] hover:bg-[#30D158]/80 text-[#0B0E14] text-xs font-bold transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT USER */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-[16px] bg-[#12151C] border border-[#232833] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
                <Edit2 className="w-5 h-5 text-[#0A84FF]" />
                <span>Edit User Account</span>
              </div>
              <button
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-[#6E7787] hover:text-[#F5F6F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  >
                    <option value="reader">Reader</option>
                    <option value="engineer">Engineer</option>
                    <option value="admin">Admin</option>
                    {customRoles.length > 0 && <option value="custom">Custom Role</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {editingUser.role === 'custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Custom Role Mapping
                  </label>
                  <select
                    value={editingUser.customRoleId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, customRoleId: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                  >
                    <option value="">-- Choose custom role --</option>
                    {customRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">Department</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232833]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] text-xs font-semibold border border-[#2E3440] text-[#A6AEC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE CUSTOM ROLE WITH PERMISSIONS MATRIX */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="rounded-[16px] bg-[#12151C] border border-[#232833] max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#232833]">
              <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
                <Shield className="w-5 h-5 text-[#BF5AF2]" />
                <span>Create Custom RBAC Role</span>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="text-[#6E7787] hover:text-[#F5F6F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Role Name <span className="text-[#FF453A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Tier-2 Support Specialist"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Summarize the operational scope of this custom role..."
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#F5F6F8] focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider block">
                    Permission Privilege Matrix ({newRolePermissions.length} selected)
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNewRolePermissions(ALL_PERMISSIONS.map((p) => p.id))}
                      className="text-[#0A84FF] hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewRolePermissions([])}
                      className="text-[#6E7787] hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#0B0E14] border border-[#2E3440] max-h-64 overflow-y-auto space-y-3">
                  {['Knowledge Base', 'Troubleshooting & Runbooks', 'Log Analyzer', 'Updates & Security', 'User Management', 'Enterprise SSO & LDAP'].map((cat) => {
                    const permsInCat = ALL_PERMISSIONS.filter((p) => p.category === cat);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#64D2FF] uppercase tracking-wider">
                          {cat}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {permsInCat.map((p) => {
                            const isChecked = newRolePermissions.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2 p-2 rounded-[6px] border cursor-pointer select-none transition-colors ${
                                  isChecked
                                    ? 'bg-[#1A1E27] border-[#0A84FF]/40 text-[#F5F6F8]'
                                    : 'bg-[#12151C]/60 border-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setNewRolePermissions(newRolePermissions.filter((id) => id !== p.id));
                                    } else {
                                      setNewRolePermissions([...newRolePermissions, p.id]);
                                    }
                                  }}
                                  className="mt-0.5 rounded bg-[#12151C] border-[#2E3440] text-[#0A84FF] focus:ring-0"
                                />
                                <div className="text-[11px] leading-snug">
                                  <div className="font-semibold">{p.label}</div>
                                  <span className="text-[#6E7787] text-[10px] font-mono">{p.id}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232833]">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] text-xs font-semibold border border-[#2E3440] text-[#A6AEC0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold transition-colors"
                >
                  Save Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
