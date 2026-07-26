import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { evaluateWaterLevel, formatDate } from '../utils/statusUtils';

export default function ReadingsTable({
  readings = [],
  filteredCount = 0,
  totalCount = 0,
  sortField,
  sortOrder,
  onSort,
  onViewDetails,
  currentPage,
  setCurrentPage,
  pageSize = 10,
  onResetFilters
}) {
  // Pagination calculations
  const totalPages = Math.ceil(readings.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, readings.length);
  const currentReadings = readings.slice(startIndex, endIndex);

  const handleHeaderSort = (field) => {
    onSort(field);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Record Count & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span>
            Showing <strong className="text-slate-100 font-mono">{readings.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-100 font-mono">{endIndex}</strong> of{' '}
            <strong className="text-cyan-400 font-mono">{filteredCount}</strong> records
          </span>
          {filteredCount < totalCount && (
            <span className="text-[11px] text-slate-500 font-normal">
              (filtered from {totalCount} total)
            </span>
          )}
        </div>

        {filteredCount === 0 && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {readings.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center space-y-4 border-dashed border-slate-700/80">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No Matching Telemetry Records</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any readings matching your current search query or filter selection.
            </p>
          </div>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition-all duration-150"
            >
              Clear Search & Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4 font-mono">Reading ID</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4 font-mono">Device ID</th>
                    <th
                      onClick={() => handleHeaderSort('water_level_m')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors group select-none"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Water Level (m)</span>
                        {getSortIcon('water_level_m')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Status</th>
                    <th
                      onClick={() => handleHeaderSort('recorded_at')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors group select-none"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Recorded At</span>
                        {getSortIcon('recorded_at')}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currentReadings.map((reading) => {
                    const evalResult = evaluateWaterLevel(reading.water_level_m);
                    const effectiveStatus = (reading.status === 'unknown' || evalResult.isImplausible || evalResult.isMissing)
                      ? evalResult.statusKey
                      : reading.status;

                    return (
                      <tr
                        key={reading.reading_id}
                        className="hover:bg-slate-800/60 transition-colors duration-150 group"
                      >
                        {/* Reading ID */}
                        <td className="py-3.5 px-4 font-mono text-cyan-400 font-medium">
                          {reading.reading_id}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {reading.location}
                        </td>

                        {/* Device ID */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                            {reading.device_id}
                          </span>
                        </td>

                        {/* Water Level */}
                        <td className="py-3.5 px-4 font-mono font-semibold">
                          {evalResult.isMissing ? (
                            <span className="text-slate-500 italic font-sans text-xs">
                              No Data
                            </span>
                          ) : evalResult.isImplausible ? (
                            <span
                              className="inline-flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-xs"
                              title={evalResult.reason}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{evalResult.formatted}</span>
                            </span>
                          ) : (
                            <span className="text-slate-100 text-base">
                              {evalResult.formatted}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={effectiveStatus} size="sm" />
                        </td>

                        {/* Recorded At */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          {formatDate(reading.recorded_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onViewDetails(reading)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 hover:border-cyan-600/50 text-xs font-semibold transition-all duration-150 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="block md:hidden space-y-3">
            {currentReadings.map((reading) => {
              const evalResult = evaluateWaterLevel(reading.water_level_m);
              const effectiveStatus = (reading.status === 'unknown' || evalResult.isImplausible || evalResult.isMissing)
                ? evalResult.statusKey
                : reading.status;

              return (
                <div
                  key={reading.reading_id}
                  className="glass-panel glass-panel-hover rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-cyan-400">
                        {reading.reading_id}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400">
                        {reading.device_id}
                      </span>
                    </div>
                    <StatusBadge status={effectiveStatus} size="sm" />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-medium text-slate-200 text-right">{reading.location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Water Level:</span>
                      <span className="font-mono font-bold">
                        {evalResult.isMissing ? (
                          <span className="text-slate-500 italic">No Data</span>
                        ) : evalResult.isImplausible ? (
                          <span className="inline-flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{evalResult.formatted}</span>
                          </span>
                        ) : (
                          <span className="text-slate-100 text-sm">{evalResult.formatted}</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 pt-1">
                      <span>Timestamp:</span>
                      <span className="font-mono">{formatDate(reading.recorded_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewDetails(reading)}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-600/50 text-xs font-semibold transition-all duration-150"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Telemetry Details</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 font-mono">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold border transition-all duration-150 ${
                        pageNum === currentPage
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
