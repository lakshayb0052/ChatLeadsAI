'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, User, Building2, Calendar,
  Zap, Phone, Mail, ShieldCheck, Trash2, MessageCircle, Server,
  Wifi, ChevronRight, Briefcase, Hash, Filter
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Lead {
  id: number;
  extracted_name: string;
  mobile: string;
  email: string;
  company: string;
  lead_score: string;
  confidence: number;
  source_message: string;
  source_type: string;
  session_id: string;
  created_at: string;
  // Enriched company fields
  owner_company: string | null;
  owner_name: string | null;
  owner_email: string | null;
}

interface SessionInfo {
  session_id: string;
  lead_count: number;
  owner_company: string | null;
  owner_name: string | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<SessionInfo[]>([]);
  const [selectedExportSessions, setSelectedExportSessions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('user');

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
  const { lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('role') || 'user');
    }
  }, []);

  const isSuperAdmin = userRole === 'superadmin';

  const fetchLeads = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (filterSession) params.append('session_id', filterSession);
      if (filterScore) params.append('score', filterScore);
      const res = await fetch(`${apiUrl}/contacts/?${params}`, { headers });
      if (!res.ok) throw new Error();
      const data: Lead[] = await res.json();
      // Client-side company filter (superadmin only)
      const filtered = filterCompany
        ? data.filter(l => (l.owner_company || '').toLowerCase().includes(filterCompany.toLowerCase()))
        : data;
      setLeads(filtered);
      setError(false); setLoading(false);
    } catch { setError(true); setLoading(false); }
  };

  const fetchSessions = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/contacts/sessions`, { headers });
      if (res.ok) setAvailableSessions(await res.json());
    } catch {}
  };

  const openExportModal = () => {
    fetchSessions();
    setSelectedExportSessions(filterSession ? [filterSession] : []);
    setShowExportModal(true);
  };

  const handleExport = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const params = new URLSearchParams();
    if (searchTerm) params.append('query', searchTerm);
    if (filterScore) params.append('score', filterScore);
    selectedExportSessions.forEach(s => params.append('session_ids', s));
    if (token) params.append('token', token);
    window.location.href = `${apiUrl}/contacts/export?${params}`;
    setShowExportModal(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${apiUrl}/contacts/${deleteId}`, { method: 'DELETE', headers });
    setDeleteId(null); fetchLeads();
  };

  const confirmDeleteAll = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${apiUrl}/contacts/all`, { method: 'DELETE', headers });
    setShowDeleteAll(false); fetchLeads();
  };

  useEffect(() => { fetchLeads(); }, [searchTerm, filterSession, filterScore, filterCompany]);
  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { if (lastMessage?.event === 'lead_updated') fetchLeads(); }, [lastMessage]);

  // Derive unique companies for the company filter dropdown
  const uniqueCompanies = Array.from(new Set(leads.map(l => l.owner_company).filter(Boolean))) as string[];

  const Modal = ({ children }: { children: React.ReactNode }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-y-auto"
      style={{ background: 'rgba(17,11,41,0.6)', backdropFilter: 'blur(16px)' }}>
      <motion.div 
        initial={{ y: "100%", scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full md:max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 space-y-6 max-h-[85vh] md:max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl"
        style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-bright)', boxShadow: '0 0 40px rgba(109, 40, 217, 0.15)' }}>
        {children}
      </motion.div>
    </motion.div>
  );

  const selectStyle = {
    background: 'var(--bg-deep)', border: '1px solid var(--border-glow)',
    color: 'var(--text-secondary)', borderRadius: '1rem', padding: '0.75rem 1.25rem',
    fontSize: '0.875rem', fontWeight: '700', outline: 'none', appearance: 'none' as const,
    cursor: 'pointer', width: '100%'
  };

  // Stats for superadmin
  const hotCount = leads.filter(l => l.lead_score === 'Hot').length;
  const warmCount = leads.filter(l => l.lead_score === 'Warm').length;
  const coldCount = leads.filter(l => l.lead_score === 'Cold').length;
  const companyCount = new Set(leads.map(l => l.owner_company).filter(Boolean)).size;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8 pb-20"
    >
      <AnimatePresence>
        {/* ── Delete Modal ── */}
        {deleteId && (
          <Modal>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-center text-[var(--text-primary)]">Purge Lead?</h3>
            <p className="text-center text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>
              This action is permanent and cannot be undone.
            </p>
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-white hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 4px 20px rgba(220,38,38,0.25)' }}>
                Delete Forever
              </button>
            </div>
          </Modal>
        )}

        {/* ── Delete All Modal ── */}
        {showDeleteAll && (
          <Modal>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <ShieldCheck size={28} className="text-red-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-center text-[var(--text-primary)]">System Wipe?</h3>
            <p className="text-center text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>
              You are about to permanently delete <strong className="text-[var(--text-primary)]">ALL</strong> contacts and lead data.
            </p>
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <button onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
              <button onClick={confirmDeleteAll}
                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 4px 20px rgba(220,38,38,0.25)' }}>
                Wipe Everything
              </button>
            </div>
          </Modal>
        )}

        {/* ── Export Modal ── */}
        {showExportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6 overflow-y-auto"
            style={{ background: 'rgba(17,11,41,0.6)', backdropFilter: 'blur(16px)' }}>
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full md:max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 md:p-10 space-y-6 max-h-[85vh] md:max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar shadow-2xl"
              style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-bright)', boxShadow: '0 0 40px rgba(109, 40, 217, 0.15)' }}>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}>
                <Download size={24} className="md:w-7 md:h-7 text-[var(--purple-mid)]" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-center text-[var(--text-primary)]">Export Intelligence</h3>
              <p className="text-center text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select sessions to export. Active filters will be applied to the final spreadsheet.
              </p>
              <div className="max-h-52 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {availableSessions.length === 0 && (
                  <p className="text-center italic font-bold text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>No sessions available.</p>
                )}
                {availableSessions.map(s => (
                  <label key={s.session_id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer hover:bg-opacity-80 transition-all"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                    <input type="checkbox" className="w-4 h-4 rounded text-[var(--purple-mid)] focus:ring-[var(--purple-mid)]"
                      checked={selectedExportSessions.includes(s.session_id)}
                      onChange={e => setSelectedExportSessions(
                        e.target.checked ? [...selectedExportSessions, s.session_id]
                          : selectedExportSessions.filter(id => id !== s.session_id)
                      )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[var(--text-primary)] text-xs md:text-sm capitalize truncate">{s.session_id.replace(/_/g, ' ')}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {s.owner_company && (
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: 'var(--bg-deep)', color: 'var(--purple-mid)', border: '1px solid var(--border-glow)' }}>
                            {s.owner_company}
                          </span>
                        )}
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{s.lead_count} Leads</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-80 transition-all"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button onClick={handleExport}
                  className="btn-primary flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                  Download XLSX
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Zap size={16} className="md:w-5 md:h-5 text-[var(--purple-mid)]" />
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Neural Storage</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-1 md:mb-2">
            {isSuperAdmin ? 'All Company' : 'Identity'} <span className="gradient-text">Leads</span>
          </h1>
          <p className="text-xs md:text-sm font-bold flex flex-wrap items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <ShieldCheck size={14} className="text-emerald-600" />
            {isSuperAdmin ? `${companyCount} Companies • ` : ''}Secured Storage • {leads.length} Entities
          </p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteAll(true)}
            className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex justify-center items-center gap-2 transition-all group"
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)', color: '#dc2626' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.04)'; }}>
            <Trash2 size={14} className="md:w-4 md:h-4 group-hover:rotate-12 transition-transform" /> Wipe All
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openExportModal}
            className="btn-primary flex-1 md:flex-none px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex justify-center items-center gap-2 group">
            <Download size={14} className="md:w-4 md:h-4 group-hover:-translate-y-0.5 transition-transform" /> Export
          </motion.button>
        </div>
      </div>

      {/* ── Superadmin Stats Bar ── */}
      {isSuperAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {[
            { label: 'Total Leads', value: leads.length, color: 'var(--purple-mid)', bg: 'var(--bg-hover)' },
            { label: 'Hot Leads', value: hotCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
            { label: 'Warm Leads', value: warmCount, color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
            { label: 'Companies', value: companyCount, color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between hover:shadow-lg transition-shadow"
              style={{ background: stat.bg, border: '1px solid var(--border-subtle)' }}>
              <div>
                <p className="text-xl md:text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Search & Filter ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col lg:flex-row gap-3"
      >
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--purple-mid)] w-4 h-4 md:w-[18px] md:h-[18px]"
            style={{ color: 'var(--text-ghost)' }} />
          <input type="text" placeholder="Search by name, email, mobile..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="input-dark w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all focus:ring-2 focus:ring-[var(--purple-mid)]" />
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          {/* Session filter — dynamic from API */}
          <div className="relative flex-1 min-w-0 sm:min-w-[150px]">
            <Wifi size={14} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 md:w-[14px] md:h-[14px]" style={{ color: 'var(--text-ghost)' }} />
            <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
              className="hover:border-[var(--border-bright)] transition-colors text-xs md:text-sm"
              style={{ ...selectStyle, paddingLeft: '2rem', paddingRight: '1rem', height: '100%', minHeight: '44px' }}>
              <option value="">All Sessions</option>
              {availableSessions.map(s => (
                <option key={s.session_id} value={s.session_id}>
                  {s.session_id.replace(/_/g, ' ')}{s.owner_company ? ` — ${s.owner_company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lead score filter */}
          <div className="relative flex-1 min-w-0 sm:min-w-[130px]">
            <Filter size={14} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 md:w-[14px] md:h-[14px]" style={{ color: 'var(--text-ghost)' }} />
            <select value={filterScore} onChange={e => setFilterScore(e.target.value)}
              className="hover:border-[var(--border-bright)] transition-colors text-xs md:text-sm"
              style={{ ...selectStyle, paddingLeft: '2rem', paddingRight: '1rem', height: '100%', minHeight: '44px' }}>
              <option value="">All Scores</option>
              <option value="Hot">🔥 Hot Only</option>
              <option value="Warm">⚡ Warm Only</option>
              <option value="Cold">❄️ Cold Only</option>
            </select>
          </div>

          {/* Company filter — superadmin only */}
          {isSuperAdmin && (
            <div className="relative flex-1 min-w-0 sm:min-w-[150px]">
              <Briefcase size={14} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none w-3 h-3 md:w-[14px] md:h-[14px]" style={{ color: 'var(--text-ghost)' }} />
              <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
                className="hover:border-[var(--border-bright)] transition-colors text-xs md:text-sm"
                style={{ ...selectStyle, paddingLeft: '2rem', paddingRight: '1rem', height: '100%', minHeight: '44px' }}>
                <option value="">All Companies</option>
                {uniqueCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Leads List ── */}
      {loading ? (
        <div className="py-20 md:py-32 flex flex-col items-center justify-center space-y-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full"
            style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }} />
          <p className="text-[10px] md:text-xs font-black uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Syncing Intelligence Pipeline...
          </p>
        </div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 md:py-24 flex flex-col items-center justify-center space-y-4 md:space-y-5 rounded-2xl md:rounded-3xl"
          style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center animate-pulse"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <Server size={32} className="md:w-9 md:h-9 text-red-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">Intelligence Hub Offline</h3>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Attempting to Restore Pipeline...
          </p>
        </motion.div>
      ) : leads.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 md:py-32 flex flex-col items-center justify-center text-center space-y-4 md:space-y-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center"
            style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border-glow)' }}>
            <User size={32} className="md:w-10 md:h-10" style={{ color: 'var(--text-ghost)' }} />
          </div>
          <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">No Intelligence Captured</h3>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>
            The neural log is currently empty
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="space-y-3 md:space-y-4"
        >
          {leads.map((lead, i) => (
            <LeadCard
              key={lead.id} lead={lead} index={i}
              isSuperAdmin={isSuperAdmin}
              onDelete={() => setDeleteId(lead.id)}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function LeadCard({ lead, index, isSuperAdmin, onDelete }: {
  lead: Lead; index: number; isSuperAdmin: boolean; onDelete: () => void;
}) {
  const isHot = lead.lead_score === 'Hot';
  const isWarm = lead.lead_score === 'Warm';

  const accentColor = isHot ? '#f59e0b' : isWarm ? '#2563eb' : '#6b7280';
  const accentBg = isHot
    ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))'
    : isWarm
    ? 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))'
    : 'var(--bg-hover)';

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
      }}
      whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      className="glass-card rounded-2xl md:rounded-3xl overflow-hidden relative"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      {/* Company banner — superadmin only */}
      {isSuperAdmin && lead.owner_company && (
        <div className="flex flex-wrap items-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-3"
          style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
          <Briefcase size={12} style={{ color: 'var(--purple-mid)' }} />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--purple-mid)' }}>
            {lead.owner_company}
          </span>
          <ChevronRight size={10} style={{ color: 'var(--text-ghost)' }} />
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] truncate max-w-[120px] md:max-w-none" style={{ color: 'var(--text-muted)' }}>
            {lead.session_id?.replace(/_/g, ' ')}
          </span>
          {lead.owner_name && (
            <>
              <span className="hidden md:inline" style={{ color: 'var(--border-glow)' }}>·</span>
              <span className="text-[9px] md:text-[10px] font-bold" style={{ color: 'var(--text-ghost)' }}>
                {lead.owner_name}
              </span>
            </>
          )}
        </div>
      )}

      <div className="p-5 md:p-8 relative">
        {/* Score glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 md:w-56 md:h-56 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }} />

        {/* Score badge */}
        <div className={`absolute top-${isSuperAdmin && lead.owner_company ? '4' : '4'} md:top-${isSuperAdmin && lead.owner_company ? '6' : '6'} right-4 md:right-6 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
          isHot ? 'badge-hot' : isWarm ? 'badge-warm' : 'badge-cold'
        }`}>
          {isHot ? '🔥' : isWarm ? '⚡' : '❄️'} {lead.lead_score}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 md:gap-8 items-start lg:items-center">

          {/* Avatar + Name + Company */}
          <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto mt-6 lg:mt-0">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shrink-0 relative overflow-hidden"
              style={{ background: accentBg, border: `1px solid ${isHot ? 'rgba(245,158,11,0.3)' : isWarm ? 'var(--border-bright)' : 'var(--border-glow)'}` }}>
              <User size={20} className={`md:w-[28px] md:h-[28px] ${isHot ? 'text-yellow-500' : isWarm ? 'text-[var(--purple-mid)]' : 'text-[var(--text-ghost)]'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-tight truncate">
                {lead.extracted_name || 'Anonymous Lead'}
              </h3>
              {lead.company && (
                <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                  <Building2 size={12} className="md:w-[12px] md:h-[12px]" style={{ color: 'var(--text-ghost)' }} />
                  <p className="text-[10px] md:text-xs font-bold truncate" style={{ color: 'var(--text-secondary)' }}>{lead.company}</p>
                </div>
              )}
              {/* Session tag — for non-superadmin or when no banner */}
              {(!isSuperAdmin || !lead.owner_company) && lead.session_id && (
                <div className="flex items-center gap-1 md:gap-1.5 mt-1 md:mt-1.5">
                  <Hash size={10} className="md:w-[11px] md:h-[11px]" style={{ color: 'var(--text-ghost)' }} />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate" style={{ color: 'var(--text-ghost)' }}>
                    {lead.session_id.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-2 md:gap-3 w-full lg:w-auto lg:border-l lg:pl-8" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                <Mail size={12} className="md:w-3.5 md:h-3.5" />
              </div>
              <span className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--text-secondary)' }}>
                {lead.email || 'no-email@detected.ai'}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                <Phone size={12} className="md:w-3.5 md:h-3.5" />
              </div>
              <span className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--text-secondary)' }}>
                {lead.mobile || 'Unknown Frequency'}
              </span>
            </div>
          </div>

          {/* Confidence ring + delete */}
          <div className="flex items-center justify-between w-full lg:w-auto lg:ml-auto gap-4 md:gap-6 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center md:flex-col gap-3 md:gap-1.5">
              <div className="relative w-10 h-10 md:w-14 md:h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="var(--border-glow)" strokeWidth="4" />
                  <circle cx="50%" cy="50%" r="42%" fill="transparent"
                    stroke={lead.confidence > 0.8 ? '#10b981' : '#f59e0b'} strokeWidth="4"
                    strokeDasharray="264%" strokeDashoffset={`${264 * (1 - lead.confidence)}%`}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${lead.confidence > 0.8 ? '#10b981' : '#f59e0b'})` }} />
                </svg>
                <span className="absolute text-[8px] md:text-[10px] font-black text-[var(--text-primary)]">
                  {Math.round(lead.confidence * 100)}%
                </span>
              </div>
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>Confidence</p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors shrink-0 group"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)' }}>
              <Trash2 size={16} className="md:w-4 md:h-4 text-[var(--text-muted)] group-hover:text-red-500 transition-colors" />
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-start md:items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl w-full lg:w-2/3"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
            <MessageCircle size={14} className="md:w-3.5 md:h-3.5 text-[var(--purple-mid)] shrink-0 mt-0.5 md:mt-0" />
            <p className="text-[10px] md:text-xs font-medium italic line-clamp-2 md:line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
              &ldquo;{lead.source_message}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest shrink-0 self-end md:self-auto" style={{ color: 'var(--text-ghost)' }}>
            <Calendar size={12} className="md:w-3 md:h-3" />
            {new Date(lead.created_at).toLocaleDateString()} at{' '}
            {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
