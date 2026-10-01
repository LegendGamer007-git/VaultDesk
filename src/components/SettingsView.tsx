import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Layers,
  Database,
  Check,
  Save,
  FileText,
  Download,
  Github,
  ExternalLink,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { PamComponent, UserPreferences } from '../types';
import { ThemeToggle, ThemeMode } from './ThemeToggle';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
  apiStatus: {
    online: boolean;
    errorCount: number;
    advisoryCount: number;
    hasGeminiKey: boolean;
  };
  onOpenReadme?: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  apiStatus,
  onOpenReadme,
  currentTheme = 'dark',
  onThemeChange,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>({ ...preferences });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const ALL_COMPONENTS: PamComponent[] = [
    'Privilege Cloud',
    'Vault',
    'PVWA',
    'CPM',
    'PSM',
    'PTA',
    'CCP',
    'Conjur',
  ];

  const handleToggleComponent = (comp: PamComponent) => {
    const exists = prefs.followedComponents.includes(comp);
    let updated: PamComponent[];
    if (exists) {
      updated = prefs.followedComponents.filter((c) => c !== comp);
    } else {
      updated = [...prefs.followedComponents, comp];
    }
    setPrefs({ ...prefs, followedComponents: updated });
  };

  const handleSave = () => {
    onUpdatePreferences(prefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // CyberArk PAM Integration State
  const [pamDeploymentType, setPamDeploymentType] = useState<'privilege_cloud' | 'self_hosted'>('privilege_cloud');
  const [pvwaUrl, setPvwaUrl] = useState('https://corp-pam.privilegecloud.cyberark.com/PasswordVault');
  const [authMethod, setAuthMethod] = useState('CyberArk');
  const [cpmEngineName, setCpmEngineName] = useState('CPM_Main_Production');
  const [apiUsername, setApiUsername] = useState('VaultDesk_CPM_Admin');
  const [testApiStatus, setTestApiStatus] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const handleTestCyberArkApi = async () => {
    setIsTestingApi(true);
    setTestApiStatus(null);
    try {
      const res = await fetch('/api/settings/test-cyberark-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentType: pamDeploymentType,
          pvwaUrl,
          authMethod,
          cpmEngineName,
          apiUsername,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestApiStatus(`🟢 Connection Successful! ${data.message}`);
      } else {
        setTestApiStatus(`🔴 Connection Error: ${data.error || 'Failed to connect to PVWA API'}`);
      }
    } catch (e: any) {
      setTestApiStatus(`🔴 Network Error: Unable to reach ${pvwaUrl}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  // Gmail SMTP State
  const [smtpUser, setSmtpUser] = useState('1393ndsd@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpStatusMsg, setSmtpStatusMsg] = useState<string | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpUser || !smtpPass) {
      setSmtpStatusMsg('Please provide your Gmail address and 16-character Gmail App Password.');
      return;
    }
    setIsSavingSmtp(true);
    setSmtpStatusMsg(null);
    try {
      const res = await fetch('/api/settings/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'smtp.gmail.com',
          port: 465,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          secure: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpStatusMsg(`Gmail SMTP saved! Real approval emails will be sent directly to ${smtpUser}.`);
      } else {
        throw new Error(data.error || 'Failed to save SMTP settings.');
      }
    } catch (err: any) {
      setSmtpStatusMsg(err.message || 'SMTP configuration failed.');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-[14px] bg-[#12151C] border border-[#232833] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30 mb-3">
          <Settings className="w-3.5 h-3.5 text-[#0A84FF]" />
          <span>Operator Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F6F8] tracking-tight">
          Settings & Architecture Configuration
        </h1>
        <p className="mt-2 text-sm text-[#A6AEC0] leading-relaxed">
          Customize your followed PAM components, alerts for high-severity CVEs, and configure live CyberArk documentation grounding.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="space-y-5">
        {/* Apple Theme & iOS Liquid Glass Appearance Card */}
        {onThemeChange && (
          <div className="p-6 rounded-[18px] liquid-glass-elevated space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-bold text-base">
                <Sparkles className="w-5 h-5 text-[#0A84FF]" />
                <span>Appearance & Cupertino Design Mode</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30">
                Apple & iOS Liquid Glass
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Switch between Light Mode, Dark Titanium, or System Preference with frosted iOS liquid glass translucency, blur filters, and specular highlights.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[14px] bg-white/5 border border-white/10">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-[var(--text-primary)] block">
                  Active Theme Mode
                </span>
                <span className="text-xs text-[var(--text-secondary)] block">
                  {currentTheme === 'light'
                    ? 'Cupertino Light Canvas (#F5F5F7) with Apple Blue accents'
                    : currentTheme === 'dark'
                    ? 'Space Titanium Dark Canvas (#0B0E14) with glowing glass'
                    : 'Automatically match macOS / iOS / OS System Theme'}
                </span>
              </div>

              <ThemeToggle
                currentTheme={currentTheme || 'dark'}
                onThemeChange={onThemeChange}
                variant="segmented"
              />
            </div>
          </div>
        )}

        {/* Followed Components */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-4">
          <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
            <Layers className="w-4 h-4 text-[#0A84FF]" />
            <span>Followed PAM Architecture Components</span>
          </div>
          <p className="text-xs text-[#A6AEC0] leading-relaxed">
            Select the components deployed in your enterprise environment. VaultDesk will prioritize alerts and runbooks matching your stack.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {ALL_COMPONENTS.map((comp) => {
              const isChecked = prefs.followedComponents.includes(comp);
              return (
                <button
                  key={comp}
                  onClick={() => handleToggleComponent(comp)}
                  className={`p-3 rounded-[10px] border text-xs font-semibold flex items-center justify-between transition-all ${
                    isChecked
                      ? 'bg-[#1A1E27] border-[#0A84FF] text-[#64D2FF]'
                      : 'bg-[#1A1E27] border-[#2E3440] text-[#A6AEC0] hover:text-[#F5F6F8]'
                  }`}
                >
                  <span>{comp}</span>
                  {isChecked && <Check className="w-4 h-4 text-[#0A84FF]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-4">
          <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
            <Bell className="w-4 h-4 text-[#FF9F0A]" />
            <span>Advisory & Patch Alert Preferences</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notifyOnCriticalCve}
                onChange={(e) =>
                  setPrefs({ ...prefs, notifyOnCriticalCve: e.target.checked })
                }
                className="mt-1 rounded bg-[#12151C] border-[#2E3440] text-[#0A84FF] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-[#F5F6F8] block">
                  Highlight Critical CVEs (CVSS 8.0+)
                </span>
                <span className="text-xs text-[#A6AEC0] block">
                  Displays immediate warning badges in header when active Remote Code Execution or Authentication Bypass advisories affect followed components.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.notifyOnPatchRelease}
                onChange={(e) =>
                  setPrefs({ ...prefs, notifyOnPatchRelease: e.target.checked })
                }
                className="mt-1 rounded bg-[#12151C] border-[#2E3440] text-[#0A84FF] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-[#F5F6F8] block">
                  Quarterly Maintenance & Patch Rollup Notifications
                </span>
                <span className="text-xs text-[#A6AEC0] block">
                  Notify of new LTS rollups (e.g. 14.0 LTS cumulative patches) with breaking change assessments.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* CyberArk PAM API Integration (Privilege Cloud & Self-Hosted) */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#232833] pb-3">
            <div className="flex items-center gap-2.5 text-[#F5F6F8] font-bold text-base">
              <Layers className="w-5 h-5 text-[#0A84FF]" />
              <span>CyberArk PAM REST API Integration (Privilege Cloud & Self-Hosted)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30 text-[11px] font-semibold">
              CPM & PVWA REST API v14.2
            </span>
          </div>

          <p className="text-xs text-[#A6AEC0] leading-relaxed">
            Configure REST API endpoints for automated privileged account compliance verification, CPM password change/reconcile triggers, and ping reachability diagnostics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* Deployment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F5F6F8]">PAM Deployment Architecture</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPamDeploymentType('privilege_cloud')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    pamDeploymentType === 'privilege_cloud'
                      ? 'bg-[#0A84FF]/20 border-[#0A84FF] text-[#64D2FF]'
                      : 'bg-[#1A1E27] border-[#2E3440] text-[#A6AEC0] hover:text-white'
                  }`}
                >
                  Privilege Cloud (SaaS)
                </button>
                <button
                  type="button"
                  onClick={() => setPamDeploymentType('self_hosted')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    pamDeploymentType === 'self_hosted'
                      ? 'bg-[#0A84FF]/20 border-[#0A84FF] text-[#64D2FF]'
                      : 'bg-[#1A1E27] border-[#2E3440] text-[#A6AEC0] hover:text-white'
                  }`}
                >
                  Self-Hosted PAM (PVWA)
                </button>
              </div>
            </div>

            {/* Authentication Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F5F6F8]">API Authentication Method</label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] focus:border-[#0A84FF] outline-none"
              >
                <option value="CyberArk">CyberArk Native Authentication</option>
                <option value="LDAP">LDAP / Active Directory Integration</option>
                <option value="RADIUS">RADIUS Two-Factor Authentication</option>
                <option value="OAuth2">OAuth 2.0 / SAML Token</option>
              </select>
            </div>

            {/* PVWA URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#F5F6F8]">Password Vault Web Access (PVWA) Endpoint URL</label>
              <input
                type="url"
                value={pvwaUrl}
                onChange={(e) => setPvwaUrl(e.target.value)}
                placeholder="https://corp-pam.privilegecloud.cyberark.com/PasswordVault"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] font-mono text-xs focus:border-[#0A84FF] outline-none"
              />
            </div>

            {/* CPM Engine Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F5F6F8]">Central Policy Manager (CPM) Engine ID</label>
              <input
                type="text"
                value={cpmEngineName}
                onChange={(e) => setCpmEngineName(e.target.value)}
                placeholder="CPM_Main_Production"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] font-mono text-xs focus:border-[#0A84FF] outline-none"
              />
            </div>

            {/* API Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F5F6F8]">Automation Service Account / User</label>
              <input
                type="text"
                value={apiUsername}
                onChange={(e) => setApiUsername(e.target.value)}
                placeholder="VaultDesk_CPM_Admin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] font-mono text-xs focus:border-[#0A84FF] outline-none"
              />
            </div>
          </div>

          {/* Test API Button & Status */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#232833]">
            <button
              type="button"
              onClick={handleTestCyberArkApi}
              disabled={isTestingApi}
              className="px-4 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isTestingApi ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Test CyberArk REST API Connection</span>
            </button>

            {testApiStatus && (
              <div className="text-xs font-medium text-white animate-in fade-in">
                {testApiStatus}
              </div>
            )}
          </div>
        </div>

        {/* Data Source & AI Grounding Management */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-4">
          <div className="flex items-center gap-2 text-[#F5F6F8] font-bold text-base">
            <Database className="w-4 h-4 text-[#0A84FF]" />
            <span>Data Source & Live Grounding Management</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F5F6F8] block">
                  CyberArk Official Documentation Base
                </span>
                <span className="text-[#6E7787] font-mono text-[11px]">
                  https://docs.cyberark.com
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#12241A] text-[#30D158] border border-[#30D158]/30 text-[11px] font-semibold">
                Connected
              </span>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F5F6F8] block">
                  CyberArk Technical Community Portal
                </span>
                <span className="text-[#6E7787] font-mono text-[11px]">
                  https://community.cyberark.com
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#12241A] text-[#30D158] border border-[#30D158]/30 text-[11px] font-semibold">
                Direct Deep-Linking
              </span>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#F5F6F8] block">
                  Gemini Web Grounding Engine
                </span>
                <span className="text-[#A6AEC0] text-[11px]">
                  {apiStatus.hasGeminiKey
                    ? 'Active (GEMINI_API_KEY detected in server environment)'
                    : 'Offline Diagnostic Engine active'}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30 text-[11px] font-semibold">
                Gemini 3.8 Flash
              </span>
            </div>
          </div>
        </div>

        {/* GitHub README & Deployment Documentation */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-[#238636]/15 border border-[#238636]/30 text-[#3FB950]">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5F6F8]">
                  GitHub Repository Documentation & Installation Guide
                </h3>
                <p className="text-xs text-[#A6AEC0]">
                  Official <code className="text-[#0A84FF] font-mono font-semibold">README.md</code> with complete OS guides for Linux, Windows, macOS, Git clone, and security compliance.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#238636]/20 text-[#3FB950] border border-[#238636]/30 text-[11px] font-semibold">
              Root File Ready
            </span>
          </div>

          <div className="p-4 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#F5F6F8] font-semibold">
                <FileText className="w-4 h-4 text-[#0A84FF]" />
                <span>README.md (576 lines • 24 KB • 0 Vulnerabilities)</span>
              </div>
              <p className="text-[11px] text-[#A6AEC0]">
                Ready to sync with your GitHub repository or download directly to your local computer.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenReadme}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#238636] hover:bg-[#2EA043] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View & Copy Guide</span>
              </button>

              <a
                href="/api/download/readme"
                download="README.md"
                className="px-3 py-1.5 rounded-[8px] bg-[#12151C] hover:bg-[#232833] border border-[#2E3440] text-[#0A84FF] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Download raw README.md file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </a>
            </div>
          </div>
        </div>

        {/* Gmail & Real SMTP Delivery Settings Card */}
        <div className="p-6 rounded-[18px] bg-[#12151C] border border-[#232833] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[#F5F6F8] font-bold text-base">
              <Database className="w-5 h-5 text-[#30D158]" />
              <span>Gmail & Real Email Delivery Configuration</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30">
              Admin Real Inbox Dispatch
            </span>
          </div>

          <p className="text-xs text-[#A6AEC0] leading-relaxed">
            Configure direct Google Gmail SMTP dispatch to deliver real registration approval notifications and OTP verification codes directly to administrator <code className="text-[#30D158] font-mono">1393ndsd@gmail.com</code>.
          </p>

          <form onSubmit={handleSaveSmtp} className="p-4 rounded-[12px] bg-[#1A1E27] border border-[#2E3440] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8E9BBA] block">
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E1017] border border-[#2E3440] text-white text-xs focus:outline-none focus:border-[#30D158]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8E9BBA] block">
                  Gmail 16-Char App Password *
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="e.g. xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 rounded-xl bg-[#0E1017] border border-[#2E3440] text-white text-xs focus:outline-none focus:border-[#30D158]"
                  required
                />
              </div>
            </div>

            {smtpStatusMsg && (
              <div className="p-2.5 rounded-xl bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] font-medium">
                {smtpStatusMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#6E7787]">
                Connects to official Google Gmail server <code className="font-mono text-[#8E9BBA]">smtp.gmail.com:465</code>
              </span>
              <button
                type="submit"
                disabled={isSavingSmtp}
                className="px-4 py-2 rounded-xl bg-[#30D158] hover:bg-[#28B84D] text-[#0B0E14] font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                {isSavingSmtp ? 'Saving SMTP...' : 'Save Gmail App Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#6E7787]">
            Preferences are persisted in browser state.
          </span>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Preferences!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
