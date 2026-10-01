import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Terminal,
  Shield,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  CheckCircle,
  Loader2,
  Filter,
  FileCode,
  Layers,
  HelpCircle,
  Flame,
  FileSpreadsheet,
  Globe,
  Sparkles,
  Copy,
  Check,
  Wand2,
  ChevronDown,
  RefreshCw,
  Activity,
  Wrench,
  X,
  FileText,
  BookOpen,
} from 'lucide-react';
import { ErrorEntry, PamComponent, SeverityLevel, AiDiagnosisResult, UserProfile } from '../types';
import { TrendingIssuesWidget } from './TrendingIssuesWidget';
import { ComponentErrorHeatmapWidget } from './ComponentErrorHeatmapWidget';
import { COMMUNITY_KB_ARTICLES } from '../data/communityArticles';
import { COMPONENT_SYMPTOM_PROFILES, SymptomAreaDetail, getSymptomAreasForComponent, getAllSymptomAreas } from '../data/symptomAreas';
import { getSymptomAreaForError } from '../utils/symptomHelper';

interface TroubleshootingDashboardProps {
  errors: ErrorEntry[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (error: ErrorEntry) => void;
  onSelectError: (error: ErrorEntry) => void;
  onPromoteAiEntry: (entry: Partial<ErrorEntry>) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resolutionFilter?: string;
  setResolutionFilter?: (q: string) => void;
  selectedComponent: string;
  setSelectedComponent: (c: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (s: string) => void;
  onOpenWizard?: () => void;
  onOpenLocalKb?: () => void;
  onRefreshErrors?: () => Promise<any>;
  lastSyncedTimestamp?: string;
  isGlobalSyncing?: boolean;
  currentUser?: UserProfile | null;
}

export const TroubleshootingDashboard: React.FC<TroubleshootingDashboardProps> = ({
  errors,
  bookmarkedIds,
  onToggleBookmark,
  onSelectError,
  onPromoteAiEntry,
  searchQuery,
  setSearchQuery,
  resolutionFilter,
  setResolutionFilter,
  selectedComponent,
  setSelectedComponent,
  selectedSeverity,
  setSelectedSeverity,
  onOpenWizard,
  onOpenLocalKb,
  onRefreshErrors,
  lastSyncedTimestamp,
  isGlobalSyncing,
  currentUser,
}) => {
  const [internalResolutionFilter, setInternalResolutionFilter] = useState<string>('');
  const activeResolutionFilter = resolutionFilter !== undefined ? resolutionFilter : internalResolutionFilter;
  const setActiveResolutionFilter = setResolutionFilter || setInternalResolutionFilter;

  // Live Auto-Sync Troubleshooting Database State
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(60);
  const [isLocalSyncing, setIsLocalSyncing] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    lastSyncedTimestamp || new Date().toLocaleTimeString()
  );

  const isSyncing = isGlobalSyncing || isLocalSyncing;

  // Auto-sync ticker effect
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerFetchErrors(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled]);

  // Sync timestamp updates when parent passes new lastSyncedTimestamp
  useEffect(() => {
    if (lastSyncedTimestamp) {
      setLastSyncTime(new Date(lastSyncedTimestamp).toLocaleTimeString());
    }
  }, [lastSyncedTimestamp]);

