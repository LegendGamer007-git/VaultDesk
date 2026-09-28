import React from 'react';
import { X, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { UserBookmark } from '../types';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: UserBookmark[];
  onRemoveBookmark: (id: string) => void;
  onSelectBookmark: (entryId: string) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onSelectBookmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#12151C] border-l border-[#232833] h-full flex flex-col shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#232833] flex items-center justify-between bg-[#12151C]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#0A84FF]" />
            <h2 className="text-base font-bold text-[#F5F6F8]">
              Saved Errors & Runbooks ({bookmarks.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#A6AEC0] hover:text-[#F5F6F8] hover:bg-[#1A1E27] border border-transparent hover:border-[#2E3440] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-[#6E7787]">
              <Bookmark className="w-10 h-10 mx-auto opacity-40 text-[#6E7787]" />
              <p className="text-sm font-medium text-[#A6AEC0]">No saved errors yet</p>
              <p className="text-xs text-[#6E7787] max-w-xs mx-auto">
                Click the bookmark icon on any PAM error code or runbook card to pin it here for quick access during on-call.
              </p>
            </div>
          ) : (
            bookmarks.map((bmk) => (
              <div
                key={bmk.id}
                className="p-3.5 rounded-[12px] bg-[#1A1E27] border border-[#2E3440] hover:border-[#0A84FF]/50 transition-all flex items-start justify-between gap-3 group"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectBookmark(bmk.entryId);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {bmk.code && (
                      <span className="font-mono text-xs font-bold text-[#0A84FF] bg-[#12151C] px-2 py-0.5 rounded-[6px] border border-[#2E3440]">
                        {bmk.code}
                      </span>
                    )}
                    {bmk.component && (
                      <span className="text-[11px] px-2 py-0.5 rounded-[6px] bg-[#12151C] text-[#A6AEC0] border border-[#2E3440]">
                        {bmk.component}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-[#F5F6F8] group-hover:text-[#64D2FF] transition-colors line-clamp-2">
                    {bmk.title}
                  </h4>
                  <span className="text-[10px] text-[#6E7787] block mt-1">
                    Saved: {new Date(bmk.savedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onSelectBookmark(bmk.entryId);
                      onClose();
                    }}
                    className="p-1.5 text-[#A6AEC0] hover:text-[#0A84FF] hover:bg-[#12151C] rounded-[6px] transition-colors"
                    title="Open Runbook"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bmk.id)}
                    className="p-1.5 text-[#6E7787] hover:text-[#FF453A] hover:bg-[#12151C] rounded-[6px] transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {bookmarks.length > 0 && (
          <div className="p-4 border-t border-[#232833] bg-[#12151C] flex justify-between items-center text-xs text-[#A6AEC0]">
            <span>Pinned for active operational shift</span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[8px] bg-[#1A1E27] hover:bg-[#232833] text-[#F5F6F8] border border-[#2E3440] transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
