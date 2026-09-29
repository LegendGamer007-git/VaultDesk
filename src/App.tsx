import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TroubleshootingDashboard } from './components/TroubleshootingDashboard';
import { ErrorDetailModal } from './components/ErrorDetailModal';
import { UpdatesDashboard } from './components/UpdatesDashboard';
import { MarketplaceBrowser } from './components/MarketplaceBrowser';
import { CommunityHub } from './components/CommunityHub';
import { SettingsView } from './components/SettingsView';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { PsmConnectorStudio } from './components/PsmConnectorStudio';
import { LocalKnowledgeBase } from './components/LocalKnowledgeBase';
import { LoginView } from './components/LoginView';
import { UserManagement } from './components/UserManagement';
import { ReadmeModal } from './components/ReadmeModal';
import {
  ErrorEntry,
  UpdateRelease,
  SecurityAdvisory,
  MarketplaceItem,
  CommunityThread,
  UserBookmark,
  UserPreferences,
  PamComponent,
  UserProfile,
} from './types';
import { NavTab } from './components/Navbar';
import {
  INITIAL_ERRORS,
  INITIAL_UPDATES,
  INITIAL_ADVISORIES,
  INITIAL_MARKETPLACE,
  INITIAL_COMMUNITY_THREADS,
} from './data/pamData';

