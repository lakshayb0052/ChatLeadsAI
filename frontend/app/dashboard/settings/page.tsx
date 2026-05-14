'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  Database, 
  User, 
  Bell, 
  Globe,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div>
        <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-2">Platform Controls</p>
        <h2 className="text-4xl font-black tracking-tight text-slate-900">System Settings</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Navigation Tabs (Vertical) */}
        <div className="space-y-2">
          <SettingsTab icon={<Cpu size={18} />} label="AI Engine" active />
          <SettingsTab icon={<Database size={18} />} label="Database" />
          <SettingsTab icon={<Bell size={18} />} label="Notifications" />
          <SettingsTab icon={<Globe size={18} />} label="API & Webhooks" />
          <SettingsTab icon={<User size={18} />} label="Account" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Configuration */}
          <div className="glass-card rounded-[2.5rem] p-10 border-slate-100 shadow-2xl shadow-slate-100 space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                 <Cpu size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-900">AI Intelligence Engine</h3>
                 <p className="text-xs font-bold text-slate-400">Configure your local or cloud processing</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <ProviderCard name="Ollama (Local)" selected={true} desc="Llama 3 • Free • Secure" />
                  <ProviderCard name="OpenAI (Cloud)" selected={false} desc="GPT-4o • Pay-per-use" />
               </div>

               <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Ollama Host URL</label>
                  <input 
                    type="text" 
                    defaultValue="http://localhost:11434"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
               </div>

               <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <div>
                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Engine Status: Optimal</p>
                    <p className="text-[10px] font-bold text-emerald-600 opacity-80">Local Llama 3 is responding in 420ms.</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="glass-card rounded-[2.5rem] p-10 border-slate-100 shadow-2xl shadow-slate-100 space-y-8">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border border-slate-100">
                 <Database size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-900">Database & Persistence</h3>
                 <p className="text-xs font-bold text-slate-400">PostgreSQL connection health</p>
               </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="space-y-1">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Database</p>
                 <p className="text-sm font-bold text-slate-900">ChatLeadsAI @ localhost:5432</p>
               </div>
               <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-slate-100">
                 Connected
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
             <button className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">
               Discard
             </button>
             <button 
              onClick={handleSave}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
             >
               {saving ? 'Updating...' : <><Save size={18} /> Save Preferences</>}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
      active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ProviderCard({ name, selected, desc }: { name: string, selected: boolean, desc: string }) {
  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${
      selected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-black text-slate-900">{name}</p>
        <div className={`w-4 h-4 rounded-full border-2 ${selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}`} />
      </div>
      <p className="text-[10px] font-bold text-slate-400">{desc}</p>
    </div>
  );
}
