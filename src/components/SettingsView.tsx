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
