'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Database, User, Bell, Globe, Save,
  CheckCircle2, Zap, Shield, Activity, X
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
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'api', label: 'API & Webhooks', icon: <Globe size={16} className="md:w-[18px] md:h-[18px]" /> },
  { id: 'account', label: 'Account', icon: <User size={16} className="md:w-[18px] md:h-[18px]" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('ai');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');

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
          {TABS.map(tab => (
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
                            <div className={`absolute top-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-white transition-all duration-300`}
                              style={{ left: enabled ? 'calc(100% - 18px)' : '2px', md: { left: enabled ? 'calc(100% - 22px)' : '2px' }, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
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
        </div>
      </div>
    </motion.div>
  );
}
