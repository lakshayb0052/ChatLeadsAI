'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Users,
  Smartphone,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ChevronRight,
  User,
  Activity,
  Wifi,
  WifiOff,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface Stats {
  summary: { total_leads: number; active_fleet: number; hot_ratio: number };
  scoring: { hot: number; warm: number; cold: number };
  fleet: Array<{ name: string; leads: number }>;
  recent: Array<{ id: number; name: string; score: string; time: string; session: string; message?: string }>;
}

/* ─── Animated Number ───────────────────────────────────── */
function AnimatedNumber({ value }: { value: string | number }) {
  const [display, setDisplay] = useState(0);
  const numVal = parseInt(String(value), 10) || 0;

  useEffect(() => {
    let frame = 0;
    const total = 45;
    const timer = setInterval(() => {
      frame++;
      setDisplay(Math.round((frame / total) * numVal));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [numVal]);

  return <>{display}</>;
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ title, value, label, icon, gradient, glowColor, trend, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", bounce: 0.4 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group cursor-pointer shadow-lg"
      style={{ boxShadow: `0 4px 20px ${glowColor}10`, border: `1px solid ${glowColor}20` }}
    >
      {/* Glow bg */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent)` }} />

      {/* Icon */}
      <motion.div 
        whileHover={{ rotate: 10, scale: 1.1 }}
        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 relative"
        style={{ background: gradient, boxShadow: `0 8px 24px ${glowColor}40` }}>
        <div className="absolute inset-0 rounded-2xl opacity-30"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)' }} />
        <span className="text-white relative z-10">{icon}</span>
      </motion.div>

      {/* Value */}
      <div className="mb-2 flex items-end gap-3">
        <h4 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none drop-shadow-sm">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </h4>
      </div>

      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-secondary)' }}>{label}</p>

      {/* Trend */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
        style={{ background: `${glowColor}15`, border: `1px solid ${glowColor}30`, color: glowColor }}>
        <TrendingUp size={10} />
        {trend}
      </div>
    </motion.div>
  );
}

/* ─── Distribution Row ──────────────────────────────────── */
function DistributionRow({ label, count, total, gradient, glowColor, delay = 0 }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-xs md:text-sm font-black text-[var(--text-primary)]">{count}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.5, delay: delay + 0.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: gradient, boxShadow: `0 0 8px ${glowColor}60` }}
        />
      </div>
      <p className="text-[9px] md:text-[10px] font-bold" style={{ color: 'var(--text-ghost)' }}>
        {percent.toFixed(1)}% of total
      </p>
    </motion.div>
  );
}

/* ─── Bar Chart ─────────────────────────────────────────── */
function FleetBar({ session, maxLeads, index }: { session: { name: string; leads: number }; maxLeads: number; index: number }) {
  const targetHeight = maxLeads > 0 ? (session.leads / maxLeads) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col items-center gap-3 group/bar">
      <div className="w-full relative flex items-end justify-center" style={{ minHeight: '140px', md: { minHeight: '180px' } }}>
        <div className="relative w-full max-w-[32px] md:max-w-[48px]">
          {/* Tooltip */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-10"
            style={{ background: 'rgba(37,99,235,0.9)', border: '1px solid rgba(14,165,233,0.4)', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
            {session.leads} leads
          </div>
          {/* Bar */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${targetHeight}%` }}
            transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
            className="w-full rounded-t-xl relative overflow-hidden"
            style={{
              minHeight: session.leads > 0 ? '8px' : '0',
              maxHeight: '180px',
              background: 'linear-gradient(180deg, rgba(14,165,233,0.9) 0%, rgba(109,40,217,0.6) 100%)',
              border: '1px solid rgba(14,165,233,0.3)',
              boxShadow: '0 0 20px rgba(14,165,233,0.3)',
            }}>
            <div className="absolute inset-x-0 top-0 h-8 opacity-30"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)' }} />
          </motion.div>
        </div>
      </div>
      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center truncate w-full"
        style={{ color: 'var(--text-muted)' }}>
        {session.name}
      </p>
    </div>
  );
}

