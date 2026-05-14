'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In a real app, you would call the /auth/login endpoint
      // For now, we will simulate a successful login for the admin account
      if (email === 'admin@chatleads.ai' && password === 'admin123') {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError('Invalid credentials. Please use the admin account.');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-indigo-50/50 blur-[120px] -z-10 rounded-full opacity-50" />
      
      <div className="w-full max-w-[440px] space-y-8 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 mx-auto animate-float">
            <Zap size={32} className="text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-slate-400 font-medium">Access your intelligent lead platform</p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-10 border-slate-100 shadow-2xl shadow-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Auth</span>
        </div>
      </div>
    </div>
  );
}
