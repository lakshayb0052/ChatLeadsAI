"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Lead {
  id: number;
  extracted_name: string;
  mobile: string;
  email: string;
  lead_score: string;
  created_at: string;
  session_id: string;
}

interface WASession {
  session_id: string;
  status: string;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [leadsRes, sessionsRes] = await Promise.all([
        fetch(`${apiUrl}/contacts/`),
        fetch(`${apiUrl}/sessions/`)
      ]);
      const leadsData = await leadsRes.json();
      const sessionsData = await sessionsRes.json();
      setLeads(leadsData);
      setSessions(sessionsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedSessions.length === 0) {
      alert("Please select at least one session");
      return;
    }
    
    const sessionIds = selectedSessions.join(",");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    window.open(`${apiUrl}/contacts/export?session_ids=${sessionIds}`, "_blank");
    setShowExportModal(false);
  };

  const toggleSession = (id: string) => {
    setSelectedSessions(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-10 px-2">ChatLeads <span className="text-blue-500">AI</span></h2>
        <nav className="space-y-2 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-xl text-white font-medium">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/whatsapp" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <span>📱</span> WhatsApp
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <span>👤</span> Contacts
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <span>⚙️</span> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Lead Intelligence</h1>
            <p className="text-slate-400">Automatically extracted leads from multiple WhatsApp sessions.</p>
          </div>
          <button 
            onClick={() => setShowExportModal(true)}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span>📥</span> Download Excel
          </button>
        </header>

        {/* Export Modal/Dropdown */}
        {showExportModal && (
          <div className="absolute top-24 right-8 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">Select Sessions</h3>
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map(session => (
                <div 
                  key={session.session_id}
                  onClick={() => toggleSession(session.session_id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedSessions.includes(session.session_id) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  <span className="text-sm font-medium">{session.session_id}</span>
                  {selectedSessions.includes(session.session_id) && <span>✓</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 text-sm font-medium text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all"
              >
                Download
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Leads", value: leads.length.toLocaleString(), color: "text-blue-400" },
            { label: "Active Sessions", value: sessions.filter(s => s.status === 'connected').length.toString(), color: "text-emerald-400" },
            { label: "Hot Leads", value: leads.filter(l => l.lead_score === 'Hot').length.toString(), color: "text-pink-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
              <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Contacts Table */}
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-sm">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Mobile</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Session</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">Loading leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No leads captured yet.</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-6 py-4 font-medium">{lead.extracted_name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-sm">{lead.mobile}</td>
                  <td className="px-6 py-4 text-slate-400">{lead.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black ${
                      lead.lead_score === 'Hot' ? 'bg-pink-500/10 text-pink-500' :
                      lead.lead_score === 'Warm' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {lead.lead_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{lead.session_id}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
