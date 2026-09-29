import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Layers,
  Bell,
  Search,
  Bookmark,
  Cpu,
  Wand2,
  BookOpen,
  Users,
  LogOut,
  Check,
  ChevronDown,
  Download,
  Globe,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ThemeToggle, ThemeMode } from './ThemeToggle';

export type NavTab =
  | 'troubleshooting'
  | 'wizard'
  | 'connectors'
  | 'local-kb'
  | 'updates'
  | 'marketplace'
  | 'community'
  | 'settings'
  | 'users';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  onQuickSearchClick?: () => void;
  apiStatus: {
    online: boolean;
    errorCount: number;
    advisoryCount: number;
    hasGeminiKey: boolean;
  };
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onSwitchDemoUser?: (email: string) => void;
  onOpenReadme?: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bookmarkCount,
  onOpenBookmarks,
  onQuickSearchClick,
  apiStatus,
  currentUser,
  onLogout,
  onSwitchDemoUser,
  onOpenReadme,
  currentTheme = 'dark',
  onThemeChange,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const secondaryTabs = [
    { id: 'marketplace' as NavTab, label: 'Marketplace', icon: <Layers className="w-4 h-4" /> },
    { id: 'community' as NavTab, label: 'Community Hub', icon: <Cpu className="w-4 h-4" /> },
    { id: 'users' as NavTab, label: 'Users & RBAC', icon: <Users className="w-4 h-4" /> },
  ];

  const activeSecondary = secondaryTabs.find((t) => t.id === activeTab);

  return (
    <header className="sticky top-0 z-40 liquid-glass-bar border-b border-white/10 dark:border-white/10 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* ZONE 1: Brand Wordmark (Single text element with icon mark) */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group select-none"
            onClick={() => setActiveTab('troubleshooting')}
            title="VaultDesk PAM Ops Assistant"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#64D2FF] flex items-center justify-center shadow-md shadow-[#0A84FF]/20 text-white font-bold transition-transform group-hover:scale-105">
              <ShieldAlert className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight font-sans text-[var(--text-primary)]">
                Vault<span className="text-[#0A84FF]">Desk</span>
              </span>
            </div>
          </div>

          {/* ZONE 2: Primary Navigation Bar (Apple Cupertino Segmented Control) */}
          <nav className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full border border-black/5 dark:border-white/10 shadow-inner">
            <button
              id="nav-troubleshooting"
              onClick={() => setActiveTab('troubleshooting')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === 'troubleshooting'
                  ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Troubleshooting</span>
            </button>

            <button
              id="nav-wizard"
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === 'wizard'
                  ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-[#64D2FF]" />
              <span>Diagnostics</span>
            </button>

            <button
              id="nav-connectors"
              onClick={() => setActiveTab('connectors')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === 'connectors'
                  ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#64D2FF]" />
              <span>Connectors</span>
            </button>

            <button
              id="nav-local-kb"
              onClick={() => setActiveTab('local-kb')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeTab === 'local-kb'
                  ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Knowledge Base</span>
            </button>

            <button
              id="nav-updates"
              onClick={() => setActiveTab('updates')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 relative ${
                activeTab === 'updates'
                  ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Updates</span>
              {apiStatus.advisoryCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse"></span>
              )}
            </button>

            {/* Secondary Tabs "More" Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeSecondary
                    ? 'bg-white dark:bg-[#1C1C1E] text-[#0A84FF] shadow-sm font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="More PAM Tools"
              >
                {activeSecondary ? activeSecondary.label : 'More'}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl liquid-glass-elevated p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {secondaryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#0A84FF]/15 text-[#0A84FF] font-semibold'
                          : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* ZONE 3: Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick search button */}
            {onQuickSearchClick && (
              <button
                id="btn-nav-search"
                onClick={onQuickSearchClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full liquid-glass-interactive text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                title="Search PAM error or keyword (/)"
              >
                <Search className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span className="hidden lg:inline text-xs">Search</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono text-[var(--text-tertiary)]">
                  /
                </kbd>
              </button>
            )}

            {/* Saved Bookmarks Button */}
            <button
              id="btn-nav-bookmarks"
              onClick={onOpenBookmarks}
              className="relative p-2 rounded-full liquid-glass-interactive text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              title="Saved Errors & Runbooks"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#0A84FF] text-white min-w-[18px] text-center shadow-sm">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Dark & Light Mode Switcher */}
            {onThemeChange && (
              <ThemeToggle
                currentTheme={currentTheme}
                onThemeChange={onThemeChange}
                variant="compact"
              />
            )}

            {/* Settings button */}
            <button
              id="nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-full liquid-glass-interactive transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-[#0A84FF] bg-black/10 dark:bg-white/10 font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Settings & Notification Preferences"
            >
              <Settings className="w-4 h-4" />
              <span className="sr-only">Settings</span>
            </button>

            {/* Download README.md button */}
            <button
              onClick={onOpenReadme}
              title="GitHub README.md Guide"
              className="hidden xl:flex p-2 rounded-full liquid-glass-interactive text-xs font-medium text-[var(--text-secondary)] hover:text-[#0A84FF] transition-all items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">README</span>
            </button>

            {/* Current User Profile Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full liquid-glass-interactive text-xs cursor-pointer max-w-[150px]"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <span className="font-semibold text-[var(--text-primary)] hidden sm:inline truncate max-w-[80px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl liquid-glass-elevated p-3 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-2.5 border-b border-black/10 dark:border-white/10">
                      <div className="font-bold text-[var(--text-primary)] text-xs truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">{currentUser.email}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30">
                          {currentUser.role}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{currentUser.permissions.length} Permissions</span>
                      </div>
                    </div>

                    {/* Quick Persona Switcher */}
                    {onSwitchDemoUser && (
                      <div className="space-y-1 pb-2 border-b border-black/10 dark:border-white/10">
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
                          Switch Role (RBAC Tester)
                        </span>
                        <button
                          onClick={() => {
                            onSwitchDemoUser('admin@vaultdesk.internal');
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                            currentUser.role === 'admin' ? 'text-[#0A84FF] font-bold' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          <span>Admin (Alexander Ward)</span>
                          {currentUser.role === 'admin' && <Check className="w-3.5 h-3.5 text-[#0A84FF]" />}
                        </button>
                        <button
                          onClick={() => {
                            onSwitchDemoUser('engineer@vaultdesk.internal');
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                            currentUser.role === 'engineer' ? 'text-[#30D158] font-bold' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          <span>Engineer (Marcus Vance)</span>
                          {currentUser.role === 'engineer' && <Check className="w-3.5 h-3.5 text-[#30D158]" />}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                      >
                        <Users className="w-3.5 h-3.5 text-[#0A84FF]" />
                        <span>User Management & RBAC</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenReadme) onOpenReadme();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>GitHub README.md & Guide</span>
                      </button>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-[#FF453A] hover:bg-[#FF453A]/10 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-start py-2 border-t border-black/10 dark:border-white/10 overflow-x-auto text-xs gap-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'troubleshooting' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Troubleshooting
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'wizard' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('connectors')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'connectors' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Connectors
          </button>
          <button
            onClick={() => setActiveTab('local-kb')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'local-kb' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'updates' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Updates
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'marketplace' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === 'community' ? 'bg-[#0A84FF] text-white font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            Community
          </button>
        </div>
      </div>
    </header>
  );
};
