import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Clock,
  AlertTriangle,
  Users,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line
} from 'recharts';

import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  KPIOverview,
  StatusDistributionItem,
  MonthlyTrendItem,
  DelayAnalyticsResponse,
  AirportTrafficResponse,
  Flight
} from '../types';

const STATUS_COLORS: Record<string, string> = {
  Landed: '#10B981',
  Delayed: '#F59E0B',
  Scheduled: '#64748B',
  Cancelled: '#EF4444',
  Diverted: '#F97316',
  'En Route': '#0EA5E9'
};

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIOverview | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistributionItem[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);
  const [delaysData, setDelaysData] = useState<DelayAnalyticsResponse | null>(null);
  const [trafficData, setTrafficData] = useState<AirportTrafficResponse | null>(null);
  const [recentFlights, setRecentFlights] = useState<Flight[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          kpisRes,
          statusRes,
          monthlyRes,
          delaysRes,
          trafficRes,
          flightsRes
        ] = await Promise.all([
          api.getKPIOverview(),
          api.getStatusDistribution(),
          api.getMonthlyTrends(),
          api.getDelayAnalytics(),
          api.getAirportTrafficAnalytics(),
          api.getFlights({ page: 1, page_size: 7, sort_by: 'scheduled_departure', sort_dir: 'desc' })
        ]);

        setKpis(kpisRes);
        setStatusDist(statusRes);
        setMonthlyTrends(monthlyRes);
        setDelaysData(delaysRes);
        setTrafficData(trafficRes);
        setRecentFlights(flightsRes.items);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Aggregating MongoDB AirTrafficDB corpus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Air Traffic Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time MongoDB aggregation metrics, delay diagnostics, and synthetic flight corpus overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/airspace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 text-xs font-semibold tracking-wide transition-all"
          >
            <Activity className="h-4 w-4 text-sky-400" />
            <span>Monitor Live Airspace</span>
          </Link>
          <Link
            to="/flights"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aviation-800 border border-slate-700 text-slate-200 hover:bg-aviation-700 text-xs font-semibold tracking-wide transition-all"
          >
            <span>Manage Flights</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Flights Indexed"
          value={kpis?.total_flights.toLocaleString() || '50,000'}
          subtitle="AirTrafficDB 'flights' collection"
          icon={Plane}
          accentColor="sky"
        />
        <StatCard
          title="On-Time Performance"
          value={`${kpis?.on_time_rate || 0}%`}
          subtitle="Departure delay ≤ 15 min"
          icon={Clock}
          accentColor="emerald"
          trend={{ value: `${kpis?.delayed_rate || 0}% delayed`, isPositive: (kpis?.on_time_rate || 0) >= 70 }}
        />
        <StatCard
          title="Average Departure Delay"
          value={`${kpis?.avg_departure_delay || 0}m`}
          subtitle={`Arrival avg: ${kpis?.avg_arrival_delay || 0}m`}
          icon={AlertTriangle}
          accentColor="amber"
        />
        <StatCard
          title="Active Simulated Flights"
          value={kpis?.active_flights_count || 94}
          subtitle="Currently airborne en route"
          icon={Activity}
          accentColor="indigo"
          trend={{ value: 'Real-time telemetry', isPositive: true }}
        />
      </div>

      {/* Primary Analytics Section: Status Donut + Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Donut */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <span>Flight Status Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Relative proportions across all 50,000 scheduled flights.
            </p>
          </div>

          <div className="h-64 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {statusDist.map((entry) => (
                    <Cell
                      key={`cell-${entry.status}`}
                      fill={STATUS_COLORS[entry.status] || '#94A3B8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#F8FAFC'
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `${Number(value).toLocaleString()} flights (${item.payload.percentage}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {statusDist.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || '#94A3B8' }}
                  />
                  <span className="text-slate-300">{item.status}</span>
                </div>
                <span className="font-mono text-slate-400">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Flight Volume & Delay Trend */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-400" />
                <span>Monthly Flight Volume & Delay Trend</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aggregated by month: bars denote operations count, line denotes average departure delay (mins).
              </p>
            </div>
          </div>

          <div className="h-72 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#F59E0B"
                  fontSize={11}
                  unit="m"
                />
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
                  yAxisId="left"
                  dataKey="flight_count"
                  name="Flight Volume"
                  fill="#0EA5E9"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_delay_minutes"
                  name="Avg Delay (min)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Peak season operations managed</span>
            <Link to="/analytics" className="text-sky-400 hover:underline flex items-center gap-1">
              Explore deep analytics <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Row: Delay Causes & Busiest Airports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay Causes Breakdown */}
        <div className="glass-panel p-6">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>Root Delay Cause Distribution</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Aggregated minutes lost by aviation causality category.
          </p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={delaysData?.causes || []}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} unit="m" />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={11}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#F8FAFC'
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${Number(val).toLocaleString()} mins (${item.payload.percentage}%)`,
                    'Delay Duration'
                  ]}
                />
                <Bar dataKey="total_minutes" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Busiest Airports Leaderboard */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                <span>Busiest Airports by Traffic Volume</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Total commercial aircraft movements (departures + arrivals).
              </p>
            </div>
            <Link to="/airports" className="text-xs text-sky-400 hover:underline">
              View all 100
            </Link>
          </div>

          <div className="space-y-3">
            {trafficData?.busiest_airports.slice(0, 5).map((airport, idx) => {
              const maxMovements = trafficData.busiest_airports[0]?.total_movements || 1;
              const pct = Math.round((airport.total_movements / maxMovements) * 100);
              return (
                <div key={airport.iata_code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <span className="font-mono font-bold text-sky-300">{airport.iata_code}</span>
                      <span className="text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">
                        {airport.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-300">
                      {airport.total_movements.toLocaleString()} mvts
                    </span>
                  </div>
                  <div className="w-full bg-aviation-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Flights Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plane className="h-4 w-4 text-sky-400" />
              <span>Recent Flight Operations</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sample of scheduled & landed movements indexed in MongoDB.
            </p>
          </div>
          <Link
            to="/flights"
            className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open Flight Operations Table</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="table-wrapper border border-slate-800/80">
          <table className="text-xs text-slate-300">
            <thead className="bg-aviation-950 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">Flight</th>
                <th className="py-2.5 px-3 text-left">Airline</th>
                <th className="py-2.5 px-3 text-left">Route</th>
                <th className="py-2.5 px-3 text-left">Scheduled Dep (UTC)</th>
                <th className="py-2.5 px-3 text-left">Status</th>
                <th className="py-2.5 px-3 text-left">Delay</th>
                <th className="py-2.5 px-3 text-left">Aircraft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-aviation-900/40">
              {recentFlights.map((flight) => (
                <tr key={flight.id || flight.flight_number} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-semibold text-sky-300">
                    {flight.flight_number}
                  </td>
                  <td className="py-2.5 px-3">{flight.airline?.name}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                    {flight.origin_airport?.iata_code} → {flight.destination_airport?.iata_code}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {flight.scheduled_departure ? flight.scheduled_departure.replace('T', ' ').slice(0, 16) : '-'}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={flight.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {flight.departure_delay_minutes > 0 ? (
                      <span className="text-amber-400">+{flight.departure_delay_minutes}m</span>
                    ) : flight.departure_delay_minutes < 0 ? (
                      <span className="text-emerald-400">{flight.departure_delay_minutes}m</span>
                    ) : (
                      <span className="text-slate-400">On Time</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{flight.aircraft?.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