const DEFAULT_PREFERENCES: UserPreferences = {
  followedComponents: ['Vault', 'PVWA', 'CPM', 'PSM'],
  notifyOnCriticalCve: true,
  notifyOnPatchRelease: true,
  enableGeminiGrounding: true,
  defaultView: 'troubleshooting',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('troubleshooting');

  // Authentication & Current User Session
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vaultdesk_token') || 'session-admin';
    } catch {
      return 'session-admin';
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('vaultdesk_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [errors, setErrors] = useState<ErrorEntry[]>(INITIAL_ERRORS);
  const [updates, setUpdates] = useState<UpdateRelease[]>(INITIAL_UPDATES);
  const [advisories, setAdvisories] = useState<SecurityAdvisory[]>(INITIAL_ADVISORIES);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE);
  const [community, setCommunity] = useState<CommunityThread[]>(INITIAL_COMMUNITY_THREADS);
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([
    {
      id: 'bmk-1',
      entryId: 'err-itats006e',
      entryType: 'error',
      title: 'Station is not authenticated to the Vault',
      code: 'ITATS006E',
      component: 'Vault',
      savedAt: new Date().toISOString(),
    },
  ]);

  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(new Date().toISOString());
  const [isAutoSyncingUpdates, setIsAutoSyncingUpdates] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('vaultdesk_prefs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('vaultdesk_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
      return preferences.theme || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply Apple theme and iOS liquid glass mode to document element
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let effectiveTheme: 'light' | 'dark' = 'dark';

      if (themeMode === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        effectiveTheme = themeMode;
      }

      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      root.setAttribute('data-theme', effectiveTheme);

      try {
        localStorage.setItem('vaultdesk_theme', themeMode);
      } catch {
        // ignore
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    const newPrefs = { ...preferences, theme: newTheme };
    setPreferences(newPrefs);
    try {
      localStorage.setItem('vaultdesk_prefs', JSON.stringify(newPrefs));
    } catch {
      // ignore
    }
  };

  const [apiStatus, setApiStatus] = useState({
    online: true,
    errorCount: INITIAL_ERRORS.length,
    advisoryCount: INITIAL_ADVISORIES.length,
    hasGeminiKey: true,
  });

  // Fetch initial data from API with graceful fallbacks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setApiStatus({
            online: true,
            errorCount: healthData.counts?.errors || INITIAL_ERRORS.length,
            advisoryCount: healthData.counts?.advisories || INITIAL_ADVISORIES.length,
            hasGeminiKey: healthData.hasGeminiKey,
          });
        }

        const [errRes, updRes, advRes, mktRes, comRes, bmkRes] = await Promise.allSettled([
          fetch('/api/errors').then((r) => r.json()),
          fetch('/api/updates').then((r) => r.json()),
          fetch('/api/advisories').then((r) => r.json()),
          fetch('/api/marketplace').then((r) => r.json()),
          fetch('/api/community').then((r) => r.json()),
          fetch('/api/bookmarks').then((r) => r.json()),
        ]);

        if (errRes.status === 'fulfilled' && Array.isArray(errRes.value)) {
          setErrors(errRes.value);
        }
        if (updRes.status === 'fulfilled') {
          if (Array.isArray(updRes.value)) {
            setUpdates(updRes.value);
          } else if (updRes.value?.releases && Array.isArray(updRes.value.releases)) {
            setUpdates(updRes.value.releases);
            if (updRes.value.meta?.lastSynced) {
              setLastSyncedTime(updRes.value.meta.lastSynced);
            }
          }
        }
        if (advRes.status === 'fulfilled' && Array.isArray(advRes.value)) {
          setAdvisories(advRes.value);
        }
        if (mktRes.status === 'fulfilled' && Array.isArray(mktRes.value)) {
          setMarketplace(mktRes.value);
        }
        if (comRes.status === 'fulfilled' && Array.isArray(comRes.value)) {
          setCommunity(comRes.value);
        }
        if (bmkRes.status === 'fulfilled' && Array.isArray(bmkRes.value)) {
          setBookmarks(bmkRes.value);
        }
      } catch (err) {
        console.warn('API sync warning; running on local seeded database', err);
      }
    };

    fetchData();

    // Automatic periodic update poll from CyberArk every 60 seconds
    const updateInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/updates?withMeta=true');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setUpdates(data);
          } else if (data.releases && Array.isArray(data.releases)) {
            setUpdates(data.releases);
            if (data.meta?.lastSynced) {
              setLastSyncedTime(data.meta.lastSynced);
            }
          }
        }
      } catch (e) {
        // silent background poll fallback
      }
    }, 60000);

    return () => clearInterval(updateInterval);
  }, []);

  // Handler to manually or automatically fetch latest updates from CyberArk
  const handleFetchUpdatesFromCyberArk = async () => {
    setIsAutoSyncingUpdates(true);
    try {
      const res = await fetch('/api/updates/fetch', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.updates)) {
          setUpdates(data.updates);
        }
        if (data.lastSynced) {
          setLastSyncedTime(data.lastSynced);
        }
        return data;
      }
    } catch (err) {
      console.warn('Live fetch from CyberArk fallback:', err);
    } finally {
      setIsAutoSyncingUpdates(false);
    }
  };

  // Handler to refresh troubleshooting errors
  const handleRefreshErrors = async () => {
    try {
      const res = await fetch('/api/errors');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setErrors(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Troubleshooting errors refresh fallback:', err);
    }
  };

  // Handler to refresh community threads
  const handleRefreshCommunity = async () => {
    try {
      const res = await fetch('/api/community');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCommunity(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Community threads refresh fallback:', err);
    }
  };

  // Save preferences to localStorage
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem('vaultdesk_prefs', JSON.stringify(newPrefs));
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setActiveTab('troubleshooting');
        const input = document.getElementById('input-error-search');
        input?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedError(null);
        setIsBookmarksDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bookmark Toggle
  const bookmarkedIds = new Set(bookmarks.map((b) => b.entryId));

  const handleToggleBookmark = async (error: ErrorEntry) => {
    const isAlready = bookmarkedIds.has(error.id);
    if (isAlready) {
      setBookmarks((prev) => prev.filter((b) => b.entryId !== error.id));
      setErrors((prev) =>
        prev.map((e) =>
          e.id === error.id
            ? { ...e, bookmarks30d: Math.max(0, (e.bookmarks30d || 0) - 1) }
            : e
        )
      );
      try {
        await fetch(`/api/bookmarks/${error.id}`, { method: 'DELETE' });
      } catch {
        // local state already updated
      }
    } else {
      const newBmk: UserBookmark = {
        id: `bmk-${Date.now()}`,
        entryId: error.id,
        entryType: 'error',
        title: error.title,
        code: error.code,
        component: error.component,
        savedAt: new Date().toISOString(),
      };
      setBookmarks((prev) => [newBmk, ...prev]);
      setErrors((prev) =>
        prev.map((e) =>
          e.id === error.id
            ? { ...e, bookmarks30d: (e.bookmarks30d || 0) + 1 }
            : e
        )
      );
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBmk),
        });
      } catch {
        // local state already updated
      }
    }
  };

  const handleRemoveBookmarkById = async (id: string) => {
    const bmk = bookmarks.find((b) => b.id === id || b.entryId === id);
    if (bmk) {
      setErrors((prev) =>
        prev.map((e) =>
          e.id === bmk.entryId || e.code === bmk.code
            ? { ...e, bookmarks30d: Math.max(0, (e.bookmarks30d || 0) - 1) }
            : e
        )
      );
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id && b.entryId !== id));
    try {
      await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleBookmarkRunbook = async (title: string, code: string, component: PamComponent) => {
    const newBmk: UserBookmark = {
      id: `bmk-runbook-${Date.now()}`,
      entryId: `runbook-${code.toLowerCase()}`,
      entryType: 'error',
      title,
      code,
      component,
      savedAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [newBmk, ...prev.filter((b) => b.entryId !== newBmk.entryId)]);
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBmk),
      });
    } catch {
      // ignore
    }
  };

  const handleBookmarkKbArticle = async (title: string, id: string, component: PamComponent) => {
    const existing = bookmarks.find((b) => b.entryId === id);
    if (existing) return;

    const newBmk: UserBookmark = {
      id: `bmk-kb-${Date.now()}`,
      entryId: id,
      entryType: 'kb',
      title,
      component,
      savedAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [newBmk, ...prev]);
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBmk),
      });
    } catch {
      // ignore
    }
  };

  // Select error with 30-day view telemetry increment
  const handleSelectError = (error: ErrorEntry) => {
    const updatedError = { ...error, views30d: (error.views30d || 0) + 1 };
    setSelectedError(updatedError);

    // Increment 30-day views in local state so trending ranking updates reactively
    setErrors((prev) =>
      prev.map((e) => (e.id === error.id ? updatedError : e))
    );

    // Sync view event with server
    fetch(`/api/errors/${error.id}/view`, { method: 'POST' }).catch(() => {});
  };

  // Select error or KB by ID (e.g. from bookmark)
  const handleSelectBookmarkEntry = (entryId: string) => {
    const bmk = bookmarks.find((b) => b.entryId === entryId);
    if (bmk?.entryType === 'kb' || entryId.startsWith('kb-')) {
      setActiveTab('local-kb');
      return;
    }
    const found = errors.find((e) => e.id === entryId || e.code === entryId);
    if (found) {
      handleSelectError(found);
    }
  };

  // Feedback on error
  const handleFeedback = async (errorId: string, type: 'helpful' | 'unhelpful') => {
    try {
      await fetch(`/api/errors/${errorId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      // Update local state
      setErrors((prev) =>
        prev.map((err) => {
          if (err.id === errorId) {
            return {
              ...err,
              helpfulCount: type === 'helpful' ? err.helpfulCount + 1 : err.helpfulCount,
              unhelpfulCount: type === 'unhelpful' ? err.unhelpfulCount + 1 : err.unhelpfulCount,
            };
          }
          return err;
        })
      );
    } catch {
      // ignore
    }
  };

  // Promote AI Entry to Curated KB
  const handlePromoteAiEntry = async (entry: Partial<ErrorEntry>) => {
    const res = await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.entry) {
        setErrors((prev) => [data.entry, ...prev.filter((e) => e.code !== data.entry.code)]);
      }
    }
  };

  // Verify authenticated session
  useEffect(() => {
    const verifySession = async () => {
      if (!authToken) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          localStorage.setItem('vaultdesk_user', JSON.stringify(userData));
        } else {
          setCurrentUser(null);
          setAuthToken(null);
          localStorage.removeItem('vaultdesk_token');
          localStorage.removeItem('vaultdesk_user');
        }
      } catch (err) {
        console.warn('Session verification fallback:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    verifySession();
  }, [authToken]);

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('vaultdesk_user', JSON.stringify(user));
    localStorage.setItem('vaultdesk_token', token);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('vaultdesk_user');
    localStorage.removeItem('vaultdesk_token');
  };

  const handleSwitchDemoUser = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, authMethod: 'local' }),
      });
      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      console.warn('Demo switch fallback:', err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#F5F6F8] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#A6AEC0] font-mono">Verifying VaultDesk Enterprise Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !authToken) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenReadme={() => setIsReadmeModalOpen(true)}
        />
        <ReadmeModal
          isOpen={isReadmeModalOpen}
          onClose={() => setIsReadmeModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F5F6F8] flex flex-col font-sans selection:bg-[#0A84FF] selection:text-[#0B0E14]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookmarkCount={bookmarks.length}
        onOpenBookmarks={() => setIsBookmarksDrawerOpen(true)}
        onQuickSearchClick={() => {
          setActiveTab('troubleshooting');
          const input = document.getElementById('input-error-search');
          input?.focus();
        }}
        apiStatus={apiStatus}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchDemoUser={handleSwitchDemoUser}
        onOpenReadme={() => setIsReadmeModalOpen(true)}
        currentTheme={themeMode}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Area - 1440px container max */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'troubleshooting' && (
          <TroubleshootingDashboard
            errors={errors}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onSelectError={handleSelectError}
            onPromoteAiEntry={handlePromoteAiEntry}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            resolutionFilter={resolutionFilter}
            setResolutionFilter={setResolutionFilter}
            selectedComponent={selectedComponent}
            setSelectedComponent={setSelectedComponent}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={setSelectedSeverity}
            onOpenWizard={() => setActiveTab('wizard')}
            onOpenLocalKb={() => setActiveTab('local-kb')}
            onRefreshErrors={handleRefreshErrors}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'wizard' && (
          <DiagnosticWizard
            onSelectError={handleSelectError}
            onBookmarkRunbook={handleBookmarkRunbook}
          />
        )}

        {activeTab === 'connectors' && (
          <PsmConnectorStudio
            currentUser={currentUser}
            onNavigateToTroubleshoot={() => setActiveTab('troubleshooting')}
          />
        )}

        {activeTab === 'local-kb' && (
          <LocalKnowledgeBase
            onBookmarkArticle={handleBookmarkKbArticle}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'updates' && (
          <UpdatesDashboard
            updates={updates}
            advisories={advisories}
            onRefreshUpdates={handleFetchUpdatesFromCyberArk}
            lastSyncedTimestamp={lastSyncedTime}
            isGlobalSyncing={isAutoSyncingUpdates}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceBrowser items={marketplace} />
        )}

        {activeTab === 'community' && (
          <CommunityHub
            threads={community}
            onRefreshCommunity={handleRefreshCommunity}
          />
        )}

        {activeTab === 'users' && currentUser && (
          <UserManagement
            currentUser={currentUser}
            onUserUpdated={(updated) => {
              if (updated.id === currentUser.id) {
                setCurrentUser(updated);
                localStorage.setItem('vaultdesk_user', JSON.stringify(updated));
              }
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            apiStatus={apiStatus}
            onOpenReadme={() => setIsReadmeModalOpen(true)}
            currentTheme={themeMode}
            onThemeChange={handleThemeChange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#232833] bg-[#0B0E14] py-8 text-xs text-[#6E7787]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F6F8]">VaultDesk</span>
            <span>•</span>
            <span className="text-[#A6AEC0]">Unofficial Community PAM Troubleshooting Assistant & Operations Hub</span>
          </div>

          <div className="flex items-center gap-4 text-[#A6AEC0]">
            <a
              href="https://docs.cyberark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0A84FF] transition-colors"
            >
              CyberArk Docs
            </a>
            <a
              href="https://community.cyberark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0A84FF] transition-colors"
            >
              Technical Community
            </a>
            <a
              href="https://marketplace.cyberark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0A84FF] transition-colors"
            >
              Marketplace
            </a>
          </div>
        </div>
      </footer>

      {/* Error Detail Modal */}
      <ErrorDetailModal
        error={selectedError}
        isOpen={Boolean(selectedError)}
        onClose={() => setSelectedError(null)}
        isBookmarked={Boolean(selectedError && bookmarkedIds.has(selectedError.id))}
        onToggleBookmark={handleToggleBookmark}
        onFeedback={handleFeedback}
      />

      {/* Bookmarks Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksDrawerOpen}
        onClose={() => setIsBookmarksDrawerOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmarkById}
        onSelectBookmark={handleSelectBookmarkEntry}
      />

      {/* GitHub README & OS Setup Guide Modal */}
      <ReadmeModal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
      />
    </div>
  );
}
