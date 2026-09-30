import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  Wand2,
  Globe,
  BookOpen,
  Bell,
  Layers,
  Cpu,
  Users,
  Settings,
  ShieldAlert,
  ChevronRight,
  Download,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  advisoryCount: number;
  onOpenReadme?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  advisoryCount,
  onOpenReadme,
  className = '',
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <Terminal className="w-5 h-5" /> },
    { id: 'wizard', label: 'Diagnostics', icon: <Wand2 className="w-5 h-5" /> },
    { id: 'connectors', label: 'PSM Connectors', icon: <Globe className="w-5 h-5" /> },
    { id: 'local-kb', label: 'Knowledge Base', icon: <BookOpen className="w-5 h-5" /> },
    {
      id: 'updates',
      label: 'Security & Updates',
      icon: <Bell className="w-5 h-5" />,
      badge: advisoryCount > 0 ? `${advisoryCount}` : undefined,
      badgeColor: 'bg-[#FF4B4B] text-white',
    },
    { id: 'marketplace', label: 'Marketplace', icon: <Layers className="w-5 h-5" /> },
    { id: 'community', label: 'Community Hub', icon: <Cpu className="w-5 h-5" /> },
    { id: 'users', label: 'Users & RBAC', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`w-64 shrink-0 bg-white dark:bg-[#12151F] border-r border-[#E6EFF5] dark:border-white/10 flex flex-col justify-between py-6 min-h-screen transition-colors duration-300 ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Lockup */}
        <div
          className="px-6 flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab('troubleshooting')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#396AFF] via-[#4C49ED] to-[#6157FF] flex items-center justify-center text-white shadow-md shadow-[#396AFF]/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-2xl tracking-tight text-[#343C6A] dark:text-white font-sans">
              Vault<span className="text-[#396AFF]">Desk</span>
            </span>
            <span className="block text-[10px] font-semibold text-[#8BA3CB] dark:text-[#A0AEC0] uppercase tracking-wider">
              PAM Operations
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5 px-3">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#F4F5F9] dark:bg-[#1E2332] text-[#396AFF] dark:text-[#396AFF] shadow-sm'
                    : 'text-[#B1B2CA] dark:text-[#8E9BBA] hover:text-[#343C6A] dark:hover:text-white hover:bg-[#F8F9FD] dark:hover:bg-white/5'
                }`}
              >
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#396AFF] rounded-r-full" />
                )}

                <div className="flex items-center gap-3.5">
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#396AFF]' : 'group-hover:scale-105'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${item.badgeColor || 'bg-[#396AFF] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / GitHub README Quick Action */}
      <div className="px-4 pt-4 border-t border-[#E6EFF5] dark:border-white/10 space-y-3">
        {onOpenReadme && (
          <button
            onClick={onOpenReadme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#396AFF]/10 to-[#16DBCC]/10 text-[#396AFF] dark:text-[#16DBCC] font-semibold text-xs border border-[#396AFF]/20 hover:border-[#396AFF]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#396AFF] dark:text-[#16DBCC] group-hover:bounce" />
              <span>GitHub README</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        <div className="px-2 text-[11px] text-[#B1B2CA] dark:text-[#6E7787] text-center font-mono">
          VaultDesk v14.0 • PAM Assistant
        </div>
      </div>
    </aside>
  );
};
