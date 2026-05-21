'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Zap, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function FloatingOrb({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) {
  return (
    <div className="absolute rounded-full pointer-events-none opacity-0 animate-fade-in"
      style={{
        left: x, top: y, width: size, height: size, animationDelay: `${delay}s`,
        background: 'radial-gradient(circle, rgba(124,58,237,0.08), transparent)',
        filter: 'blur(40px)',
        animation: `float-slow ${8 + delay}s ease-in-out ${delay}s infinite, fadeIn 1.2s ease ${delay}s forwards`,
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

      // Store auth session variables
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('display_name', data.display_name);
      localStorage.setItem('email', data.email);
      localStorage.setItem('company_name', data.company_name || 'Individual');
      localStorage.setItem('max_sessions', String(data.max_sessions));

      // Successfully authenticated
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg-void)]">
      
      {/* Background Graphic Rings & Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <FloatingOrb x="5%" y="15%" size={250} delay={0} />
        <FloatingOrb x="75%" y="55%" size={180} delay={1.5} />
      </div>

      <div className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Logo and Dynamic Headers */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-5 relative overflow-hidden animate-float">
            <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
          </div>

          {source === 'console' ? null : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
              <ShieldCheck size={12} /> Enterprise Workspace
            </div>
          )}

          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {source === 'console' ? 'Console Secure Login' : 'Workspace Login'}
          </h1>
          <p className="text-xs font-bold mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            {source === 'console' ? 'Elevated Access Control Terminal' : 'Access your WhatsApp extraction workspace'}
          </p>
        </div>

        {/* Form Container Card */}
        <div className="glass-card rounded-3xl p-8" style={{ boxShadow: 'var(--glow-purple)', border: '1px solid var(--border-bright)' }}>
          <form onSubmit={handleLogin} className="space-y-5">

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
                  className="input-dark w-full pl-12 pr-5 py-4 rounded-xl text-sm font-bold text-[var(--text-primary)]"
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
                  className="input-dark w-full pl-12 pr-12 py-4 rounded-xl text-sm font-bold text-[var(--text-primary)]"
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
              <div className="p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0 mt-1.5" />
                <p className="text-xs font-bold text-red-700 leading-normal">{error}</p>
              </div>
            )}

            {/* Submit Widget */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
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
            </button>
          </form>

          {source !== 'console' && (
            <>
              {/* Guidelines */}
              <div className="flex items-center gap-4 my-5">
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
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <ShieldCheck size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Secure Encrypted TLS Connection
          </span>
        </div>
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
