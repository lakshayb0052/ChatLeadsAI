'use client';

import React, { useEffect, useState } from 'react';
import { 
  QrCode, 
  RefreshCcw, 
  CheckCircle2, 
  Smartphone,
  ShieldCheck,
  Zap,
  Loader2,
  Lock,
  Wifi,
  Plus,
  Trash2,
  Power,
  Server
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Session {
  id: number;
  session_id: string;
  status: string;
  qr_code: string | null;
  last_seen: string;
}

export default function WhatsAppPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(false);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiUrl = rawApiUrl.replace(/\/$/, "");

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${apiUrl}/sessions/`);
      if (!response.ok) throw new Error('Offline');
      const data = await response.json();
      setSessions(data);
      setError(false);
      setLoading(false);
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const wsUrl = rawWsUrl.endsWith("/ws") ? rawWsUrl : `${rawWsUrl.replace(/\/$/, "")}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === 'session_updated') {
        fetchSessions(); // Refresh all sessions when any changes
      }
    };

    return () => ws.close();
  }, []);

  const [newSessionId, setNewSessionId] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleCreateSession = async () => {
    if (!newSessionId) return;
    try {
      await fetch(`${apiUrl}/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: newSessionId.toLowerCase().replace(/\s+/g, '_') })
      });
      setNewSessionId('');
      setShowModal(false);
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string) => {
    console.log(`[Fleet] Deletion requested for: ${sessionId}`);
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${sessionId}"? This will remotely logout the device.`)) return;
    
    setDeletingSessionId(sessionId);
    try {
      const url = `${apiUrl}/sessions/${sessionId}`;
      console.log(`[Fleet] Sending DELETE request to: ${url}`);
      
      const response = await fetch(url, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[Fleet] Deletion response:`, result);
      
      // Success Notification
      alert(`Account "${sessionId}" has been fully purged and unpaired.`);
      
      fetchSessions();
    } catch (e) {
      console.error(`[Fleet] Deletion failed:`, e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Delete Failed: ${message}`);
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl border border-white/20 animate-scale-in">
              <h3 className="text-3xl font-black text-slate-900 mb-2">Link New Device</h3>
              <p className="text-slate-400 font-medium mb-8">Assign a unique identifier for this WhatsApp instance.</p>
              
              <input 
                type="text" 
                placeholder="e.g. Sales Team, Support Line"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all mb-8"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
              />

              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowModal(false)}
                   className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleCreateSession}
                   className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                 >
                   Initialize
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-2">Integration Console</p>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">WhatsApp Device Fleet</h2>
          <p className="text-slate-400 font-medium mt-1">Manage multiple WhatsApp instances for cross-channel lead capture.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} /> Link New Device
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="animate-spin text-indigo-500" size={48} />
           <p className="text-slate-400 font-bold animate-pulse">Syncing Session Fleet...</p>
        </div>
      ) : (
        /* Sessions Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-12">
          {error && (
            <div className="col-span-full py-20 px-10 glass-card rounded-[4rem] border-rose-100 bg-rose-50/30 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 bg-rose-100 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-2xl animate-pulse">
                  <Server size={44} />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Connection Interrupted</h3>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">Attempting to Re-Sync with Intelligence Hub...</p>
               </div>
            </div>
          )}

          {sessions.length === 0 && !error ? (
            <div className="lg:col-span-3 glass-card rounded-[3rem] p-20 text-center space-y-6 border-dashed border-2 border-slate-200 bg-white/50">
               <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                  <Smartphone size={48} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-slate-900">No Active Sessions</h3>
                 <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Start by linking your primary WhatsApp account to begin capturing lead intelligence.</p>
               </div>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onDelete={() => handleDelete(session.session_id)}
                isDeleting={deletingSessionId === session.session_id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onDelete, isDeleting }: { session: Session, onDelete: () => void, isDeleting: boolean }) {
  const isConnected = session.status === 'connected';
  const isLinking = session.status === 'linking' || (session.status === 'disconnected' && session.qr_code);

  return (
    <div className={`glass-card rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-100 flex flex-col overflow-hidden group transition-all duration-500 relative ${isDeleting ? 'opacity-50 scale-95' : 'hover:-translate-y-2'}`}>
      {isDeleting && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="animate-spin text-red-500" size={48} />
           <p className="text-red-600 font-black text-xs uppercase tracking-widest">Logging Out...</p>
        </div>
      )}
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
            isConnected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
             <Smartphone size={24} className={isConnected ? 'animate-float' : ''} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 capitalize">{session.session_id.replace('_', ' ')}</h4>
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{session.status}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Delete Account"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[340px] relative">
        {isConnected ? (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto border border-emerald-100 shadow-xl shadow-emerald-50">
               <ShieldCheck size={48} className="text-emerald-500 animate-float" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">Secured & Active</p>
              <p className="text-xs font-medium text-slate-400 mt-2">Encrypted session active. <br />Monitoring incoming leads.</p>
            </div>
            <div className="flex items-center justify-center gap-4">
               <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 flex items-center gap-2">
                  <Wifi size={14} className="text-emerald-500" /> Live Sync
               </div>
            </div>
          </div>
        ) : session.qr_code ? (
          <div className="space-y-6 text-center">
            <div className="p-5 bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-50 inline-block">
               <QRCodeSVG value={session.qr_code} size={180} level="H" fgColor="#0f172a" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Authorization Required</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">Scan with WhatsApp</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requesting Token...</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-50 grid grid-cols-2 gap-4">
         <div className="flex items-center gap-3">
           <Lock size={16} className="text-slate-300" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E2EE Ready</span>
         </div>
         <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
           <Clock size={14} className="text-slate-300" /> 
           {new Date(session.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
    </div>
  );
}

function Clock({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