/* ─── Activity Feed Item ────────────────────────────────── */
function FeedItem({ item, index }: { item: any; index: number }) {
  const isHot = item.score === 'Hot';
  const isWarm = item.score === 'Warm';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1 }}
      whileHover={{ scale: 1.01, backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-glow)' }}
      className="flex items-center gap-3 md:gap-5 p-4 md:p-5 rounded-2xl transition-colors duration-300 group cursor-pointer"
      style={{
        background: 'var(--bg-deep)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 relative`} style={{
        background: isHot
          ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))'
          : isWarm
          ? 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.08))'
          : 'var(--bg-hover)',
        border: isHot ? '1px solid rgba(245,158,11,0.3)' : isWarm ? '1px solid var(--border-bright)' : '1px solid var(--border-glow)',
      }}>
        <User size={18} className={isHot ? 'text-yellow-500' : isWarm ? 'text-[var(--purple-mid)]' : 'text-[var(--text-ghost)]'} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-[var(--text-primary)] text-xs md:text-sm truncate group-hover:text-[var(--purple-mid)] transition-colors">
          {item.name}
        </h4>
        <p className="text-[9px] md:text-[10px] font-bold flex items-center gap-1.5 md:gap-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={10} />
          {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-ghost)' }} />
          <span className="text-[var(--purple-mid)] uppercase tracking-widest truncate">via {item.session.replace('_', ' ')}</span>
        </p>
        {item.message && (
          <p className="text-[10px] md:text-[11px] italic mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
            "{item.message}"
          </p>
        )}
      </div>

      {/* Score */}
      <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest shrink-0 ${
        isHot ? 'badge-hot' : isWarm ? 'badge-warm' : 'badge-cold'
      }`}>
        {item.score}
      </div>

      {/* Arrow */}
      <motion.div 
        whileHover={{ x: 2, y: -2 }}
        className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0"
        style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)' }}>
        <ArrowUpRight size={14} className="md:w-4 md:h-4" />
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiUrl = rawApiUrl.replace(/\/$/, '');
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  const fetchStats = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${apiUrl}/stats/overview`, { headers });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (lastMessage && (lastMessage.event === 'lead_updated' || lastMessage.event === 'session_updated')) {
      fetchStats();
    }
  }, [lastMessage]);

  if (loading || !stats) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 rounded-full"
            style={{ border: '3px solid rgba(14,165,233,0.1)', borderTopColor: '#0ea5e9' }} />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full"
            style={{ border: '2px solid rgba(14,165,233,0.05)', borderBottomColor: '#a78bfa' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={18} className="text-purple-500" />
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-2"
        >
          <p className="text-[var(--text-primary)] font-black text-lg">Initializing War Room</p>
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Syncing intelligence pipeline...
          </p>
        </motion.div>
      </div>
    );
  }

  const maxLeads = Math.max(...(stats.fleet ?? []).map(f => f.leads), 1);

  return (
    <div className="space-y-6 md:space-y-8 pb-20">

      {/* ── Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Sparkles size={16} className="text-[var(--purple-mid)]" />
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">System Command</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-2">
            Intelligence <span className="gradient-text">War Room</span>
          </h2>
          <p className="text-sm md:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            Real-time oversight of your automated lead generation fleet.
          </p>
        </div>

        {/* Connection status */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-sm`}
          style={isConnected ? {
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#34d399',
          } : {
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}>
          {isConnected ? <Wifi size={14} className="md:w-4 md:h-4" /> : <WifiOff size={14} className="md:w-4 md:h-4" />}
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          Fleet: {isConnected ? 'Operational' : 'Offline'}
        </motion.div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Intelligence"
          value={stats.summary.total_leads}
          label="Leads Captured"
          icon={<Users size={24} />}
          gradient="linear-gradient(135deg, #2563eb, #1e3a8a)"
          glowColor="#0ea5e9"
          trend="+12% today"
          delay={0.1}
        />
        <StatCard
          title="Active Fleet"
          value={stats.summary.active_fleet}
          label="Connected Devices"
          icon={<Smartphone size={24} />}
          gradient="linear-gradient(135deg, #059669, #047857)"
          glowColor="#10b981"
          trend="Live Sync"
          delay={0.2}
        />
        <StatCard
          title="Conversion Heat"
          value={`${stats.summary.hot_ratio}%`}
          label="Hot Lead Ratio"
          icon={<Zap size={24} />}
          gradient="linear-gradient(135deg, #d97706, #92400e)"
          glowColor="#f59e0b"
          trend="Action Required"
          delay={0.3}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">

        {/* Fleet Performance Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] mb-1">Fleet Performance</h3>
              <p className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                Leads generated per WhatsApp session
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
               style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)' }}>
              <BarChart2 size={18} className="md:w-5 md:h-5" />
            </div>
          </div>

          <div className="flex-1 flex items-end gap-2 md:gap-4 px-1 md:px-2" style={{ minHeight: '180px', md: { minHeight: '220px' } }}>
            {stats.fleet.length > 0 ? (
              stats.fleet.map((session, i) => (
                <FleetBar key={i} session={session} maxLeads={maxLeads} index={i} />
              ))
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-12 md:py-16 text-center space-y-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center"
                   style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <Smartphone size={24} className="md:w-7 md:h-7" style={{ color: 'var(--text-ghost)' }} />
                </div>
                <p className="text-xs md:text-sm font-bold italic" style={{ color: 'var(--text-ghost)' }}>
                  No sessions connected yet...
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quality Mix */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 md:p-8 flex flex-col"
        >
          <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] mb-1">Quality Mix</h3>
          <p className="text-[10px] md:text-xs font-bold mb-6 md:mb-8" style={{ color: 'var(--text-secondary)' }}>Lead scoring distribution</p>

          <div className="flex-1 flex flex-col justify-center space-y-5 md:space-y-7">
            <DistributionRow
              label="🔥 Hot Leads"
              count={stats.scoring.hot}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #f59e0b, #ef4444)"
              glowColor="#f59e0b"
              delay={0.6}
            />
            <DistributionRow
              label="⚡ Warm Leads"
              count={stats.scoring.warm}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #0ea5e9, #312e81)"
              glowColor="#0ea5e9"
              delay={0.7}
            />
            <DistributionRow
              label="❄️ Cold Leads"
              count={stats.scoring.cold}
              total={stats.summary.total_leads}
              gradient="linear-gradient(90deg, #b3acd8, #5c538a)"
              glowColor="#2563eb"
              delay={0.8}
            />
          </div>

          {/* Insight */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="mt-6 md:mt-8 p-4 md:p-5 rounded-xl md:rounded-2xl"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(37,99,235,0.1)' }}>
                <TrendingUp size={16} className="md:w-4 md:h-4 text-[var(--purple-mid)]" />
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-black text-[var(--purple-mid)]">Growth Detected</p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  High performance signals
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Live Activity Feed ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] mb-1">Live Activity Feed</h3>
            <p className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              Real-time extractions across your fleet
            </p>
          </div>
          <motion.a 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             href="/dashboard/leads"
             className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors"
             style={{ background: 'var(--bg-hover)', color: 'var(--purple-mid)', border: '1px solid var(--border-glow)' }}
          >
            View All <ChevronRight size={12} />
          </motion.a>
        </div>

        <div className="space-y-2 md:space-y-3">
          {stats.recent.length > 0 ? (
            stats.recent.map((item, i) => (
              <FeedItem key={i} item={item} index={i} />
            ))
          ) : (
            <div className="py-16 md:py-24 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-5"
                 style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border-glow)' }}>
                <Activity size={24} className="md:w-7 md:h-7" style={{ color: 'var(--text-ghost)' }} />
              </div>
              <p className="text-sm md:text-base font-black text-[var(--text-primary)] mb-1 md:mb-2">No Recent Activity</p>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
                Awaiting first lead extraction...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

