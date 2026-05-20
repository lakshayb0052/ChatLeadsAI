'use client';

import React, { useEffect, useState } from 'react';
import {
  Smartphone, ShieldCheck, Zap, Loader2, Lock,
  Wifi, Plus, Trash2, Server, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Session {
  id: number; session_id: string; status: string;
  qr_code: string | null; last_seen: string;
}

function ClockIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SessionCard({ session, onDelete, isDeleting }: { session: Session; onDelete: () => void; isDeleting: boolean }) {
  const isConnected = session.status === 'connected';
  const hasQR = !!session.qr_code;

  return (
    <div className={`glass-card rounded-3xl flex flex-col overflow-hidden relative transition-all duration-500 ${
      isDeleting ? 'opacity-40 scale-95' : 'glass-card-hover'
    }`}>
      {isDeleting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-3 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <Loader2 className="animate-spin text-red-600" size={36} />
          <p className="text-red-600 font-black text-xs uppercase tracking-widest">Purging Session...</p>
        </div>
      )}

      {/* Card Header */}
      <div className="p-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
            style={{
              background: isConnected
                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))'
                : 'var(--bg-hover)',
              border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'var(--border-glow)'}`,
            }}>
            {isConnected && (
              <div className="absolute inset-0 rounded-2xl opacity-50"
                style={{ animation: 'ping-slow 2s ease-out infinite', background: 'rgba(16,185,129,0.12)' }} />
            )}
            <Smartphone size={22} className={isConnected ? 'text-emerald-600' : 'text-[var(--text-ghost)]'} />
          </div>
          <div>
            <h4 className="font-black text-[var(--text-primary)] capitalize">
              {session.session_id.replace(/_/g, ' ')}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text-ghost)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                {session.status}
              </span>
            </div>
          </div>
        </div>

        <button onClick={onDelete}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all animate-float"
          style={{ background: 'rgba(239,68,68,0.04)', color: 'var(--text-muted)', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
        {isConnected ? (
          <div className="text-center space-y-5">
            {/* Connected glow ring */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full opacity-20 animate-pulse"
                style={{ background: 'radial-gradient(circle, #10b981, transparent)', transform: 'scale(1.5)' }} />
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.15)' }}>
                <ShieldCheck size={40} className="text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-[var(--text-primary)]">Secured & Active</p>
              <p className="text-xs font-medium mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Encrypted session active.<br />Monitoring incoming leads.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
              style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
              <Wifi size={14} /> Live Sync
            </div>
          </div>
        ) : hasQR ? (
          <div className="text-center space-y-5">
            <div className="p-5 rounded-2xl inline-block relative"
              style={{ background: 'white', boxShadow: '0 10px 35px rgba(124,58,237,0.08)', border: '3px solid var(--border-glow)' }}>
              <QRCodeSVG value={session.qr_code!} size={180} level="H" fgColor="#110b29" />
            </div>
            <div>
              <p className="text-base font-black text-[var(--text-primary)]">Scan to Connect</p>
              <p className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Open WhatsApp → Linked Devices → Link a Device
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full animate-spin"
                style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }} />
              <div className="absolute inset-3 rounded-full animate-spin"
                style={{ border: '2px solid var(--border-subtle)', borderBottomColor: 'var(--purple-mid)', animationDirection: 'reverse', animationDuration: '0.7s' }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              Requesting QR Token...
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="p-5 grid grid-cols-2 gap-3"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-hover)' }}>
        <div className="flex items-center gap-2">
          <Lock size={13} style={{ color: 'var(--text-ghost)' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>E2EE Ready</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <ClockIcon size={13} className="text-[var(--text-ghost)]" />
          <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
            {new Date(session.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  const [maxSessions, setMaxSessions] = useState(5);
  const [role, setRole] = useState('user');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMaxSessions(Number(localStorage.getItem('max_sessions') || '5'));
      setRole(localStorage.getItem('role') || 'user');
    }
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${apiUrl}/sessions/`, {
        headers: getHeaders()
      });
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
    
    // Client Side Quotas Guard
    if (role !== 'superadmin' && sessions.length >= maxSessions) {
      alert(`Limit Reached: Your company is capped at a maximum of ${maxSessions} active WhatsApp sessions.`);
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/sessions/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ session_id: newSessionId.toLowerCase().replace(/\s+/g, '_') })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to initialize session');
      }
      setNewSessionId(''); setShowModal(false); fetchSessions();
    } catch (e: any) {
      alert(e.message || 'Error occurred initializing session.');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm(`Permanently delete "${sessionId}"?`)) return;
    setDeletingSessionId(sessionId);
    try {
      await fetch(`${apiUrl}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      fetchSessions();
    } catch (e) { alert(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`); }
    finally { setDeletingSessionId(null); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto animate-fade-in"
          style={{ background: 'rgba(17,11,41,0.4)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 sm:p-10 space-y-6 animate-scale-in max-h-[85vh] sm:max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-purple)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-primary)]">Link New Device</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Assign a unique identifier for this WhatsApp instance.</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all animate-float"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-ghost)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--purple-mid)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-ghost)'; }}>
                <X size={16} />
              </button>
            </div>
            <input type="text" placeholder="e.g. Sales Team, Support Line"
              className="input-dark w-full px-6 py-4 rounded-2xl font-bold text-sm"
              value={newSessionId}
              onChange={e => setNewSessionId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                className="btn-primary flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                Initialize Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Zap size={18} className="text-[var(--purple-mid)]" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Integration Console</p>
          </div>
          <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)] mb-2">
            Device <span className="gradient-text">Fleet</span>
          </h2>
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            Manage WhatsApp instances for cross-channel lead capture.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Quota Progress Bar for Regular Corporate Users */}
          {role !== 'superadmin' && (
            <div className="glass-card rounded-2xl px-5 py-3.5 flex flex-col justify-center min-w-[200px]"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-deep)' }}>
              <div className="flex justify-between items-center mb-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                <span>WhatsApp Quota</span>
                <span className="text-[var(--purple-mid)] font-black">{sessions.length} / {maxSessions}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (sessions.length / maxSessions) * 100)}%`,
                    background: sessions.length >= maxSessions ? 'linear-gradient(90deg, #ec4899, #ef4444)' : 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                  }} />
              </div>
            </div>
          )}
          
          <button onClick={() => setShowModal(true)}
            disabled={role !== 'superadmin' && sessions.length >= maxSessions}
            className="btn-primary px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Link New Device
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Smartphone size={18} className="text-[var(--purple-mid)]" />
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Syncing Session Fleet...
          </p>
        </div>
      ) : error ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-5 rounded-3xl"
          style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <Server size={36} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-[var(--text-primary)]">Connection Interrupted</h3>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Attempting to Re-Sync with Hub...
          </p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card rounded-3xl p-20 text-center space-y-5 animate-scale-in"
          style={{ border: '1px dashed var(--border-bright)' }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}>
            <Smartphone size={36} style={{ color: 'var(--text-ghost)' }} />
          </div>
          <h3 className="text-xl font-black text-[var(--text-primary)]">No Active Sessions</h3>
          <p className="max-w-sm mx-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start by linking your primary WhatsApp account to begin capturing lead intelligence.
          </p>
          <button onClick={() => setShowModal(true)}
            className="btn-primary inline-flex px-8 py-4 rounded-2xl font-black text-sm items-center gap-2">
            <Plus size={16} /> Link First Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {sessions.map(s => (
            <SessionCard key={s.id} session={s}
              onDelete={() => handleDelete(s.session_id)}
              isDeleting={deletingSessionId === s.session_id} />
          ))}
        </div>
      )}
    </div>
  );
}