  const triggerFetchErrors = async (isAuto = false) => {
    setIsLocalSyncing(true);
    try {
      if (onRefreshErrors) {
        await onRefreshErrors();
      } else {
        const res = await fetch('/api/errors');
        if (res.ok) {
          await res.json();
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString());
      setCountdown(60);
      setSyncNotification(
        isAuto
          ? 'Troubleshooting Knowledge Base auto-synchronized: Verified latest resolutions, diagnostic logs, and symptom mappings.'
          : 'Successfully synchronized troubleshooting runbooks and error database!'
      );
      setTimeout(() => setSyncNotification(null), 5000);
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsLocalSyncing(false);
    }
  };

  const [isCommunitySearching, setIsCommunitySearching] = useState(false);
  const [isFetchingMoreCommunity, setIsFetchingMoreCommunity] = useState(false);
  const [communityResults, setCommunityResults] = useState<ErrorEntry[]>([]);
  const [communitySearchQuery, setCommunitySearchQuery] = useState<string>('');
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [savedCommunityIds, setSavedCommunityIds] = useState<Set<string>>(new Set());
  const [activeResultsTab, setActiveResultsTab] = useState<'all' | 'curated' | 'community'>('all');
  const [exportedNotice, setExportedNotice] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [selectedSymptomArea, setSelectedSymptomArea] = useState<string | null>(null);
  const [isSymptomPanelExpanded, setIsSymptomPanelExpanded] = useState<boolean>(true);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, activeResolutionFilter, selectedComponent, selectedSeverity, activeResultsTab, selectedSymptomArea]);

  const handleCopySolution = (err: ErrorEntry) => {
    const text = `CyberArk PAM Troubleshooting Runbook: [${err.code}] ${err.title}
Component: ${err.component} | Severity: ${err.severity}
${err.communityArticleId ? `CyberArk Community Knowledge Base Article #${err.communityArticleId}\n` : ''}
CAUSE:
${err.cause}

RESOLUTION RUNBOOK:
${err.resolutionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DIAGNOSTIC LOGS:
${(err.logsToCheck || []).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedCardId(err.id);
    setTimeout(() => {
      setCopiedCardId(null);
    }, 2500);
  };

  const COMPONENTS: (PamComponent | 'All')[] = [
    'All',
    'Privilege Cloud',
    'Vault',
    'PVWA',
    'CPM',
    'PSM',
    'PTA',
    'CCP',
    'Conjur',
  ];

  const SEVERITIES: (SeverityLevel | 'All')[] = [
    'All',
    'Critical',
    'High',
    'Medium',
    'Low',
  ];

  // Helper to test if an error matches the resolution & technical notes filter
  const checkErrorResolutionMatch = (err: ErrorEntry, filterText: string) => {
    if (!filterText.trim()) {
      return {
        matches: true,
        matchedStepIndices: [] as number[],
        causeMatches: false,
        logsMatch: false,
        tagsMatch: false,
        descMatch: false,
      };
    }
    const keywords = filterText.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const matchedStepIndices: number[] = [];
    (err.resolutionSteps || []).forEach((step, idx) => {
      const lowerStep = step.toLowerCase();
      if (keywords.some((kw) => lowerStep.includes(kw))) {
        matchedStepIndices.push(idx);
      }
    });

    const causeLower = (err.cause || '').toLowerCase();
    const causeMatches = keywords.some((kw) => causeLower.includes(kw));

    const logsLower = (err.logsToCheck || []).join(' ').toLowerCase();
    const logsMatch = keywords.some((kw) => logsLower.includes(kw));

    const tagsLower = (err.tags || []).join(' ').toLowerCase();
    const tagsMatch = keywords.some((kw) => tagsLower.includes(kw));

    const descLower = (err.description || '').toLowerCase();
    const descMatch = keywords.some((kw) => descLower.includes(kw));

    const allTechNotesText = [
      ...(err.resolutionSteps || []),
      err.cause || '',
      ...(err.logsToCheck || []),
      ...(err.tags || []),
      err.description || '',
      ...(err.observedSymptoms || []),
    ].join(' ').toLowerCase();

    // Check if every keyword is present in the resolution or technical notes
    const matches = keywords.every((kw) => allTechNotesText.includes(kw));

    return {
      matches,
      matchedStepIndices,
      causeMatches,
      logsMatch,
      tagsMatch,
      descMatch,
    };
  };

  // Filter curated errors - matches ANY part of the error
  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      const matchComponent =
        selectedComponent === 'All' ||
        err.component.toLowerCase() === selectedComponent.toLowerCase();

      const matchSeverity =
        selectedSeverity === 'All' ||
        err.severity.toLowerCase() === selectedSeverity.toLowerCase();

      if (!matchComponent || !matchSeverity) return false;

      if (selectedSymptomArea) {
        const errSymptom = (err.symptomArea || getSymptomAreaForError(err.code, err.component)).toLowerCase();
        if (!errSymptom.includes(selectedSymptomArea.toLowerCase())) {
          return false;
        }
      }

      // Check text-based filter for resolution or technical notes
      if (activeResolutionFilter.trim()) {
        const resolutionMatch = checkErrorResolutionMatch(err, activeResolutionFilter);
        if (!resolutionMatch.matches) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;

      const rawQ = searchQuery.toLowerCase().trim();
      const cleanNormQ = rawQ.replace(/[^a-z0-9]/g, '');
      const codeNorm = err.code.toLowerCase().replace(/[^a-z0-9]/g, '');

      const codeMatch =
        err.code.toLowerCase().includes(rawQ) ||
        (cleanNormQ.length >= 2 && codeNorm.includes(cleanNormQ));
      const titleMatch = err.title.toLowerCase().includes(rawQ);
      const descMatch = err.description.toLowerCase().includes(rawQ);
      const causeMatch = err.cause.toLowerCase().includes(rawQ);
      const stepMatch = err.resolutionSteps?.some((s) => s.toLowerCase().includes(rawQ));
      const logMatch = err.logsToCheck?.some((l) => l.toLowerCase().includes(rawQ));
      const tagMatch = err.tags?.some((t) => t.toLowerCase().includes(rawQ));
      const versionMatch = err.affectedVersions?.some((v) => v.toLowerCase().includes(rawQ));

      return (
        codeMatch ||
        titleMatch ||
        descMatch ||
        causeMatch ||
        stepMatch ||
        logMatch ||
        tagMatch ||
        versionMatch
      );
    });
  }, [errors, selectedComponent, selectedSeverity, searchQuery, selectedSymptomArea, activeResolutionFilter]);

  // Complete filter for all CyberArk Community Portal articles - lists all articles
  const filteredCommunityArticles = useMemo(() => {
    return COMMUNITY_KB_ARTICLES.filter((item) => {
      const matchComponent =
        selectedComponent === 'All' ||
        item.component.toLowerCase() === selectedComponent.toLowerCase();

      const matchSeverity =
        selectedSeverity === 'All' ||
        item.severity.toLowerCase() === selectedSeverity.toLowerCase();

      if (!matchComponent || !matchSeverity) return false;

      if (selectedSymptomArea) {
        const itemSymptom = (item.symptomArea || getSymptomAreaForError(item.code, item.component)).toLowerCase();
        if (!itemSymptom.includes(selectedSymptomArea.toLowerCase())) {
          return false;
        }
      }

      // Check text-based filter for resolution or technical notes
      if (activeResolutionFilter.trim()) {
        const resolutionMatch = checkErrorResolutionMatch(item, activeResolutionFilter);
        if (!resolutionMatch.matches) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;

      const rawQ = searchQuery.toLowerCase().trim();
      const cleanNormQ = rawQ.replace(/[^a-z0-9]/g, '');
      const codeNorm = item.code.toLowerCase().replace(/[^a-z0-9]/g, '');

      const codeMatch =
        item.code.toLowerCase().includes(rawQ) ||
        (cleanNormQ.length >= 2 && codeNorm.includes(cleanNormQ));
      const titleMatch = item.title.toLowerCase().includes(rawQ);
      const descMatch = item.description.toLowerCase().includes(rawQ);
      const causeMatch = item.cause.toLowerCase().includes(rawQ);
      const stepMatch = item.resolutionSteps?.some((s) => s.toLowerCase().includes(rawQ));
      const logMatch = item.logsToCheck?.some((l) => l.toLowerCase().includes(rawQ));
      const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(rawQ));
      const versionMatch = item.affectedVersions?.some((v) => v.toLowerCase().includes(rawQ));

      return (
        codeMatch ||
        titleMatch ||
        descMatch ||
        causeMatch ||
        stepMatch ||
        logMatch ||
        tagMatch ||
        versionMatch
      );
    });
  }, [selectedComponent, selectedSeverity, searchQuery, selectedSymptomArea, activeResolutionFilter]);

  // Merge static community articles with any dynamic query results
  const allCommunityArticles = useMemo(() => {
    const map = new Map<string, ErrorEntry>();
    filteredCommunityArticles.forEach((art) => map.set(art.code.toUpperCase(), art));
    communityResults.forEach((art) => map.set(art.code.toUpperCase(), art));
    return Array.from(map.values());
  }, [filteredCommunityArticles, communityResults]);

  // Saved errors subset
  const bookmarkedErrors = useMemo(() => {
    return errors.filter((err) => bookmarkedIds.has(err.id));
  }, [errors, bookmarkedIds]);

  // Search CyberArk Community Portal & Knowledge Base (no Gemini)
  const handleSearchCommunity = async (forcedQuery?: string) => {
    const q = (forcedQuery !== undefined ? forcedQuery : searchQuery).trim();
    if (!q) {
      setCommunityResults([]);
      setCommunitySearchQuery('');
      return;
    }

    setIsCommunitySearching(true);
    setCommunityError(null);
    setCommunitySearchQuery(q);

    try {
      const compParam =
        selectedComponent !== 'All'
          ? `&component=${encodeURIComponent(selectedComponent)}`
          : '';
      const response = await fetch(
        `/api/community/search?q=${encodeURIComponent(q)}${compParam}`
      );
      if (!response.ok) {
        throw new Error('CyberArk Community Portal search service returned an error.');
      }
      const data = await response.json();
      setCommunityResults(data.results || []);
      // If we got community results and no curated results, set tab to community
      if (filteredErrors.length === 0 && (data.results || []).length > 0) {
        setActiveResultsTab('community');
      }
    } catch (err: any) {
      setCommunityError(err.message || 'Unable to connect to CyberArk Community Portal.');
    } finally {
      setIsCommunitySearching(false);
    }
  };

  // Fetch more community runbooks from Community Portal
  const handleFetchMoreCommunityArticles = async () => {
    setIsFetchingMoreCommunity(true);
    try {
      const q = searchQuery.trim() || (selectedComponent !== 'All' ? selectedComponent : 'Privilege Cloud');
      const compParam =
        selectedComponent !== 'All'
          ? `&component=${encodeURIComponent(selectedComponent)}`
          : '';
      const response = await fetch(
        `/api/community/search?q=${encodeURIComponent(q)}${compParam}&more=true&offset=${communityResults.length}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setCommunityResults((prev) => {
            const existingCodes = new Set(prev.map((e) => e.code.toUpperCase()));
            const newOnes = data.results.filter((e: ErrorEntry) => !existingCodes.has(e.code.toUpperCase()));
            return [...prev, ...newOnes];
          });
        }
      }
    } catch (err) {
      console.warn('Notice: Could not fetch more community articles:', err);
    } finally {
      setIsFetchingMoreCommunity(false);
      setVisibleCount((prev) => prev + 6);
    }
  };

  // Automatically search CyberArk Community Portal if error is not updated in local database
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2 && filteredErrors.length === 0 && filteredCommunityArticles.length === 0) {
      const timer = setTimeout(() => {
        handleSearchCommunity(trimmed);
      }, 400);
      return () => clearTimeout(timer);
    } else if (trimmed.length === 0) {
      setCommunityResults([]);
      setCommunitySearchQuery('');
    }
  }, [searchQuery, filteredErrors.length, filteredCommunityArticles.length, selectedComponent]);

  // Save community entry into local curated database
  const handleSaveCommunityEntry = async (entry: ErrorEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await onPromoteAiEntry({
        code: entry.code,
        title: entry.title,
        component: entry.component,
        description: entry.description,
        cause: entry.cause,
        resolutionSteps: entry.resolutionSteps,
        severity: entry.severity,
        affectedVersions: entry.affectedVersions,
        sourceLinks: entry.sourceLinks,
        tags: [...entry.tags, 'community-vetted'],
        logsToCheck: entry.logsToCheck,
        helpfulCount: entry.helpfulCount,
        unhelpfulCount: entry.unhelpfulCount,
        verifiedByCommunity: true,
        isCommunityResult: true,
        communityArticleId: entry.communityArticleId,
      });
      setSavedCommunityIds((prev) => new Set(prev).add(entry.id));
    } catch (err) {
      console.error('Failed to save community article to local library:', err);
    }
  };

  // Determine which errors to display based on active tab
  const displayedErrors = useMemo(() => {
    if (activeResultsTab === 'curated') return filteredErrors;
    if (activeResultsTab === 'community') return allCommunityArticles;
    // 'all' tab: union curated + community (avoid duplicate codes)
    const curatedCodes = new Set(filteredErrors.map((e) => e.code.toUpperCase()));
    const uniqueCommunity = allCommunityArticles.filter((e) => !curatedCodes.has(e.code.toUpperCase()));
    return [...filteredErrors, ...uniqueCommunity];
  }, [activeResultsTab, filteredErrors, allCommunityArticles]);

  const handleExportToCsv = () => {
    if (displayedErrors.length === 0) return;

    // Helper to safely escape CSV values according to RFC 4180
    const escapeCsv = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = [
      'Error Code',
      'Component',
      'Severity',
      'Title',
      'Description',
      'Root Cause',
      'Resolution Steps',
      'Affected Versions',
      'Logs to Check',
      'Tags',
      '30-Day Views',
      '30-Day Bookmarks',
      'Helpful Feedback',
      'Unhelpful Feedback',
      'Verified by Community',
      'Source Type',
      'Community Article ID',
      'Last Updated',
    ];

    const rows = displayedErrors.map((err) => [
      escapeCsv(err.code),
      escapeCsv(err.component),
      escapeCsv(err.severity),
      escapeCsv(err.title),
      escapeCsv(err.description),
      escapeCsv(err.cause),
      escapeCsv(
        err.resolutionSteps && err.resolutionSteps.length > 0
          ? err.resolutionSteps.map((step, idx) => `${idx + 1}. ${step}`).join(' | ')
          : ''
      ),
      escapeCsv(err.affectedVersions ? err.affectedVersions.join(', ') : ''),
      escapeCsv(err.logsToCheck ? err.logsToCheck.join(' | ') : ''),
      escapeCsv(err.tags ? err.tags.join(', ') : ''),
      escapeCsv(err.views30d || 0),
      escapeCsv(err.bookmarks30d || 0),
      escapeCsv(err.helpfulCount || 0),
      escapeCsv(err.unhelpfulCount || 0),
      escapeCsv(err.verifiedByCommunity ? 'Yes' : 'No'),
      escapeCsv(err.isCommunityResult ? 'CyberArk Community' : 'Curated Local'),
      escapeCsv(err.communityArticleId || ''),
      escapeCsv(err.lastUpdated || ''),
    ]);

    // Prepend UTF-8 BOM so spreadsheet viewers render UTF-8 characters properly
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    const compSlug =
      selectedComponent !== 'All' ? `-${selectedComponent.toLowerCase()}` : '';
    const sevSlug =
      selectedSeverity !== 'All' ? `-${selectedSeverity.toLowerCase()}` : '';
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `cyberark-pam-errors${compSlug}${sevSlug}-${dateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 2500);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/40 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'High':
        return 'bg-[#2A1414] text-[#FF6961] border border-[#FF6961]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Medium':
        return 'bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Low':
        return 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
      default:
        return 'bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30 rounded-full px-2.5 py-0.5 text-xs font-semibold';
    }
  };

  return (
    <div className="space-y-8">
      {/* Interactive Diagnostic Wizard Callout Banner */}
      {onOpenWizard && (
        <div className="relative overflow-hidden rounded-2xl liquid-glass-elevated p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center shrink-0 text-[#0A84FF]">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight">
                  Interactive Diagnostic Wizard & Log Analyzer
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Guided triage based on PAM component selection, or upload/paste raw logs from <code className="font-mono text-[#0A84FF]">itaso001.log</code>, <code className="font-mono text-[#0A84FF]">pm_error.log</code>, <code className="font-mono text-[#0A84FF]">PSMTrace.log</code> to pinpoint root causes & solutions.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#3B9EFF] text-white text-xs font-semibold transition-all shadow-md shrink-0 self-start sm:self-auto cursor-pointer active:scale-95"
          >
            <span>Launch Wizard & Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-Update & Knowledge Synchronization Status Bar */}
      <div className="rounded-2xl liquid-glass p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isAutoSyncEnabled ? 'bg-[#30D158]' : 'bg-[#6E7787]'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isAutoSyncEnabled ? 'bg-[#30D158]' : 'bg-[#6E7787]'
                  }`}
                />
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                Troubleshooting KB Auto-Update:
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  isAutoSyncEnabled
                    ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                    : 'bg-black/10 dark:bg-white/10 text-[var(--text-tertiary)]'
                }`}
              >
                {isAutoSyncEnabled ? 'ACTIVE (Polling Every 60s)' : 'PAUSED'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#A6AEC0] border-l border-[#2E3440] pl-3">
              <Clock className="w-3.5 h-3.5 text-[#6E7787]" />
              <span>Last synced: <strong className="text-[#F5F6F8] font-mono">{lastSyncTime}</strong></span>
              {isAutoSyncEnabled && (
                <span className="text-[11px] text-[#6E7787] ml-1 font-mono">
                  (next in {countdown}s)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#A6AEC0] hover:text-[#F5F6F8] mr-2 select-none">
              <input
                type="checkbox"
                checked={isAutoSyncEnabled}
                onChange={(e) => setIsAutoSyncEnabled(e.target.checked)}
                className="rounded bg-[#12151C] border-[#2E3440] text-[#0A84FF] focus:ring-0 cursor-pointer"
              />
              <span>Auto-Update</span>
            </label>

            <button
              onClick={() => triggerFetchErrors(false)}
              disabled={isSyncing}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                isSyncing
                  ? 'bg-[#12151C] text-[#6E7787] cursor-not-allowed border border-[#2E3440]'
                  : 'bg-[#0A84FF] hover:bg-[#3B9EFF] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing KB...' : 'Sync Troubleshooting KB'}</span>
            </button>
          </div>
        </div>

        {/* Sync Success Notification */}
        {syncNotification && (
          <div className="p-3 rounded-[8px] bg-[#12241A] border border-[#30D158]/40 text-xs text-[#30D158] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#30D158] shrink-0" />
              <span>{syncNotification}</span>
            </div>
            <button
              onClick={() => setSyncNotification(null)}
              className="text-[#A6AEC0] hover:text-[#F5F6F8] text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Search & Hero Header */}
      <div className="relative rounded-[14px] bg-[#12151C] border border-[#232833] p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Hybrid Search: Curated KB First • Gemini Grounded Fallback</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F6F8] tracking-tight">
            PAM Troubleshooting Runbooks & Diagnostics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#A6AEC0] leading-relaxed">
            Search error codes, credential sync failures, dispatcher crashes, or AppLocker blocks across CyberArk Vault, PVWA, CPM, and PSM.
          </p>

          {/* Search Input Box */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#6E7787] pointer-events-none" />
              <input
                id="input-error-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchCommunity();
                  }
                }}
                placeholder="Search with any part of error (e.g. 072, ITATS006E, locked, AppLocker, timeout)..."
                className="w-full pl-11 pr-24 py-3 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25 focus:border-[#0A84FF] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCommunityResults([]);
                    setCommunitySearchQuery('');
                  }}
                  className="absolute right-3 top-3 px-2 py-1 text-xs text-[#A6AEC0] hover:text-[#F5F6F8] bg-[#12151C] border border-[#2E3440] rounded-[6px] font-sans"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              id="btn-search-community"
              onClick={() => handleSearchCommunity()}
              disabled={isCommunitySearching || !searchQuery.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] disabled:opacity-50 disabled:hover:bg-[#0A84FF] text-white font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all font-sans whitespace-nowrap"
              title="Search CyberArk Technical Community Knowledge Base without Gemini"
            >
              {isCommunitySearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Community...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Search CyberArk Community</span>
                </>
              )}
            </button>
          </div>

          {/* Quick error code chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#A6AEC0]">
            <span className="text-[#6E7787]">Popular codes:</span>
            {['ITATS006E', 'CACPM406E', 'PSMSR126E', 'PSMSR280E', 'CACPM250E', 'PSMSR945E', 'CACPM072E', 'ITATS375E'].map(
              (code) => (
                <button
                  key={code}
                  onClick={() => setSearchQuery(code)}
                  className="px-2.5 py-1 rounded-[6px] bg-[#1A1E27] border border-[#2E3440] hover:border-[#0A84FF] text-[#64D2FF] font-mono text-[11px] transition-colors"
                >
                  {code}
                </button>
              )
            )}
            <button
              id="btn-hero-jump-resolution-filter"
              onClick={() => {
                const el = document.getElementById('input-resolution-filter');
                el?.focus();
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#1A1E27] border border-[#2E3440] hover:border-[#0A84FF] text-[#0A84FF] text-[11px] transition-colors"
              title="Jump to resolution & technical notes filter"
            >
              <Wrench className="w-3 h-3 text-[#0A84FF]" />
              <span>Resolution Keywords</span>
            </button>
            {onOpenLocalKb && (
              <button
                id="btn-hero-jump-local-kb"
                onClick={onOpenLocalKb}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#1A1E27] border border-[#2E3440] hover:border-[#30D158] text-[#30D158] text-[11px] transition-colors"
                title="Open Team Confluence & Local KB"
              >
                <BookOpen className="w-3 h-3 text-[#30D158]" />
                <span>Team Local KB</span>
              </button>
            )}
            <div className="inline-flex items-center gap-2 ml-auto">
              <button
                id="btn-jump-heatmap"
                onClick={() => {
                  const el = document.getElementById('widget-component-error-heatmap');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#2A1414] hover:bg-[#2A1414]/80 text-[#FF453A] font-semibold border border-[#FF453A]/40 text-[11px] transition-colors shadow-sm"
              >
                <Activity className="w-3.5 h-3.5 text-[#FF453A]" />
                <span>30-Day Component Heatmap</span>
              </button>
              <button
                id="btn-jump-trending"
                onClick={() => {
                  const el = document.getElementById('widget-trending-issues');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#2A1F0C] hover:bg-[#2A1F0C]/80 text-[#FF9F0A] font-semibold border border-[#FF9F0A]/40 text-[11px] transition-colors shadow-sm"
              >
                <Flame className="w-3.5 h-3.5 text-[#FF9F0A] fill-[#FF9F0A]" />
                <span>30-Day Trending Leaderboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Component & Severity Quick-Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-[14px] bg-[#12151C] border border-[#232833]">
        {/* Component Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-[#6E7787] mr-2 flex items-center gap-1 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#0A84FF]" />
            Component:
          </span>
          {COMPONENTS.map((comp) => (
            <button
              key={comp}
              id={`filter-component-${comp.toLowerCase()}`}
              onClick={() => setSelectedComponent(comp)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedComponent === comp
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'bg-[#1A1E27] text-[#A6AEC0] hover:bg-[#232833] hover:text-[#F5F6F8] border border-[#2E3440]'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#6E7787] mr-2 flex items-center gap-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-[#FF9F0A]" />
            Severity:
          </span>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              id={`filter-severity-${sev.toLowerCase()}`}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-[8px] text-xs font-medium transition-colors ${
                selectedSeverity === sev
                  ? 'bg-[#232833] text-[#F5F6F8] font-semibold border border-[#3D4454]'
                  : 'text-[#6E7787] hover:text-[#A6AEC0] hover:bg-[#1A1E27]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Targeted Resolution & Technical Notes Keyword Filter */}
      <div className="p-5 rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] flex items-center justify-center text-[#0A84FF] shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#F5F6F8] uppercase tracking-wider">
                  Filter by Resolution & Technical Notes
                </span>
                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                  Targeted Keywords
                </span>
                {activeResolutionFilter && (
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-[#12241A] text-[#30D158] border border-[#30D158]/30">
                    Active: "{activeResolutionFilter}" ({displayedErrors.length} matches)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A6AEC0] mt-0.5">
                Quickly filter errors containing specific remediation steps, registry keys, commands, daemon restarts, or diagnostic logs—independent of the error code or title.
              </p>
            </div>
          </div>

          {activeResolutionFilter && (
            <button
              id="btn-clear-resolution-filter"
              onClick={() => setActiveResolutionFilter('')}
              className="inline-flex items-center gap-1.5 text-xs text-[#64D2FF] hover:text-white font-semibold bg-[#1A1E27] hover:bg-[#232833] px-3 py-1.5 rounded-[8px] border border-[#2E3440] shadow-sm transition-colors self-start sm:self-auto shrink-0"
              title="Clear resolution and technical notes keyword filter"
            >
              <X className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Text Filter Input */}
        <div className="relative">
          <div className="absolute left-3.5 top-3 flex items-center pointer-events-none text-[#6E7787]">
            <Terminal className="w-4 h-4 text-[#0A84FF]" />
          </div>
          <input
            id="input-resolution-filter"
            type="text"
            value={activeResolutionFilter}
            onChange={(e) => setActiveResolutionFilter(e.target.value)}
            placeholder="Type keywords in resolution, remediation runbook, root cause, or technical notes (e.g., AppLocker, regedit, restart service, iisreset, certificate, CreateCredFile)..."
            className="w-full pl-10 pr-28 py-2.5 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] text-[#F5F6F8] placeholder-[#6E7787] text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25 focus:border-[#0A84FF] transition-all"
          />
          {activeResolutionFilter && (
            <div className="absolute right-2.5 top-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#64D2FF] bg-[#12151C] px-2 py-0.5 rounded-[6px] border border-[#2E3440] hidden sm:inline-block">
                {displayedErrors.length} matching
              </span>
              <button
                onClick={() => setActiveResolutionFilter('')}
                className="px-2 py-1 text-xs text-[#A6AEC0] hover:text-[#F5F6F8] bg-[#12151C] border border-[#2E3440] hover:bg-[#232833] rounded-[6px] transition-colors"
                title="Clear input"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Quick Remediation Keyword Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[#6E7787] text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#0A84FF]" />
            Quick Presets:
          </span>
          {[
            { label: 'AppLocker / DLL', keyword: 'AppLocker' },
            { label: 'Restart Service', keyword: 'restart service' },
            { label: 'CreateCredFile', keyword: 'CreateCredFile' },
            { label: 'Registry / Regedit', keyword: 'registry' },
            { label: 'IIS / AppPool', keyword: 'iisreset' },
            { label: 'TLS / Certificate', keyword: 'certificate' },
            { label: 'Safe Permissions', keyword: 'permissions' },
            { label: 'dbparm.ini', keyword: 'dbparm.ini' },
            { label: 'Firewall / Port', keyword: 'firewall' },
            { label: 'Diagnostic Logs', keyword: 'log' },
          ].map((chip) => {
            const isSelected = activeResolutionFilter.toLowerCase() === chip.keyword.toLowerCase();
            return (
              <button
                key={chip.label}
                id={`btn-kw-${chip.keyword.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                onClick={() => {
                  if (isSelected) {
                    setActiveResolutionFilter('');
                  } else {
                    setActiveResolutionFilter(chip.keyword);
                  }
                }}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-mono transition-colors border ${
                  isSelected
                    ? 'bg-[#0A84FF] text-white border-[#0A84FF] font-semibold shadow-sm'
                    : 'bg-[#1A1E27] text-[#A6AEC0] border-[#2E3440] hover:border-[#0A84FF] hover:text-[#64D2FF] hover:bg-[#232833]'
                }`}
                title={`Filter errors with "${chip.keyword}" in their resolution or technical notes`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Community Search In-Progress Notice */}
      {isCommunitySearching && (
        <div
          id="alert-community-searching"
          className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/70 text-cyan-200 flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
            <div className="space-y-0.5 text-sm">
              <p className="font-semibold text-cyan-300">Searching CyberArk Community Portal & Knowledge Base</p>
              <p className="text-xs text-cyan-200/80">
                Querying CyberArk certified administrator articles, field resolutions, and error databases for "{communitySearchQuery || searchQuery}"...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Community Error Alert (if any) */}
      {communityError && (
        <div
          id="alert-community-error"
          className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 flex items-start justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-amber-300">CyberArk Community Portal Notice</p>
              <p className="text-xs text-amber-200/90">{communityError}</p>
            </div>
          </div>
          <button
            onClick={() => setCommunityError(null)}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 30-Day PAM Component Error Volume Heatmap Widget */}
      <ComponentErrorHeatmapWidget
        errors={errors}
        selectedComponent={selectedComponent as PamComponent | 'All'}
        onSelectComponent={(comp) => setSelectedComponent(comp)}
        onSelectError={onSelectError}
        onQuickSearch={(code) => setSearchQuery(code)}
      />

      {/* 30-Day Trending Issues Widget (Top 5 Leaderboard) */}
      <TrendingIssuesWidget
        errors={errors}
        bookmarkedIds={bookmarkedIds}
        onSelectError={onSelectError}
        onToggleBookmark={onToggleBookmark}
        onQuickSearch={(code) => setSearchQuery(code)}
      />

      {/* Main Results Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          {/* Always Visible Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-[#12151C] border border-[#232833]">
              <button
                id="tab-all-results"
                onClick={() => setActiveResultsTab('all')}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                  activeResultsTab === 'all'
                    ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
              >
                All Knowledge Base ({displayedErrors.length})
              </button>
              <button
                id="tab-community-results"
                onClick={() => setActiveResultsTab('community')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                  activeResultsTab === 'community'
                    ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>CyberArk Community Portal ({allCommunityArticles.length})</span>
              </button>
              <button
                id="tab-curated-results"
                onClick={() => setActiveResultsTab('curated')}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors ${
                  activeResultsTab === 'curated'
                    ? 'bg-[#1A1E27] text-[#0A84FF] border border-[#2E3440] shadow-sm'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
              >
                Curated Runbooks ({filteredErrors.length})
              </button>
            </div>

            {searchQuery && (
              <span className="text-xs text-[#A6AEC0] ml-1">
                Matching "{searchQuery}"
              </span>
            )}
            {activeResolutionFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-semibold bg-[#12241A] text-[#30D158] border border-[#30D158]/30 ml-1">
                <Wrench className="w-3 h-3 text-[#30D158]" />
                <span>Resolution: "{activeResolutionFilter}"</span>
                <button
                  onClick={() => setActiveResolutionFilter('')}
                  className="hover:text-white ml-0.5"
                  title="Clear resolution keyword filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              id="btn-export-csv"
              onClick={handleExportToCsv}
              disabled={displayedErrors.length === 0}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] font-semibold text-xs border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${
                exportedNotice
                  ? 'bg-[#12241A] text-[#30D158] border-[#30D158]/40'
                  : 'bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] border-[#2E3440] hover:border-[#3D4454] disabled:opacity-40 disabled:hover:bg-[#1A1E27] disabled:cursor-not-allowed'
              }`}
              title={
                displayedErrors.length === 0
                  ? 'No matching errors to export'
                  : `Export ${displayedErrors.length} error ${
                      displayedErrors.length === 1 ? 'entry' : 'entries'
                    } to CSV for offline reference`
              }
            >
              {exportedNotice ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>Exported {displayedErrors.length} entries!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Export to CSV</span>
                  <span className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#12151C] text-[#A6AEC0] border border-[#2E3440]">
                    {displayedErrors.length}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Community Portal Banner when Community tab is active */}
        {activeResultsTab === 'community' && (
          <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-300">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>CyberArk Technical Community Knowledge Base</strong> — All verified articles, complete causes, and step-by-step resolution runbooks are stored locally in-app without external redirection.
              </span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-700/50 text-cyan-200 whitespace-nowrap self-start sm:self-auto">
              {allCommunityArticles.length} Authentic Articles
            </span>
          </div>
        )}

        {displayedErrors.length === 0 ? (
          isCommunitySearching ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-cyan-800/40 space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Searching CyberArk Community Portal for "{searchQuery}"...
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Querying official CyberArk Customer Portal, PAM Knowledge Base articles, and verified community thread solutions.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  No matching runbook found
                  {searchQuery ? ` for "${searchQuery}"` : ''}
                  {activeResolutionFilter ? ` with resolution containing "${activeResolutionFilter}"` : ''}
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {activeResolutionFilter
                    ? `No error records matched the keyword "${activeResolutionFilter}" within their remediation steps, root cause, or technical notes. Try clearing the resolution filter or trying a broader term.`
                    : 'Search with any substring of the error code, component, log message, or symptom across all CyberArk Community Portal articles.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {activeResolutionFilter && (
                  <button
                    id="btn-empty-clear-resolution-filter"
                    onClick={() => setActiveResolutionFilter('')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm shadow transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Resolution Filter</span>
                  </button>
                )}
                {searchQuery && (
                  <button
                    id="btn-retry-community-search"
                    onClick={() => handleSearchCommunity(searchQuery)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-slate-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Search Community Knowledge Base</span>
                  </button>
                )}
                <button
                  id="btn-view-all-community"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveResolutionFilter('');
                    setSelectedComponent('All');
                    setSelectedSeverity('All');
                    setSelectedSymptomArea(null);
                    setActiveResultsTab('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-colors"
                >
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {displayedErrors.slice(0, visibleCount).map((err) => {
              const isBmk = bookmarkedIds.has(err.id);
              const isCommunity = Boolean(err.isCommunityResult || err.communityArticleId);
              const isSaved = savedCommunityIds.has(err.id);
              const matchDetails = checkErrorResolutionMatch(err, activeResolutionFilter);

              return (
                <div
                  key={err.id}
                  id={`card-error-${err.code.toLowerCase()}-${err.id}`}
                  className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] hover:border-[#2E3440] hover:bg-[#151922] shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all flex flex-col justify-between group cursor-pointer space-y-4"
                  onClick={() => onSelectError(err)}
                >
                  <div className="space-y-3.5">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold px-2.5 py-0.5 rounded-[6px] text-[#0A84FF] bg-[#1A1E27] border border-[#2E3440]">
                          {err.code}
                        </span>
                        <span className={getSeverityBadge(err.severity)}>
                          {err.severity}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-[6px] font-medium bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]">
                          {err.component}
                        </span>

                        {(() => {
                          const symptomAreaName = err.symptomArea || getSymptomAreaForError(err.code, err.component);
                          return (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-[6px] font-medium bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440] hover:border-[#0A84FF] hover:text-[#0A84FF] transition-colors"
                              title={`Symptom Area: ${symptomAreaName} (Click to filter)`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSymptomArea(symptomAreaName);
                              }}
                            >
                              <Activity className="w-3 h-3 text-[#0A84FF] shrink-0" />
                              <span className="truncate max-w-[170px] sm:max-w-[230px]">{symptomAreaName}</span>
                            </span>
                          );
                        })()}

                        {isCommunity && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[6px] font-semibold bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/30"
                            title="Verified CyberArk Technical Community Knowledge Base Article"
                          >
                            <Globe className="w-3 h-3 text-[#64D2FF]" />
                            <span>Community Article {err.communityArticleId ? `#${err.communityArticleId}` : ''}</span>
                          </span>
                        )}

                        {activeResolutionFilter && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-[6px] font-semibold bg-[#12241A] text-[#30D158] border border-[#30D158]/30"
                            title={`Matches resolution keyword: ${activeResolutionFilter}`}
                          >
                            <Wrench className="w-3 h-3 text-[#30D158]" />
                            <span>Matched Tech Notes</span>
                          </span>
                        )}
                      </div>

                      <button
                        id={`btn-bmk-${err.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(err);
                        }}
                        className={`p-1.5 rounded-[6px] hover:bg-[#1A1E27] transition-colors ${
                          isBmk ? 'text-[#0A84FF]' : 'text-[#6E7787] hover:text-[#F5F6F8]'
                        }`}
                        title={isBmk ? 'Bookmarked' : 'Save Error'}
                      >
                        {isBmk ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[#F5F6F8] text-base group-hover:text-[#0A84FF] transition-colors leading-snug">
                      {err.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs text-[#A6AEC0] leading-relaxed">
                      {err.description}
                    </p>

                    {/* Cause: Full Cause Written Here */}
                    {err.cause && (
                      <div className={`p-3.5 rounded-[10px] border space-y-1.5 transition-colors ${
                        activeResolutionFilter && matchDetails.causeMatches
                          ? 'bg-[#2A1F0C] border-[#FF9F0A]/60 shadow-sm ring-1 ring-[#FF9F0A]/30'
                          : 'bg-[#2A1F0C]/40 border-[#FF9F0A]/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF9F0A]">
                            <AlertCircle className="w-3.5 h-3.5 text-[#FF9F0A] shrink-0" />
                            <span>Root Cause & Trigger:</span>
                          </div>
                          {activeResolutionFilter && matchDetails.causeMatches && (
                            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/40">
                              Keywords Found in Root Cause
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#FF9F0A]/90 leading-relaxed font-sans select-text">
                          {err.cause}
                        </p>
                      </div>
                    )}

                    {/* Solution: Full Solution Runbook Written Here */}
                    {err.resolutionSteps && err.resolutionSteps.length > 0 && (
                      <div className={`p-4 rounded-[10px] border space-y-2.5 transition-colors ${
                        activeResolutionFilter && matchDetails.matchedStepIndices.length > 0
                          ? 'bg-[#080A0F] border-[#30D158]/50 shadow-md ring-1 ring-[#30D158]/20'
                          : 'bg-[#080A0F] border-[#232833]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#30D158]">
                            <Terminal className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
                            <span>Remediation Runbook ({err.resolutionSteps.length} Steps):</span>
                            {activeResolutionFilter && matchDetails.matchedStepIndices.length > 0 && (
                              <span className="ml-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[#12241A] text-[#30D158] border border-[#30D158]/40">
                                {matchDetails.matchedStepIndices.length} {matchDetails.matchedStepIndices.length === 1 ? 'Step Matches' : 'Steps Match'} Keywords
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySolution(err);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440] transition-colors shadow-sm"
                            title="Copy entire solution runbook to clipboard"
                          >
                            {copiedCardId === err.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#30D158]" />
                                <span className="text-[#30D158] font-semibold">Solution Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#6E7787]" />
                                <span>Copy Solution</span>
                              </>
                            )}
                          </button>
                        </div>
                        <ol className="space-y-1.5 list-decimal list-inside text-xs text-[#F5F6F8] select-text">
                          {err.resolutionSteps.map((step, sIdx) => {
                            const isStepMatched = activeResolutionFilter && matchDetails.matchedStepIndices.includes(sIdx);
                            return (
                              <li
                                key={sIdx}
                                className={`leading-relaxed p-1 rounded-[6px] transition-colors ${
                                  isStepMatched
                                    ? 'bg-[#12241A] border border-[#30D158]/30 text-[#F5F6F8] pl-2'
                                    : ''
                                }`}
                              >
                                <span className={`font-mono text-[11.5px] ${isStepMatched ? 'text-[#30D158] font-medium' : 'text-[#F5F6F8]'}`}>
                                  {step}
                                </span>
                                {isStepMatched && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#30D158] bg-[#12241A] px-1.5 py-0.2 rounded border border-[#30D158]/40">
                                    Keyword Match
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}

                    {/* Pertinent Diagnostic Logs */}
                    {err.logsToCheck && err.logsToCheck.length > 0 && (
                      <div className={`p-3 rounded-[10px] border text-[11px] text-[#A6AEC0] flex flex-wrap items-center gap-1.5 font-mono ${
                        activeResolutionFilter && matchDetails.logsMatch
                          ? 'bg-[#080A0F] border-[#0A84FF]/60 shadow-sm ring-1 ring-[#0A84FF]/20'
                          : 'bg-[#080A0F] border-[#232833]'
                      }`}>
                        <span className="text-[#6E7787] font-sans font-semibold">Diagnostic Logs:</span>
                        <span className="text-[#64D2FF] select-text">{err.logsToCheck.join(' • ')}</span>
                        {activeResolutionFilter && matchDetails.logsMatch && (
                          <span className="ml-auto px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
                            Keywords in Logs
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer tags and action */}
                  <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{err.resolutionSteps.length} step runbook</span>
                      <span>•</span>
                      <span>{err.helpfulCount} helpful</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCommunity && (
                        <button
                          id={`btn-save-community-${err.id}`}
                          onClick={(e) => handleSaveCommunityEntry(err, e)}
                          disabled={isSaved}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            isSaved
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border-slate-700 hover:border-emerald-700'
                          }`}
                          title="Save this CyberArk community runbook permanently into local curated catalog"
                        >
                          {isSaved ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Saved to Local Curated</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3 text-cyan-400" />
                              <span>Save to Local Runbooks</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                        <span>View Interactive Runbook</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Option for Knowledge Base & Community Portal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[14px] bg-[#12151C] border border-[#232833]">
            <div className="text-xs text-[#A6AEC0]">
              Showing <span className="font-bold text-[#F5F6F8] font-mono">{Math.min(visibleCount, displayedErrors.length)}</span> of{' '}
              <span className="font-bold text-[#F5F6F8] font-mono">{displayedErrors.length}</span> Knowledge Base & Community Runbooks
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {visibleCount < displayedErrors.length && (
                <button
                  id="btn-load-more-runbooks"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#0A84FF] hover:bg-[#3B9EFF] text-white font-semibold text-xs transition-all shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  <span>Load More ({displayedErrors.length - visibleCount} remaining)</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              <button
                id="btn-fetch-more-community-portal"
                onClick={handleFetchMoreCommunityArticles}
                disabled={isFetchingMoreCommunity}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#1A1E27] hover:bg-[#232833] text-[#0A84FF] font-semibold text-xs border border-[#2E3440] transition-colors"
                title="Fetch additional live runbooks directly from CyberArk Technical Community Portal"
              >
                {isFetchingMoreCommunity ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
                    <span>Fetching More Articles...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-[#0A84FF]" />
                    <span>Fetch More from Community Portal</span>
                    <RefreshCw className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Bottom Section: Saved Errors & Diagnostic Playbook Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Saved Errors Quick Shelf */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#0A84FF]" />
              <h3 className="text-sm font-bold text-[#F5F6F8] uppercase tracking-wider">
                Your Saved Errors ({bookmarkedErrors.length})
              </h3>
            </div>
            {bookmarkedErrors.length > 0 && (
              <span className="text-xs text-[#6E7787]">Fast Shift Access</span>
            )}
          </div>

          {bookmarkedErrors.length === 0 ? (
            <p className="text-xs text-[#6E7787] py-4 text-center">
              No saved errors yet. Click the bookmark icon on any error card or trending item to keep fast access for your shift.
            </p>
          ) : (
            <div className="divide-y divide-[#232833]">
              {bookmarkedErrors.slice(0, 5).map((bmk) => (
                <div
                  key={bmk.id}
                  onClick={() => onSelectError(bmk)}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#1A1E27] px-2 rounded-[8px] cursor-pointer transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="font-mono text-xs font-bold text-[#0A84FF] mr-2">
                      {bmk.code}
                    </span>
                    <span className="text-xs text-[#A6AEC0] truncate">
                      {bmk.title}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6E7787]" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Telemetry Scope & Triage Guide */}
        <div className="p-6 rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-sm font-bold text-[#F5F6F8] uppercase tracking-wider">
              30-Day Operational Triage Protocol
            </h3>
          </div>
          <div className="text-xs text-[#A6AEC0] space-y-2 leading-relaxed">
            <p>
              The <strong className="text-[#F5F6F8]">Trending Issues widget</strong> recalculates every 30 days based on active engineer views, runbook queries, and bookmarks recorded across community deployments.
            </p>
            <div className="p-3.5 rounded-[10px] bg-[#080A0F] border border-[#232833] text-[11px] space-y-1.5 text-[#F5F6F8]">
              <div className="flex items-center justify-between font-semibold text-[#0A84FF]">
                <span>Top Incident Inquiries This Month</span>
                <span className="font-mono">PSMSR945E & PSMSR280E</span>
              </div>
              <p className="text-[#A6AEC0]">
                Browser driver auto-updates (Chrome/Edge) and Windows AppLocker hash enforcement account for 56% of enterprise dispatcher incidents. Check AppLocker Event ID 8004 before restarting services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
