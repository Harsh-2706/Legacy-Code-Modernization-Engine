"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileCode2, UploadCloud, Activity, Cpu } from "lucide-react";
import clsx from "clsx";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ingest", label: "Ingest Repository", icon: UploadCloud },
    { href: "/explorer", label: "Analysis Explorer", icon: FileCode2 }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#1e293b]/50 backdrop-blur-md flex flex-col h-screen shrink-0 relative z-20">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight leading-none text-white">Modernizer<br/><span className="text-[10px] text-blue-400 font-normal uppercase tracking-widest">Engine</span></h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Core Modules</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm border",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-inner" 
                  : "text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-200"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-blue-400" : "text-slate-500")} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Scaledown Configured
      </div>
    </aside>
  );
}
