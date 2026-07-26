import React, { useState, useMemo, useEffect } from 'react';
import initialReadings from './data/readings.json';
import { evaluateWaterLevel } from './utils/statusUtils';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import ReadingsTable from './components/ReadingsTable';
import DetailModal from './components/DetailModal';
import TrendChart from './components/TrendChart';
import SensorNodeSimulator from './components/SensorNodeSimulator';
import { Shield, Info } from 'lucide-react';

export default function App() {
  const [readings, setReadings] = useState(initialReadings);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('recorded_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReading, setSelectedReading] = useState(null);

  // Add new reading to live telemetry array
  const handleAddReading = (newReading) => {
    setReadings((prev) => [newReading, ...prev]);
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter and Sort Telemetry Readings using useMemo
  const filteredAndSortedReadings = useMemo(() => {
    let result = [...readings];

    // 1. Search Query Filtering (across reading_id, location, device_id)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.reading_id?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.device_id?.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter Pill
    if (statusFilter !== 'all') {
      result = result.filter((r) => {
        const evalRes = evaluateWaterLevel(r.water_level_m);
        const effectiveStatus = (r.status === 'unknown' || evalRes.isImplausible || evalRes.isMissing)
          ? evalRes.statusKey
          : r.status;
        return effectiveStatus === statusFilter;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'water_level_m') {
        const evalA = evaluateWaterLevel(a.water_level_m);
        const evalB = evaluateWaterLevel(b.water_level_m);
        
        // Handle null / missing values for sorting
        aVal = evalA.isMissing ? -9999 : (evalA.value ?? -9999);
        bVal = evalB.isMissing ? -9999 : (evalB.value ?? -9999);
      } else if (sortField === 'recorded_at') {
        aVal = new Date(a.recorded_at).getTime();
        bVal = new Date(b.recorded_at).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [readings, searchQuery, statusFilter, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Count active unique ESP32 sensor nodes
  const activeSensorCount = useMemo(() => {
    return new Set(readings.map((r) => r.device_id)).size;
  }, [readings]);

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      
      {/* Top Control-Room Navbar with Tab Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSensorCount={activeSensorCount}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeTab === 'dashboard' ? (
          <>
            {/* Section 1: Summary Metric Cards */}
            <section aria-label="Telemetry Summary Overview">
              <SummaryCards readings={readings} />
            </section>

            {/* Section 2: Search Bar & Status Filter Panel */}
            <section
              aria-label="Filter Controls"
              className="glass-panel rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4"
            >
              <div className="w-full lg:w-96">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>

              <div className="w-full lg:w-auto">
                <FilterPanel
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  readings={readings}
                />
              </div>
            </section>

            {/* Section 3: Interactive Hydrograph Trend Analytics Chart */}
            <section aria-label="Water Level Hydrograph Chart">
              <TrendChart readings={readings} />
            </section>

            {/* Section 4: Live Telemetry Readings Table / Responsive Cards */}
            <section aria-label="Telemetry Readings Log">
              <ReadingsTable
                readings={filteredAndSortedReadings}
                filteredCount={filteredAndSortedReadings.length}
                totalCount={readings.length}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                onViewDetails={(item) => setSelectedReading(item)}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={10}
                onResetFilters={handleResetFilters}
              />
            </section>
          </>
        ) : (
          /* Sensor Node Simulator View */
          <section aria-label="Sensing Node Simulator">
            <SensorNodeSimulator
              onAddReading={handleAddReading}
              totalDashboardReadings={readings.length}
            />
          </section>
        )}

      </main>

      {/* Detail Modal Component */}
      {selectedReading && (
        <DetailModal
          reading={selectedReading}
          allReadings={readings}
          onClose={() => setSelectedReading(null)}
        />
      )}

      {/* Control Room Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>FloodWatch CR • Smart Flood Monitoring & Early Warning System</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500 font-mono">
            <Info className="w-3.5 h-3.5" />
            <span>Academic Capstone Project • Sensing Node Simulator Integrated</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
