import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, Plane, Award, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Airline, AirlinePerformanceMetric } from '../types';
import { Modal } from '../components/common/Modal';

export const AirlinesPage: React.FC = () => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [allianceFilter, setAllianceFilter] = useState('All');

  const [selectedPerformance, setSelectedPerformance] = useState<AirlinePerformanceMetric | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    const fetchAirlinesData = async () => {
      try {
        setLoading(true);
        const res = await api.getAirlines({
          alliance: allianceFilter !== 'All' ? allianceFilter : undefined,
          search: search.trim() || undefined
        });
        setAirlines(res);
      } catch (err) {
        console.error('Failed to load airlines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAirlinesData();
  }, [allianceFilter]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.getAirlines({
        alliance: allianceFilter !== 'All' ? allianceFilter : undefined,
        search: search.trim() || undefined
      });
      setAirlines(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPerformance = async (airline: Airline) => {
    try {
      setPerfLoading(true);
      const perf = await api.getAirlineDetail(airline.iata_code);
      setSelectedPerformance(perf);
    } catch (err) {
      console.error('Failed to load airline performance:', err);
    } finally {
      setPerfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Commercial Airlines Directory
              </h1>
              <p className="text-xs text-slate-400">
                50 major international carriers indexed with fleet allocations, alliances, and operational metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Alliance Filter Toolbar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search airline name, callsign, or country..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={allianceFilter}
            onChange={(e) => setAllianceFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Alliances</option>
            <option value="Star Alliance">Star Alliance</option>
            <option value="SkyTeam">SkyTeam</option>
            <option value="Oneworld">Oneworld</option>
            <option value="None">Non-Alliance / Independent</option>
          </select>
        </div>
      </div>

      {/* Airlines Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-mono">
          Loading airlines from MongoDB...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {airlines.map((airline) => (
            <div
              key={airline.iata_code}
              onClick={() => handleOpenPerformance(airline)}
              className="glass-panel-hover p-5 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-mono font-bold text-sky-400 group-hover:text-sky-300">
                    {airline.iata_code}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-aviation-800 border border-slate-700 text-slate-300">
                    {airline.alliance}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-slate-200 line-clamp-1">
                  {airline.name}
                </h3>
                <p className="text-xs text-slate-400">{airline.country}</p>
                {airline.callsign && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    Callsign: <span className="text-slate-400">{airline.callsign}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Fleet Size:</span>
                  <span className="text-slate-200 font-bold">{airline.fleet_size} jets</span>
                </div>
                {airline.hub_airports && airline.hub_airports.length > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Key Hubs:</span>
                    <span className="text-sky-300">{airline.hub_airports.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 text-[11px] text-sky-400 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                <span>View Analytics</span>
                <Award className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Airline Performance Modal */}
      {selectedPerformance && (
        <Modal
          isOpen={!!selectedPerformance}
          onClose={() => setSelectedPerformance(null)}
          title={`Carrier Performance: ${selectedPerformance.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-aviation-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-2xl font-mono font-bold text-sky-400">
                  {selectedPerformance.iata_code}
                </span>
                <h4 className="font-semibold text-sm text-slate-200 mt-0.5">
                  {selectedPerformance.name}
                </h4>
                <p className="text-slate-400">
                  {selectedPerformance.country} • {selectedPerformance.alliance}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-500 text-[10px] block">FLEET</span>
                <span className="text-sm font-bold text-slate-200">
                  {selectedPerformance.fleet_size} Aircraft
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 block">TOTAL FLIGHTS</span>
                <span className="text-lg font-bold text-slate-200">
                  {selectedPerformance.total_flights.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 block">ON-TIME RATE</span>
                <span className="text-lg font-bold text-emerald-400">
                  {selectedPerformance.on_time_rate}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Delayed Flights (≥15m):</span>
                <span className="text-amber-400 font-bold">
                  {selectedPerformance.delayed_flights.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cancelled Flights:</span>
                <span className="text-rose-400 font-bold">
                  {selectedPerformance.cancelled_flights} ({selectedPerformance.cancellation_rate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Delay:</span>
                <span className="text-slate-200 font-bold">
                  +{selectedPerformance.avg_delay_minutes} mins
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
