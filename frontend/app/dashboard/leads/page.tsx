'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  MessageCircle, 
  User, 
  Building2, 
  Calendar,
  Zap,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  ChevronRight,
  MoreVertical,
  Trash2,
  X,
  Server
} from 'lucide-react';

interface Lead {
  id: number;
  extracted_name: string;
  mobile: string;
  email: string;
  company: string;
  lead_score: string;
  confidence: number;
  source_message: string;
  session_id: string;
  created_at: string;
}

import { useWebSocket } from '../../hooks/useWebSocket';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8000/ws');

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (filterSession) params.append('session_id', filterSession);
      if (filterScore) params.append('score', filterScore);

      const response = await fetch(`http://localhost:8000/contacts/?${params.toString()}`);
      if (!response.ok) throw new Error('Offline');
      const data = await response.json();
      setLeads(data);
      setError(false);
      setLoading(false);
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = 'http://localhost:8000/contacts/export';
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`http://localhost:8000/contacts/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      await fetch(`http://localhost:8000/contacts/all`, { method: 'DELETE' });
      setShowDeleteAll(false);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchTerm, filterSession, filterScore]);

  useEffect(() => {
    if (lastMessage && lastMessage.event === 'lead_updated') {
      fetchLeads();
    }
  }, [lastMessage]);

  return (
    <div className="space-y-12 animate-fade-in text-slate-900 pb-20 relative">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-8">
                 <Trash2 size={40} />
              </div>
              <h3 className="text-3xl font-black text-center text-slate-900">Purge Lead?</h3>
              <p className="text-slate-400 font-medium text-center mt-4 mb-10 leading-relaxed">
                This action is permanent and will shred all extracted data for this lead from your infinite log.
              </p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setDeleteId(null)}
                   className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all"
                 >
                   Delete Forever
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up">
              <div className="w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-rose-200">
                 <ShieldCheck size={48} />
              </div>
              <h3 className="text-3xl font-black text-center text-slate-900">System Wipe?</h3>
              <p className="text-slate-400 font-medium text-center mt-4 mb-10 leading-relaxed">
                You are about to initiate a full intelligence wipe. This will delete ALL contacts and lead data permanently.
              </p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowDeleteAll(false)}
                   className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={confirmDeleteAll}
                   className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all"
                 >
                   Wipe Everything
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-bounce">
                 <Zap size={24} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Identity Log</h1>
           </div>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
             <ShieldCheck size={14} className="text-emerald-500" />
             Secured Neural Storage • {leads.length} Entities Extracted
           </p>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={() => setShowDeleteAll(true)}
             className="px-8 py-5 bg-white border border-rose-100 text-rose-500 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-50/50 hover:bg-rose-50 transition-all flex items-center gap-3 group"
           >
             <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
             Wipe All
           </button>
           <button 
             onClick={handleExport}
             className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3 group"
           >
             <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
             Export Intelligence
           </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card rounded-[2.5rem] p-4 border-slate-100 bg-white/50 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search Intelligence Log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-none rounded-[2rem] font-bold text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="flex-1 md:w-48 px-6 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-600 text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Sessions</option>
            <option value="primary_account">Primary</option>
            <option value="diya">Diya</option>
          </select>

          <select 
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="flex-1 md:w-48 px-6 py-5 bg-white border border-slate-100 rounded-[2rem] font-bold text-slate-600 text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Scores</option>
            <option value="Hot">Hot Only</option>
            <option value="Warm">Warm Only</option>
            <option value="Cold">Cold Only</option>
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-6">
           <div className="w-20 h-20 border-8 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-sm uppercase tracking-widest animate-pulse">Syncing Intelligence Pipeline...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-14">
          {error && (
            <div className="py-20 px-10 glass-card rounded-[4rem] border-rose-100 bg-rose-50/30 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 bg-rose-100 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-2xl animate-pulse">
                  <Server size={44} />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Intelligence Hub Offline</h3>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">Attempting to Restore Identity Pipeline...</p>
               </div>
            </div>
          )}

          {leads.length > 0 ? (
            leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onDelete={() => setDeleteId(lead.id)} />
            ))
          ) : (
            <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
               <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200">
                  <User size={64} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Intelligence Captured</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">The neural log is currently empty</p>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, onDelete }: { lead: Lead; onDelete: () => void }) {
  const isHot = lead.lead_score === 'Hot';
  
  return (
    <div className="glass-card rounded-[3rem] p-10 border-slate-100 shadow-2xl shadow-slate-100 hover:shadow-indigo-200 transition-all duration-700 group animate-slide-up relative overflow-hidden">
      {/* Visual Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-100/50 transition-colors duration-700" />
      <div className={`absolute top-10 right-10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isHot ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
        {lead.lead_score}
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
        {/* Identity Section */}
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 duration-500 ${isHot ? 'bg-orange-500 shadow-orange-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
            <User size={36} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">
              {lead.extracted_name || 'Anonymous Lead'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Building2 size={16} className="text-slate-300" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                {lead.company || 'Private Entity'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Intelligence */}
        <div className="flex flex-col gap-4 lg:border-l lg:border-slate-100 lg:pl-12">
          <div className="flex items-center gap-4 group/item">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-all">
              <Mail size={18} />
            </div>
            <span className="text-slate-600 font-bold tracking-tight">{lead.email || 'no-email@detected.ai'}</span>
          </div>
          <div className="flex items-center gap-4 group/item">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-all">
              <Phone size={18} />
            </div>
            <span className="text-slate-600 font-bold tracking-tight">{lead.mobile || 'Unknown Frequency'}</span>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="flex items-center gap-10 lg:ml-auto">
           {/* Extraction Quality */}
           <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100" />
                  <circle 
                    cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" 
                    strokeDasharray={175.9} 
                    strokeDashoffset={175.9 * (1 - lead.confidence)} 
                    className={lead.confidence > 0.8 ? 'text-emerald-500' : 'text-orange-500'} 
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-900">{Math.round(lead.confidence * 100)}%</span>
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Confidence</p>
           </div>
           
           <div className="flex gap-4">
              <button 
                onClick={onDelete}
                className="w-16 h-16 bg-white border border-slate-100 text-slate-300 rounded-[1.5rem] flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"
              >
                 <Trash2 size={24} />
              </button>
              <button className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 group/btn relative overflow-hidden">
                 <MessageCircle size={28} className="relative z-10" />
                 <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </button>
           </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-2xl w-full lg:w-2/3">
          <MessageCircle size={18} className="text-indigo-500 shrink-0" />
          <p className="text-slate-400 text-sm font-medium italic line-clamp-1">"{lead.source_message}"</p>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Calendar size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {new Date(lead.created_at).toLocaleDateString()} at {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
