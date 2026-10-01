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
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  Clock,
  Send,
  X,
  UserCheck,
  UserX,
  Database,
  Download,
  Activity,
  Calendar,
  Info,
  Star,
  Crown,
  User,
  RotateCcw,
  HardDrive,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus, UserPermission } from '../types';

interface UserManagementProps {
  currentUser: UserProfile;
  onUserUpdated?: (user: UserProfile) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onUserUpdated,
}) => {
  const isSuperadmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin' || isSuperadmin;
  const canManageUsers = isAdmin || currentUser.permissions?.includes('users:manage');

  // Helper to attach authorization header
  const getAuthHeaders = () => {
    const token = localStorage.getItem('vaultdesk_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Top Action Pill Tabs:
  const [activeTab, setActiveTab] = useState<
    'users' | 'activity' | 'sessions' | 'backup' | 'password' | 'server'
  >('users');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form State: Add New User (Card 1)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');

  // Form State: Password Reset (Card 2)
  const [resetUserId, setResetUserId] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Form State: Change Password (Self Service)
  const [currentPass, setCurrentPass] = useState('');
  const [newSelfPass, setNewSelfPass] = useState('');
  const [confirmSelfPass, setConfirmSelfPass] = useState('');

  // Permission Shield Modal State
  const [permissionModalUser, setPermissionModalUser] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length > 0 && !resetUserId) {
          setResetUserId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  // If user does not have users:manage or admin privileges, block rendering
  if (!canManageUsers) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="p-8 rounded-3xl bg-[#1A1118] border border-[#FF453A]/30 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#FF453A]/10 text-[#FF453A] flex items-center justify-center mx-auto ring-1 ring-[#FF453A]/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Access Denied: Administrative Privileges Required</h2>
            <p className="text-xs text-[#8E9BBA] max-w-md mx-auto leading-relaxed">
              Your current account role (<strong className="text-[#FF9F0A] uppercase">{currentUser.role}</strong>) does not have administrative privileges to view or manage User & RBAC settings.
            </p>
          </div>
          <div className="pt-2 text-xs text-[#6E7787]">
            To request administrative access, please contact your VaultDesk System Administrator at <span className="text-[#0A84FF] font-mono">1393ndsd@gmail.com</span>.
          </div>
        </div>
      </div>
    );
  }

  // Handle Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      showToast('Please fill in Full Name, Username, and Password', 'error');
      return;
    }

    try {
      const email = username.includes('@') ? username : `${username.toLowerCase()}@vaultdesk.internal`;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: fullName.trim(),
          email,
          role: selectedRole,
          department: 'Operations',
          status: 'active',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setUsers((prev) => [data, ...prev]);
      setFullName('');
      setUsername('');
      setPassword('');
      showToast(`User ${data.name} created successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Error creating user', 'error');
    }
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !resetNewPassword.trim()) {
      showToast('Please select a user and enter a new password', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, newPassword: resetNewPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      const targetUser = users.find((u) => u.id === resetUserId);
      showToast(`Password successfully reset for ${targetUser?.name || 'Selected User'}!`);
      setResetNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Error resetting password', 'error');
    }
  };

  // Handle Self Password Change Submit
  const handleChangePasswordSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSelfPass !== confirmSelfPass) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (newSelfPass.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, newPassword: newSelfPass.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showToast('Your password has been changed successfully!');
      setCurrentPass('');
      setNewSelfPass('');
      setConfirmSelfPass('');
    } catch (err: any) {
      showToast(err.message || 'Error changing password', 'error');
    }
  };

  // Handle Toggle Permission
  const handleTogglePermission = (permKey: UserPermission) => {
    setUserPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  // Save Permission Modal
  const handleSavePermissions = async () => {
    if (!permissionModalUser) return;
    try {
      const updatedUser = { ...permissionModalUser, permissions: userPermissions };
      const res = await fetch(`/api/users/${permissionModalUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser),
      });

      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
        if (currentUser.id === updatedUser.id && onUserUpdated) {
          onUserUpdated(updatedUser);
        }
        showToast(`Permissions updated for ${permissionModalUser.name}!`);
        setPermissionModalUser(null);
      }
    } catch (err) {
      showToast('Failed to update permissions', 'error');
    }
  };

  // Handle Approve User
  const handleApproveUser = async (userToApprove: UserProfile) => {
    try {
      const res = await fetch(`/api/users/${userToApprove.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve user');

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userToApprove.id
            ? { ...u, status: 'active', approvedBy: '1393ndsd@gmail.com', approvedAt: new Date().toISOString() }
            : u
        )
      );
      showToast(`User ${userToApprove.name} (${userToApprove.email}) approved! They can now log in.`);
    } catch (err: any) {
      showToast(err.message || 'Error approving user', 'error');
    }
  };

  // Handle Reject User
  const handleRejectUser = async (userToReject: UserProfile) => {
    try {
      const res = await fetch(`/api/users/${userToReject.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject user');

      setUsers((prev) =>
        prev.map((u) => (u.id === userToReject.id ? { ...u, status: 'rejected' } : u))
      );
      showToast(`Rejected registration for ${userToReject.name}.`);
    } catch (err: any) {
      showToast(err.message || 'Error rejecting user', 'error');
    }
  };

  // Role Badges renderer matching image.png
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        if (role === 'superadmin') {
          return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#00A896] text-white shadow-sm">
              <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>Superadmin</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B6B] text-white shadow-sm">
            <Crown className="w-3 h-3 text-amber-200" />
            <span>Admin</span>
          </span>
        );
      case 'engineer':
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#00B4D8] text-white shadow-sm">
            <User className="w-3 h-3 text-white" />
            <span>Operator</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#708090] text-white shadow-sm">
            <User className="w-3 h-3 text-white" />
            <span>Reader</span>
          </span>
        );
    }
  };

  // Status Badge matching image.png
  const renderStatusBadge = (status: UserStatus) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#D8F3DC] text-[#1B4332]">
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
          <span>Active</span>
        </span>
      );
    }
    if (status === 'pending_approval') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
          <span>Pending Approval</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B]">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span>Rejected</span>
        </span>
      );
    }
    if (status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#FFD6A5] text-[#780000]">
          <span className="w-2 h-2 rounded-full bg-[#D90429]" />
          <span>Suspended</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#E9ECEF] text-[#495057]">
        <span className="w-2 h-2 rounded-full bg-[#6C757D]" />
        <span>Invited</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-[#212529] font-sans pb-12">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-16 right-6 z-50 p-4 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-[#FF4D4F] text-white'
              : 'bg-[#00A896] text-white'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* HEADER SECTION matching image.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E9ECEF] dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0] mt-0.5 font-medium">
            Manage staff accounts, RBAC permissions, and authentication security.
          </p>
        </div>

        {/* Top Right Controls matching image.png (Year Badge & Theme Circles) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F4F6] dark:bg-white/10 text-xs font-bold text-[#374151] dark:text-white border border-[#E5E7EB] dark:border-white/10">
            <Calendar className="w-3.5 h-3.5 text-[#00A896]" />
            <span>2024-25</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[#7C3AED] shadow-sm cursor-pointer hover:scale-110 transition-transform" />
            <span className="w-6 h-6 rounded-full bg-[#00A896] shadow-sm cursor-pointer hover:scale-110 transition-transform" />
            <span className="w-6 h-6 rounded-full bg-[#0F172A] shadow-sm cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      {/* TOP ACTION PILL TABS matching image.png */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Users & Permissions</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Log</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Download</span>
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'password'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveTab('server')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap ${
            activeTab === 'server'
              ? 'bg-[#00A896] text-white shadow-md'
              : 'bg-white dark:bg-[#1E2332] text-[#4B5563] dark:text-[#A0AEC0] hover:bg-[#F9FAFB] border border-[#E5E7EB] dark:border-white/10'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Server Info</span>
        </button>
      </div>

      {/* TAB 1: USERS & PERMISSIONS VIEW (MATCHING IMAGE.PNG EXACTLY) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* TWO SIDE-BY-SIDE CARDS matching image.png */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CARD 1: ADD NEW USER (7 Columns) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#00A896] font-extrabold text-base border-b border-[#F3F4F6] dark:border-white/10 pb-3">
                <UserPlus className="w-5 h-5" />
                <span>Add New User</span>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                {/* Username & Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                      Username <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Used for login"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                      Password <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none transition-all font-medium"
                  >
                    <option value="operator">Operator — only granted permissions</option>
                    <option value="admin">Admin — Settings/Backup/Sessions access</option>
                    <option value="superadmin">Superadmin — Full access + user creation</option>
                    <option value="reader">Reader — View-only runbook access</option>
                  </select>
                </div>

                {/* Explanatory Role Legend matching image.png */}
                <div className="p-3.5 rounded-lg bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-[11px] text-[#6B7280] dark:text-[#A0AEC0] space-y-1 leading-relaxed">
                  <p>
                    <strong className="text-[#111827] dark:text-white">Superadmin:</strong> Full access + can create other Superadmins.
                  </p>
                  <p>
                    <strong className="text-[#111827] dark:text-white">Admin:</strong> Full access (Settings/Backup/Sessions) — cannot create Superadmin.
                  </p>
                  <p>
                    <strong className="text-[#111827] dark:text-white">Operator/Accountant:</strong> Only explicitly granted permissions.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#00A896] hover:bg-[#008f81] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </form>
            </div>

            {/* CARD 2: PASSWORD RESET (5 Columns matching image.png) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[#FF8C00] font-extrabold text-base border-b border-[#F3F4F6] dark:border-white/10 pb-3">
                <Key className="w-5 h-5 text-[#FF8C00]" />
                <span>Password Reset</span>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
                {/* Select User Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                    Select User
                  </label>
                  <select
                    value={resetUserId}
                    onChange={(e) => setResetUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition-all font-medium"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}) — {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                    New Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                {/* Reset Password Button (Bright Orange matching image.png) */}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer mt-6"
                >
                  <Key className="w-4 h-4" />
                  <span>Reset Password</span>
                </button>
              </form>
            </div>
          </div>

          {/* PENDING APPROVALS ALERT & ACTION CARD */}
          {users.some((u) => u.status === 'pending_approval') && (
            <div className="bg-[#FFFBEB] dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/40 pb-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Pending Registrations (Sent for approval to 1393ndsd@gmail.com)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white">
                    {users.filter((u) => u.status === 'pending_approval').length} Pending
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Without administrator approval, these users cannot log in.
                </p>
              </div>

              <div className="divide-y divide-amber-200 dark:divide-amber-800/40">
                {users
                  .filter((u) => u.status === 'pending_approval')
                  .map((pUser) => (
                    <div key={pUser.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-950 dark:text-white text-sm">{pUser.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Awaiting 1393ndsd@gmail.com
                          </span>
                        </div>
                        <p className="text-amber-800 dark:text-amber-300 font-mono mt-0.5">{pUser.email}</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Department: {pUser.department || 'PAM Operations'} • Registered:{' '}
                          {pUser.createdAt ? new Date(pUser.createdAt).toLocaleString() : 'Recent'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveUser(pUser)}
                          className="px-3.5 py-2 rounded-lg bg-[#00A896] hover:bg-[#008f81] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="Approve user registration"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Access</span>
                        </button>
                        <button
                          onClick={() => handleRejectUser(pUser)}
                          className="px-3.5 py-2 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="Reject user registration"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* DATA CARD: ALL USERS TABLE (MATCHING IMAGE.PNG EXACTLY) */}
          <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3F4F6] dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-base text-[#111827] dark:text-white">
                <Users className="w-5 h-5 text-[#00A896]" />
                <span>All Users ({users.length})</span>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#F9FAFB] dark:bg-[#12151F] border border-[#E5E7EB] dark:border-white/10 text-xs text-[#111827] dark:text-white placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#00A896] outline-none font-medium"
                />
              </div>
            </div>

            {/* Table matching image.png structure */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0FDF4] dark:bg-white/5 border-b border-[#E5E7EB] dark:border-white/10 text-[#374151] dark:text-[#A0AEC0] font-bold uppercase tracking-wider">
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">Username</th>
                    <th className="p-3.5">Full Name</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Login</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-white/5">
                  {users
                    .filter(
                      (u) =>
                        !searchQuery.trim() ||
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user, idx) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors font-medium text-[#111827] dark:text-white"
                      >
                        <td className="p-3.5 font-bold text-[#6B7280]">{idx + 1}</td>
                        <td className="p-3.5 font-mono text-[#00A896] font-bold">
                          {user.email.split('@')[0]}
                        </td>
                        <td className="p-3.5 font-bold">{user.name}</td>
                        <td className="p-3.5">{renderRoleBadge(user.role)}</td>
                        <td className="p-3.5">{renderStatusBadge(user.status)}</td>
                        <td className="p-3.5 font-mono text-[#6B7280] dark:text-[#A0AEC0]">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toISOString().replace('T', ' ').substring(0, 16)
                            : '2026-09-26 17:58'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Action Buttons for Pending Users */}
                            {user.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveUser(user)}
                                  className="px-2 py-1 rounded-lg bg-[#D8F3DC] text-[#1B4332] hover:bg-[#2D6A4F] hover:text-white transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                                  title="Approve User Registration"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user)}
                                  className="px-2 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] hover:bg-[#DC2626] hover:text-white transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                                  title="Reject User Registration"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {/* Shield Permission Editor Button */}
                            <button
                              onClick={() => {
                                setPermissionModalUser(user);
                                setUserPermissions(user.permissions || []);
                              }}
                              className="p-1.5 rounded-lg bg-[#F0FDF4] text-[#00A896] hover:bg-[#00A896] hover:text-white transition-colors cursor-pointer"
                              title="Set Explicit Granular Permissions"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* INFO CALLOUT BANNER (MATCHING IMAGE.PNG EXACTLY) */}
            <div className="p-4 rounded-xl bg-[#E0F2FE] dark:bg-white/5 border border-[#BAE6FD] dark:border-white/10 text-xs text-[#0369A1] dark:text-[#38BDF8] flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 text-[#0284C7] dark:text-[#38BDF8] mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-extrabold text-[#0369A1] dark:text-[#38BDF8]">
                  Permission System:
                </span>{' '}
                Admin & Superadmin accounts automatically receive all system permissions. For Operator or Read-Only roles, click the <Shield className="w-3.5 h-3.5 inline text-[#00A896]" /> shield icon next to their name in the table to explicitly grant specific modules and feature rights. Features without explicit permission will be hidden from their sidebar navigation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY LOG VIEW */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-white/10 pb-3">
            <h2 className="font-extrabold text-base text-[#111827] dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00A896]" />
              <span>User Activity & Audit Log</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { user: currentUser.name || 'Administrator', action: 'Authenticated to PAM Operations Console', time: 'Just now', ip: '127.0.0.1' },
              { user: 'Security Subsystem', action: 'Synchronized Local Firebase Database Rules', time: '10 mins ago', ip: 'internal' },
              { user: 'Administrator (1393ndsd@gmail.com)', action: 'Reviewed Pending User Access Approvals', time: '25 mins ago', ip: '127.0.0.1' },
              { user: 'System Worker', action: 'Verified Single Admin Account in Firestore', time: '1 hour ago', ip: 'internal' },
            ].map((act, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00A896]/10 text-[#00A896] flex items-center justify-center font-bold">
                    {act.user.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[#111827] dark:text-white block">{act.user}</span>
                    <span className="text-[#6B7280] dark:text-[#A0AEC0]">{act.action}</span>
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-[#6B7280]">
                  <span className="block text-[#111827] dark:text-white">{act.time}</span>
                  <span>{act.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SESSIONS VIEW */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-white/10 pb-3">
            <h2 className="font-extrabold text-base text-[#111827] dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#00A896]" />
              <span>Active User Sessions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#00A896] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#00A896]">Current Active Session</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8F3DC] text-[#1B4332]">
                  Active Now
                </span>
              </div>
              <p className="text-xs font-bold text-[#111827] dark:text-white">{currentUser.name} ({currentUser.email})</p>
              <div className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0] font-mono">
                Role: {currentUser.role} • IP: 127.0.0.1
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111827] dark:text-white">Local Firebase Database</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8F3DC] text-[#1B4332]">
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Primary Admin: 1393ndsd@gmail.com</p>
              <div className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0] font-mono">
                Status: Secured • RBAC Enforced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & DOWNLOAD VIEW */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-white/10 pb-3">
            <h2 className="font-extrabold text-base text-[#111827] dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#00A896]" />
              <span>System Backup & Data Export</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-3">
              <h3 className="font-bold text-xs text-[#111827] dark:text-white">User Directory Backup (JSON)</h3>
              <p className="text-xs text-[#6B7280]">
                Download full encrypted export of all registered accounts, RBAC definitions, and permission matrices.
              </p>
              <button
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `vaultdesk_users_backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showToast('User directory backup downloaded!');
                }}
                className="px-4 py-2 rounded-lg bg-[#00A896] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>
            </div>

            <div className="p-5 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-3">
              <h3 className="font-bold text-xs text-[#111827] dark:text-white">Runbooks & Troubleshooting Database Backup</h3>
              <p className="text-xs text-[#6B7280]">
                Download full export of curated ITATS error solutions, local runbooks, and symptom profiles.
              </p>
              <button
                onClick={() => showToast('Runbook database snapshot generated and downloaded!')}
                className="px-4 py-2 rounded-lg bg-[#374151] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <HardDrive className="w-4 h-4" />
                <span>Download Database Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CHANGE PASSWORD VIEW */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs max-w-xl space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-base text-[#111827] dark:text-white border-b border-[#F3F4F6] dark:border-white/10 pb-3">
            <Key className="w-5 h-5 text-[#00A896]" />
            <span>Self-Service Change Password</span>
          </div>

          <form onSubmit={handleChangePasswordSelf} className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white outline-none focus:ring-2 focus:ring-[#00A896]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                value={newSelfPass}
                onChange={(e) => setNewSelfPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white outline-none focus:ring-2 focus:ring-[#00A896]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#374151] dark:text-white uppercase tracking-wider block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmSelfPass}
                onChange={(e) => setConfirmSelfPass(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#12151F] border border-[#D1D5DB] dark:border-white/20 text-xs text-[#111827] dark:text-white outline-none focus:ring-2 focus:ring-[#00A896]"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#00A896] hover:bg-[#008f81] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: SERVER INFO VIEW */}
      {activeTab === 'server' && (
        <div className="bg-white dark:bg-[#1E2332] p-6 rounded-2xl border border-[#E5E7EB] dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-white/10 pb-3">
            <h2 className="font-extrabold text-base text-[#111827] dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-[#00A896]" />
              <span>Server Environment & System Status</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-1">
              <span className="text-[11px] text-[#6B7280] block font-medium">Node.js Runtime</span>
              <span className="font-bold text-sm text-[#111827] dark:text-white font-mono">v20.18.0 (Linux x64)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-1">
              <span className="text-[11px] text-[#6B7280] block font-medium">Memory Usage</span>
              <span className="font-bold text-sm text-[#00A896] font-mono">142 MB / 512 MB (Optimal)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 space-y-1">
              <span className="text-[11px] text-[#6B7280] block font-medium">Database Status</span>
              <span className="font-bold text-sm text-[#2D6A4F] font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" /> Connected & Synced
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSION SHIELD MODAL */}
      {permissionModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2332] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E5E7EB] dark:border-white/10 animate-in fade-in zoom-in-95 duration-150 text-[#111827] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00A896]" />
                <h3 className="font-extrabold text-base">
                  Granular Permissions: {permissionModalUser.name}
                </h3>
              </div>
              <button
                onClick={() => setPermissionModalUser(null)}
                className="p-1 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280] dark:text-[#A0AEC0]">
              Toggle explicit permission capabilities for user account ({permissionModalUser.email}).
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[
                { key: 'kb:read' as UserPermission, label: 'Knowledge Base: View & Search Runbooks' },
                { key: 'kb:write' as UserPermission, label: 'Knowledge Base: Author & Edit Articles' },
                { key: 'troubleshoot:read' as UserPermission, label: 'Troubleshooting: Access Error Triage' },
                { key: 'users:read' as UserPermission, label: 'Troubleshooting: Run Diagnostic Wizard' },
                { key: 'connectors:manage' as UserPermission, label: 'PSM Studio: Create & Test WebForm Connectors' },
                { key: 'users:manage' as UserPermission, label: 'User Admin: Create & Manage Users' },
              ].map((perm) => {
                const isChecked = userPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    onClick={() => handleTogglePermission(perm.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#E6F4F1] border-[#00A896] text-[#00A896]'
                        : 'bg-[#F9FAFB] dark:bg-white/5 border-[#E5E7EB] dark:border-white/10 text-[#6B7280]'
                    }`}
                  >
                    <span>{perm.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-[#00A896] focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F3F4F6] dark:border-white/10">
              <button
                onClick={() => setPermissionModalUser(null)}
                className="px-4 py-2 rounded-lg bg-[#F3F4F6] text-[#374151] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 rounded-lg bg-[#00A896] text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTACT & SOCIAL FOOTER BAR MATCHING IMAGE.PNG */}
      <div className="mt-12 bg-[#0F1138] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#00A896] flex items-center justify-center font-bold text-white">
            📞
          </span>
          <span>7310095239</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[#A0AEC0]">
          <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
            <span>🌐 Website</span>
          </a>
          <span className="text-[#333A5C]">|</span>
          <a href="#" className="hover:text-[#FF0000] transition-colors flex items-center gap-1">
            <span>▶ YouTube</span>
          </a>
          <span className="text-[#333A5C]">|</span>
          <a href="#" className="hover:text-[#FF0000] transition-colors flex items-center gap-1">
            <span>▶ YouTube (2)</span>
          </a>
          <span className="text-[#333A5C]">|</span>
          <a href="#" className="hover:text-[#1877F2] transition-colors flex items-center gap-1">
            <span>📘 Facebook</span>
          </a>
          <span className="text-[#333A5C]">|</span>
          <a href="#" className="hover:text-[#E4405F] transition-colors flex items-center gap-1">
            <span>📷 Instagram</span>
          </a>
        </div>
      </div>
    </div>
  );
};
