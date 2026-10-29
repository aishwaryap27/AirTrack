import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  MapPin,
  Building2,
  Database,
  Layers,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowUpDown,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

import { api } from '../services/api';
import {
  DelayAnalyticsResponse,
  AirportTrafficResponse,
  AirlinePerformanceMetric,
  StatusDistributionItem
} from '../types';

export const AnalyticsHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delays' | 'airports' | 'airlines' | 'mongodb'>('delays');
  const [loading, setLoading] = useState(true);

  const [delays, setDelays] = useState<DelayAnalyticsResponse | null>(null);
  const [traffic, setTraffic] = useState<AirportTrafficResponse | null>(null);
  const [airlines, setAirlines] = useState<AirlinePerformanceMetric[]>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [airlineSort, setAirlineSort] = useState<'on_time_rate' | 'avg_delay_minutes' | 'total_flights'>('on_time_rate');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [delaysRes, trafficRes, airlinesRes] = await Promise.all([
          api.getDelayAnalytics(),
          api.getAirportTrafficAnalytics(),
          api.getAirlinePerformance()
        ]);
        setDelays(delaysRes);
        setTraffic(trafficRes);
        setAirlines(airlinesRes);
      } catch (err) {
        console.error('Failed to load analytics hub:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Running MongoDB Aggregation Pipelines across 50,000 documents...</p>
      </div>
    );
  }

  // Filter & sort airlines table
  const filteredAirlines = airlines
    .filter(
      (a) =>
        a.name.toLowerCase().includes(airlineSearch.toLowerCase()) ||
        a.iata_code.toLowerCase().includes(airlineSearch.toLowerCase()) ||
        a.country.toLowerCase().includes(airlineSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (airlineSort === 'on_time_rate') return b.on_time_rate - a.on_time_rate;
      if (airlineSort === 'avg_delay_minutes') return a.avg_delay_minutes - b.avg_delay_minutes;
      return b.total_flights - a.total_flights;
    });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Aviation Big Data Analytics Hub
              </h1>
              <p className="text-xs text-slate-400">
                Multi-stage aggregation pipeline results exploring delay root causes, traffic bottlenecks, and fleet benchmarks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'delays', label: 'Delay Diagnostics', icon: Clock },
          { id: 'airports', label: 'Airport Traffic & Corridors', icon: MapPin },
          { id: 'airlines', label: 'Airline Performance Benchmarks', icon: Building2 },
          { id: 'mongodb', label: 'MongoDB Aggregation Architecture', icon: Database }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-sky-500/15 border border-sky-500/30 text-sky-300 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-aviation-900 border border-transparent'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DELAY DIAGNOSTICS */}
      {activeTab === 'delays' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Delay Curve */}
            <div className="glass-panel p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span>Diurnal Hourly Delay Curve (00:00 – 23:00)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Average departure delay in minutes by scheduled hour of departure.
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={delays?.hourly_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis
                      dataKey="hour"
                      stroke="#64748B"
                      fontSize={11}
                      tickFormatter={(h) => `${h}:00`}
                    />
                    <YAxis stroke="#64748B" fontSize={11} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#F8FAFC'
                      }}
                      formatter={(val: any) => [`${val} minutes`, 'Avg Delay']}
                      labelFormatter={(h) => `Departure Hour: ${h}:00 UTC`}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_delay_minutes"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#F59E0B' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week Delay Trend */}
            <div className="glass-panel p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Weekly Operational Delay Trend (Sun – Sat)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Average delay minutes compared across days of the week.
                </p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delays?.day_of_week_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="day_name" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        color: '#F8FAFC'
                      }}
                      formatter={(val: any) => [`${val} mins`, 'Avg Departure Delay']}
                    />
                    <Bar
                      dataKey="avg_delay_minutes"
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Root Delay Causes Radar / Cards */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Causality Breakdown (Minutes & Relative Weight)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              {delays?.causes.map((c) => (
                <div
                  key={c.cause}
                  className="p-4 rounded-xl border border-slate-800 bg-aviation-950 flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-slate-300">{c.label}</span>
                  <div className="my-2">
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {c.total_minutes.toLocaleString()}m
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Avg: {c.avg_minutes} min / flight
                    </span>
                  </div>
                  <div className="w-full bg-aviation-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${c.percentage}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 text-right block">
                    {c.percentage}% of total delay
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Delayed Flight Corridors */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-semibold text-white mb-3">
              Top 10 Most Delayed Flight Corridors
            </h2>
            <div className="table-wrapper border border-slate-800">
              <table className="text-xs text-slate-200">
                <thead className="bg-aviation-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Route Corridor</th>
                    <th className="py-2.5 px-4 text-left">Origin</th>
                    <th className="py-2.5 px-4 text-left">Destination</th>
                    <th className="py-2.5 px-4 text-left">Flights Operated</th>
                    <th className="py-2.5 px-4 text-right">Avg Departure Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-aviation-900/30">
                  {delays?.top_delayed_routes.map((route, i) => (
                    <tr key={route.route} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-sky-300">
                        #{i + 1} {route.route}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{route.origin}</td>
                      <td className="py-2.5 px-4 font-mono">{route.destination}</td>
                      <td className="py-2.5 px-4 font-mono">{route.flight_count} flights</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400">
                        +{route.avg_delay_minutes} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AIRPORT TRAFFIC & CORRIDORS */}
      {activeTab === 'airports' && (
        <div className="space-y-6">
          {/* Top 10 Busiest Airports: Departures vs Arrivals Stacked Bar */}
          <div className="glass-panel p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Top 10 Busiest Airports (Departures vs Arrivals)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Commercial flight movements breakdown per international hub.
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traffic?.busiest_airports || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="iata_code" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#F8FAFC'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="departures"
                    name="Departures"
                    stackId="a"
                    fill="#0EA5E9"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="arrivals"
                    name="Arrivals"
                    stackId="a"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Flight Corridors Table */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-semibold text-white mb-3">
              Top 10 Most Traversed Flight Corridors
            </h2>
            <div className="table-wrapper border border-slate-800">
              <table className="text-xs text-slate-200">
                <thead className="bg-aviation-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Corridor Rank</th>
                    <th className="py-2.5 px-4 text-left">Origin → Destination</th>
                    <th className="py-2.5 px-4 text-left">Total Movements</th>
                    <th className="py-2.5 px-4 text-left">Great-Circle Distance</th>
                    <th className="py-2.5 px-4 text-right">Avg Scheduled Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-aviation-900/30">
                  {traffic?.popular_routes.map((route, idx) => (
                    <tr key={route.route} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-sky-400">
                        Corridor #{idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-200">
                        {route.route}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">
                        {route.flight_count} flights
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">
                        {route.distance_km?.toLocaleString()} km
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {Math.floor(route.avg_duration_minutes / 60)}h{' '}
                        {Math.round(route.avg_duration_minutes % 60)}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AIRLINE PERFORMANCE BENCHMARKS */}
      {activeTab === 'airlines' && (
        <div className="space-y-6">
          {/* Filter & Sort Controls */}
          <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={airlineSearch}
                onChange={(e) => setAirlineSearch(e.target.value)}
                placeholder="Filter airline name or country..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-aviation-950 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Rank by:</span>
              <button
                onClick={() => setAirlineSort('on_time_rate')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  airlineSort === 'on_time_rate'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'border-slate-800 text-slate-400 hover:bg-aviation-800'
                }`}
              >
                On-Time Rate %
              </button>
              <button
                onClick={() => setAirlineSort('avg_delay_minutes')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  airlineSort === 'avg_delay_minutes'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'border-slate-800 text-slate-400 hover:bg-aviation-800'
                }`}
              >
                Lowest Delay
              </button>
              <button
                onClick={() => setAirlineSort('total_flights')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  airlineSort === 'total_flights'
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    : 'border-slate-800 text-slate-400 hover:bg-aviation-800'
                }`}
              >
                Flight Volume
              </button>
            </div>
          </div>

          {/* Airlines Ranking Table */}
          <div className="glass-panel overflow-hidden border border-slate-800">
            <div className="table-wrapper">
              <table className="text-xs text-slate-200">
                <thead className="bg-aviation-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">Airline Name</th>
                    <th className="py-3 px-4 text-left">Alliance</th>
                    <th className="py-3 px-4 text-left">Fleet Size</th>
                    <th className="py-3 px-4 text-left">Flights Handled</th>
                    <th className="py-3 px-4 text-left">On-Time Rate</th>
                    <th className="py-3 px-4 text-left">Cancel Rate</th>
                    <th className="py-3 px-4 text-right">Avg Dep Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-aviation-900/30">
                  {filteredAirlines.map((airline, idx) => (
                    <tr key={airline.iata_code} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-300">
                            {airline.iata_code}
                          </span>
                          <span className="font-medium text-slate-200">{airline.name}</span>
                          <span className="text-slate-500 text-[11px]">({airline.country})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-aviation-800 border border-slate-700 text-slate-300">
                          {airline.alliance}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {airline.fleet_size} aircraft
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 font-bold">
                        {airline.total_flights.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              airline.on_time_rate >= 75
                                ? 'text-emerald-400 font-bold'
                                : airline.on_time_rate >= 68
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {airline.on_time_rate}%
                          </span>
                          <div className="w-16 bg-aviation-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-1.5 rounded-full"
                              style={{ width: `${airline.on_time_rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {airline.cancellation_rate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {airline.avg_delay_minutes > 15 ? (
                          <span className="text-amber-400 font-bold">+{airline.avg_delay_minutes}m</span>
                        ) : (
                          <span className="text-emerald-400">{airline.avg_delay_minutes}m</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONGODB AGGREGATION ARCHITECTURE */}
      {activeTab === 'mongodb' && (
        <div className="glass-panel p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-sky-400" />
              <span>MongoDB Aggregation Framework Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Academic design principles demonstrating how NoSQL aggregation pipelines process high-volume aviation records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl border border-slate-800 bg-aviation-950 space-y-2">
              <span className="text-sky-400 font-bold block">// 1. Airspace KPIs Overview Pipeline</span>
              <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre">
{`db.flights.aggregate([
  {
    $group: {
      _id: null,
      total_flights: { $sum: 1 },
      on_time_count: {
        $sum: {
          $cond: [
            { $and: [
              { $lte: ["$departure_delay_minutes", 15] },
              { $ne: ["$status", "Cancelled"] }
            ]},
            1, 0
          ]
        }
      },
      avg_dep_delay: { $avg: "$departure_delay_minutes" },
      total_passengers: { $sum: "$passenger_count" }
    }
  }
])`}
              </pre>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-aviation-950 space-y-2">
              <span className="text-emerald-400 font-bold">// 2. Airport Traffic Movements Pipeline</span>
              <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre">
{`db.flights.aggregate([
  {
    $group: {
      _id: "$origin_airport.iata_code",
      departures: { $sum: 1 },
      avg_delay: { $avg: "$departure_delay_minutes" },
      name: { $first: "$origin_airport.name" }
    }
  },
  { $sort: { departures: -1 } },
  { $limit: 10 }
])`}
              </pre>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-aviation-900/60 space-y-3 text-xs">
            <h3 className="font-semibold text-slate-200">Key Database Indexing Decisions:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>
                <span className="text-slate-200 font-mono">status + scheduled_departure compound index</span>: Accelerates filtered queries and time-series aggregations without collection scans.
              </li>
              <li>
                <span className="text-slate-200 font-mono">origin_airport.iata_code & destination_airport.iata_code</span>: Powers fast corridor lookups and airport movement summaries.
              </li>
              <li>
                <span className="text-slate-200 font-mono">coordinates 2dsphere index</span> on airports collection: Enables GeoJSON geospatial proximity and boundary queries.
              </li>
              <li>
                <span className="text-slate-200 font-mono">text search index</span> across airline and airport names/cities for flexible keyword exploration.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
