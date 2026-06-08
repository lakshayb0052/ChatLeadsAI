'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Database, User, Bell, Globe, Save,
  CheckCircle2, Zap, Shield, Activity, X,
  Users, Plus, Trash2, MapPin, Building2
} from 'lucide-react';

function SettingsTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm w-full text-left transition-all duration-300 relative overflow-hidden ${
        active ? 'bg-[var(--bg-hover)] text-[var(--purple-mid)] border-l-[3px] border-[var(--purple-mid)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--purple-mid)]'
      }`}>
      <span className={active ? 'text-[var(--purple-mid)]' : ''}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProviderCard({ name, selected, desc, onClick }: { name: string; selected: boolean; desc: string; onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 md:p-5 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background: selected ? 'rgba(37,99,235,0.06)' : 'var(--bg-deep)',
        border: `2px solid ${selected ? 'var(--border-bright)' : 'var(--border-subtle)'}`,
        boxShadow: selected ? 'var(--glow-purple)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
      <div className="flex items-center justify-between mb-1 md:mb-1.5">
        <p className="text-xs md:text-sm font-black text-[var(--text-primary)]">{name}</p>
        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? 'var(--purple-mid)' : 'var(--border-glow)', backgroundColor: selected ? 'var(--purple-mid)' : 'transparent' }}>
          {selected && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />}
        </div>
      </div>
      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </motion.div>
  );
}

function InputField({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="space-y-1.5 md:space-y-2">
      <label className="block text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input type={type} defaultValue={defaultValue}
        className="input-dark w-full px-4 md:px-5 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm focus:ring-2 focus:ring-[var(--purple-mid)]" />
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', bounce: 0.3 }}
      className="glass-card rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-4 md:space-y-6"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-black text-[var(--text-primary)] truncate">{title}</h3>
          <p className="text-[10px] md:text-xs font-bold truncate" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

const TABS = [
  { id: 'ai', label: 'AI Engine', icon: <Cpu size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'database', label: 'Database', icon: <Database size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'agents', label: 'Agents Location', icon: <Users size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'api', label: 'API & Webhooks', icon: <Globe size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'account', label: 'Account', icon: <User size={16} className="md:w-[18px] md:h-[18px]" /> },
];

export default function SettingsPage() {
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState('ai');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');

  // Agents & Locations management states
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [lgCode, setLgCode] = useState('');
  const [execName, setExecName] = useState('');
  const [execCode, setExecCode] = useState('');
  const [city, setCity] = useState('');
  const [place, setPlace] = useState('');
  const [venue, setVenue] = useState('');
  const [agentError, setAgentError] = useState('');
  const [agentSuccess, setAgentSuccess] = useState('');

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiUrl = rawApiUrl.replace(/\/$/, '');

  const fetchAgents = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/agents/`, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAgents(data);
    } catch (e) {
      console.error("Failed to fetch agents", e);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role') || 'user';
      setRole(storedRole);
      if (storedRole !== 'superadmin') {
        setActiveTab('agents');
      }
    }
    fetchAgents();
  }, []);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentError('');
    setAgentSuccess('');

    if (!lgCode || !execName || !execCode || !city || !place || !venue) {
      setAgentError('Please fill all fields.');
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/agents/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lg_code: lgCode,
          executive_name: execName,
          executive_code: execCode,
          city,
          place,
          venue
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to add agent');
      }

      setAgentSuccess('Agent added successfully!');
      setLgCode('');
      setExecName('');
      setExecCode('');
      setCity('');
      setPlace('');
      setVenue('');
      fetchAgents();
    } catch (err: any) {
      setAgentError(err.message || 'Error occurred');
    }
  };

  const handleDeleteAgent = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/agents/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) throw new Error();
      fetchAgents();
    } catch (e) {
      console.error("Failed to delete agent", e);
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 1800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
            <Zap size={16} className="md:w-4.5 md:h-4.5 text-[var(--purple-mid)]" />
          </div>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[var(--purple-mid)]">Platform Controls</p>
        </div>
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
          System <span className="gradient-text">Settings</span>
        </h2>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Sidebar Tabs */}
        <div className="glass-card rounded-2xl md:rounded-3xl p-3 md:p-4 h-fit flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible custom-scrollbar space-x-2 lg:space-x-0 lg:space-y-1">
          {TABS.filter(tab => role === 'superadmin' || tab.id === 'agents').map(tab => (
            <div key={tab.id} className="min-w-fit lg:min-w-0 flex-1 lg:flex-none">
              <SettingsTab
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'ai' && (
              <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<Cpu size={20} className="md:w-[22px] md:h-[22px]" />} title="AI Intelligence Engine" subtitle="Configure local or cloud processing">
                  <div className="space-y-2 md:space-y-3">
                    <ProviderCard
                      name="Groq LPU (Cloud)" selected={selectedProvider === 'groq'}
                      desc="Llama 4 Scout • High-speed Extraction"
                      onClick={() => setSelectedProvider('groq')}
                    />
                    <ProviderCard
                      name="Gemini Vision (Cloud)" selected={selectedProvider === 'gemini'}
                      desc="Gemini 2.5 Flash • Multi-modal Vision"
                      onClick={() => setSelectedProvider('gemini')}
                    />
                  </div>
                  <div className="p-4 md:p-5 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4"
                    style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(16,185,129,0.08)' }}>
                      <CheckCircle2 size={16} className="md:w-4.5 md:h-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-wider">Engine Status: Optimal</p>
                      <p className="text-[9px] md:text-[10px] font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>AI responding in 420ms avg.</p>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'database' && (
              <motion.div key="db" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<Database size={20} className="md:w-[22px] md:h-[22px]" />} title="Database & Persistence" subtitle="PostgreSQL connection health">
                  <div className="p-4 md:p-5 rounded-xl md:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                    <div className="min-w-0">
                      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1" style={{ color: 'var(--text-secondary)' }}>Active Database</p>
                      <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] truncate">ChatLeadsAI @ localhost:5432</p>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shrink-0 self-start sm:self-auto"
                      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#059669' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {[['Tables', '8'], ['Records', '2,847'], ['Size', '12 MB']].map(([k, v]) => (
                      <div key={k} className="p-3 md:p-4 rounded-xl md:rounded-2xl text-center"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                        <p className="text-base md:text-xl font-black text-[var(--text-primary)]">{v}</p>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 md:mt-1" style={{ color: 'var(--text-secondary)' }}>{k}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<Bell size={20} className="md:w-[22px] md:h-[22px]" />} title="Notification Preferences" subtitle="Configure alerts and webhooks">
                  <div className="space-y-2 md:space-y-3">
                    {[
                      ['New Lead Captured', 'Notify when a new contact is extracted', true],
                      ['Hot Lead Alert', 'Priority alert for high-intent leads', true],
                      ['Session Disconnected', 'Alert when a WhatsApp session drops', false],
                      ['Daily Summary', 'Receive daily performance digest', false],
                    ].map(([title, desc, defaultEnabled], i) => {
                      const [enabled, setEnabled] = useState(defaultEnabled as boolean);
                      return (
                        <div key={i} className="flex items-center justify-between p-4 md:p-5 rounded-xl md:rounded-2xl gap-4"
                          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-black text-[var(--text-primary)] truncate">{String(title)}</p>
                            <p className="text-[9px] md:text-[10px] font-bold mt-0.5 md:mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{String(desc)}</p>
                          </div>
                          <div onClick={() => setEnabled(!enabled)}
                            className={`w-10 md:w-12 h-5 md:h-6 rounded-full relative cursor-pointer transition-all duration-300 shrink-0`}
                            style={{ background: enabled ? 'linear-gradient(135deg, #2563eb, #1e3a8a)' : 'var(--border-subtle)', border: `1px solid ${enabled ? 'rgba(37,99,235,0.3)' : 'var(--border-subtle)'}`, boxShadow: enabled ? 'var(--glow-purple)' : 'none' }}>
                            <div className={`absolute top-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-white transition-all duration-300 ${enabled ? 'left-[calc(100%-18px)] md:left-[calc(100%-22px)]' : 'left-[2px]'}`}
                              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div key="api" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<Globe size={20} className="md:w-[22px] md:h-[22px]" />} title="API & Webhooks" subtitle="Configure external integrations">
                  <div className="space-y-4 md:space-y-6">
                    <InputField label="Webhook URL" defaultValue="https://your-endpoint.com/webhook" />
                    <InputField label="API Key" defaultValue="cl_live_••••••••••••••••" type="password" />
                    <div className="p-4 md:p-5 rounded-xl md:rounded-2xl space-y-2 md:space-y-3"
                      style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-[10px] md:text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Webhook Events</p>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {['lead.created', 'lead.scored', 'session.connected', 'session.disconnected'].map(e => (
                          <div key={e} className="flex items-center gap-1.5 md:gap-2 bg-[var(--bg-deep)] px-2.5 py-1.5 rounded-lg border border-[var(--border-glow)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--purple-mid)]" />
                            <code className="text-[10px] md:text-xs font-bold text-[var(--purple-mid)]">{e}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div key="agents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<Users size={20} className="md:w-[22px] md:h-[22px]" />} title="Agents Location & Staff" subtitle="Manage multiple agents and locations linked by LG codes">
                  
                  {/* Form to Add New Agent */}
                  <form onSubmit={handleAddAgent} className="p-5 rounded-2xl border space-y-4 shadow-sm" style={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs font-black uppercase tracking-widest text-[var(--purple-mid)]">Add New Agents Location</p>
                    
                    {agentError && (
                      <div className="p-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                        {agentError}
                      </div>
                    )}
                    {agentSuccess && (
                      <div className="p-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {agentSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">LG Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. FIDR30" 
                          value={lgCode}
                          onChange={e => setLgCode(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Executive Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Samiksha" 
                          value={execName}
                          onChange={e => setExecName(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Executive Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. FIDR30" 
                          value={execCode}
                          onChange={e => setExecCode(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">City</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Delhi (or Bangalore)" 
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Place / Area</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Vegas Dwarka (or White Field)" 
                          value={place}
                          onChange={e => setPlace(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">Venue</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Croma (or Croma Store)" 
                          value={venue}
                          onChange={e => setVenue(e.target.value)}
                          className="input-dark w-full px-3 py-2 rounded-lg font-bold text-xs" 
                        />
                      </div>
                    </div>

                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 btn-primary rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                      <Plus size={14} /> Add Agents Location
                    </button>
                  </form>

                  {/* List of Registered Agents */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Registered Agents ({agents.length})</p>
                    
                    {loadingAgents ? (
                      <p className="text-xs italic text-[var(--text-ghost)]">Loading agents...</p>
                    ) : agents.length === 0 ? (
                      <div className="p-6 text-center border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
                        <Users size={24} className="mx-auto text-[var(--text-ghost)] mb-2" />
                        <p className="text-xs font-bold text-[var(--text-ghost)] uppercase tracking-wider">No agents added yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                        {agents.map((agent: any) => (
                          <div key={agent.id} className="p-4 rounded-xl border flex flex-col justify-between hover:border-[var(--purple-mid)] transition-all" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-subtle)' }}>
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black text-[var(--purple-mid)] uppercase tracking-widest bg-[var(--bg-deep)] px-2.5 py-0.5 rounded border border-glow">
                                  LG: {agent.lg_code}
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteAgent(agent.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div>
                                <p className="text-xs font-black text-[var(--text-primary)]">{agent.executive_name}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-wider">Code: {agent.executive_code}</p>
                              </div>

                              <div className="grid grid-cols-3 gap-1 bg-[var(--bg-deep)] p-2 rounded-lg text-[9px] font-bold text-[var(--text-secondary)] border border-subtle">
                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase text-[var(--text-muted)]">City</p>
                                  <p className="text-[var(--text-primary)] truncate">{agent.city}</p>
                                </div>
                                <div className="min-w-0 col-span-2 border-l pl-2" style={{ borderColor: 'var(--border-subtle)' }}>
                                  <p className="text-[8px] font-black uppercase text-[var(--text-muted)]">Venue</p>
                                  <p className="text-[var(--text-primary)] truncate">{agent.place} ({agent.venue})</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <SectionCard icon={<User size={20} className="md:w-[22px] md:h-[22px]" />} title="Account Settings" subtitle="Manage your profile and credentials">
                  <div className="flex items-center gap-4 md:gap-5 p-4 md:p-5 rounded-xl md:rounded-2xl"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #ec4899)', boxShadow: 'var(--glow-purple)' }}>
                      L
                    </div>
                    <div className="min-w-0">
                      <p className="text-base md:text-lg font-black text-[var(--text-primary)] truncate">Lakshay</p>
                      <p className="text-xs md:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>admin@chatleads.ai</p>
                      <div className="inline-flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg mt-1.5 md:mt-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)', color: 'var(--purple-mid)' }}>
                        <Shield size={10} className="md:w-2.5 md:h-2.5" /> System Admin
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                    <InputField label="Display Name" defaultValue="Lakshay" />
                    <InputField label="Email Address" defaultValue="admin@chatleads.ai" type="email" />
                    <InputField label="New Password" defaultValue="" type="password" />
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Bar */}
          {role === 'superadmin' && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 pt-2 md:pt-4">
              <button className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                Discard
              </button>
              <motion.button 
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
                onClick={handleSave} disabled={saving}
                className="btn-primary w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 disabled:opacity-70">
                {saved ? (
                  <><CheckCircle2 size={14} className="md:w-4 md:h-4" /> Saved!</>
                ) : saving ? (
                  <><Activity size={14} className="md:w-4 md:h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save size={14} className="md:w-4 md:h-4" /> Save Preferences</>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
