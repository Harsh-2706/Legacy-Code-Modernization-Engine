"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Cpu, CheckCircle2, BarChart3, RefreshCw, Activity, ArrowRight } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import axios from "axios";

export default function DashboardHome() {
  const { metrics, setMetrics } = useStore();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
    const int = setInterval(fetchData, 5000);
    return () => clearInterval(int);
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, histRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/metrics/summary`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/metrics`)
      ]);
      setMetrics(sumRes.data);
      
      // Map history for charts
      const mapped = histRes.data.map((m: any, i: number) => ({
        name: `Req ${i+1}`,
        tokensSaved: m.tokens_saved,
        compression: m.compression_ratio,
        latency: m.latency_ms
      }));
      setHistory(mapped);
    } catch(e) { console.error(e); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Analytics</h1>
          <p className="text-slate-400">Global modernization telemetry and Scaledown efficiency.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              if (confirm("Are you sure you want to clear all metrics? This will reset the dashboard.")) {
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/metrics/reset`);
                fetchData();
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" /> Reset Metrics
          </button>
          <Link href="/ingest" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            Start Ingestion <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Generations" value={metrics.total_calls} icon={<Cpu className="w-5 h-5 text-indigo-400" />} />
        <StatCard label="Tokens Saved" value={metrics.total_tokens_saved.toLocaleString()} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Avg Compression" value={`${metrics.avg_compression_ratio.toFixed(1)}%`} icon={<BarChart3 className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Avg Latency" value={`${metrics.avg_latency_ms.toFixed(0)} ms`} icon={<RefreshCw className="w-5 h-5 text-blue-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Reduction Over Time */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-200">Token Reduction Over Time</h2>
          </div>
          <div className="h-[300px] w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-sm border border-slate-800/50 border-dashed rounded-xl">No generation data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="tokensSaved" name="Tokens Saved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Compression vs Latency */}
        <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-200">Latency & Compression Stats</h2>
          </div>
          <div className="h-[300px] w-full">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic text-sm border border-slate-800/50 border-dashed rounded-xl">No generation data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#60a5fa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#fbbf24" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="step" dataKey="compression" name="Compression (%)" stroke="#fbbf24" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-slate-800/50">
      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5 truncate">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight truncate">{value}</p>
      </div>
    </div>
  );
}
