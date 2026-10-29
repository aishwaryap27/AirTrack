import React, { useState, useEffect } from 'react';
import {
  Plane,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Flight, Airline, Airport } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';

export const FlightsManagerPage: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [airlineFilter, setAirlineFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [minDelay, setMinDelay] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('scheduled_departure');
  const [sortDir, setSortDir] = useState('desc');

  // Directory lookups for forms & filters
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);

  // Modals state
  const [viewFlight, setViewFlight] = useState<Flight | null>(null);
  const [editFlight, setEditFlight] = useState<Flight | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    flight_number: '',
    airline_code: 'AA',
    aircraft_model: 'Boeing 737-800',
    origin_code: 'JFK',
    destination_code: 'LAX',
    scheduled_departure: new Date().toISOString().slice(0, 16),
    terminal: 'T4',
    gate: 'A12'
  });

  const [editForm, setEditForm] = useState({
    status: 'Landed',
    departure_delay_minutes: 0,
    arrival_delay_minutes: 0,
    terminal: 'T1',
    gate: 'A1',
    carrier_delay: 0,
    weather_delay: 0,
    nas_delay: 0,
    security_delay: 0,
    late_aircraft_delay: 0
  });

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load directory items once
  useEffect(() => {
    const loadDirectories = async () => {
      try {
        const [airlinesRes, airportsRes] = await Promise.all([
          api.getAirlines(),
          api.getAirports({ page: 1, page_size: 100 })
        ]);
        setAirlines(airlinesRes);
        setAirports(airportsRes.items);
      } catch (err) {
        console.error('Failed to load directories:', err);
      }
    };
    loadDirectories();
  }, []);

  // Fetch flights on filter change
  const fetchFlightsData = async () => {
    try {
      setLoading(true);
      const res = await api.getFlights({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        airline: airlineFilter || undefined,
        origin: originFilter.trim() || undefined,
        destination: destFilter.trim() || undefined,
        min_delay: minDelay,
        sort_by: sortBy,
        sort_dir: sortDir
      });
      setFlights(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch flights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightsData();
  }, [page, pageSize, statusFilter, airlineFilter, minDelay, sortBy, sortDir]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFlightsData();
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // CREATE Flight
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createFlight({
        ...createForm,
        scheduled_departure: new Date(createForm.scheduled_departure).toISOString()
      });
      setIsCreateOpen(false);
      showNotification('success', `Flight ${created.flight_number} created successfully.`);
      fetchFlightsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to create flight');
    }
  };

  // EDIT Flight
  const openEditModal = (flight: Flight) => {
    setEditFlight(flight);
    setEditForm({
      status: flight.status,
      departure_delay_minutes: flight.departure_delay_minutes,
      arrival_delay_minutes: flight.arrival_delay_minutes,
      terminal: flight.terminal || 'T1',
      gate: flight.gate || 'A1',
      carrier_delay: flight.delays?.carrier_delay || 0,
      weather_delay: flight.delays?.weather_delay || 0,
      nas_delay: flight.delays?.nas_delay || 0,
      security_delay: flight.delays?.security_delay || 0,
      late_aircraft_delay: flight.delays?.late_aircraft_delay || 0
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFlight?.id) return;
    try {
      await api.updateFlight(editFlight.id, editForm);
      setEditFlight(null);
      showNotification('success', `Flight ${editFlight.flight_number} updated.`);
      fetchFlightsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to update flight');
    }
  };

  // DELETE Flight
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.deleteFlight(deleteId);
      setDeleteId(null);
      showNotification('success', 'Flight record deleted from MongoDB.');
      fetchFlightsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to delete flight');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Plane className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Flight Operations Management
              </h1>
              <p className="text-xs text-slate-400">
                CRUD operations, multi-parameter querying, and pagination over 50,000 MongoDB flight records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule New Flight</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Query & Filter Toolbar */}
      <div className="glass-panel p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Flight Number Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Flight # (e.g. AA1204)"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Landed">Landed</option>
              <option value="Delayed">Delayed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="En Route">En Route</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Diverted">Diverted</option>
            </select>
          </div>

          {/* Airline Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Airline</label>
            <select
              value={airlineFilter}
              onChange={(e) => {
                setAirlineFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="">All Airlines</option>
              {airlines.map((a) => (
                <option key={a.iata_code} value={a.iata_code}>
                  {a.iata_code} - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Origin Airport Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Origin (IATA)</label>
            <input
              type="text"
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value.toUpperCase())}
              placeholder="e.g. JFK"
              maxLength={4}
              className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 uppercase font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Destination Airport Filter */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Destination (IATA)</label>
            <input
              type="text"
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value.toUpperCase())}
              placeholder="e.g. LHR"
              maxLength={4}
              className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 uppercase font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </form>

        {/* Secondary Filter & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Min Delay:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Any', val: undefined },
                { label: '≥15m', val: 15 },
                { label: '≥30m', val: 30 },
                { label: '≥60m', val: 60 }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMinDelay(item.val);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors ${
                    minDelay === item.val
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'border-slate-800 text-slate-400 hover:bg-aviation-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1 px-2 rounded border border-slate-700 bg-aviation-950 text-slate-200 text-xs"
            >
              <option value="scheduled_departure">Departure Date</option>
              <option value="departure_delay_minutes">Delay (Mins)</option>
              <option value="distance_km">Distance (km)</option>
              <option value="passenger_count">Passenger Count</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              className="p-1 rounded border border-slate-700 bg-aviation-950 text-slate-300 hover:text-white"
              title="Toggle Ascending/Descending"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Flights Table (Using modern-web-guidance responsive table approach) */}
      <div className="glass-panel overflow-hidden border border-slate-800">
        <div
          tabIndex={0}
          role="region"
          aria-label="Aviation Flight Operations Table"
          className="table-wrapper"
        >
          <table className="text-xs text-slate-200">
            <thead className="bg-aviation-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-left">Flight</th>
                <th className="py-3 px-4 text-left">Airline</th>
                <th className="py-3 px-4 text-left">Route</th>
                <th className="py-3 px-4 text-left">Departure (UTC)</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Delay</th>
                <th className="py-3 px-4 text-left">Distance</th>
                <th className="py-3 px-4 text-left">Pax</th>
                <th className="py-3 px-4 text-left">Aircraft</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-aviation-900/30">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                      <span>Querying MongoDB flights collection...</span>
                    </div>
                  </td>
                </tr>
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No flight records match the chosen search criteria.
                  </td>
                </tr>
              ) : (
                flights.map((flight) => (
                  <tr
                    key={flight.id || flight.flight_number}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {flight.flight_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-300">{flight.airline?.iata_code}</span>
                      <span className="text-slate-400 ml-1.5 hidden sm:inline">
                        {flight.airline?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span className="text-slate-200">{flight.origin_airport?.iata_code}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="text-slate-200">{flight.destination_airport?.iata_code}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {flight.scheduled_departure ? flight.scheduled_departure.replace('T', ' ').slice(0, 16) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={flight.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {flight.departure_delay_minutes > 0 ? (
                        <span className="text-amber-400">+{flight.departure_delay_minutes}m</span>
                      ) : flight.departure_delay_minutes < 0 ? (
                        <span className="text-emerald-400">{flight.departure_delay_minutes}m</span>
                      ) : (
                        <span className="text-slate-400">On Time</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {flight.distance_km?.toLocaleString()} km
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {flight.passenger_count || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                      {flight.aircraft?.model}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewFlight(flight)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-aviation-850 hover:bg-slate-700 text-sky-400"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(flight)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-aviation-850 hover:bg-slate-700 text-amber-400"
                          title="Edit Flight"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(flight.id || null)}
                          className="p-1.5 rounded-lg border border-slate-700 bg-aviation-850 hover:bg-rose-950 text-rose-400"
                          title="Delete Flight"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-aviation-950/80">
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
      </div>

      {/* VIEW FLIGHT DETAILS MODAL */}
      {viewFlight && (
        <Modal
          isOpen={!!viewFlight}
          onClose={() => setViewFlight(null)}
          title={`Flight Manifest: ${viewFlight.flight_number}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-aviation-950 border border-slate-800">
              <div>
                <span className="text-xl font-mono font-bold text-sky-400">
                  {viewFlight.flight_number}
                </span>
                <p className="text-slate-300 font-medium">
                  {viewFlight.airline?.name} ({viewFlight.airline?.country})
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Alliance: {viewFlight.airline?.alliance || 'None'}
                </p>
              </div>
              <StatusBadge status={viewFlight.status} size="lg" />
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 uppercase">ORIGIN AIRPORT</span>
                <div className="text-lg font-bold text-sky-300">
                  {viewFlight.origin_airport?.iata_code}
                </div>
                <div className="text-slate-300 text-xs font-sans">
                  {viewFlight.origin_airport?.name}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {viewFlight.origin_airport?.city}, {viewFlight.origin_airport?.country}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-800 bg-aviation-950">
                <span className="text-[10px] text-slate-500 uppercase">DESTINATION AIRPORT</span>
                <div className="text-lg font-bold text-sky-300">
                  {viewFlight.destination_airport?.iata_code}
                </div>
                <div className="text-slate-300 text-xs font-sans">
                  {viewFlight.destination_airport?.name}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {viewFlight.destination_airport?.city}, {viewFlight.destination_airport?.country}
                </div>
              </div>
            </div>

            {/* Timetable */}
            <div className="p-3 rounded-xl border border-slate-800 bg-aviation-950 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <span className="text-[10px] text-slate-500">SCHED DEPARTURE</span>
                <div className="text-slate-200">
                  {viewFlight.scheduled_departure ? viewFlight.scheduled_departure.replace('T', ' ').slice(0, 16) : '-'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">ACTUAL DEPARTURE</span>
                <div className="text-slate-200">
                  {viewFlight.actual_departure ? viewFlight.actual_departure.replace('T', ' ').slice(0, 16) : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">DEPARTURE DELAY</span>
                <div className={viewFlight.departure_delay_minutes > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {viewFlight.departure_delay_minutes > 0 ? `+${viewFlight.departure_delay_minutes} mins` : 'On Time'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">GATE / TERMINAL</span>
                <div className="text-slate-200">
                  {viewFlight.terminal || 'T1'} / {viewFlight.gate || 'A1'}
                </div>
              </div>
            </div>

            {/* Delay Diagnostics */}
            {viewFlight.departure_delay_minutes > 15 && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Delay Causality Diagnostics</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-aviation-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Carrier</span>
                    <span className="text-amber-300 font-bold">{viewFlight.delays?.carrier_delay || 0}m</span>
                  </div>
                  <div className="p-2 rounded bg-aviation-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Weather</span>
                    <span className="text-amber-300 font-bold">{viewFlight.delays?.weather_delay || 0}m</span>
                  </div>
                  <div className="p-2 rounded bg-aviation-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">NAS / ATC</span>
                    <span className="text-amber-300 font-bold">{viewFlight.delays?.nas_delay || 0}m</span>
                  </div>
                  <div className="p-2 rounded bg-aviation-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Late Aircraft</span>
                    <span className="text-amber-300 font-bold">{viewFlight.delays?.late_aircraft_delay || 0}m</span>
                  </div>
                  <div className="p-2 rounded bg-aviation-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Security</span>
                    <span className="text-amber-300 font-bold">{viewFlight.delays?.security_delay || 0}m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Aircraft & Performance */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-slate-800 bg-aviation-950 font-mono">
              <div>
                <span className="text-[10px] text-slate-500">AIRCRAFT</span>
                <div className="text-slate-200 font-bold">{viewFlight.aircraft?.model}</div>
                <div className="text-slate-400 text-[11px] font-sans">{viewFlight.aircraft?.category}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">LOAD FACTOR</span>
                <div className="text-slate-200 font-bold">{viewFlight.passenger_count} pax</div>
                <div className="text-slate-400 text-[11px]">
                  Cap: {viewFlight.aircraft?.capacity || 180}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500">FUEL CONSUMPTION</span>
                <div className="text-slate-200 font-bold">
                  {viewFlight.fuel_burn_kg?.toLocaleString()} kg
                </div>
                <div className="text-slate-400 text-[11px]">
                  Dist: {viewFlight.distance_km?.toLocaleString()} km
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE FLIGHT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Commercial Flight"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Flight Number *
              </label>
              <input
                type="text"
                required
                value={createForm.flight_number}
                onChange={(e) => setCreateForm({ ...createForm, flight_number: e.target.value.toUpperCase() })}
                placeholder="e.g. DL1045"
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono uppercase focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Airline *
              </label>
              <select
                value={createForm.airline_code}
                onChange={(e) => setCreateForm({ ...createForm, airline_code: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {airlines.map((a) => (
                  <option key={a.iata_code} value={a.iata_code}>
                    {a.iata_code} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Origin Airport (IATA) *
              </label>
              <select
                value={createForm.origin_code}
                onChange={(e) => setCreateForm({ ...createForm, origin_code: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              >
                {airports.map((ap) => (
                  <option key={ap.iata_code} value={ap.iata_code}>
                    {ap.iata_code} - {ap.city} ({ap.country})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Destination Airport (IATA) *
              </label>
              <select
                value={createForm.destination_code}
                onChange={(e) => setCreateForm({ ...createForm, destination_code: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              >
                {airports.map((ap) => (
                  <option key={ap.iata_code} value={ap.iata_code}>
                    {ap.iata_code} - {ap.city} ({ap.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Aircraft Model *
              </label>
              <input
                type="text"
                required
                value={createForm.aircraft_model}
                onChange={(e) => setCreateForm({ ...createForm, aircraft_model: e.target.value })}
                placeholder="e.g. Boeing 737-800"
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Scheduled Departure (UTC) *
              </label>
              <input
                type="datetime-local"
                required
                value={createForm.scheduled_departure}
                onChange={(e) => setCreateForm({ ...createForm, scheduled_departure: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Terminal
              </label>
              <input
                type="text"
                value={createForm.terminal}
                onChange={(e) => setCreateForm({ ...createForm, terminal: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                Gate
              </label>
              <input
                type="text"
                value={createForm.gate}
                onChange={(e) => setCreateForm({ ...createForm, gate: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
            >
              Insert Flight Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT FLIGHT MODAL */}
      {editFlight && (
        <Modal
          isOpen={!!editFlight}
          onClose={() => setEditFlight(null)}
          title={`Edit Flight: ${editFlight.flight_number}`}
          maxWidth="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="Landed">Landed</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="En Route">En Route</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Diverted">Diverted</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                  Departure Delay (Mins)
                </label>
                <input
                  type="number"
                  value={editForm.departure_delay_minutes}
                  onChange={(e) => setEditForm({ ...editForm, departure_delay_minutes: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                  Terminal
                </label>
                <input
                  type="text"
                  value={editForm.terminal}
                  onChange={(e) => setEditForm({ ...editForm, terminal: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">
                  Gate
                </label>
                <input
                  type="text"
                  value={editForm.gate}
                  onChange={(e) => setEditForm({ ...editForm, gate: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-700 bg-aviation-950 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Delay Causes Breakdown Inputs */}
            <div className="p-3 rounded-lg border border-slate-800 bg-aviation-950 space-y-2">
              <span className="font-semibold text-slate-300 block">Delay Attribution Minutes</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Carrier</label>
                  <input
                    type="number"
                    value={editForm.carrier_delay}
                    onChange={(e) => setEditForm({ ...editForm, carrier_delay: Number(e.target.value) })}
                    className="w-full p-1.5 rounded border border-slate-700 bg-aviation-900 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Weather</label>
                  <input
                    type="number"
                    value={editForm.weather_delay}
                    onChange={(e) => setEditForm({ ...editForm, weather_delay: Number(e.target.value) })}
                    className="w-full p-1.5 rounded border border-slate-700 bg-aviation-900 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">NAS / ATC</label>
                  <input
                    type="number"
                    value={editForm.nas_delay}
                    onChange={(e) => setEditForm({ ...editForm, nas_delay: Number(e.target.value) })}
                    className="w-full p-1.5 rounded border border-slate-700 bg-aviation-900 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditFlight(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <Modal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Confirm Flight Record Deletion"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Are you sure you want to permanently delete this flight document from MongoDB collection{' '}
              <span className="font-mono text-sky-400">AirTrafficDB.flights</span>?
            </p>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
              This operation immediately triggers a MongoDB <code className="font-mono">deleteOne()</code> command.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
