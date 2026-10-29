import React, { useState, useEffect } from 'react';
import {
  Radar,
  Plane,
  Compass,
  Gauge,
  ArrowUpRight,
  Search,
  Filter,
  ShieldAlert,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { ActiveSimulatedFlight } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const LiveAirspacePage: React.FC = () => {
  const [flights, setFlights] = useState<ActiveSimulatedFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAirline, setSelectedAirline] = useState('All');
  const [selectedFlight, setSelectedFlight] = useState<ActiveSimulatedFlight | null>(null);
  const [stats, setStats] = useState<any>(null);

  const loadActiveSimulation = async () => {
    try {
      setLoading(true);
      const [flightsRes, statsRes] = await Promise.all([
        api.getActiveSimulationFlights(),
        api.getSimulationStats()
      ]);
      setFlights(flightsRes);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveSimulation();
    const interval = setInterval(loadActiveSimulation, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter flights
  const airlinesList = Array.from(new Set(flights.map((f) => f.airline_code))).sort();

  const filteredFlights = flights.filter((f) => {
    const matchesSearch =
      f.flight_number.toLowerCase().includes(search.toLowerCase()) ||
      f.origin_code.toLowerCase().includes(search.toLowerCase()) ||
      f.dest_code.toLowerCase().includes(search.toLowerCase()) ||
      f.airline_name.toLowerCase().includes(search.toLowerCase());

    const matchesAirline = selectedAirline === 'All' || f.airline_code === selectedAirline;
    return matchesSearch && matchesAirline;
  });

  return (
    <div className="space-y-6">
      {/* Header & Academic Notice */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Radar className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Simulated Airspace Monitor
              </h1>
              <p className="text-xs text-slate-400">
                Visualizing active en-route flights with simulated coordinates, altitudes, and headings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadActiveSimulation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:bg-aviation-700 text-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Academic Big Data Demonstration Notice: </span>
          This is a simulated flight visualization created for educational and analytical purposes using synthetic data.
          It does not connect to live operational radar, real aircraft transponders, ADS-B feeds, or air traffic control centers.
        </div>
      </div>

      {/* Radar Canvas & Telemetry Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Screen (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden bg-aviation-950/90 min-h-[460px]">
          {/* Radar Header */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 z-10">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              RADAR SIM: ACTIVE ({filteredFlights.length} BLIPS)
            </span>
            <span className="font-mono text-slate-400">SWEEP: 360° / 4s</span>
          </div>

          {/* Circular Radar Scope */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-2 border-emerald-500/30 bg-aviation-950/90 flex items-center justify-center shadow-2xl shadow-emerald-950/30">
            {/* Concentric Range Rings */}
            <div className="absolute inset-8 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-20 rounded-full border border-emerald-500/20" />
            <div className="absolute inset-32 rounded-full border border-emerald-500/20" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/25" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/25" />

            {/* Degree Cardinal Ticks */}
            <span className="absolute top-2 text-[10px] font-mono text-emerald-400">000°</span>
            <span className="absolute right-2 text-[10px] font-mono text-emerald-400">090°</span>
            <span className="absolute bottom-2 text-[10px] font-mono text-emerald-400">180°</span>
            <span className="absolute left-2 text-[10px] font-mono text-emerald-400">270°</span>

            {/* Rotating Radar Sweep Beam */}
            <div
              className="absolute inset-0 rounded-full radar-sweep-effect pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0) 0deg, rgba(16, 185, 129, 0) 270deg, rgba(16, 185, 129, 0.3) 360deg)'
              }}
            />

            {/* Center Origin Node */}
            <div className="h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 z-10" />

            {/* Plotted Flights as Radar Blips */}
            {filteredFlights.slice(0, 40).map((flight, i) => {
              // Convert lat/lon into normalized polar projection within the 96rem box
              const radius = 30 + ((Math.abs(flight.latitude * 3 + flight.longitude * 2) % 130));
              const angle = (flight.heading_deg * Math.PI) / 180;
              const x = Math.sin(angle) * radius;
              const y = -Math.cos(angle) * radius;

              const isSelected = selectedFlight?.flight_number === flight.flight_number;

              return (
                <button
                  key={flight.flight_number}
                  onClick={() => setSelectedFlight(flight)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                    isSelected ? 'scale-125' : 'hover:scale-125'
                  }`}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`
                  }}
                  title={`${flight.flight_number}: ${flight.origin_code} → ${flight.dest_code}`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-400 ring-4 ring-amber-400/30'
                        : 'bg-emerald-400 group-hover:bg-sky-400 ring-2 ring-emerald-400/20'
                    }`}
                  />
                  <span className="absolute left-3 top-[-6px] hidden group-hover:block whitespace-nowrap px-1.5 py-0.5 rounded bg-aviation-900 border border-slate-700 text-[10px] font-mono text-emerald-300 z-30 shadow-lg">
                    {flight.flight_number} | FL{Math.round(flight.altitude_ft / 100)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mt-4 z-10">
            <span>Range: 400 NM Radius</span>
            <span>Target Acquisition: Synthetic Projection</span>
          </div>
        </div>

        {/* Active En-Route Flights Sidebar (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Plane className="h-4 w-4 text-sky-400" />
                <span>Active En Route Targets</span>
              </h2>
              <p className="text-xs text-slate-400">
                {filteredFlights.length} flights currently airborne
              </p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flight number, route, airline..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="flex-1 py-1 px-2 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="All">All Airlines ({airlinesList.length})</option>
                {airlinesList.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Flights List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredFlights.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No active simulated flights match your filter.
              </div>
            ) : (
              filteredFlights.map((flight) => {
                const isSelected = selectedFlight?.flight_number === flight.flight_number;
                return (
                  <div
                    key={flight.flight_number}
                    onClick={() => setSelectedFlight(flight)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 shadow-md'
                        : 'border-slate-800 bg-aviation-950/60 hover:border-slate-700 hover:bg-aviation-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400 text-sm">
                          {flight.flight_number}
                        </span>
                        <span className="text-slate-400 truncate max-w-[120px]">
                          {flight.airline_name}
                        </span>
                      </div>
                      <StatusBadge status="En Route" size="sm" />
                    </div>

                    <div className="flex items-center justify-between font-mono text-slate-300 mb-2">
                      <span>{flight.origin_code} ({flight.origin_city})</span>
                      <span className="text-slate-500">→</span>
                      <span>{flight.dest_code} ({flight.dest_city})</span>
                    </div>

                    {/* Telemetry Pills */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 bg-aviation-900/60 p-2 rounded-lg border border-slate-800/80 mb-2">
                      <div>
                        <span className="block text-slate-500 text-[10px]">ALTITUDE</span>
                        <span className="text-slate-200">{flight.altitude_ft.toLocaleString()} ft</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px]">SPEED</span>
                        <span className="text-slate-200">{flight.groundspeed_kmh} km/h</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[10px]">HEADING</span>
                        <span className="text-slate-200">{flight.heading_deg}°</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Route Progress</span>
                        <span>{flight.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-aviation-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-1.5 rounded-full"
                          style={{ width: `${flight.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Flight Telemetry Details Modal */}
      {selectedFlight && (
        <Modal
          isOpen={!!selectedFlight}
          onClose={() => setSelectedFlight(null)}
          title={`Simulated Flight Telemetry: ${selectedFlight.flight_number}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-aviation-950 border border-slate-800">
              <div>
                <span className="text-lg font-mono font-bold text-sky-400">
                  {selectedFlight.flight_number}
                </span>
                <p className="text-slate-400">{selectedFlight.airline_name}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{selectedFlight.aircraft_model}</p>
              </div>
              <StatusBadge status="En Route" size="lg" />
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] uppercase text-slate-500">ORIGIN</span>
                <div className="text-base font-bold text-slate-200">{selectedFlight.origin_code}</div>
                <div className="text-slate-400 text-xs">{selectedFlight.origin_city}</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] uppercase text-slate-500">DESTINATION</span>
                <div className="text-base font-bold text-slate-200">{selectedFlight.dest_code}</div>
                <div className="text-slate-400 text-xs">{selectedFlight.dest_city}</div>
              </div>
            </div>

            {/* Telemetry Detailed Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-2.5 rounded-lg bg-aviation-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">CURRENT ALTITUDE</span>
                <div className="text-sm font-bold text-sky-300">
                  {selectedFlight.altitude_ft.toLocaleString()} ft
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-aviation-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">GROUNDSPEED</span>
                <div className="text-sm font-bold text-slate-200">
                  {selectedFlight.groundspeed_kmh} km/h
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-aviation-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">COMPASS BEARING</span>
                <div className="text-sm font-bold text-slate-200">{selectedFlight.heading_deg}°</div>
              </div>
              <div className="p-2.5 rounded-lg bg-aviation-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">COORDINATES</span>
                <div className="text-xs font-bold text-slate-200">
                  {selectedFlight.latitude.toFixed(2)}, {selectedFlight.longitude.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Route Trajectory Completion</span>
                <span className="font-bold text-sky-400">{selectedFlight.progress_percent}%</span>
              </div>
              <div className="w-full bg-aviation-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${selectedFlight.progress_percent}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Interpolated geographic position computed from great-circle arc between origin and destination coordinates.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
