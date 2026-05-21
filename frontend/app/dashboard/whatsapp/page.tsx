'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, ShieldCheck, Zap, Loader2, Lock,
  Wifi, Plus, Trash2, Server, X, Briefcase, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Session {
  id: number;
  session_id: string;
  status: string;
  qr_code: string | null;
  last_seen: string;
  user_id: number;
  owner_company: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

interface CompanyGroup {
  company: string;
  ownerName: string | null;
  ownerEmail: string | null;
  sessions: Session[];
}

function ClockIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SessionCard({ session, onDelete, isDeleting }: {
  session: Session; onDelete: () => void; isDeleting: boolean;
}) {
  const isConnected = session.status === 'connected';
  const hasQR = !!session.qr_code;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`glass-card rounded-2xl md:rounded-3xl flex flex-col overflow-hidden relative transition-all duration-500 ${
        isDeleting ? 'opacity-40 scale-95' : 'glass-card-hover'
      }`}
    >
      {isDeleting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-2 md:space-y-3 rounded-2xl md:rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <Loader2 className="animate-spin text-red-600" size={32} />
          <p className="text-red-600 font-black text-[10px] md:text-xs uppercase tracking-widest">Purging Session...</p>
        </div>
      )}

      {/* Card Header */}
      <div className="p-4 md:p-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center relative"
            style={{
              background: isConnected
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))'
                : 'var(--bg-hover)',
              border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'var(--border-glow)'}`,
            }}>
            {isConnected && (
              <div className="absolute inset-0 rounded-xl md:rounded-2xl opacity-50"
                style={{ animation: 'ping-slow 2s ease-out infinite', background: 'rgba(16,185,129,0.12)' }} />
            )}
            <Smartphone size={20} className={`md:w-6 md:h-6 ${isConnected ? 'text-emerald-600' : 'text-[var(--text-ghost)]'}`} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-sm md:text-base text-[var(--text-primary)] capitalize truncate">
              {session.session_id.replace(/_/g, ' ')}
            </h4>
            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text-ghost)]'}`} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate" style={{ color: 'var(--text-secondary)' }}>
                {session.status}
              </span>
            </div>
          </div>
        </div>

        <button onClick={onDelete}
          className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-lg md:rounded-xl flex items-center justify-center transition-all group"
          style={{ background: 'rgba(239,68,68,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <Trash2 size={14} className="md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center min-h-[220px] md:min-h-[280px]">
        {isConnected ? (
          <div className="text-center space-y-4 md:space-y-5">
            <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto">
              <div className="absolute inset-0 rounded-full opacity-20 animate-pulse"
                style={{ background: 'radial-gradient(circle, #10b981, transparent)', transform: 'scale(1.5)' }} />
              <div className="w-full h-full rounded-2xl md:rounded-3xl flex items-center justify-center relative"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.15)' }}>
                <ShieldCheck size={32} className="md:w-10 md:h-10 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-base md:text-lg font-black text-[var(--text-primary)]">Secured & Active</p>
              <p className="text-[10px] md:text-xs font-medium mt-1 md:mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Encrypted session active.<br />Monitoring incoming leads.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black uppercase tracking-widest"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
              <Wifi size={12} className="md:w-3.5 md:h-3.5" /> Live Sync
            </div>
          </div>
        ) : hasQR ? (
          <div className="text-center space-y-4 md:space-y-5">
            <div className="p-3 md:p-5 rounded-xl md:rounded-2xl inline-block relative"
              style={{ background: 'white', boxShadow: '0 10px 35px rgba(37,99,235,0.08)', border: '3px solid var(--border-glow)' }}>
              <QRCodeSVG value={session.qr_code!} size={140} className="md:w-[170px] md:h-[170px]" level="H" fgColor="#020617" />
            </div>
            <div>
              <p className="text-sm md:text-base font-black text-[var(--text-primary)]">Scan to Connect</p>
              <p className="text-[9px] md:text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                WhatsApp → Linked Devices → Link a Device
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 md:space-y-4">
            <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto">
              <div className="absolute inset-0 rounded-full animate-spin"
                style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }} />
              <div className="absolute inset-2 md:inset-3 rounded-full animate-spin"
                style={{ border: '2px solid var(--border-subtle)', borderBottomColor: 'var(--purple-mid)', animationDirection: 'reverse', animationDuration: '0.7s' }} />
            </div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              Requesting QR Token...
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-4 md:p-5 grid grid-cols-2 gap-2 md:gap-3"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-hover)' }}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Lock size={12} className="md:w-3.5 md:h-3.5" style={{ color: 'var(--text-ghost)' }} />
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>E2EE Ready</span>
        </div>
        <div className="flex items-center justify-end gap-1.5 md:gap-2">
          <ClockIcon size={12} className="md:w-3.5 md:h-3.5 text-[var(--text-ghost)]" />
          <span className="text-[9px] md:text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            {new Date(session.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Company Group Block (superadmin only) ── */
function CompanyGroupBlock({ group, deletingSessionId, onDelete }: {
  group: CompanyGroup;
  deletingSessionId: string | null;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const connectedCount = group.sessions.filter(s => s.status === 'connected').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl md:rounded-3xl overflow-hidden"
      style={{ border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-soft)' }}
    >
      {/* Company Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-5 transition-colors text-left gap-4"
        style={{ background: 'var(--bg-hover)', borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 md:gap-4">
          {/* Company Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-lg text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1e3a8a)', boxShadow: 'var(--glow-purple)' }}>
            {(group.company || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <p className="font-black text-[var(--text-primary)] text-base md:text-lg truncate">{group.company || 'Unknown Company'}</p>
              {/* Connected badge */}
              {connectedCount > 0 && (
                <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shrink-0"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                  <span className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  {connectedCount} Live
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-1">
              {group.ownerName && (
                <span className="text-[10px] md:text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                  {group.ownerName}
                </span>
              )}
              {group.ownerEmail && (
                <span className="text-[9px] md:text-[10px] truncate" style={{ color: 'var(--text-ghost)' }}>
                  <span className="hidden md:inline">· </span>{group.ownerEmail}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          {/* Session count pill */}
          <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-glow)' }}>
            <Smartphone size={12} className="md:w-3.5 md:h-3.5" style={{ color: 'var(--purple-mid)' }} />
            <span className="text-[10px] md:text-xs font-black" style={{ color: 'var(--purple-mid)' }}>
              {group.sessions.length} {group.sessions.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          {collapsed ? <ChevronDown size={16} className="md:w-4.5 md:h-4.5" style={{ color: 'var(--text-ghost)' }} /> : <ChevronUp size={16} className="md:w-4.5 md:h-4.5" style={{ color: 'var(--text-ghost)' }} />}
        </div>
      </button>

      {/* Sessions Grid */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {group.sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={() => onDelete(s.session_id)}
                isDeleting={deletingSessionId === s.session_id}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [maxSessions, setMaxSessions] = useState(5);
  const [role, setRole] = useState('user');

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMaxSessions(Number(localStorage.getItem('max_sessions') || '5'));
      setRole(localStorage.getItem('role') || 'user');
    }
  }, []);

  const isSuperAdmin = role === 'superadmin';

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${apiUrl}/sessions/`, { headers: getHeaders() });
      if (!res.ok) throw new Error();
      setSessions(await res.json());
      setError(false); setLoading(false);
    } catch { setError(true); setLoading(false); }
  };

  useEffect(() => {
    fetchSessions();
    const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      const ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'ping' })), 30000);
      ws.addEventListener('close', () => clearInterval(ping));
    };
    ws.onmessage = e => { try { const m = JSON.parse(e.data); if (m.event === 'session_updated') fetchSessions(); } catch {} };
    return () => ws.close();
  }, []);

  const handleCreate = async () => {
    if (!newSessionId.trim()) return;
    if (!isSuperAdmin && sessions.length >= maxSessions) {
      alert(`Limit Reached: Your company is capped at ${maxSessions} active sessions.`);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/sessions/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ session_id: newSessionId.toLowerCase().replace(/\s+/g, '_') })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed'); }
      setNewSessionId(''); setShowModal(false); fetchSessions();
    } catch (e: any) { alert(e.message || 'Error initializing session.'); }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm(`Permanently delete "${sessionId}"?`)) return;
    setDeletingSessionId(sessionId);
    try {
      await fetch(`${apiUrl}/sessions/${sessionId}`, { method: 'DELETE', headers: getHeaders() });
      fetchSessions();
    } catch (e) { alert(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`); }
    finally { setDeletingSessionId(null); }
  };

  // Group sessions by company (superadmin view)
  const companyGroups: CompanyGroup[] = React.useMemo(() => {
    if (!isSuperAdmin) return [];
    const map = new Map<string, CompanyGroup>();
    sessions.forEach(s => {
      const key = s.owner_company || 'Unassigned';
      if (!map.has(key)) {
        map.set(key, {
          company: key,
          ownerName: s.owner_name,
          ownerEmail: s.owner_email,
          sessions: []
        });
      }
      map.get(key)!.sessions.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.company.localeCompare(b.company));
  }, [sessions, isSuperAdmin]);

  // Stats for superadmin
  const totalConnected = sessions.filter(s => s.status === 'connected').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8 pb-20"
    >
      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
            style={{ background: 'rgba(17,11,41,0.6)', backdropFilter: 'blur(16px)' }}>
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 max-h-[85vh] sm:max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-bright)', boxShadow: '0 0 40px rgba(109, 40, 217, 0.15)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Link New Device</h3>
                  <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Assign a unique identifier for this WhatsApp instance.</p>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-ghost)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--purple-mid)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-ghost)'; }}>
                  <X size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
              <input type="text" placeholder="e.g. Sales Team, Support Line"
                className="input-dark w-full px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[var(--purple-mid)]"
                value={newSessionId}
                onChange={e => setNewSessionId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-opacity-80 transition-all"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button onClick={handleCreate}
                  className="btn-primary flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                  Initialize Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Zap size={16} className="md:w-4.5 md:h-4.5 text-[var(--purple-mid)]" />
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Integration Console</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-1 md:mb-2">
            Device <span className="gradient-text">Fleet</span>
          </h2>
          <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isSuperAdmin
              ? `${companyGroups.length} Companies · ${sessions.length} Total Sessions · ${totalConnected} Live`
              : 'Manage WhatsApp instances for cross-channel lead capture.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 mt-2 md:mt-0">
          {/* Quota bar for regular users */}
          {!isSuperAdmin && (
            <div className="glass-card rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-3.5 flex flex-col justify-center min-w-[200px]"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-deep)' }}>
              <div className="flex justify-between items-center mb-1 md:mb-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                <span>WhatsApp Quota</span>
                <span className="text-[var(--purple-mid)] font-black">{sessions.length} / {maxSessions}</span>
              </div>
              <div className="w-full h-1 md:h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (sessions.length / maxSessions) * 100)}%`,
                    background: sessions.length >= maxSessions
                      ? 'linear-gradient(90deg, #ec4899, #ef4444)'
                      : 'linear-gradient(90deg, #0ea5e9, #2563eb)'
                  }} />
              </div>
            </div>
          )}

          {/* Superadmin stats pills */}
          {isSuperAdmin && (
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 md:gap-3">
              <div className="glass-card rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 flex items-center justify-center sm:justify-start gap-2 md:gap-3"
                style={{ border: '1px solid var(--border-subtle)' }}>
                <Users size={14} className="md:w-3.5 md:h-3.5" style={{ color: 'var(--purple-mid)' }} />
                <div>
                  <p className="text-xs md:text-sm font-black" style={{ color: 'var(--text-primary)' }}>{companyGroups.length}</p>
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Companies</p>
                </div>
              </div>
              <div className="glass-card rounded-xl md:rounded-2xl px-3 md:px-5 py-2 md:py-3 flex items-center justify-center sm:justify-start gap-2 md:gap-3"
                style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                <Wifi size={14} className="md:w-3.5 md:h-3.5 text-emerald-500" />
                <div>
                  <p className="text-xs md:text-sm font-black text-emerald-500">{totalConnected}</p>
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Live</p>
                </div>
              </div>
            </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            disabled={!isSuperAdmin && sessions.length >= maxSessions}
            className="btn-primary px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={16} className="md:w-4.5 md:h-4.5 group-hover:rotate-90 transition-transform duration-300" />
            Link New Device
          </motion.button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-4 md:space-y-5">
          <div className="relative w-12 h-12 md:w-16 md:h-16">
            <div className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Smartphone size={16} className="md:w-4.5 md:h-4.5 text-[var(--purple-mid)]" />
            </div>
          </div>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Syncing Session Fleet...
          </p>
        </div>
      ) : error ? (
        <div className="py-16 md:py-24 flex flex-col items-center justify-center space-y-4 md:space-y-5 rounded-2xl md:rounded-3xl"
          style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center animate-pulse"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <Server size={32} className="md:w-9 md:h-9 text-red-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">Connection Interrupted</h3>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSessions} 
            className="btn-primary px-5 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-sm">
            Retry
          </motion.button>
        </div>
      ) : sessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl md:rounded-3xl p-10 md:p-20 text-center space-y-4 md:space-y-5"
          style={{ border: '1px dashed var(--border-bright)' }}>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}>
            <Smartphone size={28} className="md:w-9 md:h-9" style={{ color: 'var(--text-ghost)' }} />
          </div>
          <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">No Active Sessions</h3>
          <p className="max-w-sm mx-auto text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start by linking your primary WhatsApp account to begin capturing lead intelligence.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm items-center gap-2">
            <Plus size={14} className="md:w-4 md:h-4" /> Link First Device
          </motion.button>
        </motion.div>
      ) : isSuperAdmin ? (
        /* ── Superadmin: Grouped by company ── */
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="space-y-4 md:space-y-6"
        >
          {companyGroups.map(group => (
            <CompanyGroupBlock
              key={group.company}
              group={group}
              deletingSessionId={deletingSessionId}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      ) : (
        /* ── Regular user: flat grid ── */
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
        >
          {sessions.map(s => (
            <SessionCard key={s.id} session={s}
              onDelete={() => handleDelete(s.session_id)}
              isDeleting={deletingSessionId === s.session_id} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
