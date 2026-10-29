import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  HardDrive,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus } from '../types';

export const DatabaseStatusPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMessage, setReseedMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (err) {
      console.error('Failed to load database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopyUri = () => {
    if (status?.mongo_uri) {
      navigator.clipboard.writeText(status.mongo_uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed MongoDB AirTrafficDB with 50,000 flight records?')) return;
    try {
      setReseedLoading(true);
      setReseedMessage(null);
      const res = await api.reseedDatabase();
      setReseedMessage(res.message);
      await fetchStatus();
    } catch (err: any) {
      setReseedMessage(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Database className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                MongoDB Architecture & Health
              </h1>
              <p className="text-xs text-slate-400">
                Database diagnostics, collection telemetry, indexing manifests, and MongoDB Compass integration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:bg-aviation-700 text-xs transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
          <button
            onClick={handleReseed}
            disabled={reseedLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
            <span>{reseedLoading ? 'Reseeding Corpus...' : 'Reseed Database'}</span>
          </button>
        </div>
      </div>

      {reseedMessage && (
        <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-mono">
          {reseedMessage}
        </div>
      )}

      {/* Primary Connection Health Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl ${
                status?.connected
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              }`}
            >
              {status?.connected ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <AlertTriangle className="h-8 w-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">MongoDB Community Server</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    status?.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {status?.connected ? 'CONNECTED & HEALTHY' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active Database: <span className="font-mono text-sky-300 font-bold">{status?.database_name || 'AirTrafficDB'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-aviation-950 px-3 py-1.5 rounded-lg border border-slate-800">
              {status?.mongo_uri || 'mongodb://localhost:27017'}
            </span>
            <button
              onClick={handleCopyUri}
              className="p-2 rounded-lg border border-slate-700 bg-aviation-800 text-slate-300 hover:text-white"
              title="Copy Connection URI"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Database Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-aviation-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Documents</span>
            <span className="text-xl font-mono font-bold text-white">
              {status?.total_documents?.toLocaleString() || '50,170'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-aviation-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Data Size</span>
            <span className="text-xl font-mono font-bold text-sky-400">
              {status?.data_size_mb || 0} MB
            </span>
          </div>

          <div className="p-3 rounded-xl bg-aviation-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Storage Allocated</span>
            <span className="text-xl font-mono font-bold text-emerald-400">
              {status?.storage_size_mb || 0} MB
            </span>
          </div>

          <div className="p-3 rounded-xl bg-aviation-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Collections</span>
            <span className="text-xl font-mono font-bold text-slate-200">
              {status?.collections_count || 4} collections
            </span>
          </div>
        </div>
      </div>

      {/* Collections & Index Manifest */}
      <div className="glass-panel p-6">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-400" />
          <span>Corpus Collections & Index Configurations</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Each collection utilizes specialized B-Tree, compound, text, or 2dsphere indexes for optimal query efficiency.
        </p>

        <div className="table-wrapper border border-slate-800">
          <table className="text-xs text-slate-200">
            <thead className="bg-aviation-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-left">Collection</th>
                <th className="py-3 px-4 text-left">Document Count</th>
                <th className="py-3 px-4 text-left">Index Count</th>
                <th className="py-3 px-4 text-left">Configured Indexes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-aviation-900/30">
              {status?.collections?.map((col) => (
                <tr key={col.collection} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-sky-300">
                    {col.collection}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {col.document_count.toLocaleString()} docs
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {col.index_count}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {col.indexes.map((idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-aviation-950 border border-slate-700 text-slate-300"
                        >
                          {idx}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MongoDB Compass Inspection Guide */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <HardDrive className="h-5 w-5 text-emerald-400" />
          <span>MongoDB Compass Inspection Guide</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Students, reviewers, and examiners can inspect the database structure directly in <strong>MongoDB Compass</strong>:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-sans">
          <li>
            Launch <strong>MongoDB Compass</strong> on this machine.
          </li>
          <li>
            Paste the connection URI:{' '}
            <code className="px-2 py-0.5 rounded bg-aviation-950 border border-slate-700 font-mono text-sky-300">
              mongodb://localhost:27017
            </code>{' '}
            and click <strong>Connect</strong>.
          </li>
          <li>
            Locate database <span className="font-mono text-slate-100 font-bold">AirTrafficDB</span> in the left database tree.
          </li>
          <li>
            Inspect the collections: <code className="font-mono text-emerald-400">flights</code>,{' '}
            <code className="font-mono text-emerald-400">airports</code>,{' '}
            <code className="font-mono text-emerald-400">airlines</code>, and{' '}
            <code className="font-mono text-emerald-400">aircraft_types</code>.
          </li>
          <li>
            Navigate to the <strong>Indexes</strong> tab in Compass to verify compound indexes and text search weights.
          </li>
        </ol>
      </div>
    </div>
  );
};
