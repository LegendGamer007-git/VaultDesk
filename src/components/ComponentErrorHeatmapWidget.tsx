import React, { useState, useMemo } from 'react';
import {
  Flame,
  Activity,
  Layers,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Filter,
  Info,
  Clock,
  ExternalLink,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ErrorEntry, PamComponent, SeverityLevel } from '../types';
import { COMPONENT_SYMPTOM_PROFILES } from '../data/symptomAreas';

interface ComponentErrorHeatmapWidgetProps {
  errors: ErrorEntry[];
  selectedComponent: PamComponent | 'All';
  onSelectComponent: (component: PamComponent | 'All') => void;
  onSelectError?: (error: ErrorEntry) => void;
  onQuickSearch?: (code: string) => void;
}

export type HeatmapViewMode = 'timeline' | 'severity' | 'tiles';
export type HeatmapMetricFilter = 'all' | 'critical_high';

interface ComponentHeatData {
  component: PamComponent;
  totalVolume: number;
  totalErrorsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  criticalHighVolume: number;
  weeks: {
    weekIndex: number;
    weekLabel: string;
    volume: number;
    intensity: number; // 0 to 1
  }[];
  topErrorCode: string;
  topErrorTitle: string;
  trendVelocity: string;
  trendDirection: 'up' | 'down' | 'steady';
  percentageOfTotal: number;
  intensity: number; // 0 to 1 relative to highest volume component
  rank: number;
}

const ALL_PAM_COMPONENTS: PamComponent[] = [
  'PSM',
  'Privilege Cloud',
  'CPM',
  'Vault',
  'PVWA',
  'PTA',
  'CCP',
  'Conjur',
];

