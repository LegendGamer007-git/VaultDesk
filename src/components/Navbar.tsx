import React, { useState } from 'react';
import {
  ShieldAlert,
  Terminal,
  Layers,
  Bell,
  Search,
  Bookmark,
  ExternalLink,
  Cpu,
  Sparkles,
  RefreshCw,
  Wand2,
  BookOpen,
  Users,
  Shield,
  LogOut,
  User,
  Check,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab =
  | 'troubleshooting'
  | 'wizard'
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
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#232833] text-[#F5F6F8]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('troubleshooting')}>
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#0A84FF] to-[#64D2FF] flex items-center justify-center shadow-lg shadow-[#0A84FF]/20 text-white font-bold">
              <ShieldAlert className="w-5 h-5 text-[#0B0E14]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#F5F6F8] font-sans">
                  Vault<span className="text-[#0A84FF]">Desk</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                  PAM Ops
                </span>
              </div>
              <p className="text-[11px] text-[#A6AEC0] hidden sm:block">
                Community Privileged Access Management Assistant
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            <button
              id="nav-troubleshooting"
              onClick={() => setActiveTab('troubleshooting')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'troubleshooting'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Troubleshooting</span>
            </button>

            <button
              id="nav-wizard"
              onClick={() => setActiveTab('wizard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'wizard'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Wand2 className="w-4 h-4 text-[#64D2FF]" />
              <span>Diagnostic Wizard</span>
              <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#12241A] text-[#30D158] border border-[#30D158]/30">
                Logs
              </span>
            </button>

            <button
              id="nav-local-kb"
              onClick={() => setActiveTab('local-kb')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'local-kb'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#0A84FF]" />
              <span>Local KB</span>
              <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                Confluence
              </span>
            </button>

            <button
              id="nav-updates"
              onClick={() => setActiveTab('updates')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors relative ${
                activeTab === 'updates'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Updates & Security</span>
              {apiStatus.advisoryCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse"></span>
              )}
            </button>

            <button
              id="nav-marketplace"
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Marketplace</span>
            </button>

            <button
              id="nav-community"
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'community'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Community Hub</span>
            </button>

            <button
              id="nav-users"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users & RBAC</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Quick search shortcut */}
            {onQuickSearchClick && (
              <button
                id="btn-nav-search"
                onClick={onQuickSearchClick}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-xs text-[#A6AEC0] hover:text-[#F5F6F8] hover:border-[#3D4454] transition-all"
                title="Search PAM error or keyword"
              >
                <Search className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Search KB (ITATS...)</span>
                <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[#12151C] border border-[#2E3440] text-[10px] text-[#A6AEC0] font-mono">
                  /
                </kbd>
              </button>
            )}

            {/* Saved Bookmarks Button */}
            <button
              id="btn-nav-bookmarks"
              onClick={onOpenBookmarks}
              className="relative p-2 rounded-[10px] text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#1A1E27] transition-colors border border-transparent hover:border-[#2E3440]"
              title="Saved Errors & Runbooks"
            >
              <Bookmark className="w-4 h-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#0A84FF] text-[#0B0E14] min-w-[18px] text-center">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* Settings button */}
            <button
              id="nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-[10px] text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440]'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#12151C]'
              }`}
              title="Settings & Notification Preferences"
            >
              <span className="sr-only">Settings</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Current User Profile Dropdown & Persona Switcher */}
            {currentUser && (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-[10px] bg-[#12151C] hover:bg-[#1A1E27] border border-[#232833] hover:border-[#2E3440] transition-all text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1A1E27] border border-[#2E3440] flex items-center justify-center text-[10px] font-bold text-[#F5F6F8] overflow-hidden">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <span className="font-semibold text-[#F5F6F8] hidden lg:inline max-w-[90px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      currentUser.role === 'admin'
                        ? 'bg-[#101E26] text-[#0A84FF] border border-[#0A84FF]/40'
                        : currentUser.role === 'engineer'
                        ? 'bg-[#12241A] text-[#30D158] border border-[#30D158]/40'
                        : currentUser.role === 'custom'
                        ? 'bg-[#251A30] text-[#BF5AF2] border border-[#BF5AF2]/40'
                        : 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#6E7787]" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-[12px] bg-[#12151C] border border-[#232833] shadow-2xl p-3 z-50 space-y-3 animate-in fade-in">
                    <div className="pb-2.5 border-b border-[#232833]">
                      <div className="font-bold text-[#F5F6F8] text-xs truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-[#6E7787] font-mono truncate">{currentUser.email}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440]">
                          {currentUser.role === 'custom' && currentUser.customRoleName ? currentUser.customRoleName : currentUser.role}
                        </span>
                        <span className="text-[10px] text-[#A6AEC0]">{currentUser.permissions.length} Permissions</span>
                      </div>
                    </div>

                    {/* Quick Persona Switcher for Reviewing RBAC controls */}
                    {onSwitchDemoUser && (
                      <div className="space-y-1 pb-2 border-b border-[#232833]">
                        <span className="text-[10px] font-bold text-[#6E7787] uppercase tracking-wider block">
                          Switch Role (RBAC Tester)
                        </span>
                        <button
                          onClick={() => {
                            onSwitchDemoUser('admin@vaultdesk.internal');
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs flex items-center justify-between hover:bg-[#1A1E27] transition-colors ${
                            currentUser.role === 'admin' ? 'text-[#0A84FF] font-bold bg-[#1A1E27]/50' : 'text-[#A6AEC0]'
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
                          className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs flex items-center justify-between hover:bg-[#1A1E27] transition-colors ${
                            currentUser.role === 'engineer' ? 'text-[#30D158] font-bold bg-[#1A1E27]/50' : 'text-[#A6AEC0]'
                          }`}
                        >
                          <span>Engineer (Marcus Vance)</span>
                          {currentUser.role === 'engineer' && <Check className="w-3.5 h-3.5 text-[#30D158]" />}
                        </button>
                        <button
                          onClick={() => {
                            onSwitchDemoUser('reader@vaultdesk.internal');
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs flex items-center justify-between hover:bg-[#1A1E27] transition-colors ${
                            currentUser.role === 'reader' ? 'text-[#A6AEC0] font-bold bg-[#1A1E27]/50' : 'text-[#A6AEC0]'
                          }`}
                        >
                          <span>Reader (Sarah Chen)</span>
                          {currentUser.role === 'reader' && <Check className="w-3.5 h-3.5 text-[#A6AEC0]" />}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs text-[#F5F6F8] hover:bg-[#1A1E27] flex items-center gap-2"
                      >
                        <Users className="w-3.5 h-3.5 text-[#0A84FF]" />
                        <span>User Management & RBAC</span>
                      </button>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs text-[#FF453A] hover:bg-[#2A1414] flex items-center gap-2"
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

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-[#232833] overflow-x-auto text-xs gap-1">
          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'troubleshooting' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Troubleshooting
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'wizard' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Wizard & Logs
          </button>
          <button
            id="mobile-nav-local-kb"
            onClick={() => setActiveTab('local-kb')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'local-kb' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Local KB
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'updates' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Updates & CVEs
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'marketplace' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'community' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Community
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'settings' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Settings
          </button>
          <button
            id="mobile-nav-users"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap font-medium ${
              activeTab === 'users' ? 'bg-[#1A1E27] text-[#0A84FF]' : 'text-[#A6AEC0]'
            }`}
          >
            Users & RBAC
          </button>
        </div>
      </div>
    </header>
  );
};
