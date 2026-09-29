import React from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  MoreHorizontal,
} from 'lucide-react';
import { ErrorEntry } from '../types';

interface BankDashOverviewProps {
  errors: ErrorEntry[];
  onSelectError: (error: ErrorEntry) => void;
  onOpenWizard: () => void;
}

export const BankDashOverview: React.FC<BankDashOverviewProps> = ({
  errors,
  onSelectError,
  onOpenWizard,
}) => {
  // Extract critical & recent errors
  const criticalErrors = errors.filter((e) => e.severity === 'Critical' || e.severity === 'High').slice(0, 3);

  return (
    <div className="space-y-8">
      {/* TOP ROW: My Cards & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Cards Container (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-18px sm:text-xl font-extrabold text-[#343C6A] dark:text-white">
              Active PAM Vault Instances & Nodes
            </h2>
            <button className="text-xs font-bold text-[#343C6A] dark:text-[#A0AEC0] hover:text-[#396AFF] transition-colors">
              See All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* CARD 1: Electric Blue Gradient Credit Card */}
            <div className="bg-gradient-to-br from-[#4C49ED] via-[#396AFF] to-[#6157FF] text-white p-6 rounded-[25px] shadow-xl shadow-[#396AFF]/20 relative overflow-hidden flex flex-col justify-between h-56 transition-transform hover:scale-[1.02] duration-200">
              {/* Card Top */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/80 block font-medium">
                    Vault Uptime / Balance
                  </span>
                  <span className="text-2xl font-black tracking-tight">$5,756.00</span>
                </div>
                {/* Microchip Graphic */}
                <div className="w-9 h-8 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                  <div className="w-5 h-4 border border-white/50 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-white/60 rounded-xs" />
                    <div className="bg-white/60 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Card Middle */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-white/70 block">Card Holder / Owner</span>
                  <span className="font-bold text-sm">Alexander Ward</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-white/70 block">Valid Thru</span>
                  <span className="font-bold text-sm">12/28</span>
                </div>
              </div>

              {/* Card Bottom */}
              <div className="flex items-center justify-between border-t border-white/20 pt-4">
                <span className="font-mono font-extrabold text-base tracking-widest">
                  3778 •••• •••• 1234
                </span>
                {/* Mastercard Circles Emblem */}
                <div className="flex items-center -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-white/40" />
                  <div className="w-6 h-6 rounded-full bg-white/60" />
                </div>
              </div>
            </div>

            {/* CARD 2: Crisp Light White Credit Card */}
            <div className="bg-white dark:bg-[#1E2332] border border-[#DFEAF2] dark:border-white/10 p-6 rounded-[25px] shadow-sm text-[#343C6A] dark:text-white flex flex-col justify-between h-56 transition-transform hover:scale-[1.02] duration-200">
              {/* Card Top */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#718EBF] dark:text-[#A0AEC0] block font-medium">
                    PVWA Cluster Health
                  </span>
                  <span className="text-2xl font-black tracking-tight text-[#343C6A] dark:text-white">
                    $5,756.00
                  </span>
                </div>
                {/* Microchip Graphic */}
                <div className="w-9 h-8 rounded-lg bg-[#F4F5F9] dark:bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#343C6A] dark:text-white" />
                </div>
              </div>

              {/* Card Middle */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#718EBF] dark:text-[#A0AEC0] block">
                    Card Holder / Owner
                  </span>
                  <span className="font-bold text-sm text-[#343C6A] dark:text-white">Marcus Vance</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#718EBF] dark:text-[#A0AEC0] block">
                    Valid Thru
                  </span>
                  <span className="font-bold text-sm text-[#343C6A] dark:text-white">08/29</span>
                </div>
              </div>

              {/* Card Bottom */}
              <div className="flex items-center justify-between border-t border-[#DFEAF2] dark:border-white/10 pt-4">
                <span className="font-mono font-extrabold text-base tracking-widest text-[#343C6A] dark:text-white">
                  3778 •••• •••• 5678
                </span>
                <div className="flex items-center -space-x-2 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-[#9199B5]" />
                  <div className="w-6 h-6 rounded-full bg-[#718EBF]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions / PAM Incidents Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-18px sm:text-xl font-extrabold text-[#343C6A] dark:text-white">
              Recent Transactions & Incidents
            </h2>
          </div>

          <div className="bg-white dark:bg-[#1E2332] border border-[#DFEAF2] dark:border-white/10 rounded-[25px] p-6 shadow-sm space-y-4 h-56 flex flex-col justify-around">
            {criticalErrors.map((err, idx) => {
              const bgColors = ['bg-[#FFF5D9] text-[#FFBB38]', 'bg-[#E7EDFF] text-[#396AFF]', 'bg-[#DCFAF8] text-[#16DBCC]'];
              return (
                <div
                  key={err.id}
                  onClick={() => onSelectError(err)}
                  className="flex items-center justify-between cursor-pointer group hover:bg-[#F4F5F9] dark:hover:bg-white/5 p-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${bgColors[idx % 3]} flex items-center justify-center shrink-0`}>
                      {idx === 0 ? <AlertTriangle className="w-5 h-5" /> : idx === 1 ? <Zap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#23235F] dark:text-white group-hover:text-[#396AFF] transition-colors truncate max-w-[140px]">
                        {err.code}
                      </h4>
                      <p className="text-[11px] text-[#718EBF] dark:text-[#A0AEC0] truncate max-w-[140px]">
                        {err.title}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${err.severity === 'Critical' ? 'text-[#FF4B4B]' : 'text-[#16DBCC]'}`}>
                    {err.severity === 'Critical' ? '-$850' : '+$2,500'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Weekly Activity Chart & Expense Statistics Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Error Activity Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-18px sm:text-xl font-extrabold text-[#343C6A] dark:text-white">
              Weekly Activity (Reported vs Resolved)
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-[#718EBF]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#396AFF]" />
                <span>Reported</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#16DBCC]" />
                <span>Resolved</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E2332] border border-[#DFEAF2] dark:border-white/10 rounded-[25px] p-6 shadow-sm h-72 flex items-end justify-between gap-4 pt-10">
            {/* Simulated Dual Bar Columns for Sat through Fri */}
            {[
              { day: 'Sat', blue: 70, teal: 40 },
              { day: 'Sun', blue: 40, teal: 30 },
              { day: 'Mon', blue: 85, teal: 65 },
              { day: 'Tue', blue: 95, teal: 80 },
              { day: 'Wed', blue: 50, teal: 45 },
              { day: 'Thu', blue: 90, teal: 75 },
              { day: 'Fri', blue: 75, teal: 88 },
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-[36px] flex items-end justify-center gap-1.5 h-full">
                  <div
                    style={{ height: `${col.blue}%` }}
                    className="w-3 bg-[#396AFF] rounded-full transition-all duration-500 hover:opacity-80"
                  />
                  <div
                    style={{ height: `${col.teal}%` }}
                    className="w-3 bg-[#16DBCC] rounded-full transition-all duration-500 hover:opacity-80"
                  />
                </div>
                <span className="text-xs font-semibold text-[#718EBF] dark:text-[#A0AEC0]">{col.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense / Severity Breakdown Donut Chart */}
        <div className="space-y-4">
          <h2 className="text-18px sm:text-xl font-extrabold text-[#343C6A] dark:text-white">
            Component Severity Breakdown
          </h2>

          <div className="bg-white dark:bg-[#1E2332] border border-[#DFEAF2] dark:border-white/10 rounded-[25px] p-6 shadow-sm h-72 flex flex-col items-center justify-center relative">
            {/* Simulated Donut Slices */}
            <div className="w-44 h-44 rounded-full border-[18px] border-[#343C6A] border-t-[#396AFF] border-r-[#FF82AC] border-b-[#16DBCC] flex items-center justify-center relative shadow-inner">
              <div className="text-center">
                <span className="text-2xl font-black text-[#343C6A] dark:text-white block">30%</span>
                <span className="text-[10px] font-bold uppercase text-[#718EBF] dark:text-[#A0AEC0]">
                  Critical
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-[11px] font-bold text-[#718EBF] dark:text-[#A0AEC0]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#396AFF]" />
                <span>30% Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF82AC]" />
                <span>20% High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16DBCC]" />
                <span>50% Medium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
