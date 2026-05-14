'use client';

import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  Users, 
  Smartphone, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  User,
  MessageCircle,
  Activity
} from 'lucide-react';

interface Stats {
  summary: {
    total_leads: number;
    active_fleet: number;
    hot_ratio: number;
  };
  scoring: {
    hot: number;
    warm: number;
    cold: number;
  };
  fleet: Array<{ name: string; leads: number }>;
  recent: Array<{ id: number; name: string; score: string; time: string; session: string; message?: string }>;
}

import { useWebSocket } from '../hooks/useWebSocket';

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/stats/overview`);
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (lastMessage && (lastMessage.event === 'lead_updated' || lastMessage.event === 'session_updated')) {
      fetchStats();
    }
  }, [lastMessage]);

  if (loading || !stats) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-6">
         <div className="w-20 h-20 border-8 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
         <p className="text-slate-400 font-black text-sm uppercase tracking-widest animate-pulse">Initializing War Room...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] mb-3 text-glow">System Command</p>
          <h2 className="text-5xl font-black tracking-tight text-slate-900">Intelligence War Room</h2>
          <p className="text-slate-400 font-medium mt-2 text-lg">Real-time oversight of your automated lead generation fleet.</p>
        </div>
        
        <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest border transition-all ${
           isConnected 
           ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
           : "bg-rose-50 border-rose-100 text-rose-700"
        }`}>
           <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
           Fleet Status: {isConnected ? "Operational" : "Offline"}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard 
          title="Total Intelligence" 
          value={stats.summary.total_leads.toString()} 
          label="Leads Captured" 
          icon={<Users size={32} />} 
          color="indigo" 
          trend="+12% today"
        />
        <StatCard 
          title="Active Fleet" 
          value={stats.summary.active_fleet.toString()} 
          label="Connected Devices" 
          icon={<Smartphone size={32} />} 
          color="emerald" 
          trend="Syncing live"
        />
        <StatCard 
          title="Conversion Heat" 
          value={`${stats.summary.hot_ratio}%`} 
          label="Hot Lead Ratio" 
          icon={<Zap size={32} />} 
          color="orange" 
          trend="Action required"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Fleet Performance */}
        <div className="xl:col-span-2 glass-card rounded-[3.5rem] p-12 border-slate-100 shadow-2xl shadow-slate-100 flex flex-col group">
           <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Fleet Performance</h3>
                <p className="text-slate-400 font-bold text-sm">Leads generated per WhatsApp session</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                 <Activity size={24} />
              </div>
           </div>

           <div className="flex-1 flex items-end gap-6 min-h-[300px] px-4">
              {stats.fleet.map((session, i) => {
                const max = Math.max(...stats.fleet.map(f => f.leads), 1);
                const height = (session.leads / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                    <div className="w-full relative flex items-end justify-center min-h-[200px]">
                       <div 
                         className="w-16 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl shadow-2xl shadow-indigo-100 transition-all duration-1000 group-hover/bar:scale-x-110 group-hover/bar:to-indigo-300 relative"
                         style={{ height: `${height}%` }}
                       >
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all translate-y-2 group-hover/bar:translate-y-0">
                            {session.leads}
                         </div>
                       </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate w-full">
                       {session.name}
                    </p>
                  </div>
                );
              })}
              {stats.fleet.length === 0 && (
                <div className="w-full flex items-center justify-center py-20 text-slate-300 font-bold italic">
                   No sessions connected yet...
                </div>
              )}
           </div>
        </div>

        {/* Lead Distribution */}
        <div className="glass-card rounded-[3.5rem] p-12 border-slate-100 shadow-2xl shadow-slate-100 flex flex-col">
           <h3 className="text-2xl font-black text-slate-900 mb-2">Quality Mix</h3>
           <p className="text-slate-400 font-bold text-sm mb-12">Lead scoring distribution</p>

           <div className="flex-1 flex flex-col justify-center space-y-8">
              <DistributionRow label="Hot Leads" count={stats.scoring.hot} total={stats.summary.total_leads} color="bg-orange-500" />
              <DistributionRow label="Warm Leads" count={stats.scoring.warm} total={stats.summary.total_leads} color="bg-indigo-500" />
              <DistributionRow label="Cold Leads" count={stats.scoring.cold} total={stats.summary.total_leads} color="bg-slate-300" />
           </div>

           <div className="mt-12 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <p className="text-indigo-900 font-black text-sm">Growth Spurt</p>
                    <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">High performance detected</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Extraction Feed */}
      <div className="glass-card rounded-[3.5rem] p-12 border-slate-100 shadow-2xl shadow-slate-100">
         <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Live Activity Feed</h3>
              <p className="text-slate-400 font-bold text-sm">Real-time extractions across your fleet</p>
            </div>
            <button className="px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-2">
               View All Activity <ChevronRight size={14} />
            </button>
         </div>

         <div className="space-y-6">
            {stats.recent.map((item, i) => (
              <div key={i} className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border border-slate-50 hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-50 group">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
                    item.score === 'Hot' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                 }`}>
                    <User size={24} />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                    <p className="text-slate-400 text-xs font-bold flex items-center gap-2 mb-1">
                       <Clock size={12} /> {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       <span className="w-1 h-1 bg-slate-200 rounded-full" />
                       <span className="text-indigo-500 font-black uppercase tracking-widest text-[9px]">Captured via {item.session.replace('_', ' ')}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] font-medium italic line-clamp-1 group-hover:text-slate-600 transition-colors">
                      "{item.message}"
                    </p>
                 </div>
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    item.score === 'Hot' ? 'bg-orange-500 text-white border-orange-400' : 
                    item.score === 'Warm' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-100 text-slate-400 border-slate-200'
                 }`}>
                    {item.score}
                 </div>
                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                    <ArrowUpRight size={20} />
                 </div>
              </div>
            ))}
            {stats.recent.length === 0 && (
              <div className="py-20 text-center text-slate-300 font-bold italic">
                 No recent activity detected. Awaiting first lead...
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, label, icon, color, trend }: any) {
  const colors: any = {
    indigo: 'from-indigo-600 to-indigo-400 shadow-indigo-100 text-indigo-600 bg-indigo-50',
    emerald: 'from-emerald-600 to-emerald-400 shadow-emerald-100 text-emerald-600 bg-emerald-50',
    orange: 'from-orange-600 to-orange-400 shadow-orange-100 text-orange-600 bg-orange-50',
  };

  return (
    <div className="glass-card rounded-[3.5rem] p-10 border-slate-100 shadow-2xl shadow-slate-100 relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-150 duration-700" />
      
      <div className="relative z-10 space-y-6">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl ${colors[color].split(' shadow')[0]} text-white`}>
           {icon}
        </div>
        <div>
           <div className="flex items-center gap-3">
              <h4 className="text-5xl font-black text-slate-900 tracking-tighter">{value}</h4>
              <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
                 {trend}
              </div>
           </div>
           <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mt-2">{label}</p>
        </div>
      </div>
    </div>
  );
}

function DistributionRow({ label, count, total, color }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-900">{count} Records</span>
       </div>
       <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`${color} h-full rounded-full transition-all duration-1000 shadow-lg`}
            style={{ width: `${percent}%` }}
          />
       </div>
    </div>
  );
}
