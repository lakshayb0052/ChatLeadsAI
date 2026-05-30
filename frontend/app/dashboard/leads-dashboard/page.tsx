'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Users, CheckCircle, ShieldAlert, ArrowUpRight,
  TrendingUp, Search, Filter, ClipboardList, MapPin, CreditCard,
  User, ChevronDown, ChevronUp, Clock, Info, Check, Copy, ExternalLink,
  Calendar, Building2, Phone, Mail, Sparkles, Server, ArrowLeft,
  Activity, Zap, Hash
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Lead {
  id: number;
  extracted_name: string;
  mobile: string;
  email: string;
  arn?: string | null;
  company: string;
  lead_score: string;
  confidence: number;
  source_message: string;
  source_type: string;
  session_id: string;
  created_at: string;
  owner_company: string | null;
  owner_name: string | null;
  owner_email: string | null;

  // Excel Matched Fields
  creation_date_time?: string | null;
  customer_type?: string | null;
  state?: string | null;
  pincode?: string | null;
  lg_code?: string | null;
  ipa_status?: string | null;
  dropoff_reason?: string | null;
  idcom_status?: string | null;
  vkyc_status?: string | null;
  vkyc_consent_date?: string | null;
  vkyc_expiry_date?: string | null;
  capture_link?: string | null;
  final_decision?: string | null;
  final_decision_date?: string | null;
  current_stage?: string | null;
  kyc_status?: string | null;
  decline_type?: string | null;
  product_des?: string | null;
  kyc_success_nr?: string | null;
  card_type?: string | null;
  card_active_status?: string | null;
  application_id?: string | null;
  remarks?: string | null;
  excel_updated?: boolean;
  excel_updated_at?: string | null;
}

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // All Required Filters
  const [filterState, setFilterState] = useState('');
  const [filterDecision, setFilterDecision] = useState('');
  const [filterKyc, setFilterKyc] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterCustomerType, setFilterCustomerType] = useState('');
  const [filterCardActive, setFilterCardActive] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [filterSession, setFilterSession] = useState('');
  
  // Export Date Range Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [role, setRole] = useState('user');
  
  // Selected Lead Drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiUrl = rawApiUrl.replace(/\/$/, '');
  const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const wsUrl = rawWsUrl.endsWith('/ws') ? rawWsUrl : `${rawWsUrl.replace(/\/$/, '')}/ws`;
  const { lastMessage } = useWebSocket(wsUrl);

  const fetchMatchedLeads = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/contacts/?excel_updated=true&limit=1000`, { headers });
      if (!res.ok) throw new Error();
      const data: Lead[] = await res.json();
      setLeads(data);
      setError(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role') || 'user');
    }
    fetchMatchedLeads();
  }, []);

  useEffect(() => {
    if (lastMessage?.event === 'lead_updated') {
      fetchMatchedLeads();
    }
  }, [lastMessage]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSuperAdmin = role === 'superadmin';

  // ── Derived Unique Option Lists for Select Elements ──
  const uniqueStates = Array.from(new Set(leads.map(l => l.state).filter(Boolean))) as string[];
  const uniqueDecisions = Array.from(new Set(leads.map(l => l.final_decision).filter(Boolean))) as string[];
  const uniqueKycStatuses = Array.from(new Set(leads.map(l => l.kyc_status).filter(Boolean))) as string[];
  const uniqueProducts = Array.from(new Set(leads.map(l => l.product_des).filter(Boolean))) as string[];
  const uniqueCustomerTypes = Array.from(new Set(leads.map(l => l.customer_type).filter(Boolean))) as string[];
  const uniqueCardActiveStatuses = Array.from(new Set(leads.map(l => l.card_active_status).filter(Boolean))) as string[];
  const uniqueSessions = Array.from(new Set(leads.map(l => l.session_id).filter(Boolean))) as string[];
  const uniqueScores = Array.from(new Set(leads.map(l => l.lead_score).filter(Boolean))) as string[];

  // ── Resilient Filtering Heuristic ──
  const filteredLeads = leads.filter(lead => {
    const matchSearch = 
      (lead.extracted_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.arn || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchState = !filterState || lead.state === filterState;
    const matchDecision = !filterDecision || lead.final_decision === filterDecision;
    const matchKyc = !filterKyc || lead.kyc_status === filterKyc;
    const matchProduct = !filterProduct || lead.product_des === filterProduct;
    const matchCustomerType = !filterCustomerType || lead.customer_type === filterCustomerType;
    const matchCardActive = !filterCardActive || lead.card_active_status === filterCardActive;
    const matchScore = !filterScore || lead.lead_score === filterScore;
    const matchSession = !filterSession || lead.session_id === filterSession;

    return matchSearch && matchState && matchDecision && matchKyc && matchProduct && 
           matchCustomerType && matchCardActive && matchScore && matchSession;
  });

  // ── Dynamic calculations based on FILTERED results ──
  const totalCount = filteredLeads.length;
  
  const approvedCount = filteredLeads.filter(l => 
    l.final_decision?.toLowerCase().includes('approve') || 
    l.final_decision?.toLowerCase() === 'yes'
  ).length;
  
  const kycSuccessCount = filteredLeads.filter(l => 
    l.kyc_status?.toLowerCase().includes('success') || 
    l.kyc_success_nr?.toLowerCase().includes('success') || 
    l.kyc_success_nr?.toLowerCase() === 'success' ||
    l.kyc_status?.toLowerCase() === 'approved'
  ).length;

  const activeCardCount = filteredLeads.filter(l => 
    l.card_active_status?.toLowerCase().includes('active') || 
    l.card_active_status?.toLowerCase() === 'yes' ||
    l.card_active_status?.toLowerCase() === 'y'
  ).length;

  const approvalRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;
  const kycRate = totalCount > 0 ? (kycSuccessCount / totalCount) * 100 : 0;
  const activeCardRate = totalCount > 0 ? (activeCardCount / totalCount) * 100 : 0;

  // ── Dynamic Chart Aggregations based on FILTERED results ──
  
  // 1. Decision Breakdown
  const decisionGroups = filteredLeads.reduce((acc: {[key: string]: number}, l) => {
    const key = l.final_decision || 'Pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const decisionChartData = Object.entries(decisionGroups).map(([name, value]) => ({ name, value }));

  // 2. Product Breakdown (Top 5)
  const productGroups = filteredLeads.reduce((acc: {[key: string]: number}, l) => {
    const key = l.product_des || 'Unknown Product';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const productChartData = Object.entries(productGroups)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // 3. Geographic States Breakdown (Top 5)
  const stateGroups = filteredLeads.reduce((acc: {[key: string]: number}, l) => {
    const key = l.state || 'Other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const stateChartData = Object.entries(stateGroups)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // 4. Dropoff Reasons
  const dropoffGroups = filteredLeads.reduce((acc: {[key: string]: number}, l) => {
    const key = l.dropoff_reason || 'No Dropoff';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dropoffChartData = Object.entries(dropoffGroups)
    .filter(([name]) => name !== 'No Dropoff' && name !== 'None')
    .sort((a,b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }));

  // 5. Timeline Trend (Last 7 unique dates)
  const timelineGroups = filteredLeads.reduce((acc: {[key: string]: number}, l) => {
    const dateStr = l.excel_updated_at 
      ? new Date(l.excel_updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : l.created_at
      ? new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'N/A';
    if (dateStr !== 'N/A') {
      acc[dateStr] = (acc[dateStr] || 0) + 1;
    }
    return acc;
  }, {});
  const timelineChartData = Object.entries(timelineGroups)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-7)
    .map(([date, count]) => ({ date, count }));

  // Colors for Donut Slices
  const sliceColors = ['#2563eb', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6', '#6b7280'];

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterState('');
    setFilterDecision('');
    setFilterKyc('');
    setFilterProduct('');
    setFilterCustomerType('');
    setFilterCardActive('');
    setFilterScore('');
    setFilterSession('');
    setStartDate('');
    setEndDate('');
  };

  const isFiltersActive = searchTerm || filterState || filterDecision || filterKyc || 
                          filterProduct || filterCustomerType || filterCardActive || 
                          filterScore || filterSession || startDate || endDate;

  const handleExportMatched = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (token) params.append('token', token);
    window.location.href = `${apiUrl}/contacts/export-matched?${params}`;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Sparkles size={16} className="text-[var(--purple-mid)]" />
            </div>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Dynamic Outcome Center</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-2">
            Leads <span className="gradient-text">Dashboard</span>
          </h2>
          <p className="text-sm md:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            Real-time outcome analysis, conversion rates, and business parameter mapping.
          </p>
        </div>

        <div className="flex gap-2.5">
          {isFiltersActive && (
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
              Reset Filters
            </button>
          )}
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full"
            style={{ border: '3px solid var(--border-glow)', borderTopColor: 'var(--purple-mid)' }}
          />
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Synthesizing Outcome Analytics...
          </p>
        </div>
      ) : error ? (
        <div className="py-24 text-center glass-card rounded-3xl p-10 max-w-lg mx-auto"
          style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)' }}>
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Pipeline Failed</h3>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Could not fetch Excel matched leads.
          </p>
        </div>
      ) : (
        <>
          {/* ── KPI Grid (Calculated dynamically) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Total Leads Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg"
              style={{ border: '1px solid var(--border-glow)' }}>
              <div>
                <p className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                  {totalCount}
                </p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">Leads Selected</p>
                <p className="text-[8px] font-bold text-[var(--text-ghost)] mt-1">Matched row subset</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)', color: '#2563eb' }}>
                <Users size={22} />
              </div>
            </div>

            {/* Approved Ratio Card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg"
              style={{ border: '1px solid var(--border-glow)' }}>
              <div>
                <p className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tighter leading-none">
                  {approvalRate.toFixed(1)}%
                </p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">Approved Rate</p>
                <p className="text-[8px] font-bold text-[var(--text-ghost)] mt-1">{approvedCount} of {totalCount} leads approved</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981' }}>
                <CheckCircle size={22} />
              </div>
            </div>

            {/* KYC success rate card */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg"
              style={{ border: '1px solid var(--border-glow)' }}>
              <div>
                <p className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter leading-none">
                  {kycRate.toFixed(1)}%
                </p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">KYC Success Rate</p>
                <p className="text-[8px] font-bold text-[var(--text-ghost)] mt-1">{kycSuccessCount} verified successfully</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <ClipboardList size={22} />
              </div>
            </div>

            {/* Active Card Rate */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-lg"
              style={{ border: '1px solid var(--border-glow)' }}>
              <div>
                <p className="text-4xl md:text-5xl font-black text-indigo-500 tracking-tighter leading-none">
                  {activeCardRate.toFixed(1)}%
                </p>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">Card Active Rate</p>
                <p className="text-[8px] font-bold text-[var(--text-ghost)] mt-1">{activeCardCount} cards activated live</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#6366f1' }}>
                <CreditCard size={22} />
              </div>
            </div>

          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="glass-card rounded-3xl p-6 space-y-4 shadow-md"
            style={{ border: '1px solid var(--border-glow)' }}>
            
            {/* Search Input */}
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--purple-mid)] w-4 h-4"
                style={{ color: 'var(--text-ghost)' }} />
              <input 
                type="text" 
                placeholder="Fully functional search: query by Lead Name, Phone, Email, or ARN Ref..."
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="input-dark w-full pl-11 pr-4 py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all focus:ring-2 focus:ring-[var(--purple-mid)]"
              />
            </div>

            {/* Comprehensive Grid of 8 Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* 1. Filter by WhatsApp Session */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Session Device</label>
                <select 
                  value={filterSession} 
                  onChange={e => setFilterSession(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Devices</option>
                  {uniqueSessions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              {/* 2. Filter by State */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">State</label>
                <select 
                  value={filterState} 
                  onChange={e => setFilterState(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All States</option>
                  {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* 3. Filter by Final Decision */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Outcome Decision</label>
                <select 
                  value={filterDecision} 
                  onChange={e => setFilterDecision(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Decisions</option>
                  {uniqueDecisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* 4. Filter by KYC Status */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">KYC Status</label>
                <select 
                  value={filterKyc} 
                  onChange={e => setFilterKyc(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All KYC Status</option>
                  {uniqueKycStatuses.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* 5. Filter by Product */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Card Product</label>
                <select 
                  value={filterProduct} 
                  onChange={e => setFilterProduct(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Products</option>
                  {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* 6. Filter by Customer Type */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Customer Type</label>
                <select 
                  value={filterCustomerType} 
                  onChange={e => setFilterCustomerType(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Types</option>
                  {uniqueCustomerTypes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 7. Filter by Card Active Status */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Active Status</label>
                <select 
                  value={filterCardActive} 
                  onChange={e => setFilterCardActive(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Active</option>
                  {uniqueCardActiveStatuses.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* 8. Filter by Lead Score */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Lead Score</label>
                <select 
                  value={filterScore} 
                  onChange={e => setFilterScore(e.target.value)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                >
                  <option value="">All Scores</option>
                  {uniqueScores.map(sc => <option key={sc} value={sc}>{sc === 'Hot' ? '🔥 Hot' : sc === 'Warm' ? '⚡ Warm' : '❄️ Cold'}</option>)}
                </select>
              </div>

            </div>

            {/* ── Export Matched Leads Area ── */}
            <div className="border-t pt-5 mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4"
              style={{ borderColor: 'var(--border-subtle)' }}>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center flex-1">
                
                {/* Export Start Date */}
                <div className="w-full sm:w-auto flex-1 space-y-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Export Start Date</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-ghost)] pointer-events-none" />
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      className="input-dark w-full pl-9 pr-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                    />
                  </div>
                </div>

                {/* Export End Date */}
                <div className="w-full sm:w-auto flex-1 space-y-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Export End Date</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-ghost)] pointer-events-none" />
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)}
                      className="input-dark w-full pl-9 pr-3 py-2.5 rounded-lg font-bold text-xs cursor-pointer outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Export Trigger Button */}
              <button 
                onClick={handleExportMatched}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 text-white cursor-pointer"
                style={{ 
                  background: 'linear-gradient(135deg, var(--purple-mid), #3b82f6)', 
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <ClipboardList size={14} /> Export Matched Leads (XLSX)
              </button>

            </div>

          </div>

          {totalCount === 0 ? (
            <div className="py-24 text-center glass-card rounded-3xl p-8 max-w-md mx-auto"
              style={{ border: '1px dashed var(--border-glow)' }}>
              <Users size={36} style={{ color: 'var(--text-ghost)' }} className="mx-auto mb-3" />
              <h3 className="text-lg font-black text-[var(--text-primary)]">No Matched Data</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-ghost)] mt-1">
                No leads match the selected filter configuration.
              </p>
              {isFiltersActive && (
                <button 
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2.5 btn-primary rounded-xl text-xs uppercase tracking-widest">
                  Reset Active Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── Visual Analytics Section (Charts dynamically reflect filtered subset) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Donut Chart: Final Decision Mix */}
                <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Final Decision Mix</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-1">Lead status breakdown</p>
                  </div>
                  
                  {/* Custom SVG Donut Chart */}
                  <div className="my-6 flex items-center justify-center relative">
                    <svg className="w-48 h-48 -rotate-90">
                      {(() => {
                        let currentOffset = 0;
                        return decisionChartData.map((d, i) => {
                          const percent = (d.value / totalCount) * 100;
                          const dashArray = 2 * Math.PI * 65; 
                          const dashOffset = dashArray - (dashArray * percent) / 100;
                          const strokeOffset = currentOffset;
                          currentOffset += (dashArray * percent) / 100;

                          return (
                            <motion.circle
                              key={d.name}
                              cx="50%" cy="50%" r="65"
                              fill="transparent"
                              stroke={sliceColors[i % sliceColors.length]}
                              strokeWidth="16"
                              strokeDasharray={`${dashArray} ${dashArray}`}
                              strokeDashoffset={dashOffset - strokeOffset}
                              strokeLinecap="round"
                              initial={{ strokeDashoffset: dashArray }}
                              animate={{ strokeDashoffset: dashOffset - strokeOffset }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="cursor-pointer hover:stroke-[20px] transition-all"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[var(--text-primary)]">{totalCount}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">Filtered</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="space-y-1.5 pt-2">
                    {decisionChartData.map((d, i) => (
                      <div key={d.name} className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sliceColors[i % sliceColors.length] }} />
                          <span style={{ color: 'var(--text-secondary)' }} className="truncate max-w-[150px]">{d.name}</span>
                        </div>
                        <span className="font-black text-[var(--text-primary)]">{d.value} ({((d.value/totalCount)*100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart: Product Distribution */}
                <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Product Mix</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-1">Top card products generated</p>
                  </div>

                  <div className="my-6 space-y-4">
                    {productChartData.length === 0 ? (
                      <p className="text-center italic text-xs font-bold py-10" style={{ color: 'var(--text-ghost)' }}>No product data</p>
                    ) : (
                      productChartData.map((prod, i) => {
                        const maxVal = Math.max(...productChartData.map(p => p.value));
                        const percent = maxVal > 0 ? (prod.value / maxVal) * 100 : 0;
                        return (
                          <div key={prod.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span style={{ color: 'var(--text-secondary)' }} className="truncate max-w-[200px]">{prod.name}</span>
                              <span className="font-black text-[var(--text-primary)]">{prod.value}</span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.06)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #6366f1, #3b82f6)' }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl flex items-center gap-3"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)' }}>
                    <Info size={16} className="text-[var(--purple-mid)] shrink-0" />
                    <p className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                      Product breakdown dynamically updating to your query.
                    </p>
                  </div>
                </div>

                {/* Line/Area Graph: Timeline Trend */}
                <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Matching Timeline</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-1">Matched leads count trend</p>
                  </div>

                  {/* SVG Line Graph */}
                  <div className="my-6 h-40 w-full relative flex items-end">
                    {timelineChartData.length === 0 ? (
                      <p className="text-center italic text-xs font-bold w-full" style={{ color: 'var(--text-ghost)' }}>Awaiting dates...</p>
                    ) : (
                      <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                        {(() => {
                          const maxCount = Math.max(...timelineChartData.map(d => d.count), 1);
                          const widthPerSegment = 300 / (timelineChartData.length - 1 || 1);
                          
                          const coords = timelineChartData.map((d, i) => {
                            const x = i * widthPerSegment;
                            const y = 110 - (d.count / maxCount) * 80;
                            return { x, y };
                          });

                          const pathD = coords.reduce((acc, c, i) => 
                            i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`, ""
                          );

                          const fillD = `${pathD} L 300 120 L 0 120 Z`;

                          return (
                            <>
                              <line x1="0" y1="30" x2="300" y2="30" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />
                              <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />
                              <line x1="0" y1="110" x2="300" y2="110" stroke="var(--border-subtle)" strokeWidth="0.5" />

                              <path d={fillD} fill="url(#areaGlow)" opacity="0.15" />

                              <motion.path
                                d={pathD}
                                fill="none"
                                stroke="var(--purple-mid)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.0, ease: "easeOut" }}
                              />

                              {coords.map((c, i) => (
                                <circle
                                  key={i}
                                  cx={c.x} cy={c.y} r="3"
                                  fill="#ffffff"
                                  stroke="var(--purple-mid)"
                                  strokeWidth="1.5"
                                  className="cursor-pointer hover:r-5 transition-all"
                                />
                              ))}

                              <defs>
                                <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--purple-mid)" />
                                  <stop offset="100%" stopColor="var(--purple-mid)" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </>
                          );
                        })()}
                      </svg>
                    )}
                  </div>

                  {/* Horizontal Dates list */}
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider border-t pt-3"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    {timelineChartData.length === 0 ? (
                      <span className="w-full text-center">N/A</span>
                    ) : (
                      timelineChartData.map((d, i) => (
                        <span key={i} className="truncate max-w-[40px] text-center">{d.date}</span>
                      ))
                    )}
                  </div>

                </div>

              </div>

              {/* ── Sub Charts Row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* State Distribution Bar Chart */}
                <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Geographic Mix</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-1">Statewise leads counts</p>
                  </div>

                  <div className="my-6 space-y-4">
                    {stateChartData.length === 0 ? (
                      <p className="text-center italic text-xs font-bold py-10" style={{ color: 'var(--text-ghost)' }}>No geographic tags found.</p>
                    ) : (
                      stateChartData.map((st, i) => {
                        const maxVal = Math.max(...stateChartData.map(s => s.value));
                        const percent = maxVal > 0 ? (st.value / maxVal) * 100 : 0;
                        return (
                          <div key={st.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-1.5">
                                <MapPin size={10} className="text-indigo-400" /> {st.name}
                              </span>
                              <span className="font-black text-[var(--text-primary)]">{st.value}</span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.06)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #10b981, #059669)' }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Dropoff Reasons Bar Chart */}
                <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-md">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">Conversion Dropoffs</h3>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-1">Core friction points and reasons</p>
                  </div>

                  <div className="my-6 space-y-4">
                    {dropoffChartData.length === 0 ? (
                      <div className="text-center py-10">
                        <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                        <p className="italic text-xs font-bold" style={{ color: 'var(--text-muted)' }}>No Conversion Dropoffs detected!</p>
                      </div>
                    ) : (
                      dropoffChartData.map((drop, i) => {
                        const maxVal = Math.max(...dropoffChartData.map(d => d.value));
                        const percent = maxVal > 0 ? (drop.value / maxVal) * 100 : 0;
                        return (
                          <div key={drop.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span style={{ color: 'var(--text-secondary)' }} className="truncate max-w-[280px]">{drop.name}</span>
                              <span className="font-black text-amber-500">{drop.value}</span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(37,99,235,0.06)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #f59e0b, #eab308)' }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* ── Detail Grid list ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredLeads.map((lead) => {
                  const isApproved = lead.final_decision?.toLowerCase().includes('approve') || lead.final_decision?.toLowerCase() === 'yes';
                  const isDeclined = lead.final_decision?.toLowerCase().includes('decline') || lead.final_decision?.toLowerCase() === 'no';
                  
                  return (
                    <motion.div
                      key={lead.id}
                      whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                      onClick={() => setSelectedLead(lead)}
                      className="glass-card rounded-3xl p-5 md:p-6 overflow-hidden flex flex-col justify-between cursor-pointer border hover:border-[var(--purple-mid)] transition-all"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="space-y-3">
                        {/* Top Row: ARN + score */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-[var(--purple-mid)] uppercase tracking-widest bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg border border-glow">
                            ARN: {lead.arn || 'N/A'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            isApproved ? 'bg-emerald-500/10 text-emerald-600' : isDeclined ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {lead.final_decision || 'Pending'}
                          </span>
                        </div>

                        {/* Lead Name and Product */}
                        <div>
                          <h4 className="text-base font-black text-[var(--text-primary)] truncate">{lead.extracted_name || 'Anonymous Lead'}</h4>
                          {isSuperAdmin && (
                            <p className="text-[10px] font-black text-blue-500 mt-1 truncate flex items-center gap-1.5 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 w-fit">
                              <Building2 size={10} className="text-blue-400 shrink-0" /> {lead.owner_company || 'Independent'}
                            </p>
                          )}
                          {lead.product_des && (
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-1.5 truncate flex items-center gap-1.5">
                              <CreditCard size={10} className="text-indigo-400 shrink-0" /> {lead.product_des}
                            </p>
                          )}
                        </div>

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-[var(--text-secondary)] bg-opacity-40 bg-[var(--bg-hover)] p-3 rounded-xl border border-subtle">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">KYC Status</p>
                            <p className="text-[var(--text-primary)] font-black truncate">{lead.kyc_success_nr || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">VKYC Status</p>
                            <p className="text-[var(--text-primary)] font-black truncate">{lead.vkyc_status || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">State</p>
                            <p className="text-[var(--text-primary)] font-black truncate">{lead.state || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)]">Score Rank</p>
                            <p className="text-[var(--text-primary)] font-black truncate">{lead.lead_score === 'Hot' ? '🔥 Hot' : lead.lead_score === 'Warm' ? '⚡ Warm' : '❄️ Cold'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Sync time */}
                      <div className="flex justify-between items-center border-t pt-3 mt-4 text-[9px] font-black uppercase tracking-wider"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-ghost)' }}>
                        <span className="flex items-center gap-1"><Clock size={10} /> Sync Complete</span>
                        <span>{lead.excel_updated_at ? new Date(lead.excel_updated_at).toLocaleDateString() : 'N/A'}</span>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

        </>
      )}

      {/* ── Slide-out Lead Details Drawer/Modal ── */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-end p-0 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 220 }}
              className="w-full sm:max-w-xl h-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-2xl relative"
              style={{ background: 'var(--bg-deep)', borderLeft: '1px solid var(--border-bright)' }}
              onClick={e => e.stopPropagation()}
            >
              
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--purple-mid)] bg-[var(--bg-hover)] px-2.5 py-1 rounded-lg border">
                      Matched Outcome Parameters
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mt-2">
                      {selectedLead.extracted_name || 'Anonymous Lead'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-2 rounded-xl text-[var(--text-ghost)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Close
                  </button>
                </div>

                {/* Subheader context */}
                <div className="p-4 rounded-2xl flex items-center gap-3 border border-subtle" style={{ background: 'var(--bg-hover)' }}>
                  <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                    <User size={18} className="text-[var(--purple-mid)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[var(--text-primary)] truncate">Session: {selectedLead.session_id.replace(/_/g, ' ')}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-0.5 truncate">
                      Company: {selectedLead.owner_company || 'Independent'}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">

                  {/* Identity and Context info */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Lead Identity Specs</p>
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Mobile</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.mobile || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Email</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">ARN (Reference)</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-black text-[var(--purple-mid)]">{selectedLead.arn || 'N/A'}</p>
                          {selectedLead.arn && (
                            <button 
                              onClick={() => copyToClipboard(selectedLead.arn || '', 'drawer-arn')}
                              className="text-[9px] text-[var(--purple-mid)] hover:underline flex items-center gap-0.5">
                              {copiedId === 'drawer-arn' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              {copiedId === 'drawer-arn' ? 'Copied' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Customer Type</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.customer_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Logs */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Verification Status Log</p>
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">KYC Status</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.kyc_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">VKYC Status</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.vkyc_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">VKYC Consent Date</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.vkyc_consent_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">VKYC Expiry Date</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.vkyc_expiry_date || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">KYC Success/NR Status</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.kyc_success_nr || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Metrics */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Application Specifications</p>
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Application ID</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.application_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">LG Code</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.lg_code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Product Description</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.product_des || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Card Type</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.card_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Card Active Status</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.card_active_status || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">IPA Status</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.ipa_status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Outcome and details */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Decision Outcomes & Dropoffs</p>
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Final Decision</p>
                        <p className="font-black text-[var(--text-primary)] mt-0.5">{selectedLead.final_decision || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Final Decision Date</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.final_decision_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Current Stage</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.current_stage || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Decline Type</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.decline_type || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">DropOff Reason</p>
                        <p className="font-medium text-amber-600 mt-0.5">{selectedLead.dropoff_reason || 'No dropoff detected (Full flow complete)'}</p>
                      </div>
                      <div className="col-span-2 pt-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Idcom Status</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.idcom_status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Capture Info */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Location & Capture specs</p>
                    <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-2xl border" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">State</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Pincode</p>
                        <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedLead.pincode || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 border-t pt-2 mt-1" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Capture Link</p>
                        <p className="font-bold mt-0.5">
                          {selectedLead.capture_link ? (
                            <a href={selectedLead.capture_link} target="_blank" rel="noreferrer" className="text-[var(--purple-mid)] hover:underline flex items-center gap-1">
                              {selectedLead.capture_link} <ExternalLink size={10} />
                            </a>
                          ) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remarks details */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Administrative Log & Remarks</p>
                    <div className="p-4 rounded-2xl border text-xs" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Remarks</p>
                      <p className="font-medium text-[var(--text-primary)] mt-1.5 italic">
                        "{selectedLead.remarks || 'No notes added for this entity.'}"
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="border-t pt-4 mt-6 flex gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Dismiss
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
