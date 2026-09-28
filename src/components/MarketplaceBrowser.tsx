import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  Filter,
  Cpu,
  Server,
  Cloud,
  Terminal,
  Database,
  Download,
  Star,
  Sparkles,
} from 'lucide-react';
import { MarketplaceItem } from '../types';

interface MarketplaceBrowserProps {
  items: MarketplaceItem[];
}

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');

  const CATEGORIES = [
    'All',
    'CPM Plugins',
    'PSM Connection Components',
    'Cloud & DevOps',
    'PTA Sensors',
    'Tools & Integrations',
  ];

  const PLATFORMS = [
    'All',
    'Privilege Cloud',
    'AWS',
    'Azure',
    'Database',
    'Cisco',
    'Kubernetes',
    'Snowflake',
    'DevOps',
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === 'All' || item.category === selectedCategory;

      const isPc =
        item.compatibleWith?.includes('Privilege Cloud') ||
        item.compatibleWith?.includes('Both') ||
        item.targetSystems.some((t) => t.toLowerCase().includes('privilege cloud')) ||
        item.name.toLowerCase().includes('privilege cloud');

      const matchPlatform =
        selectedPlatform === 'All' ||
        (selectedPlatform === 'Privilege Cloud' && isPc) ||
        item.targetSystems.some((t) => t.toLowerCase().includes(selectedPlatform.toLowerCase())) ||
        item.protocolOrPlatform.toLowerCase().includes(selectedPlatform.toLowerCase());

      if (!matchCat || !matchPlatform) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        item.protocolOrPlatform.toLowerCase().includes(q) ||
        item.targetSystems.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, selectedCategory, selectedPlatform, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#121c2c] to-[#0c121e] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 mb-3">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official & Community Marketplace Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PAM Plugin & Connector Discovery
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Discover vetted CPM plugins for credentials rotation, PSM connection components for privileged session recording, and DevOps integrations.
          </p>

          {/* Search Box */}
          <div className="mt-6 relative max-w-xl">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="input-marketplace-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins by name, protocol, or vendor (e.g. AWS, Cisco, DBeaver)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Platform Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto">
          <span className="text-xs font-semibold text-slate-400 mr-2">Target:</span>
          {PLATFORMS.map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedPlatform === plat
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-[#0f1624] border border-slate-800 hover:border-slate-700 shadow-lg flex flex-col justify-between group transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {item.category}
                  </span>
                  {item.version && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      v{item.version}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {item.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Vetted
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                  {item.name}
                </h3>
                {(item.compatibleWith?.includes('Privilege Cloud') ||
                  item.compatibleWith?.includes('Both') ||
                  item.name.toLowerCase().includes('privilege cloud')) && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300">
                    <Cloud className="w-2.5 h-2.5 text-sky-400" />
                    Privilege Cloud Compatible
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {item.description}
              </p>

              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Vendor:</span>
                  <span className="text-slate-200 font-medium">{item.vendor}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Protocol:</span>
                  <span className="font-mono text-emerald-400/90 text-[11px]">
                    {item.protocolOrPlatform}
                  </span>
                </div>
                {(item.rating || item.downloadCount) && (
                  <div className="flex items-center justify-between text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.rating || 4.8} / 5.0
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {(item.downloadCount || 1200).toLocaleString()} downloads
                    </span>
                  </div>
                )}
              </div>

              {/* Target tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {item.targetSystems.map((sys) => (
                  <span
                    key={sys}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                  >
                    {sys}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Synced: {item.lastSynced}
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={item.downloadUrl || item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                  title="Redirection link to download connector package from CyberArk Marketplace"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Connector</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
