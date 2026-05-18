'use client';

import React, { useState } from 'react';
import {
  Cpu, Database, User, Bell, Globe, Save,
  CheckCircle2, Zap, Shield, Activity
} from 'lucide-react';

function SettingsTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm w-full text-left transition-all duration-300 relative overflow-hidden ${active ? 'nav-active text-purple-300' : ''}`}
      style={!active ? { color: '#6b6190' } : {}}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.color = '#a89fd4'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6190'; } }}>
      <span className={active ? 'text-purple-400' : ''}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProviderCard({ name, selected, desc, onClick }: { name: string; selected: boolean; desc: string; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="p-5 rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        background: selected ? 'rgba(124,58,237,0.1)' : 'rgba(139,92,246,0.03)',
        border: `2px solid ${selected ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.08)'}`,
        boxShadow: selected ? '0 0 20px rgba(124,58,237,0.15)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(139,92,246,0.08)'; }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-black text-white">{name}</p>
        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? '#8b5cf6' : '#3d3660', backgroundColor: selected ? '#8b5cf6' : 'transparent' }}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b6190' }}>{desc}</p>
    </div>
  );
}

function InputField({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#6b6190' }}>
        {label}
      </label>
      <input type={type} defaultValue={defaultValue}
        className="input-dark w-full px-5 py-4 rounded-xl font-bold text-sm" />
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="text-xs font-bold" style={{ color: '#6b6190' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'ai', label: 'AI Engine', icon: <Cpu size={18} /> },
  { id: 'database', label: 'Database', icon: <Database size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'api', label: 'API & Webhooks', icon: <Globe size={18} /> },
  { id: 'account', label: 'Account', icon: <User size={18} /> },
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(139,92,246,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Zap size={18} className="text-purple-400" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-500">Platform Controls</p>
        </div>
        <h2 className="text-5xl font-black tracking-tight text-white">
          System <span className="gradient-text">Settings</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Tabs */}
        <div className="glass-card rounded-3xl p-4 h-fit space-y-1">
          {TABS.map(tab => (
            <SettingsTab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">

          {activeTab === 'ai' && (
            <>
              <SectionCard icon={<Cpu size={22} />} title="AI Intelligence Engine" subtitle="Configure local or cloud processing">
                <div className="space-y-3">
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
                <div className="p-5 rounded-2xl flex items-center gap-4"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">Engine Status: Optimal</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: '#6b6190' }}>AI responding in 420ms avg.</p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'database' && (
            <SectionCard icon={<Database size={22} />} title="Database & Persistence" subtitle="PostgreSQL connection health">
              <div className="p-5 rounded-2xl flex items-center justify-between"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6b6190' }}>Active Database</p>
                  <p className="text-sm font-bold text-white">ChatLeadsAI @ localhost:5432</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[['Tables', '8'], ['Records', '2,847'], ['Size', '12 MB']].map(([k, v]) => (
                  <div key={k} className="p-4 rounded-2xl text-center"
                    style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}>
                    <p className="text-xl font-black text-white">{v}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#6b6190' }}>{k}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'notifications' && (
            <SectionCard icon={<Bell size={22} />} title="Notification Preferences" subtitle="Configure alerts and webhooks">
              {[
                ['New Lead Captured', 'Notify when a new contact is extracted', true],
                ['Hot Lead Alert', 'Priority alert for high-intent leads', true],
                ['Session Disconnected', 'Alert when a WhatsApp session drops', false],
                ['Daily Summary', 'Receive daily performance digest', false],
              ].map(([title, desc, enabled]) => (
                <div key={String(title)} className="flex items-center justify-between p-5 rounded-2xl"
                  style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.08)' }}>
                  <div>
                    <p className="text-sm font-black text-white">{String(title)}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: '#6b6190' }}>{String(desc)}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300`}
                    style={{ background: enabled ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(139,92,246,0.1)', border: `1px solid ${enabled ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.15)'}`, boxShadow: enabled ? '0 0 15px rgba(124,58,237,0.3)' : 'none' }}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300`}
                      style={{ left: enabled ? '24px' : '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              ))}
            </SectionCard>
          )}

          {activeTab === 'api' && (
            <SectionCard icon={<Globe size={22} />} title="API & Webhooks" subtitle="Configure external integrations">
              <InputField label="Webhook URL" defaultValue="https://your-endpoint.com/webhook" />
              <InputField label="API Key" defaultValue="cl_live_••••••••••••••••" type="password" />
              <div className="p-5 rounded-2xl space-y-3"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <p className="text-xs font-black text-white uppercase tracking-widest">Webhook Events</p>
                {['lead.created', 'lead.scored', 'session.connected', 'session.disconnected'].map(e => (
                  <div key={e} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <code className="text-xs font-bold" style={{ color: '#a78bfa' }}>{e}</code>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'account' && (
            <SectionCard icon={<User size={22} />} title="Account Settings" subtitle="Manage your profile and credentials">
              <div className="flex items-center gap-5 p-5 rounded-2xl"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.08)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                  L
                </div>
                <div>
                  <p className="text-lg font-black text-white">Lakshay</p>
                  <p className="text-sm" style={{ color: '#6b6190' }}>admin@chatleads.ai</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg mt-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                    <Shield size={10} /> System Admin
                  </div>
                </div>
              </div>
              <InputField label="Display Name" defaultValue="Lakshay" />
              <InputField label="Email Address" defaultValue="admin@chatleads.ai" type="email" />
              <InputField label="New Password" defaultValue="" type="password" />
            </SectionCard>
          )}

          {/* Save Bar */}
          <div className="flex justify-end gap-3 pt-2">
            <button className="px-8 py-4 rounded-2xl font-black text-sm transition-all"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)', color: '#6b6190' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.color = '#a89fd4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.color = '#6b6190'; }}>
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 disabled:opacity-70">
              {saved ? (
                <><CheckCircle2 size={16} /> Saved!</>
              ) : saving ? (
                <><Activity size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Preferences</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
