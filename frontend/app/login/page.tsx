'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function FloatingOrb({ x, y, size, delay, color = 'rgba(37,99,235,0.08)' }: { x: string; y: string; size: number; delay: number, color?: string }) {
  return (
    <motion.div 
      className="absolute rounded-full pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
      transition={{ 
        opacity: { duration: 1, delay },
        scale: { duration: 1, delay },
        y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay }
      }}
      style={{
        left: x, top: y, width: size, height: size,
        background: `radial-gradient(circle, ${color}, transparent)`,
        filter: 'blur(40px)',
      }} />
  );
}

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const source = searchParams.get('source') || 'dashboard';

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/auth/login-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          source: source
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('display_name', data.display_name);
      localStorage.setItem('email', data.email);
      localStorage.setItem('company_name', data.company_name || 'Individual');
      localStorage.setItem('max_sessions', String(data.max_sessions));

      setTimeout(() => {
        router.push('/dashboard');
      }, 800);

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Connection error. Please check if the server is running.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-void)] font-sans overflow-hidden">
      
      {/* ── Left Side: Brand Visuals (Desktop Only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--bg-deep)] border-r border-[var(--border-subtle)] items-center justify-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <FloatingOrb x="10%" y="20%" size={300} delay={0} />
          <FloatingOrb x="60%" y="60%" size={250} delay={1.5} color="rgba(236,72,153,0.05)" />
        </div>

        {/* Floating 3D Showcase */}
        <div className="relative z-10 p-12 text-center max-w-lg">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotateY: -30 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="w-32 h-32 mx-auto mb-10 drop-shadow-2xl"
          >
            <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
          </motion.div>
          
          <motion.h2 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black tracking-tight text-[var(--text-primary)] mb-6"
          >
            Enterprise-Grade <br/>
            <span className="gradient-text">Lead Extraction</span>
          </motion.h2>
          
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg leading-relaxed text-[var(--text-secondary)] mb-10"
          >
            Transform your WhatsApp communication into structured, actionable data securely and instantly.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--purple-mid)]">
              <ShieldCheck size={16} /> 256-bit Encrypted
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--purple-mid)]">
              <Activity size={16} /> 99.9% Uptime
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right Side: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <FloatingOrb x="10%" y="10%" size={150} delay={0} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden w-16 h-16 flex items-center justify-center mx-auto mb-4 relative overflow-hidden animate-float">
              <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
            </div>

            {source !== 'console' && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
                <ShieldCheck size={12} /> Enterprise Workspace
              </div>
            )}

            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {source === 'console' ? 'Console Secure Login' : 'Workspace Login'}
            </h1>
            <p className="text-xs md:text-sm font-bold mt-2" style={{ color: 'var(--text-secondary)' }}>
              {source === 'console' ? 'Elevated Access Control Terminal' : 'Access your WhatsApp extraction workspace'}
            </p>
          </div>

          {/* Form Container Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="glass-card rounded-3xl p-6 md:p-8" 
            style={{ boxShadow: 'var(--glow-purple)', border: '1px solid var(--border-bright)' }}
          >
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    size={16}
                    style={{ color: email ? 'var(--purple-mid)' : 'var(--text-ghost)' }} />
                  <input type="email" required placeholder="name@company.com"
                    className="input-dark w-full pl-12 pr-5 py-3 md:py-4 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    size={16}
                    style={{ color: password ? 'var(--purple-mid)' : 'var(--text-ghost)' }} />
                  <input type={showPass ? 'text' : 'password'} required placeholder="••••••••••"
                    className="input-dark w-full pl-12 pr-12 py-3 md:py-4 rounded-xl text-sm font-bold text-[var(--text-primary)]"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Message Box */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0 mt-1.5" />
                  <p className="text-xs font-bold text-red-700 leading-normal">{error}</p>
                </motion.div>
              )}

              {/* Submit Widget */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className="btn-primary w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-xl shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    {source === 'console' ? 'Sign In as Superadmin' : 'Access Dashboard'}
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            {source !== 'console' && (
              <>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-ghost)' }}>credentials</p>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                <div className="p-4 rounded-2xl text-center"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                    Corporate Account
                  </p>
                  <p className="text-xs font-bold text-[var(--purple-mid)]">
                    Use your assigned Company User details
                  </p>
                </div>
              </>
            )}
          </motion.div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <ShieldCheck size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Secure Encrypted TLS Connection
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        <Loader2 className="animate-spin text-[var(--purple-mid)]" size={32} />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}

