'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  ArrowRight,
  Lock,
  Globe,
  Cpu,
  Eye,
  Activity,
  Sparkles,
  ChevronRight
} from 'lucide-react';

/* ─── Animated Counter ──────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = Math.ceil(end / 60);
      const timer = setInterval(() => {
        start = Math.min(start + step, end);
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, 20);
      observer.disconnect();
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Floating Particle ──────────────────────────────────── */
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <div
      className="absolute rounded-full opacity-20 pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: '-20px',
        width: size,
        height: size,
        background: 'radial-gradient(circle, var(--purple-mid), transparent)',
        animation: `particle-float ${3 + delay}s ease-out ${delay}s infinite`,
      }}
    />
  );
}

/* ─── Feature Card ─────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <div
      className="glass-card glass-card-hover rounded-3xl p-10 group cursor-default"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'var(--border-subtle)' }} />
        <span className="relative z-10 text-[var(--purple-mid)] group-hover:text-[var(--purple-deep)] transition-colors">{icon}</span>
      </div>
      <h3 className="text-xl font-black text-[var(--text-primary)] mb-4 tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      <div className="flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-widest text-[var(--purple-mid)] opacity-0 group-hover:opacity-100 transition-all duration-300">
        Learn More <ChevronRight size={14} />
      </div>
    </div>
  );
}

/* ─── Stat Pill ──────────────────────────────────────────── */
function StatPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="glass-card rounded-2xl px-8 py-6 text-center" style={{ border: '1px solid var(--border-bright)' }}>
      <p className="text-3xl font-black gradient-text mb-1">
        <Counter end={value} suffix={suffix} />
      </p>
      <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-void)]">

      {/* ── Ambient Background Effects ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-15"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.3) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] opacity-5"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'backdrop-blur-2xl border-b' : ''}`}
        style={{ backgroundColor: scrolled ? 'rgba(249,248,252,0.85)' : 'transparent', borderColor: scrolled ? 'var(--border-subtle)' : 'transparent' }}>
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center animate-pulse-glow relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="absolute inset-0 opacity-50"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)' }} />
              <Zap size={22} className="text-white fill-white relative z-10" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">ChatLeads</span>
              <span className="ml-1 text-xs font-black text-[var(--purple-mid)]">AI</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            {['Technology', 'Pricing', 'Security', 'Docs'].map((item) => (
              <a key={item} href="#"
                className="text-sm font-bold transition-all duration-300 hover:text-[var(--purple-mid)] relative group"
                style={{ color: 'var(--text-secondary)' }}>
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
              </a>
            ))}
          </div>

          {/* CTA */}
          <a href="/login?source=dashboard"
            className="btn-primary px-7 py-3.5 rounded-2xl text-sm flex items-center gap-2 group">
            Access Dashboard
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-52 pb-32 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em]"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--purple-mid)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--purple-mid)' }} />
              </span>
              Live AI Extraction Engine Active
              <Sparkles size={12} />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-7xl md:text-8xl font-black tracking-tight leading-[0.92] mb-10 animate-fade-in">
            <span className="text-[var(--text-primary)]">Turn WhatsApp</span><br />
            <span className="gradient-text animate-neon-pulse">into Leads.</span>
          </h1>

          {/* Sub */}
          <p className="text-center text-xl max-w-2xl mx-auto leading-relaxed mb-14 animate-fade-in delay-200"
            style={{ color: 'var(--text-secondary)' }}>
            The world's first privacy-first lead extraction platform. Capture contacts from text and images with enterprise-grade AI intelligence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in delay-300">
            <a href="/login?source=launch"
              className="btn-primary w-full sm:w-auto px-10 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 group">
              <Zap size={20} className="fill-white" />
              Launch Platform
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="/dashboard/whatsapp"
              className="btn-ghost w-full sm:w-auto px-10 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 group"
              style={{ color: 'var(--text-secondary)' }}>
              <Smartphone size={20} />
              Connect WhatsApp
            </a>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 animate-fade-in delay-400">
            <StatPill label="Leads Captured" value={50000} suffix="+" />
            <StatPill label="Active Sessions" value={500} suffix="+" />
            <StatPill label="Accuracy Rate" value={99} suffix="%" />
            <StatPill label="Extraction Speed" value={420} suffix="ms" />
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <Particle key={i} delay={i * 0.5} x={10 + i * 12} size={4 + (i % 3) * 4} />
          ))}
        </div>
      </section>

      {/* ── 3D Dashboard Mockup ── */}
      <section className="relative z-10 px-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="card-3d">
            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-bright)',
                boxShadow: 'var(--glow-purple)',
              }}>
              {/* Window bar */}
              <div className="flex items-center gap-3 px-6 py-4 border-b animate-fade-in"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}>
                {['#ef4444','#f59e0b','#10b981'].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
                <div className="flex-1 flex justify-center">
                  <div className="px-8 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    chatleads.ai/dashboard
                  </div>
                </div>
              </div>

              {/* Mock Content */}
              <div className="p-8 grid grid-cols-3 gap-6" style={{ minHeight: '340px' }}>
                {/* Stat cards mock */}
                {[
                  { label: 'Total Leads', val: '2,847', color: '#8b5cf6' },
                  { label: 'Active Fleet', val: '12', color: '#10b981' },
                  { label: 'Hot Ratio', val: '68%', color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-6 animate-fade-in"
                    style={{ background: 'var(--bg-hover)', border: `1px solid var(--border-glow)`, animationDelay: `${i * 0.15}s` }}>
                    <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                      style={{ background: `rgba(${s.color === '#8b5cf6' ? '139,92,246' : s.color === '#10b981' ? '16,185,129' : '245,158,11'},0.08)` }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    </div>
                    <p className="text-2xl font-black text-[var(--text-primary)] mb-1">{s.val}</p>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                  </div>
                ))}
                {/* Activity mock */}
                <div className="col-span-3 rounded-2xl p-6 animate-fade-in"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-end gap-3 h-20">
                    {[30, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-lg transition-all duration-1000 animate-fade-in"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(180deg, rgba(124,58,237,${0.25 + h / 400}) 0%, rgba(124,58,237,0.12) 100%)`,
                          border: '1px solid var(--border-glow)',
                          animationDelay: `${i * 0.05}s`
                        }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.02) 0%, transparent 60%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-black uppercase tracking-[0.4em] mb-5 text-[var(--purple-mid)]">
              Engineered For Scale
            </p>
            <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)] mb-6">
              Built For <span className="gradient-text">Intelligence</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Every feature is precision-engineered to capture, analyze, and convert WhatsApp conversations into actionable leads.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe size={28} />}
              title="Global Sync Engine"
              desc="Connect any WhatsApp account worldwide and start extracting leads in milliseconds with our always-on infrastructure."
              delay={0}
            />
            <FeatureCard
              icon={<Lock size={28} />}
              title="Sovereign Data Control"
              desc="Zero-knowledge architecture. Your keys never leave your system. Enterprise-grade privacy by design."
              delay={0.1}
            />
            <FeatureCard
              icon={<Eye size={28} />}
              title="Visual Intelligence OCR"
              desc="Built-in AI vision processes business cards and images as easily as plain text — powered by Gemini 2.5."
              delay={0.2}
            />
            <FeatureCard
              icon={<Activity size={28} />}
              title="Real-Time WebSocket"
              desc="Live feed of every extracted lead with persistent WebSocket connection and automatic reconnection."
              delay={0.3}
            />
            <FeatureCard
              icon={<Cpu size={28} />}
              title="AI Scoring Engine"
              desc="Automatic Hot/Warm/Cold classification based on intent signals, engagement depth, and contact completeness."
              delay={0.4}
            />
            <FeatureCard
              icon={<BarChart3 size={28} />}
              title="Fleet Analytics"
              desc="Monitor performance across all WhatsApp sessions with real-time charts and instant export to Excel."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-16 relative overflow-hidden"
            style={{ border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-purple)' }}>
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
            {/* Orbit ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 pointer-events-none animate-spin-slow"
              style={{ border: '2px dashed #8b5cf6' }} />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 20px rgba(124,58,237,0.2)' }}>
                <Zap size={36} className="text-white fill-white" />
              </div>
              <h2 className="text-5xl font-black tracking-tight text-[var(--text-primary)] mb-5">
                Ready to Scale?
              </h2>
              <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
                Join 500+ businesses automating their WhatsApp lead generation with AI.
              </p>
              <a href="/login?source=console"
                className="btn-primary inline-flex px-12 py-5 rounded-2xl text-lg font-black items-center gap-3 group">
                <Zap size={22} className="fill-white" />
                Access the Console
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-12 border-t text-center animate-fade-in"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <Zap size={12} className="text-white fill-white" />
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">ChatLeads AI</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-ghost)' }}>
          © 2026 • All Systems Operational • Enterprise Console v2.0
        </p>
      </footer>
    </div>
  );
}
