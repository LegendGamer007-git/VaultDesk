import React, { useState } from 'react';
import {
  Search,
  Settings,
  Bell,
  Bookmark,
  Users,
  LogOut,
  Check,
  ChevronDown,
  Download,
  Menu,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ThemeToggle, ThemeMode } from './ThemeToggle';

export type NavTab =
  | 'compliance'
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
  onOpenReadme?: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  onToggleMobileSidebar?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
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
  onOpenReadme,
  currentTheme = 'light',
  onThemeChange,
  onToggleMobileSidebar,
  searchQuery = '',
  setSearchQuery,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const TAB_TITLES: Record<NavTab, string> = {
    compliance: 'Privileged Accounts Compliance & CPM Operations',
    troubleshooting: 'Overview & Troubleshooting',
    wizard: 'Diagnostic Wizard & Logs',
    connectors: 'PSM Connector Studio',
    'local-kb': 'Knowledge Base & Runbooks',
    updates: 'Security Advisories & CVEs',
    marketplace: 'Marketplace Integration',
    community: 'Community Hub & Forums',
    users: 'User Access & RBAC Controls',
    settings: 'Settings & Appearance',
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#12151F] border-b border-[#E6EFF5] dark:border-white/10 px-4 sm:px-8 py-4 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-2 rounded-2xl bg-[#F4F5F9] dark:bg-[#1E2332] text-[#343C6A] dark:text-white md:hidden hover:bg-[#E6EFF5]"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#343C6A] dark:text-white tracking-tight font-sans">
              {TAB_TITLES[activeTab] || 'Overview'}
            </h1>
            <p className="text-xs text-[#8BA3CB] dark:text-[#A0AEC0] hidden sm:block">
              Community Privileged Access Management Operations Hub
            </p>
          </div>
        </div>

        {/* Center: Search Input (BankDash Pill Style) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#8BA3CB] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for PAM errors, ITATS, runbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              onFocus={() => {
                if (activeTab !== 'troubleshooting') setActiveTab('troubleshooting');
              }}
              className="w-full bg-[#F5F7FA] dark:bg-[#1E2332] border-none text-[#343C6A] dark:text-white text-xs pl-10 pr-10 py-3 rounded-full focus:ring-2 focus:ring-[#396AFF] transition-all font-medium placeholder:text-[#8BA3CB]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white dark:bg-black/20 text-[10px] font-mono text-[#8BA3CB] border border-[#E6EFF5] dark:border-white/10">
              /
            </kbd>
          </div>
        </div>

        {/* Right Controls: Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Saved Bookmarks Icon */}
          <button
            onClick={onOpenBookmarks}
            className="relative p-2.5 rounded-full bg-[#F5F7FA] dark:bg-[#1E2332] text-[#718EBF] dark:text-[#A0AEC0] hover:text-[#396AFF] dark:hover:text-white hover:bg-[#E6EFF5] transition-all cursor-pointer"
            title="Saved Errors & Bookmarks"
          >
            <Bookmark className="w-4 h-4" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#396AFF] text-white min-w-[18px] text-center shadow-sm">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          {onThemeChange && (
            <ThemeToggle
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
              variant="compact"
            />
          )}

          {/* Security Advisories Notifications */}
          <button
            onClick={() => setActiveTab('updates')}
            className="relative p-2.5 rounded-full bg-[#F5F7FA] dark:bg-[#1E2332] text-[#FE5C73] hover:bg-[#FE5C73]/10 transition-all cursor-pointer"
            title="Security Advisories & Updates"
          >
            <Bell className="w-4 h-4" />
            {apiStatus.advisoryCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FE5C73] animate-ping" />
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2.5 rounded-full bg-[#F5F7FA] dark:bg-[#1E2332] transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#396AFF] bg-[#396AFF]/10 font-bold'
                : 'text-[#718EBF] dark:text-[#A0AEC0] hover:text-[#396AFF] hover:bg-[#E6EFF5]'
            }`}
            title="Settings & Appearance"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Avatar (BankDash Round Avatar) */}
          {currentUser && (
            <div className="relative pl-1">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#396AFF] transition-all cursor-pointer"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#396AFF] to-[#6157FF] p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#12151F] overflow-hidden flex items-center justify-center font-bold text-[#396AFF]">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-white dark:bg-[#1E2332] border border-[#E6EFF5] dark:border-white/10 p-4 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-[#343C6A] dark:text-white">
                  <div className="pb-3 border-b border-[#E6EFF5] dark:border-white/10">
                    <div className="font-bold text-sm">{currentUser.name}</div>
                    <div className="text-xs text-[#8BA3CB] dark:text-[#A0AEC0] font-mono truncate">{currentUser.email}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#396AFF]/10 text-[#396AFF]">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-[#8BA3CB]">{currentUser.permissions.length} Permissions</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {(currentUser.role === 'superadmin' ||
                      currentUser.role === 'admin' ||
                      currentUser.permissions?.includes('users:manage')) && (
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#343C6A] dark:text-white hover:bg-[#F4F5F9] dark:hover:bg-white/5 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-[#396AFF]" />
                        <span>User Management & RBAC</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#FE5C73] hover:bg-[#FE5C73]/10 flex items-center gap-2 font-medium"
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
    </header>
  );
};
