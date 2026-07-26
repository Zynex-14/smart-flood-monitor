import React, { useState, useEffect } from 'react';
import { Waves, Radio, LayoutDashboard, Cpu, Clock } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeSensorCount = 6 }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-wide">
                FloodWatch <span className="text-cyan-400">CR</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase hidden sm:inline-block">
                Control Room v2.4
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center space-x-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('sensor-node')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'sensor-node'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sensor Node</span>
          </button>
        </nav>

        {/* Right Status & Clock */}
        <div className="flex items-center space-x-4">
          
          {/* Live System Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline">System Online</span>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedTime}</span>
          </div>

        </div>

      </div>
    </header>
  );
}
