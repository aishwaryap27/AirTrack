import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Globe, Plane, Navigation, Activity } from 'lucide-react';
import { api } from '../services/api';
import { Airport, AirportTrafficStats } from '../types';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';

export const AirportsPage: React.FC = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedAirportTraffic, setSelectedAirportTraffic] = useState<AirportTrafficStats | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const fetchAirportsData = async () => {
    try {
      setLoading(true);
      const res = await api.getAirports({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        country: selectedCountry || undefined
      });
      setAirports(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch airports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirportsData();
  }, [page, pageSize, selectedCountry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAirportsData();
  };

  const handleOpenTrafficModal = async (airport: Airport) => {
    try {
      setTrafficLoading(true);
      const traffic = await api.getAirportTraffic(airport.iata_code);
      setSelectedAirportTraffic(traffic);
    } catch (err) {
      console.error('Failed to load airport traffic:', err);
    } finally {
      setTrafficLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <MapPin className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Global Airports Directory
              </h1>
              <p className="text-xs text-slate-400">
                100 international and regional aviation facilities indexed with runways, coordinates, and movement metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IATA code, airport name, or city..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Airport Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-mono">
          Loading airports from MongoDB...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {airports.map((airport) => (
            <div
              key={airport.iata_code}
              onClick={() => handleOpenTrafficModal(airport)}
              className="glass-panel-hover p-4 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-mono font-bold text-sky-400 group-hover:text-sky-300">
                    {airport.iata_code}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aviation-800 border border-slate-700 text-slate-400">
                    {airport.icao_code || 'ICAO'}
                  </span>
                </div>

                <h3 className="font-semibold text-xs text-slate-200 line-clamp-1 mb-1">
                  {airport.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {airport.city}, <span className="text-slate-300">{airport.country}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Runways:</span>
                  <span className="text-slate-200">{airport.runways}</span>
                </div>
                <div className="flex justify-between">
                  <span>Elevation:</span>
                  <span className="text-slate-200">{airport.elevation_ft.toLocaleString()} ft</span>
                </div>
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="text-slate-400 text-[10px]">
                    {airport.latitude.toFixed(2)}°, {airport.longitude.toFixed(2)}°
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 text-[11px] text-sky-400 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                <span>View Traffic</span>
                <Navigation className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="glass-panel p-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* Airport Traffic Modal */}
      {selectedAirportTraffic && (
        <Modal
          isOpen={!!selectedAirportTraffic}
          onClose={() => setSelectedAirportTraffic(null)}
          title={`Airport Operations: ${selectedAirportTraffic.iata_code}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-aviation-950 border border-slate-800">
              <span className="text-2xl font-mono font-bold text-sky-400">
                {selectedAirportTraffic.iata_code}
              </span>
              <h4 className="font-semibold text-sm text-slate-200 mt-0.5">
                {selectedAirportTraffic.name}
              </h4>
              <p className="text-slate-400">{selectedAirportTraffic.city}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 block">DEPARTURES</span>
                <span className="text-lg font-bold text-sky-300">
                  {selectedAirportTraffic.total_departures.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 block">ARRIVALS</span>
                <span className="text-lg font-bold text-emerald-300">
                  {selectedAirportTraffic.total_arrivals.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 block">TOTAL MOVEMENTS</span>
                <span className="text-lg font-bold text-slate-200">
                  {selectedAirportTraffic.total_movements.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Average Departure Delay:</span>
                <span
                  className={
                    selectedAirportTraffic.avg_departure_delay > 15
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400'
                  }
                >
                  +{selectedAirportTraffic.avg_departure_delay} mins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Arrival Delay:</span>
                <span
                  className={
                    selectedAirportTraffic.avg_arrival_delay > 15
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400'
                  }
                >
                  +{selectedAirportTraffic.avg_arrival_delay} mins
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