export const ComponentErrorHeatmapWidget: React.FC<ComponentErrorHeatmapWidgetProps> = ({
  errors,
  selectedComponent,
  onSelectComponent,
  onSelectError,
  onQuickSearch,
}) => {
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('timeline');
  const [metricFilter, setMetricFilter] = useState<HeatmapMetricFilter>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    component: PamComponent;
    slotLabel: string;
    volume: number;
    topCode?: string;
    description?: string;
  } | null>(null);

  // Compute 30-day telemetry aggregates per PAM component
  const componentsData = useMemo<ComponentHeatData[]>(() => {
    // 1. Group error entries by component
    const groupMap = new Map<PamComponent, ErrorEntry[]>();
    ALL_PAM_COMPONENTS.forEach((c) => groupMap.set(c, []));

    errors.forEach((err) => {
      const comp = err.component;
      if (groupMap.has(comp)) {
        groupMap.get(comp)!.push(err);
      } else {
        // Fallback for any unexpected component name
        groupMap.set(comp, [err]);
      }
    });

    // 2. Aggregate metrics for each component over the 30-day window
    const rawList = ALL_PAM_COMPONENTS.map((comp) => {
      const compErrors = groupMap.get(comp) || [];

      let totalVolume = 0;
      let criticalHighVolume = 0;
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      // Weekly activity accumulator [W1, W2, W3, W4]
      const weeklyTotals = [0, 0, 0, 0];

      let maxErrorViews = -1;
      let topErrorCode = `${comp.slice(0, 3).toUpperCase()}101E`;
      let topErrorTitle = `${comp} operational error`;
      let trendVelocity = '+14%';
      let trendDirection: 'up' | 'down' | 'steady' = 'up';

      for (const err of compErrors) {
        const v30 = err.views30d || (err.helpfulCount || 10) * 15;
        totalVolume += v30;

        if (err.severity === 'Critical') {
          criticalCount++;
          criticalHighVolume += v30;
        } else if (err.severity === 'High') {
          highCount++;
          criticalHighVolume += v30;
        } else if (err.severity === 'Medium') {
          mediumCount++;
        } else {
          lowCount++;
        }

        // Weekly activity calculation
        if (err.weeklyActivity && err.weeklyActivity.length >= 4) {
          err.weeklyActivity.slice(0, 4).forEach((val, idx) => {
            weeklyTotals[idx] += val;
          });
        } else {
          // Distribute proportionally across 4 weeks with a slight upward drift
          const quarter = Math.round(v30 / 4);
          weeklyTotals[0] += Math.round(quarter * 0.85);
          weeklyTotals[1] += Math.round(quarter * 0.95);
          weeklyTotals[2] += Math.round(quarter * 1.05);
          weeklyTotals[3] += Math.round(quarter * 1.15);
        }

        if (v30 > maxErrorViews) {
          maxErrorViews = v30;
          topErrorCode = err.code;
          topErrorTitle = err.title;
          if (err.trendVelocity) trendVelocity = err.trendVelocity;
          if (err.trendDirection) trendDirection = err.trendDirection;
        }
      }

      // Default baseline values if component has minimal curated runbooks
      if (totalVolume === 0) {
        totalVolume = 320;
        weeklyTotals[0] = 70;
        weeklyTotals[1] = 80;
        weeklyTotals[2] = 85;
        weeklyTotals[3] = 85;
      }

      const activeVolume =
        metricFilter === 'critical_high' ? criticalHighVolume || Math.round(totalVolume * 0.65) : totalVolume;

      const weeks = [
        {
          weekIndex: 0,
          weekLabel: 'Week 1 (Days 1–7)',
          volume: weeklyTotals[0],
          intensity: 0,
        },
        {
          weekIndex: 1,
          weekLabel: 'Week 2 (Days 8–14)',
          volume: weeklyTotals[1],
          intensity: 0,
        },
        {
          weekIndex: 2,
          weekLabel: 'Week 3 (Days 15–21)',
          volume: weeklyTotals[2],
          intensity: 0,
        },
        {
          weekIndex: 3,
          weekLabel: 'Week 4 (Days 22–30)',
          volume: weeklyTotals[3],
          intensity: 0,
        },
      ];

      return {
        component: comp,
        totalVolume: activeVolume,
        totalErrorsCount: compErrors.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        criticalHighVolume,
        weeks,
        topErrorCode,
        topErrorTitle,
        trendVelocity,
        trendDirection,
        percentageOfTotal: 0,
        intensity: 0,
        rank: 0,
      };
    });

    // 3. Calculate fleet total and max volume for relative normalization
    const fleetTotal = rawList.reduce((acc, c) => acc + c.totalVolume, 0);
    const maxVolume = Math.max(1, ...rawList.map((c) => c.totalVolume));

    // Find max weekly cell volume for weekly cell heat intensity calculation
    let maxWeekVolume = 1;
    rawList.forEach((c) => {
      c.weeks.forEach((w) => {
        if (w.volume > maxWeekVolume) maxWeekVolume = w.volume;
      });
    });

    // 4. Sort descending by 30-day reported volume (Highest volume PAM component at top!)
    const sorted = rawList.sort((a, b) => b.totalVolume - a.totalVolume);

    return sorted.map((item, index) => {
      const intensity = Math.min(1, item.totalVolume / maxVolume);
      const percentageOfTotal =
        fleetTotal > 0 ? Math.round((item.totalVolume / fleetTotal) * 100) : 0;

      const normalizedWeeks = item.weeks.map((w) => ({
        ...w,
        intensity: Math.min(1, Math.max(0.08, w.volume / maxWeekVolume)),
      }));

      return {
        ...item,
        rank: index + 1,
        intensity,
        percentageOfTotal,
        weeks: normalizedWeeks,
      };
    });
  }, [errors, metricFilter]);

  // Overall fleet stats
  const totalFleetErrors = useMemo(() => {
    return componentsData.reduce((acc, c) => acc + c.totalVolume, 0);
  }, [componentsData]);

  // Highest volume component over the last 30 days
  const highestVolumeComponent = useMemo(() => {
    return componentsData[0] || null;
  }, [componentsData]);

  // Component with fastest weekly rising trend
  const fastestRisingComponent = useMemo(() => {
    const list = [...componentsData].sort((a, b) => {
      const numA = parseInt(a.trendVelocity.replace(/[^0-9-]/g, '') || '0', 10);
      const numB = parseInt(b.trendVelocity.replace(/[^0-9-]/g, '') || '0', 10);
      return numB - numA;
    });
    return list[0] || componentsData[0];
  }, [componentsData]);

  // Heat color helper based on intensity (0.0 to 1.0) using VaultDesk sequential-heat: ["#12151C", "#1E3A5F", "#0A84FF", "#64D2FF"]
  const getHeatColor = (intensity: number, isHighVolumeAlert = false) => {
    if (intensity >= 0.85 || isHighVolumeAlert) {
      return {
        bg: 'bg-[#64D2FF] hover:bg-[#64D2FF]/90',
        text: 'text-[#0B0E14]',
        border: 'border-[#64D2FF]',
        glow: 'shadow-sm shadow-[#0A84FF]/30',
        label: 'Peak Volume Spike',
        badge: 'bg-[#101E26] text-[#64D2FF] border border-[#64D2FF]/40',
        hex: '#64D2FF',
      };
    }
    if (intensity >= 0.65) {
      return {
        bg: 'bg-[#0A84FF] hover:bg-[#3B9EFF]',
        text: 'text-white',
        border: 'border-[#0A84FF]',
        glow: 'shadow-sm shadow-[#0A84FF]/20',
        label: 'High Error Volume',
        badge: 'bg-[#12151C] text-[#0A84FF] border border-[#0A84FF]/40',
        hex: '#0A84FF',
      };
    }
    if (intensity >= 0.4) {
      return {
        bg: 'bg-[#1E3A5F] hover:bg-[#254673]',
        text: 'text-[#64D2FF]',
        border: 'border-[#1E3A5F]',
        glow: '',
        label: 'Moderate Volume',
        badge: 'bg-[#1A1E27] text-[#64D2FF] border border-[#1E3A5F]',
        hex: '#1E3A5F',
      };
    }
    if (intensity >= 0.2) {
      return {
        bg: 'bg-[#12151C] hover:bg-[#1A1E27]',
        text: 'text-[#A6AEC0]',
        border: 'border-[#232833]',
        glow: '',
        label: 'Low / Managed Volume',
        badge: 'bg-[#12151C] text-[#A6AEC0] border border-[#232833]',
        hex: '#12151C',
      };
    }
    return {
      bg: 'bg-[#0B0E14] hover:bg-[#12151C]',
      text: 'text-[#6E7787]',
      border: 'border-[#232833]',
      glow: '',
      label: 'Minimal Activity',
      badge: 'bg-[#0B0E14] text-[#6E7787] border border-[#232833]',
      hex: '#0B0E14',
    };
  };

  const handleComponentClick = (comp: PamComponent) => {
    onSelectComponent(selectedComponent === comp ? 'All' : comp);
    // Smooth scroll down to runbooks list
    const el = document.getElementById('tab-all-results');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div
      id="widget-component-error-heatmap"
      className="relative rounded-[14px] bg-[#12151C] border border-[#232833] shadow-[0_1px_2px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#0A84FF] via-[#64D2FF] to-[#30D158]" />

      {/* Main Header & Control Row */}
      <div className="p-5 sm:p-6 border-b border-[#232833]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/40">
                <Flame className="w-3.5 h-3.5 text-[#FF453A] fill-[#FF453A]" />
                <span>PAM Component Error Volume Heatmap</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A6AEC0] px-2.5 py-1 rounded-[6px] bg-[#1A1E27] border border-[#2E3440]">
                <Clock className="w-3 h-3 text-[#0A84FF]" />
                <span>Last 30 Days Rolling Telemetry</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F6F8] tracking-tight flex items-center gap-2">
              <span>Incident Heatmap: Top PAM Error Generators</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A6AEC0] max-w-2xl leading-relaxed">
              Real-time heat distribution highlighting PAM components reporting the highest volume of operational incidents, credential failures, and dispatcher aborts over the last 30 days.
            </p>
          </div>

          {/* Controls: View Modes & Metric Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Filter */}
            <div className="inline-flex p-1 rounded-[10px] bg-[#1A1E27] border border-[#2E3440]">
              <button
                id="btn-heatmap-metric-all"
                onClick={() => setMetricFilter('all')}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  metricFilter === 'all'
                    ? 'bg-[#0A84FF] text-white shadow-sm'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
              >
                All Errors
              </button>
              <button
                id="btn-heatmap-metric-critical"
                onClick={() => setMetricFilter('critical_high')}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  metricFilter === 'critical_high'
                    ? 'bg-[#0A84FF] text-white shadow-sm'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
              >
                Critical & High Only
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex p-1 rounded-[10px] bg-[#1A1E27] border border-[#2E3440]">
              <button
                id="btn-heatmap-view-timeline"
                onClick={() => setViewMode('timeline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-[#232833] text-[#F5F6F8] border border-[#3D4454]'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
                title="30-day weekly heat timeline breakdown"
              >
                <Calendar className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>30D Timeline</span>
              </button>
              <button
                id="btn-heatmap-view-severity"
                onClick={() => setViewMode('severity')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  viewMode === 'severity'
                    ? 'bg-[#232833] text-[#F5F6F8] border border-[#3D4454]'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
                title="Severity concentration matrix"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF9F0A]" />
                <span>Severity Heat</span>
              </button>
              <button
                id="btn-heatmap-view-tiles"
                onClick={() => setViewMode('tiles')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                  viewMode === 'tiles'
                    ? 'bg-[#232833] text-[#F5F6F8] border border-[#3D4454]'
                    : 'text-[#A6AEC0] hover:text-[#F5F6F8]'
                }`}
                title="Component volume intensity tiles"
              >
                <Layers className="w-3.5 h-3.5 text-[#30D158]" />
                <span>Ranked Tiles</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Banner: #1 Component with Highest 30-Day Error Volume */}
        {highestVolumeComponent && (
          <div className="mt-5 p-4 rounded-[10px] bg-[#1A1E27] border border-[#2E3440] border-l-[3px] border-l-[#FF453A] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-[8px] bg-[#2A1414] border border-[#FF453A]/40 flex items-center justify-center shrink-0 text-[#FF453A]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider bg-[#2A1414] text-[#FF453A] border border-[#FF453A]/30">
                    Highest 30-Day Volume
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#F5F6F8]">
                    {highestVolumeComponent.component}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px] bg-[#12151C] text-[#FF453A] border border-[#2E3440] font-mono">
                    {highestVolumeComponent.totalVolume.toLocaleString()} errors ({highestVolumeComponent.percentageOfTotal}% of fleet)
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF9F0A]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{highestVolumeComponent.trendVelocity} Spike</span>
                  </span>
                </div>
                <p className="text-xs text-[#A6AEC0]">
                  Primary incident driver:{' '}
                  <strong className="text-[#F5F6F8] font-mono">{highestVolumeComponent.topErrorCode}</strong>
                  {' — '}{highestVolumeComponent.topErrorTitle}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {onQuickSearch && (
                <button
                  onClick={() => onQuickSearch(highestVolumeComponent.topErrorCode)}
                  className="px-3 py-2 rounded-[8px] bg-[#12151C] hover:bg-[#232833] text-[#0A84FF] text-xs font-semibold border border-[#2E3440] transition-colors flex items-center gap-1.5"
                  title={`Search error code ${highestVolumeComponent.topErrorCode}`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Inspect {highestVolumeComponent.topErrorCode}</span>
                </button>
              )}
              <button
                id="btn-focus-highest-component"
                onClick={() => handleComponentClick(highestVolumeComponent.component)}
                className={`px-4 py-2 rounded-[8px] text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedComponent === highestVolumeComponent.component
                    ? 'bg-[#0A84FF] text-white'
                    : 'bg-[#0A84FF] hover:bg-[#3B9EFF] text-white shadow-sm'
                }`}
              >
                <span>
                  {selectedComponent === highestVolumeComponent.component
                    ? `Showing ${highestVolumeComponent.component} Runbooks`
                    : `Filter for ${highestVolumeComponent.component}`}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend & Summary Stats Bar */}
      <div className="px-5 py-3 bg-[#0B0E14] border-b border-[#232833] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Heat Intensity Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[#6E7787] font-semibold text-[11px] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#6E7787]" />
            Sequential Heat (30D Volume):
          </span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center gap-1 text-[#6E7787]">
              <span className="w-3 h-3 rounded-[3px] bg-[#0B0E14] border border-[#232833] inline-block" />
              Minimal
            </span>
            <span className="flex items-center gap-1 text-[#A6AEC0]">
              <span className="w-3 h-3 rounded-[3px] bg-[#12151C] border border-[#232833] inline-block" />
              Low
            </span>
            <span className="flex items-center gap-1 text-[#64D2FF]">
              <span className="w-3 h-3 rounded-[3px] bg-[#1E3A5F] border border-[#1E3A5F] inline-block" />
              Moderate
            </span>
            <span className="flex items-center gap-1 text-[#0A84FF] font-semibold">
              <span className="w-3 h-3 rounded-[3px] bg-[#0A84FF] inline-block" />
              High
            </span>
            <span className="flex items-center gap-1 text-[#64D2FF] font-bold">
              <span className="w-3 h-3 rounded-[3px] bg-[#64D2FF] inline-block" />
              Peak
            </span>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-4 text-[#A6AEC0] text-[11px]">
          <span>
            Total Fleet Inquiries:{' '}
            <strong className="text-[#F5F6F8] font-mono">{totalFleetErrors.toLocaleString()}</strong>
          </span>
          <span>
            Fastest Surge:{' '}
            <strong className="text-[#FF9F0A] font-semibold">
              {fastestRisingComponent.component} ({fastestRisingComponent.trendVelocity})
            </strong>
          </span>
          {selectedComponent !== 'All' && (
            <button
              onClick={() => onSelectComponent('All')}
              className="px-2 py-0.5 rounded-[6px] bg-[#1A1E27] hover:bg-[#232833] text-[#0A84FF] font-medium transition-colors border border-[#2E3440]"
            >
              Reset Filter (Showing {selectedComponent})
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: 30-Day Timeline Matrix Heatmap */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#2E3440] text-[11px] font-semibold text-[#6E7787] uppercase tracking-[0.06em]">
                <th className="pb-3 pr-4 w-48">PAM Component</th>
                <th className="pb-3 px-2 text-center">Week 1 (Days 1–7)</th>
                <th className="pb-3 px-2 text-center">Week 2 (Days 8–14)</th>
                <th className="pb-3 px-2 text-center">Week 3 (Days 15–21)</th>
                <th className="pb-3 px-2 text-center">Week 4 (Days 22–30)</th>
                <th className="pb-3 px-4 text-right">30D Error Volume</th>
                <th className="pb-3 pl-4 w-44">Top Incident Code</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232833] text-xs">
              {componentsData.map((item) => {
                const heat = getHeatColor(item.intensity, item.rank === 1);
                const isSelected = selectedComponent === item.component;

                return (
                  <tr
                    key={item.component}
                    className={`transition-colors group hover:bg-[#1A1E27] ${
                      isSelected ? 'bg-[#1A1E27] ring-1 ring-[#0A84FF]/40' : ''
                    }`}
                  >
                    {/* Component Name & Rank */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            item.rank === 1
                              ? 'bg-[#FF453A] text-white shadow-sm'
                              : item.rank === 2
                              ? 'bg-[#FF9F0A] text-white'
                              : item.rank === 3
                              ? 'bg-[#1E3A5F] text-[#64D2FF]'
                              : 'bg-[#1A1E27] text-[#A6AEC0]'
                          }`}
                        >
                          #{item.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                              {item.component}
                            </span>
                            {item.rank === 1 && (
                              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {item.percentageOfTotal}% of total errors
                          </span>
                          {COMPONENT_SYMPTOM_PROFILES[item.component]?.symptomAreas[0] && (
                            <div
                              className="text-[10px] text-emerald-400/90 truncate max-w-[160px] font-medium"
                              title={`Top Symptom Area: ${COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}`}
                            >
                              Symptom: {COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4 Weekly Heat Cells */}
                    {item.weeks.map((w) => {
                      const cellHeat = getHeatColor(w.intensity, item.rank === 1 && w.weekIndex === 3);

                      return (
                        <td key={w.weekIndex} className="py-3.5 px-2 text-center">
                          <div
                            onMouseEnter={() =>
                              setHoveredCell({
                                component: item.component,
                                slotLabel: w.weekLabel,
                                volume: w.volume,
                                topCode: item.topErrorCode,
                                description: `${w.volume.toLocaleString()} reported incidents (${cellHeat.label})`,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`relative px-3 py-2.5 rounded-lg border text-center transition-all cursor-pointer font-mono font-bold text-xs ${
                              cellHeat.bg
                            } ${cellHeat.text} ${cellHeat.border} ${cellHeat.glow} hover:scale-105`}
                            onClick={() => handleComponentClick(item.component)}
                          >
                            <span>{w.volume.toLocaleString()}</span>
                            <span className="sr-only">{w.weekLabel}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* 30D Total Volume with Visual Heat Intensity Bar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="space-y-1">
                        <div className="font-mono font-black text-sm text-white">
                          {item.totalVolume.toLocaleString()}
                        </div>
                        <div className="w-24 ml-auto h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round(item.intensity * 100)}%`,
                              backgroundColor: heat.hex,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {item.trendVelocity} 30D drift
                        </span>
                      </div>
                    </td>

                    {/* Top Incident Error Code */}
                    <td className="py-3.5 pl-4">
                      {onQuickSearch ? (
                        <button
                          onClick={() => onQuickSearch(item.topErrorCode)}
                          className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300 transition-colors truncate max-w-[130px] text-left block"
                          title={`Search ${item.topErrorCode}: ${item.topErrorTitle}`}
                        >
                          {item.topErrorCode}
                        </button>
                      ) : (
                        <span className="font-mono text-xs text-cyan-400">{item.topErrorCode}</span>
                      )}
                      <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">
                        {item.topErrorTitle}
                      </span>
                    </td>

                    {/* 1-Click Filter Button */}
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleComponentClick(item.component)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Filtered' : 'Filter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Interactive Cell Hover Inspector */}
          {hoveredCell && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-lg text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-white mr-2">
                    {hoveredCell.component} • {hoveredCell.slotLabel}:
                  </span>
                  <span className="text-cyan-300 font-semibold">{hoveredCell.description}</span>
                </div>
              </div>
              <span className="text-slate-400 text-[11px]">
                Click cell to filter dashboard runbooks for {hoveredCell.component}
              </span>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Severity Distribution Heatmap */}
      {viewMode === 'severity' && (
        <div className="p-5 sm:p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4 w-48">PAM Component</th>
                <th className="pb-3 px-3 text-center">Critical Severity</th>
                <th className="pb-3 px-3 text-center">High Severity</th>
                <th className="pb-3 px-3 text-center">Medium Severity</th>
                <th className="pb-3 px-3 text-center">Low Severity</th>
                <th className="pb-3 px-4 text-right">30D Total Volume</th>
                <th className="pb-3 text-right">Runbooks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {componentsData.map((item) => {
                const isSelected = selectedComponent === item.component;

                return (
                  <tr
                    key={item.component}
                    className={`transition-colors group hover:bg-slate-800/40 ${
                      isSelected ? 'bg-slate-800/60 ring-1 ring-cyan-500/40' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-cyan-300">
                          {item.component}
                        </span>
                        {item.rank === 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-700">
                            #1 Volume
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {item.percentageOfTotal}% of total fleet errors
                      </span>
                      {COMPONENT_SYMPTOM_PROFILES[item.component]?.symptomAreas[0] && (
                        <span
                          className="text-[10px] text-emerald-400/90 truncate max-w-[170px] block font-medium mt-0.5"
                          title={`Primary Symptom: ${COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}`}
                        >
                          Symptom: {COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}
                        </span>
                      )}
                    </td>

                    {/* Critical Severity Cell */}
                    <td className="py-3.5 px-3 text-center">
                      <div
                        className={`px-3 py-2 rounded-lg font-mono font-bold border ${
                          item.criticalCount > 0
                            ? 'bg-rose-950/80 text-rose-200 border-rose-700'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        {item.criticalCount} runbook{item.criticalCount !== 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* High Severity Cell */}
                    <td className="py-3.5 px-3 text-center">
                      <div
                        className={`px-3 py-2 rounded-lg font-mono font-bold border ${
                          item.highCount > 0
                            ? 'bg-amber-950/80 text-amber-200 border-amber-700'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        {item.highCount} runbook{item.highCount !== 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Medium Severity Cell */}
                    <td className="py-3.5 px-3 text-center">
                      <div
                        className={`px-3 py-2 rounded-lg font-mono font-bold border ${
                          item.mediumCount > 0
                            ? 'bg-yellow-950/70 text-yellow-200 border-yellow-800'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        {item.mediumCount} runbook{item.mediumCount !== 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Low Severity Cell */}
                    <td className="py-3.5 px-3 text-center">
                      <div
                        className={`px-3 py-2 rounded-lg font-mono font-bold border ${
                          item.lowCount > 0
                            ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                            : 'bg-slate-900/60 text-slate-500 border-slate-800'
                        }`}
                      >
                        {item.lowCount} runbook{item.lowCount !== 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Total 30D Volume */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-black text-sm text-white">
                        {item.totalVolume.toLocaleString()}
                      </span>
                    </td>

                    {/* Filter Button */}
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleComponentClick(item.component)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Filtered' : 'Filter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: Ranked Heat Tiles / Cluster Grid */}
      {viewMode === 'tiles' && (
        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {componentsData.map((item) => {
            const heat = getHeatColor(item.intensity, item.rank === 1);
            const isSelected = selectedComponent === item.component;

            return (
              <div
                key={item.component}
                onClick={() => handleComponentClick(item.component)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between gap-3 ${
                  heat.bg
                } ${heat.border} ${heat.glow} ${
                  isSelected ? 'ring-2 ring-cyan-400' : 'hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        item.rank === 1
                          ? 'bg-rose-600 text-white'
                          : item.rank === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Rank #{item.rank}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {item.percentageOfTotal}% share
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-base group-hover:text-cyan-300">
                      {item.component}
                    </h3>
                    {item.rank === 1 && (
                      <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono font-black text-2xl text-white">
                      {item.totalVolume.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">reported errors</span>
                  </div>

                  {/* Relative Heat Bar */}
                  <div className="mt-2 w-full h-1.5 rounded-full bg-slate-950/80 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(item.intensity * 100)}%`,
                        backgroundColor: heat.hex,
                      }}
                    />
                  </div>
                </div>

                {/* Primary Symptom Area */}
                {COMPONENT_SYMPTOM_PROFILES[item.component]?.symptomAreas[0] && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Symptom Area:</span>
                    <span
                      className="text-[11px] font-semibold text-emerald-400 truncate block"
                      title={COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}
                    >
                      {COMPONENT_SYMPTOM_PROFILES[item.component].symptomAreas[0].name}
                    </span>
                  </div>
                )}

                {/* Footer with Top Code & Filter status */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="text-[10px] text-slate-400 block">Top Error:</span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {item.topErrorCode}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-[11px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Active Filter' : 'Filter'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
