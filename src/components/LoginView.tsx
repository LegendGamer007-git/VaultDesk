import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  ArrowRight,
  Shield,
  Key,
  Globe,
  Server,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Terminal,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  FileText,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [authMethod, setAuthMethod] = useState<'local' | 'ldap' | 'saml' | 'invite'>('local');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect invite token from URL if present (e.g. ?token=inv-tok-...&email=...)
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const paramEmail = params.get('email');
      if (token) {
        setAuthMethod('invite');
        setInviteToken(token);
        if (paramEmail) setEmail(paramEmail);
      }
    } catch {
      // ignore
    }
  }, []);

  // Quick Demo Login Presets
  const DEMO_USERS = [
    {
      label: 'Admin (Alexander Ward)',
      email: 'admin@vaultdesk.internal',
      role: 'admin' as UserRole,
      badge: 'Full Access & RBAC Admin',
      badgeColor: 'bg-[#101E26] text-[#0A84FF] border-[#0A84FF]/40',
      description: 'Manage users, configure LDAP/SAML, author runbooks, and promote AI resolutions.',
    },
    {
      label: 'SecOps Engineer (Marcus Vance)',
      email: 'engineer@vaultdesk.internal',
      role: 'engineer' as UserRole,
      badge: 'Operator & Contributor',
      badgeColor: 'bg-[#12241A] text-[#30D158] border-[#30D158]/40',
      description: 'Analyze logs, triage PAM errors, author & edit Local KB runbooks.',
    },
    {
      label: 'Security Auditor (Sarah Chen)',
      email: 'reader@vaultdesk.internal',
      role: 'reader' as UserRole,
      badge: 'Read-Only Access',
      badgeColor: 'bg-[#1A1E27] text-[#A6AEC0] border-[#2E3440]',
      description: 'Browse curated errors, view runbooks & CVE advisories. No editing rights.',
    },
    {
      label: 'Invited User (Elena Rostova)',
      email: 'elena.rostova@cyberark-partner.internal',
      role: 'admin' as UserRole,
      badge: 'Pending Email Invitation',
      badgeColor: 'bg-[#12241A] text-[#30D158] border-[#30D158]/40',
      description: 'Invited team member. Has token inv-tok-9842f1a8 to test invitation flow.',
    },
  ];

  const handleQuickLogin = async (userEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: 'Password123!', authMethod: 'local' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setErrorMessage('Please enter your invitation token.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/users/invite/${encodeURIComponent(inviteToken.trim())}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired invitation token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email or corporate username.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          authMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F5F6F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#0A84FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#64D2FF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#0A84FF] to-[#64D2FF] text-[#0B0E14] shadow-xl shadow-[#0A84FF]/25 mx-auto">
          <ShieldAlert className="w-8 h-8 text-[#0B0E14]" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F6F8]">
            Vault<span className="text-[#0A84FF]">Desk</span>
          </h1>
          <p className="text-xs font-semibold text-[#64D2FF] uppercase tracking-wider mt-1">
            Enterprise PAM Operations & Troubleshooting Portal
          </p>
          <p className="text-xs text-[#A6AEC0] mt-1.5">
            Internal Operations Runbooks, Log Analytics & CyberArk Telemetry
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-[#12151C] border border-[#232833] rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
          {/* Auth Method Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[#0B0E14] border border-[#232833] rounded-[10px]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('local');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[8px] text-xs font-semibold transition-all ${
                authMethod === 'local'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
            >
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Local</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('ldap');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[8px] text-xs font-semibold transition-all ${
                authMethod === 'ldap'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
            >
              <Server className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">LDAP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('saml');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[8px] text-xs font-semibold transition-all ${
                authMethod === 'saml'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">SAML SSO</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('invite');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-[8px] text-xs font-semibold transition-all ${
                authMethod === 'invite'
                  ? 'bg-[#1A1E27] text-[#30D158] border border-[#30D158]/40 shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0 text-[#30D158]" />
              <span className="truncate">Accept Invite</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-[10px] bg-[#2A1414] border border-[#FF453A]/40 text-xs text-[#FF453A] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Form based on selected Auth Method */}
          {authMethod === 'local' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., admin@vaultdesk.internal"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#A6AEC0] block">
                    Password
                  </label>
                  <span className="text-[11px] text-[#6E7787]">
                    Default: <code className="font-mono text-[#64D2FF]">Password123!</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#6E7787] hover:text-[#F5F6F8]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-[0_2px_10px_rgba(10,132,255,0.3)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to VaultDesk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {authMethod === 'ldap' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#A6AEC0] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#F5F6F8]">
                  <Server className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>Connected to Active Directory (ad.corp.internal)</span>
                </div>
                <p className="text-[11px] text-[#6E7787]">
                  Authenticate with your sAMAccountName or UPN. Permissions will be assigned from Active Directory security group mappings.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  AD Username / User Principal Name (UPN)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="CORP\username or username@corp.internal"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Domain Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Windows domain password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#6E7787] hover:text-[#F5F6F8]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-[0_2px_10px_rgba(10,132,255,0.3)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Contacting Domain Controller...</span>
                ) : (
                  <>
                    <span>Authenticate with Active Directory</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {authMethod === 'saml' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#F5F6F8]">
                  <Globe className="w-4 h-4 text-[#64D2FF]" />
                  <span>Enterprise Single Sign-On (SAML 2.0)</span>
                </div>
                <p className="text-[#A6AEC0] text-[11px] leading-relaxed">
                  Log in via your organization's centralized identity provider (CyberArk Identity, Okta, Microsoft Entra ID / Azure AD, or PingFederate).
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#6E7787] pt-1">
                  <span>ACS URL:</span>
                  <code className="text-[#64D2FF]">https://vaultdesk.internal/api/auth/saml/acs</code>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Corporate Single Sign-On Email / Domain
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@enterprise-corp.com"
                  className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#0A84FF]"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-[0_2px_10px_rgba(10,132,255,0.3)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Redirecting to Identity Provider...</span>
                ) : (
                  <>
                    <span>Continue with CyberArk Identity / SAML SSO</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {authMethod === 'invite' && (
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div className="p-3.5 rounded-[10px] bg-[#12241A] border border-[#30D158]/30 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#30D158]">
                  <Mail className="w-4 h-4" />
                  <span>Email Invitation Activation</span>
                </div>
                <p className="text-[#A6AEC0] text-[11px] leading-relaxed">
                  Enter your onboarding invitation token received via corporate email to activate your account and access assigned RBAC privileges.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-[#6E7787]">
                  <span>Test with sample token:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteToken('inv-tok-9842f1a8');
                      setInviteName('Elena Rostova');
                    }}
                    className="font-mono text-[#30D158] hover:underline"
                  >
                    inv-tok-9842f1a8
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Invitation Token *
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="text"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="e.g. inv-tok-9842f1a8"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm font-mono focus:outline-none focus:border-[#30D158]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A6AEC0] block">
                  Your Full Name (Optional Confirm)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#6E7787]" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-[10px] bg-[#30D158] hover:bg-[#28B84D] disabled:opacity-50 text-[#0B0E14] font-bold text-sm transition-all shadow-[0_2px_10px_rgba(48,209,88,0.3)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Verifying Token & Activating...</span>
                ) : (
                  <>
                    <span>Activate Account & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Login Preset Persona Cards */}
          <div className="pt-4 border-t border-[#232833] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>1-Click Test Personas (Quick RBAC Testing)</span>
              </span>
              <span className="text-[10px] text-[#6E7787]">Click to log in immediately</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  disabled={isLoading}
                  className="p-3 rounded-[10px] bg-[#1A1E27] hover:bg-[#232833] border border-[#2E3440] hover:border-[#0A84FF]/50 text-left transition-all group flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#F5F6F8] group-hover:text-[#0A84FF] transition-colors">
                        {u.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${u.badgeColor}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E7787] truncate">
                      {u.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6E7787] group-hover:text-[#0A84FF] shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* GitHub Documentation & README.md Download Link */}
          <div className="pt-3 border-t border-[#232833]">
            <div className="p-3 rounded-[10px] bg-[#12151C] border border-[#2E3440] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#A6AEC0] min-w-0">
                <FileText className="w-4 h-4 text-[#0A84FF] shrink-0" />
                <span className="truncate">Need local setup & GitHub install docs?</span>
              </div>
              <a
                href="/api/download/readme"
                download="README.md"
                className="px-2.5 py-1.5 rounded-[6px] bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                title="Download formatted README.md for your GitHub repository"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download README.md</span>
              </a>
            </div>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-4 text-center text-xs text-[#6E7787]">
          <span>Protected by VaultDesk Role-Based Access Control (RBAC) & TLS Encrypted Session Tokens.</span>
        </div>
      </div>
    </div>
  );
};
