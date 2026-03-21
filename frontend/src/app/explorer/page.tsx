"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Folder, Code2, Cpu, RefreshCw, CheckCircle2, GitBranch, Copy, Zap, Info, ArrowRight, BarChart3, Clock, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function ExplorerPage() {
  const { 
    repositories, selectedRepo, functions, selectedFunc, dependencies, 
    optimization, modernization, loading, selectedModel, compressionRate,
    setRepositories, setSelectedRepo, setFunctions, setSelectedFunc, 
    setDependencies, setOptimization, setModernization, setLoading, 
    setSelectedModel, setCompressionRate, resetFunctionState 
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    fetchRepos();
    fetchAnalytics();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await axios.get("http://localhost:8000/repositories");
      setRepositories(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:8000/analytics/modernization");
      setMetrics(res.data.slice(-5)); // Get last 5 for a small trend
    } catch (e) { console.error(e); }
  };

  const handleRepoClick = async (repo: any) => {
    setSelectedRepo(repo);
    resetFunctionState();
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/repo/${repo.id}/functions`);
      setFunctions(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleFuncClick = async (func: any) => {
    setSelectedFunc(func);
    setOptimization(null);
    setModernization(null);
    setDependencies([]);
    try {
      const res = await axios.get(`http://localhost:8000/function/${func.id}/dependencies`);
      setDependencies(res.data);
    } catch (e) { console.error(e); }
  };

  const runModernization = async () => {
    if (!selectedFunc) return;
    setLoading(true);
    try {
      // Step 1: Optimize context with Scaledown
      const optRes = await axios.post(`http://localhost:8000/function/${selectedFunc.id}/optimize?model=${selectedModel}&rate=${compressionRate}`);
      setOptimization(optRes.data);

      // Step 2: Generate code using compressed context
      const genRes = await axios.post(`http://localhost:8000/function/${selectedFunc.id}/generate?model=${selectedModel}&rate=${compressionRate}`);
      // Ensure we extract the modernization object correctly
      setModernization(genRes.data);
      
      fetchAnalytics();
    } catch (e) { 
      console.error(e);
      setModernization({ 
        modern_code: "# Error: Modernization pipeline interrupted. Check terminal logs.",
        successful_model: "NONE"
      });
    }
    setLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0f1d] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Dynamic Navigation */}
      <nav className="h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="text-white w-5 h-5 shrink-0" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Modernization Engine <span className="text-[10px] py-0.5 px-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full ml-2 uppercase">v2.0-core</span></h1>
            <p className="text-[10px] text-slate-500 font-medium">Context Optimization and Transformation Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400">
             <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-500"/> Scaledown Active</span>
             <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Pipeline Verified</span>
           </div>
        </div>
      </nav>

      {/* 3-Panel Grid System */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* PANEL 1: NAVIGATOR (Left) */}
        <aside className="w-72 border-r border-white/5 flex flex-col bg-slate-900/20 shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repository Explorer</h2>
            <a href="/ingest" className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-[9px] font-bold text-emerald-400 transition-colors uppercase">
              + Add
            </a>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            {/* Repo List */}
            <div className="space-y-1">
              {repositories.map(repo => (
                <button
                  key={repo.id} onClick={() => handleRepoClick(repo)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${selectedRepo?.id === repo.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}
                >
                  <Folder className={`w-4 h-4 shrink-0 ${selectedRepo?.id === repo.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                  <span className="truncate">{repo.name}</span>
                </button>
              ))}
            </div>

            {/* Function List */}
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                Legacy Routines
                {loading && !selectedFunc && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
              </h3>
              <div className="space-y-1">
                {!selectedRepo ? (
                  <div className="p-4 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-2 text-slate-600 italic">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px]">Select repository</span>
                  </div>
                ) : functions.map(func => (
                  <button
                    key={func.id} onClick={() => handleFuncClick(func)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border text-[11px] group ${selectedFunc?.id === func.id ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}
                  >
                    <div className="font-bold truncate flex items-center justify-between">
                      {func.name}()
                      {selectedFunc?.id === func.id && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* PANEL 2: SOURCE & TOPOGRAPHY (Center) */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0c1223]">
          {/* Top: Source Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-10 border-b border-white/5 bg-slate-900/40 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legacy Source Viewer</span>
              </div>
              {selectedFunc && (
                <div className="flex items-center gap-3">
                  {optimization ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                      <BarChart3 className="w-3 h-3" /> Context Tokens: {optimization.original_tokens} → {optimization.optimized_tokens}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400">
                      <BarChart3 className="w-3 h-3" /> {(selectedFunc.code.match(/\w+|[^\w\s]/g) || []).length} Est. Function Tokens
                    </div>
                  )}
                </div>
              )}
            </header>
            <div className="flex-1 overflow-auto custom-scrollbar bg-[#0d1117] relative">
              <pre className="p-6 font-mono text-[12px] text-[#d1d5db] leading-relaxed selection:bg-blue-500/40">
                {selectedFunc?.code || "// Select a mission-critical routine to analyze"}
              </pre>
            </div>
          </div>

          {/* Bottom: Dependency Topography */}
          <div className="h-2/5 border-t border-white/5 flex flex-col bg-slate-900/20 overflow-hidden shrink-0">
            <header className="h-10 border-b border-white/5 bg-slate-900/40 flex items-center px-4 shrink-0">
              <GitBranch className="w-4 h-4 text-emerald-500 mr-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dependency Graph Topography</span>
            </header>
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-[radial-gradient(circle_at_top_right,_rgba(30,41,59,0.3),_transparent)]">
              {!selectedFunc ? (
                <div className="h-full flex items-center justify-center opacity-20"><GitBranch className="w-12 h-12" /></div>
              ) : (
                <div className="flex flex-col items-center gap-4 relative max-w-lg mx-auto py-4">
                  <div className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-600/20 border-2 border-white/10 z-10 text-center min-w-[200px]">
                    {selectedFunc.name}
                  </div>
                  {dependencies.length === 0 ? (
                    <div className="text-[10px] text-slate-600 font-medium italic mt-4">Isolated function - no transitive calls detected.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {dependencies.map((dep, i) => {
                        const callee = functions.find(f => f.id === dep.callee_id);
                        return (
                          <div key={i} className="relative p-3 bg-slate-800/40 border border-white/5 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[11px] font-mono text-slate-300 truncate">{callee?.name || `Routine_${dep.callee_id}`}()</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PANEL 3: MODERNIZATION & METRICS (Right) */}
        <section className="w-[500px] border-l border-white/5 flex flex-col bg-slate-900/40 shrink-0 overflow-hidden">
          {/* Header & Controls */}
          <div className="p-5 border-b border-white/5 flex flex-col gap-5 bg-slate-900/60 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-400 flex items-center gap-2 tracking-tight italic">
                CORTEX-X1 <span className="text-[10px] not-italic font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase">Engine</span>
              </h2>
              <button 
                disabled={!selectedFunc || loading} onClick={runModernization}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 text-[11px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 group"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <><Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" /> Execute Modernization</>}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 mb-1 block pl-1">Primary Model</label>
                <select 
                  value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:border-emerald-500/30 transition-all appearance-none shadow-inner"
                >
                  <optgroup label="Intelligence (Gemini Series)">
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  </optgroup>
                  <optgroup label="Ultra-Fast (Groq Llama 3)">
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B (Groq)</option>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                  </optgroup>
                  <optgroup label="Advanced Reasoning (GPT Series)">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                  </optgroup>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 mb-1 block pl-1">Context Optimizer</label>
                <select 
                  value={compressionRate} onChange={(e) => setCompressionRate(e.target.value)}
                  className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:border-emerald-500/30 transition-all appearance-none shadow-inner"
                >
                  <option value="auto">Auto (Lossless)</option>
                  <option value="high">High (Maximum Savings)</option>
                  <option value="medium">Medium (Reference)</option>
                </select>
              </div>
            </div>

            {/* Real-time Metrics Dashboard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111827] border border-white/5 p-3 rounded-2xl shadow-inner group transition-all hover:border-blue-500/30">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  <BarChart3 className="w-3 h-3 text-blue-500" /> Compression Ratio
                </div>
                <div className="text-sm font-black text-blue-400 flex items-baseline gap-1">
                  {optimization ? `${optimization.reduction_percentage}%` : '---'}
                </div>
                <div className="text-[8px] text-slate-600 mt-1">Context tokens</div>
              </div>
              <div className="bg-[#111827] border border-white/5 p-3 rounded-2xl shadow-inner transition-all hover:border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  <Clock className="w-3 h-3 text-emerald-500" /> Pipeline Latency
                </div>
                <div className="text-sm font-black text-emerald-400 flex items-baseline gap-1">
                  {optimization ? `${optimization.latency.toFixed(2)}s` : '---'}
                </div>
                <div className="text-[8px] text-slate-600 mt-1">Scaledown + overhead</div>
              </div>
              <div className="bg-[#111827] border border-white/5 p-3 rounded-2xl shadow-inner transition-all hover:border-amber-500/30">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  <TrendingDown className="w-3 h-3 text-amber-500" /> Token Delta
                </div>
                <div className="text-[10px] font-black text-amber-500 flex flex-col">
                  {optimization ? (
                    <>
                      <span className="line-through opacity-50 text-[9px]">{optimization.original_tokens} ctx tokens</span>
                      <span className="text-sm">→ {optimization.optimized_tokens}</span>
                      <span className="text-[8px] text-emerald-400 font-bold mt-0.5">−{optimization.original_tokens - optimization.optimized_tokens} saved</span>
                    </>
                  ) : '---'}
                </div>
              </div>
            </div>
            
            {optimization && optimization.reduction_percentage === 0 && (
               <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                 <Info className="w-4 h-4 text-blue-400 shrink-0" />
                 <p className="text-[10px] leading-tight text-blue-300/90 font-medium">Model determined context is maximally dense. 0 tokens were compressed without losing functionality.</p>
               </div>
            )}
          </div>

          {/* Result Area */}
          <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar gap-6">
            
            {/* Context Payload Snippet */}
            <div className="shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Optimized Context Payload</h4>
                {optimization && <span className="text-[9px] font-bold text-emerald-500">{optimization.optimized_tokens} Tokens Forwarded</span>}
              </div>
              <div className="h-28 bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 overflow-auto custom-scrollbar font-mono text-[10px] text-emerald-400/60 leading-relaxed shadow-inner shadow-black/40 italic">
                {optimization ? optimization.optimized_code : "// Context pre-processing will appear here..."}
              </div>
            </div>

            {/* Full Output Panel */}
            <div className="flex-1 flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-500 flex items-center gap-2 px-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5" /> Modernization Output
              </h4>
              
              <AnimatePresence mode="wait">
                {modernization ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="flex flex-col gap-4 flex-1 min-h-[400px]"
                  >
                    {/* Modern Code */}
                    <div className="bg-[#0d1117] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-emerald-500/5">
                      <div className="h-10 bg-white/5 px-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Code2 className="w-3.5 h-3.5" /> modernized_routine.py
                        </div>
                        <button 
                          onClick={() => copyCode(modernization.modern_code)} 
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all text-[9px] font-black uppercase tracking-widest"
                        >
                          {copied ? "Copied" : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      <pre className="p-4 flex-1 overflow-auto custom-scrollbar text-[11px] font-mono text-[#79c0ff] leading-relaxed selection:bg-teal-500/30 whitespace-pre scroll-p-4">
                        {modernization.modern_code}
                      </pre>
                    </div>

                    {/* Logic Documentation */}
                    <div className="bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-xl flex flex-col gap-2 shrink-0">
                      <h5 className="text-[10px] font-black uppercase tracking-tighter text-emerald-400">Structural Mapping Report</h5>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{modernization.explanation}</p>
                      {modernization.successful_model && (
                        <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                          <Cpu className="w-3 h-3" /> Successful Model: <span className="text-emerald-500">{modernization.successful_model}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 border-4 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-700 min-h-[400px]">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                      <Cpu className="w-8 h-8 opacity-20" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-xs font-black uppercase tracking-widest">Awaiting Command</span>
                       <span className="text-[10px] font-medium opacity-50 italic">Execute modernization to begin analysis</span>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Analytics Trends (Footer Section of Panel 3) */}
            <div className="border-t border-white/5 pt-6 mt-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-1">Modernization Latency Trend (Last 5 Runs)</h4>
               <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics}>
                       <Tooltip 
                        contentStyle={{ background: '#0d1117', border: '1px solid #334155', borderRadius: '12px', padding: '8px' }}
                        itemStyle={{ color: '#10b981', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                       />
                       <Bar dataKey="latency_ms" radius={[4, 4, 0, 0]}>
                         {metrics.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={index === metrics.length - 1 ? '#10b981' : '#3b82f6'} fillOpacity={0.6} />
                         ))}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
