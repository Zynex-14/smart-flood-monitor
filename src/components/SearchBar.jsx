import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4 text-cyan-400" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search reading ID (RD-0001), location, or device ID..."
        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-150 shadow-inner"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
          title="Clear Search"
        >
          <X className="w-4 h-4 bg-slate-800 rounded-full p-0.5" />
        </button>
      )}
    </div>
  );
}
