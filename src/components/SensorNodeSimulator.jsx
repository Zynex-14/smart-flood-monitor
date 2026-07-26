import React, { useState, useEffect, useRef } from 'react';
import { Radio, Play, Square, Send, Trash2, AlertTriangle, ShieldCheck, AlertOctagon, Cpu, Volume2, VolumeX, Sliders, ExternalLink, Terminal } from 'lucide-react';
import { evaluateWaterLevel, STATUS_CONFIG } from '../utils/statusUtils';

const MONITORING_NODES = [
  { location: 'River A - North Dam', device_id: 'ESP32-02', heightCm: 300 },
  { location: 'River A - Bridge Point', device_id: 'ESP32-01', heightCm: 300 },
  { location: 'Upstream A - Mountain Runoff', device_id: 'ESP32-07', heightCm: 300 },
  { location: 'Drainage Canal C - East Outfall', device_id: 'ESP32-03', heightCm: 300 },
  { location: 'Reservoir East - Overflow Gate', device_id: 'ESP32-04', heightCm: 300 },
  { location: 'River B - South Causeway', device_id: 'ESP32-05', heightCm: 300 },
  { location: 'Canal Substation 4', device_id: 'ESP32-06', heightCm: 300 }
];

export default function SensorNodeSimulator({ onAddReading, totalDashboardReadings = 0 }) {
  const [activeSubTab, setActiveSubTab] = useState('hardware'); // 'hardware' | 'wokwi'
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  
  // HC-SR04 Distance & ESP32 State
  const [distanceCm, setDistanceCm] = useState(136); // Default ~1.64m water level
  const [rollingBuffer, setRollingBuffer] = useState([136, 136, 136, 136, 136]);
  const [buzzerMuted, setBuzzerMuted] = useState(true);
  const [manualWaterLevel, setManualWaterLevel] = useState('');

  // Serial Monitor Terminal & Event Logs
  const [serialLogs, setSerialLogs] = useState([
    'Flood monitor node starting...',
    'ESP32-02 initialized on pins: Trig=5, Echo=18, LED=2, Buzzer=4',
    'Serial baud rate: 115200 bps | Sampling Interval: 3000ms'
  ]);
  const [eventLogs, setEventLogs] = useState([]);
  const [simulatorReadingsCount, setSimulatorReadingsCount] = useState(0);

  const timerRef = useRef(null);
  const audioContextRef = useRef(null);

  const activeNode = MONITORING_NODES[selectedNodeIndex] || MONITORING_NODES[0];

  // Calculate smoothed water level matching ESP32 C++ logic: (300.0 - smoothed) / 100.0
  const smoothedDistance = rollingBuffer.reduce((a, b) => a + b, 0) / rollingBuffer.length;
  let calculatedWaterLevel = (300.0 - smoothedDistance) / 100.0;
  if (calculatedWaterLevel < 0) calculatedWaterLevel = 0;

  // Determine hardware pin status (LED Pin 2 & Buzzer Pin 4)
  let hardwareStatus = 'safe';
  if (calculatedWaterLevel >= 2.5) {
    hardwareStatus = 'danger';
  } else if (calculatedWaterLevel >= 1.5) {
    hardwareStatus = 'warning';
  }

  const isLedOn = hardwareStatus === 'danger';
  const isBuzzerActive = hardwareStatus === 'danger' && !buzzerMuted;

  // Audio tone synth for Buzzer Pin 4
  useEffect(() => {
    if (isBuzzerActive) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, ctx.currentTime); // 1kHz beep
        gain.gain.setValueAtTime(0.05, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        return () => {
          try { osc.stop(); } catch {}
        };
      } catch {}
    }
  }, [isBuzzerActive]);

  // Update buffer when distance slider moves
  const handleDistanceChange = (newCm) => {
    const cm = Number(newCm);
    setDistanceCm(cm);
    setRollingBuffer((prev) => [...prev.slice(1), cm]);
  };

  // Helper to emit telemetry to global state & log serial
  const emitTelemetry = (waterLevelM, source = 'hardware') => {
    const evalRes = evaluateWaterLevel(waterLevelM);
    const nowISO = new Date().toISOString();
    const readingId = `RD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReading = {
      reading_id: readingId,
      location: activeNode.location,
      device_id: activeNode.device_id,
      water_level_m: evalRes.value,
      status: evalRes.statusKey,
      recorded_at: nowISO
    };

    const timeString = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Serial monitor log matching ESP32 C++ sketch output
    const serialLine = `Raw distance: ${smoothedDistance.toFixed(1)} cm | {"water_level_m": ${evalRes.value !== null ? evalRes.value.toFixed(2) : 'null'}, "status": "${evalRes.statusKey}"}`;
    setSerialLogs((prev) => [serialLine, ...prev.slice(0, 29)]);

    // Dashboard event log
    const logEntry = {
      id: Math.random().toString(36).substring(7),
      time: timeString,
      source,
      readingId,
      location: activeNode.location,
      deviceId: activeNode.device_id,
      valueFormatted: evalRes.formatted,
      statusKey: evalRes.statusKey,
      isImplausible: evalRes.isImplausible,
      isMissing: evalRes.isMissing,
      reason: evalRes.reason
    };

    onAddReading(newReading);
    setEventLogs((prev) => [logEntry, ...prev.slice(0, 49)]);
    setSimulatorReadingsCount((prev) => prev + 1);
  };

  // Automatic ESP32 Timer Tick
  useEffect(() => {
    if (isRunning) {
      const ms = Math.max(Number(intervalSeconds) || 1, 1) * 1000;
      timerRef.current = setInterval(() => {
        // Micro fluctuation mimicking water waves
        const noise = (Math.random() - 0.5) * 4;
        const nextCm = Math.max(10, Math.min(290, distanceCm + noise));
        handleDistanceChange(nextCm);

        const currentWaterLevel = (300.0 - nextCm) / 100.0;
        emitTelemetry(currentWaterLevel, 'esp32-auto');
      }, ms);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, intervalSeconds, distanceCm]);

  // Handle Manual Injection
  const handleSendManualReading = (e) => {
    e.preventDefault();
    if (manualWaterLevel.trim() === '') return;
    emitTelemetry(manualWaterLevel, 'manual-inject');
    setManualWaterLevel('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Simulator Banner & Subtab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-slate-700/70">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-slate-100">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">ESP32 Sensing Node Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Simulates an ESP32 microcontroller paired with an HC-SR04 ultrasonic distance sensor, red warning LED (Pin 2), and buzzer (Pin 4).
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('hardware')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'hardware'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Virtual ESP32 Rig</span>
          </button>

          <button
            onClick={() => setActiveSubTab('wokwi')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'wokwi'
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Embedded Wokwi Live</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'wokwi' ? (
        /* Embedded Wokwi Live Simulator View */
        <div className="glass-panel rounded-2xl p-4 border border-slate-700/70 shadow-2xl space-y-3">
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="font-semibold text-slate-200 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Wokwi ESP32 Circuit Simulation (#470602393067091969)</span>
            </span>
            <a
              href="https://wokwi.com/projects/470602393067091969"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-cyan-400 hover:underline text-xs"
            >
              <span>Open on Wokwi.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="w-full h-[620px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <iframe
              src="https://wokwi.com/projects/470602393067091969?embed=1"
              title="Wokwi ESP32 Sensing Node Simulation"
              className="w-full h-full border-0"
              allow="autoplay"
            />
          </div>
        </div>
      ) : (
        /* Virtual ESP32 Hardware Simulator Rig */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Hardware Controls & Ultrasonic Slider */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/70 space-y-5 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                HC-SR04 Sensor Controls
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700">
                Pin 5 (Trig) / Pin 18 (Echo)
              </span>
            </div>

            {/* Monitoring Node Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Node</label>
              <select
                value={selectedNodeIndex}
                onChange={(e) => setSelectedNodeIndex(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {MONITORING_NODES.map((node, idx) => (
                  <option key={node.device_id} value={idx}>
                    {node.location} ({node.device_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Slider (10cm to 290cm) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">Measured Distance:</span>
                <span className="font-mono text-base font-bold text-cyan-400">{distanceCm} cm</span>
              </div>
              <input
                type="range"
                min="10"
                max="290"
                step="1"
                value={distanceCm}
                onChange={(e) => handleDistanceChange(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10cm (Danger: 2.9m)</span>
                <span>150cm (Warning: 1.5m)</span>
                <span>290cm (Safe: 0.1m)</span>
              </div>
            </div>

            {/* Water Level Output */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Computed Water Level</span>
                <span className="font-mono text-2xl font-extrabold text-slate-100">
                  {calculatedWaterLevel.toFixed(2)} m
                </span>
              </div>
              <button
                onClick={() => emitTelemetry(calculatedWaterLevel, 'manual-dispatch')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
              >
                Emit Packet
              </button>
            </div>

            {/* Automatic Sampler Timer */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Automatic Loop Sampler</span>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(e.target.value)}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-center font-mono"
                  />
                  <span className="text-slate-500 font-mono">sec</span>
                </div>
              </div>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                  isRunning
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                }`}
              >
                {isRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                    <span>Stop Auto Loop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                    <span>Start Auto Loop ({intervalSeconds}s)</span>
                  </>
                )}
              </button>
            </div>

            {/* Manual Injection Form */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Manual Inject</span>
              <form onSubmit={handleSendManualReading} className="flex space-x-2">
                <input
                  type="text"
                  value={manualWaterLevel}
                  onChange={(e) => setManualWaterLevel(e.target.value)}
                  placeholder="e.g. 7.2 or -3"
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </form>
            </div>

          </div>

          {/* Column 2: Peripherals State & Serial Monitor */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/70 space-y-5 shadow-xl flex flex-col justify-between">
            
            {/* Peripherals Box (LED Pin 2 & Buzzer Pin 4) */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block border-b border-slate-800 pb-3">
                ESP32 Peripherals
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Red LED Pin 2 */}
                <div className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                  isLedOn
                    ? 'bg-red-500/20 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <span className={`w-4 h-4 rounded-full border ${
                    isLedOn ? 'bg-red-500 border-red-300 shadow-[0_0_10px_#ef4444] animate-ping' : 'bg-slate-700 border-slate-600'
                  }`} />
                  <div>
                    <span className="text-xs font-semibold block text-slate-200">Red LED</span>
                    <span className="text-[10px] font-mono text-slate-400">Pin 2: {isLedOn ? 'HIGH 🚨' : 'LOW'}</span>
                  </div>
                </div>

                {/* Buzzer Pin 4 */}
                <div className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-all ${
                  isBuzzerActive
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <button onClick={() => setBuzzerMuted(!buzzerMuted)} className="p-1 rounded text-slate-400 hover:text-slate-200">
                    {buzzerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
                  </button>
                  <div>
                    <span className="text-xs font-semibold block text-slate-200">Buzzer</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Pin 4: {isBuzzerActive ? '1kHz 🔊' : buzzerMuted && hardwareStatus === 'danger' ? 'Muted 🔇' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Serial Monitor (115200 Baud) */}
            <div className="space-y-2 flex-1 flex flex-col pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Serial Monitor (115200 bps)</span>
                </span>
                <button
                  onClick={() => setSerialLogs([])}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 min-h-[220px] bg-slate-950 rounded-xl border border-slate-800/90 p-3 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1">
                {serialLogs.length === 0 ? (
                  <span className="text-slate-600 italic">Serial output window ready...</span>
                ) : (
                  serialLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight">
                      <span className="text-slate-600 select-none">&gt; </span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Column 3: Dashboard Event Log */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/70 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Dashboard Event Stream
              </span>
              <button
                onClick={() => setEventLogs([])}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
              >
                <Trash2 className="w-3 h-3 text-slate-400" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800/90 p-3 font-mono text-xs overflow-y-auto max-h-[460px] min-h-[300px] space-y-2">
              {eventLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-center italic">
                  No events recorded. Move the HC-SR04 distance slider or start auto loop.
                </div>
              ) : (
                eventLogs.map((log) => {
                  const config = STATUS_CONFIG[log.statusKey] || STATUS_CONFIG.unknown;
                  return (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1 text-slate-300"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">[{log.time}]</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${config.badgeClass}`}>
                          {config.label}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-slate-200 font-sans">
                        <span className="font-semibold text-xs">{log.location}</span>
                        <span className="font-mono text-sm font-bold text-cyan-400">{log.valueFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>ID: {log.readingId} ({log.deviceId})</span>
                        <span className="text-slate-500 uppercase">{log.source}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Total Dashboard Records: <strong className="text-slate-100">{totalDashboardReadings}</strong></span>
              <span>Rig Packets: <strong className="text-cyan-400">{simulatorReadingsCount}</strong></span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
