'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Trash2, Mail, Lock, ShieldAlert,
  Loader2, CheckCircle2, AlertCircle, Smartphone, User, Globe
} from 'lucide-react';

interface CompanyUser {
  id: number;
  email: string;
  display_name: string;
  role: string;
  company_name: string;
  max_sessions: number;
  is_active: boolean;
}

export default function CompaniesPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [maxSessions, setMaxSessions] = useState(3);
  const [formError, setFormError] = useState('');

  // Fetch registered companies
  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve corporate client list.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          email: email.trim(),
          password: password,
          company_name: companyName.trim(),
          max_sessions: Number(maxSessions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Could not register new client company.');
      }

      // Success
      setModalOpen(false);
      // Reset form
      setDisplayName('');
      setEmail('');
      setPassword('');
      setCompanyName('');
      setMaxSessions(3);
      
      // Refresh list
      fetchCompanies();
    } catch (err: any) {
      setFormError(err.message || 'Fail-safe error creating company user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to delete this company? All associated devices and data will be permanently removed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete company user.');
      }

      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error occurred during deletion.');
    }
  };

  const totalSessionsAllotted = users.reduce((acc, user) => acc + user.max_sessions, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
              <Briefcase size={16} className="text-[var(--purple-mid)]" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--purple-mid)]">Super Admin Command Center</p>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
            Client <span className="gradient-text">Companies</span>
          </h2>
          <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">
            Provision workspaces, configure API allocations, and manage active WhatsApp quotas.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="btn-primary px-6 py-3.5 rounded-xl font-black text-sm flex items-center gap-2 group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Add Company Client
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="glass-card rounded-3xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--glow-soft)' }}>
          <div>
            <p className="text-2xl font-black text-[var(--text-primary)]">{users.length}</p>
            <p className="text-[10px] font-black uppercase tracking-wider mt-1 text-[var(--text-muted)]">Active Companies</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50 text-[var(--purple-mid)] border border-violet-100">
            <Globe size={20} />
          </div>
        </div>
        {/* Metric 2 */}
        <div className="glass-card rounded-3xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--glow-soft)' }}>
          <div>
            <p className="text-2xl font-black text-[var(--text-primary)]">{totalSessionsAllotted}</p>
            <p className="text-[10px] font-black uppercase tracking-wider mt-1 text-[var(--text-muted)]">Allotted WhatsApp Sessions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Smartphone size={20} />
          </div>
        </div>
        {/* Metric 3 */}
        <div className="glass-card rounded-3xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--glow-soft)' }}>
          <div>
            <p className="text-2xl font-black text-emerald-600">100%</p>
            <p className="text-[10px] font-black uppercase tracking-wider mt-1 text-[var(--text-muted)]">System Cloud Health</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Main Database Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', boxShadow: 'var(--glow-purple)' }}>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[var(--purple-mid)]" size={32} />
            <p className="text-sm font-bold text-[var(--text-secondary)]">Retrieving client database...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-sm font-bold text-red-600">{error}</p>
            <button onClick={fetchCompanies} className="mt-3 px-5 py-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-bright)] text-xs font-black text-[var(--purple-mid)]">
              Retry Sync
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
              <Briefcase size={28} className="text-[var(--text-ghost)]" />
            </div>
            <div>
              <p className="text-base font-black text-[var(--text-primary)]">No Companies Registered</p>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">Get started by provisioning your first corporate client account.</p>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="btn-primary px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 mt-2">
              <Plus size={16} /> Provision Client Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-[var(--bg-hover)]" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Company Name</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Primary Admin</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">WhatsApp Quota</th>
                  <th className="py-5 px-6 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                  <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-hover)] transition-colors duration-200">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-[var(--purple-mid)] border border-violet-100 font-black text-sm capitalize">
                          {user.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)]">{user.company_name}</p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Corporate Seat</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <p className="text-sm font-black text-[var(--text-primary)]">{user.display_name}</p>
                      <p className="text-xs font-bold text-[var(--text-secondary)] mt-0.5">{user.email}</p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black"
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-glow)', color: 'var(--purple-mid)' }}>
                        <Smartphone size={12} /> {user.max_sessions} Devices Max
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-100 text-emerald-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <button onClick={() => handleDeleteCompany(user.id)}
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Client Account">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide Up Modal Container */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          
          <div className="glass-card rounded-3xl w-full max-w-lg p-8 relative z-10 animate-slide-up space-y-6"
            style={{ border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-purple)' }}>
            
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-[var(--purple-mid)]">
                <Briefcase size={20} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Workspace Provisioner</p>
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Add Corporate Client</h3>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">Seed database configurations and assign allowed WhatsApp device seats.</p>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Company Name</label>
                  <input type="text" required placeholder="e.g. Acme CRM"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                {/* Admin Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Admin Name</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" size={14} />
                    <input type="text" required placeholder="e.g. John Doe"
                      className="input-dark w-full pl-9 pr-4 py-3 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                      value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Corporate Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" size={14} />
                  <input type="email" required placeholder="admin@company.com"
                    className="input-dark w-full pl-9 pr-4 py-3 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Access Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">Corporate Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" size={14} />
                  <input type="password" required placeholder="Assign robust login key"
                    className="input-dark w-full pl-9 pr-4 py-3 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              {/* Session quota limits */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-secondary)]">WhatsApp Device Quota</label>
                <div className="relative group">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" size={14} />
                  <input type="number" required min={1} max={100}
                    className="input-dark w-full pl-9 pr-4 py-3 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={maxSessions} onChange={e => setMaxSessions(Number(e.target.value))} />
                </div>
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">Maximum concurrent connected devices this company is allowed to link.</p>
              </div>

              {/* Form errors */}
              {formError && (
                <div className="p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200">
                  <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs font-bold text-red-700 leading-normal">{formError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-xs font-black transition-all"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="btn-primary px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-60">
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Provisioning...
                    </>
                  ) : (
                    'Provision Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
