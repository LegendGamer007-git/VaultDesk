import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Eye,
  Bookmark,
  BookmarkCheck,
  Flame,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  BarChart3,
  Search,
  Filter,
  Layers,
  Activity,
  Calendar,
} from 'lucide-react';
import { ErrorEntry, PamComponent } from '../types';

export type TrendingMetric = 'combined' | 'views' | 'bookmarks';

interface TrendingIssuesWidgetProps {
  errors: ErrorEntry[];
  bookmarkedIds: Set<string>;
  onSelectError: (error: ErrorEntry) => void;
  onToggleBookmark: (error: ErrorEntry) => void;
  onQuickSearch?: (code: string) => void;
}

export const TrendingIssuesWidget: React.FC<TrendingIssuesWidgetProps> = ({
  errors,
  bookmarkedIds,
  onSelectError,
  onToggleBookmark,
  onQuickSearch,
}) => {
  const [metric, setMetric] = useState<TrendingMetric>('combined');
  const [timeframe, setTimeframe] = useState<'30d' | '60d'>('30d');
  const [componentFilter, setComponentFilter] = useState<PamComponent | 'All'>('All');

  // Helper to compute engagement score based on selected timeframe (30d vs 60d)
  const getScore = (err: ErrorEntry, selectedMetric: TrendingMetric, tf: '30d' | '60d'): number => {
    const views =
      tf === '60d'
        ? err.views60d || Math.round((err.views30d || 0) * 1.85 + (err.helpfulCount || 10) * 3)
        : err.views30d || 0;
    const bookmarks =
      tf === '60d'
        ? err.bookmarks60d || Math.round((err.bookmarks30d || 0) * 1.75 + 5)
        : err.bookmarks30d || 0;

    switch (selectedMetric) {
      case 'views':
        return views;
      case 'bookmarks':
        return bookmarks;
      case 'combined':
      default:
        return views + bookmarks * 8;
    }
  };

  // Filter by component if selected
  const eligibleErrors = useMemo(() => {
    if (componentFilter === 'All') return errors;
    return errors.filter(
      (e) => e.component.toLowerCase() === componentFilter.toLowerCase()
    );
  }, [errors, componentFilter]);

  // Calculate top 5 most viewed or bookmarked error codes over 30 or 60 days
  const top5Errors = useMemo(() => {
    return [...eligibleErrors]
      .sort((a, b) => getScore(b, metric, timeframe) - getScore(a, metric, timeframe))
      .slice(0, 5);
  }, [eligibleErrors, metric, timeframe]);

  // Maximum score among the top 5 for visual relative bar calculation
  const maxScore = useMemo(() => {
    if (top5Errors.length === 0) return 1;
    return Math.max(1, getScore(top5Errors[0], metric, timeframe));
  }, [top5Errors, metric, timeframe]);

  // Total telemetry aggregates across selected window
  const totalViews = useMemo(() => {
    return errors.reduce((acc, curr) => {
      const v =
        timeframe === '60d'
          ? curr.views60d || Math.round((curr.views30d || 0) * 1.85 + (curr.helpfulCount || 10) * 3)
          : curr.views30d || 0;
      return acc + v;
    }, 0);
  }, [errors, timeframe]);

  const totalBookmarks = useMemo(() => {
    return errors.reduce((acc, curr) => {
      const b =
        timeframe === '60d'
          ? curr.bookmarks60d || Math.round((curr.bookmarks30d || 0) * 1.75 + 5)
          : curr.bookmarks30d || 0;
      return acc + b;
    }, 0);
  }, [errors, timeframe]);

  // Determine which component has the most trending volume
  const topComponent = useMemo(() => {
    const counts: Record<string, number> = {};
    errors.forEach((e) => {
      const v = getScore(e, 'combined', timeframe);
      counts[e.component] = (counts[e.component] || 0) + v;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'Privilege Cloud';
  }, [errors, timeframe]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          label: '#1',
          bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/20',
          ring: 'ring-1 ring-amber-400/50',
          icon: <Flame className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />,
        };
      case 1:
        return {
          label: '#2',
          bg: 'bg-gradient-to-r from-slate-200 to-cyan-200 text-slate-950 font-extrabold',
          ring: 'ring-1 ring-cyan-400/40',
          icon: <TrendingUp className="w-3.5 h-3.5 text-slate-950" />,
        };
      case 2:
        return {
          label: '#3',
          bg: 'bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 font-bold',
          ring: 'ring-1 ring-amber-600/40',
          icon: <Activity className="w-3.5 h-3.5 text-amber-100" />,
        };
      case 3:
        return {
          label: '#4',
          bg: 'bg-slate-800 text-slate-300 font-semibold',
          ring: 'ring-1 ring-slate-700',
          icon: null,
        };
      case 4:
      default:
        return {
          label: '#5',
          bg: 'bg-slate-800/80 text-slate-400 font-semibold',
          ring: 'ring-1 ring-slate-700/80',
          icon: null,
        };
    }
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
    <div
      id="widget-trending-issues"
      className="rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      {/* Widget Header & Metrics Segmented Control */}
      <div className="p-5 sm:p-6 border-b border-[#232833] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2A1F0C] text-[#FF9F0A] border border-[#FF9F0A]/30">
              <Flame className="w-3.5 h-3.5 text-[#FF9F0A] fill-[#FF9F0A]" />
              <span>{timeframe === '30d' ? '30-Day' : '60-Day'} Operational Velocity</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A6AEC0] px-2 py-0.5 rounded-[6px] bg-[#1A1E27] border border-[#2E3440]">
              <Calendar className="w-3 h-3 text-[#6E7787]" />
              Rolling {timeframe === '30d' ? '30' : '60'} Days
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#F5F6F8] tracking-tight flex items-center gap-2">
            <span>Trending Issues</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-[#1A1E27] text-[#64D2FF] border border-[#2E3440]">
              Top 5 Leaderboard
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#A6AEC0] mt-1 max-w-xl">
            Calculated ranking of the top 5 PAM error codes by user views and operational runbook bookmarks over the past {timeframe === '30d' ? '30' : '60'} days.
          </p>
        </div>

        {/* Calculation Mode Selector & Component Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Selector: 30 Days vs 60 Days */}
          <div className="inline-flex p-1 rounded-[10px] bg-[#1A1E27] border border-[#2E3440]">
            <button
              id="btn-timeframe-30d"
              onClick={() => setTimeframe('30d')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                timeframe === '30d'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="View 30-day trending window"
            >
              <span>30 Days</span>
            </button>
            <button
              id="btn-timeframe-60d"
              onClick={() => setTimeframe('60d')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                timeframe === '60d'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="View 60-day trending window"
            >
              <span>60 Days</span>
            </button>
          </div>

          {/* Segmented Metric Control */}
          <div className="inline-flex p-1 rounded-[10px] bg-[#1A1E27] border border-[#2E3440]">
            <button
              id="btn-metric-combined"
              onClick={() => setMetric('combined')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                metric === 'combined'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Combined formula: views + bookmarks weighted 8x"
            >
              <Sparkles className="w-3 h-3" />
              <span>Combined Trending</span>
            </button>

            <button
              id="btn-metric-views"
              onClick={() => setMetric('views')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                metric === 'views'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Rank strictly by most viewed"
            >
              <Eye className="w-3 h-3" />
              <span>Most Viewed</span>
            </button>

            <button
              id="btn-metric-bookmarks"
              onClick={() => setMetric('bookmarks')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                metric === 'bookmarks'
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
              }`}
              title="Rank strictly by most bookmarked"
            >
              <Bookmark className="w-3 h-3" />
              <span>Most Bookmarked</span>
            </button>
          </div>

          {/* Component Quick Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6E7787] hidden sm:inline">Component:</span>
            <select
              id="select-trending-component"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value as PamComponent | 'All')}
              className="px-2.5 py-1.5 rounded-[8px] bg-[#1A1E27] border border-[#2E3440] text-xs font-semibold text-[#F5F6F8] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25 cursor-pointer"
            >
              <option value="All">All Components</option>
              <option value="Privilege Cloud">Privilege Cloud</option>
              <option value="Vault">Vault</option>
              <option value="PSM">PSM</option>
              <option value="CPM">CPM</option>
              <option value="PVWA">PVWA</option>
              <option value="CCP">CCP</option>
              <option value="PTA">PTA</option>
              <option value="Conjur">Conjur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 5 Ranked List */}
      <div className="divide-y divide-slate-800/70">
        {top5Errors.map((err, index) => {
          const rank = getRankBadge(index);
          const isBmk = bookmarkedIds.has(err.id);
          const score = getScore(err, metric, timeframe);
          const relativePercent = Math.min(100, Math.round((score / maxScore) * 100));

          return (
            <div
              key={err.id}
              id={`trending-item-${index + 1}-${err.code.toLowerCase()}`}
              className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors group cursor-pointer"
              onClick={() => onSelectError(err)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Rank, Code, Badges, Title */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs ${rank.bg} ${rank.ring}`}
                    title={`Rank #${index + 1} over the last 30 days`}
                  >
                    {rank.icon ? (
                      <div className="flex flex-col items-center leading-none">
                        {rank.icon}
                        <span className="text-[10px] mt-0.5">{rank.label}</span>
                      </div>
                    ) : (
                      <span>{rank.label}</span>
                    )}
                  </div>

                  {/* Error Information */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#0A84FF] bg-[#1A1E27] px-2 py-0.5 rounded-[6px] border border-[#2E3440]">
                        {err.code}
                      </span>
                      <span className={getSeverityBadge(err.severity)}>
                        {err.severity}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-[6px] font-medium bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]">
                        {err.component}
                      </span>

                      {/* Trend Velocity badge */}
                      {err.trendVelocity && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-[6px] ${
                            err.trendDirection === 'up'
                              ? 'bg-[#12241A] text-[#30D158] border border-[#30D158]/30'
                              : err.trendDirection === 'down'
                              ? 'bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30'
                              : 'bg-[#1A1E27] text-[#A6AEC0] border border-[#2E3440]'
                          }`}
                          title="Rate of change in views/inquiries over the last 30 days"
                        >
                          {err.trendDirection === 'up' ? (
                            <ArrowUpRight className="w-3 h-3 text-[#30D158]" />
                          ) : err.trendDirection === 'down' ? (
                            <ArrowDownRight className="w-3 h-3 text-[#FF453A]" />
                          ) : (
                            <Minus className="w-3 h-3 text-[#6E7787]" />
                          )}
                          <span>{err.trendVelocity}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#F5F6F8] group-hover:text-[#0A84FF] transition-colors truncate">
                      {err.title}
                    </h3>
                    <p className="text-xs text-[#A6AEC0] line-clamp-1">
                      {err.description}
                    </p>
                  </div>
                </div>

                {/* Right: Metrics, Activity Sparkline, & Actions */}
                <div
                  className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#232833]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 30-Day Activity Sparkline & Percentage Bar */}
                  <div className="w-36 hidden sm:flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] text-[#A6AEC0]">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#0A84FF]" />
                        Relative 30d
                      </span>
                      <span className="font-mono text-[#0A84FF] font-semibold">{relativePercent}%</span>
                    </div>

                    {/* Relative Bar */}
                    <div className="h-1.5 w-full bg-[#080A0F] rounded-full overflow-hidden border border-[#232833]">
                      <div
                        className="h-full bg-[#0A84FF] rounded-full transition-all duration-500"
                        style={{ width: `${relativePercent}%` }}
                      />
                    </div>

                    {/* Weekly mini spark bars */}
                    {err.weeklyActivity && (
                      <div className="flex items-end justify-between gap-1 h-3 pt-0.5">
                        {err.weeklyActivity.map((val, i) => {
                          const maxWk = Math.max(...(err.weeklyActivity || [1]));
                          const barH = Math.max(20, Math.round((val / maxWk) * 100));
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-[#232833] hover:bg-[#0A84FF] rounded-[2px] transition-colors"
                              style={{ height: `${barH}%` }}
                              title={`Week ${i + 1}: ${val} inquiries`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 30-Day Metrics Badges */}
                  <div className="flex items-center gap-3 text-xs">
                    {/* Views Count */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#1A1E27] border border-[#2E3440]"
                      title="Total views over the last 30 days"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#64D2FF]" />
                      <div>
                        <span className="font-mono font-bold text-[#F5F6F8]">
                          {(err.views30d || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#6E7787] ml-1">views</span>
                      </div>
                    </div>

                    {/* Bookmarks Count */}
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#1A1E27] border border-[#2E3440]"
                      title="Total operational saves over the last 30 days"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#FF9F0A]" />
                      <div>
                        <span className="font-mono font-bold text-[#F5F6F8]">
                          {(err.bookmarks30d || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#6E7787] ml-1">saves</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick Search Filter Button */}
                    {onQuickSearch && (
                      <button
                        id={`btn-search-trending-${err.code.toLowerCase()}`}
                        onClick={() => onQuickSearch(err.code)}
                        className="p-2 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#A6AEC0] hover:text-[#F5F6F8] border border-[#2E3440] transition-colors"
                        title={`Filter catalog search for ${err.code}`}
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Bookmark Toggle Button */}
                    <button
                      id={`btn-bmk-trending-${err.code.toLowerCase()}`}
                      onClick={() => onToggleBookmark(err)}
                      className={`p-2 rounded-[8px] transition-colors border ${
                        isBmk
                          ? 'bg-[#12241A] text-[#30D158] border-[#30D158]/40'
                          : 'bg-[#1A1E27] text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#232833] border-[#2E3440]'
                      }`}
                      title={isBmk ? 'Remove bookmark' : 'Bookmark error'}
                    >
                      {isBmk ? (
                        <BookmarkCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* View Runbook Primary Action */}
                    <button
                      id={`btn-view-trending-${err.code.toLowerCase()}`}
                      onClick={() => onSelectError(err)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#0A84FF] text-[#0A84FF] hover:text-white font-semibold text-xs border border-[#2E3440] transition-colors"
                    >
                      <span>Runbook</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget Footer: 30/60-Day Aggregates & Operational Insight */}
      <div className="p-4 bg-[#0B0E14] border-t border-[#232833] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#A6AEC0]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#0A84FF]" />
            <span>
              <strong className="text-[#F5F6F8] font-mono">
                {totalViews.toLocaleString()}
              </strong>{' '}
              total {timeframe === '30d' ? '30-day' : '60-day'} views
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-[#FF9F0A]" />
            <span>
              <strong className="text-[#F5F6F8] font-mono">
                {totalBookmarks.toLocaleString()}
              </strong>{' '}
              total {timeframe === '30d' ? '30-day' : '60-day'} bookmarks
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#64D2FF]" />
            <span>
              Peak component volume:{' '}
              <strong className="text-[#F5F6F8] font-semibold">{topComponent}</strong>
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#6E7787]">
          Auto-updated on user views and community saves
        </div>
      </div>
    </div>
  );
};
