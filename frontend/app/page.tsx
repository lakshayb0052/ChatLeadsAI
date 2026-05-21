'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
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
  ChevronRight,
  Menu,
  X
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
    <motion.div
      className="absolute rounded-full opacity-20 pointer-events-none"
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -200, opacity: 0, scale: 0 }}
      transition={{ duration: 3 + delay, repeat: Infinity, delay: delay, ease: "easeOut" }}
      style={{
        left: `${x}%`,
        bottom: '-20px',
        width: size,
        height: size,
        background: 'radial-gradient(circle, var(--purple-mid), transparent)',
      }}
    />
  );
}

/* ─── 3D Feature Card ─────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);
  const springConfig = { damping: 20, stiffness: 200 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay * 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springRotateX, rotateY: springRotateY, transformStyle: "preserve-3d" }}
      className="glass-card rounded-3xl p-8 md:p-10 group cursor-default relative overflow-hidden h-full flex flex-col justify-between"
    >
      <div style={{ transform: "translateZ(30px)" }}>
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 relative overflow-hidden"
          style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'var(--border-subtle)' }} />
          <span className="relative z-10 text-[var(--purple-mid)] group-hover:text-[var(--purple-deep)] transition-colors">{icon}</span>
        </div>
        <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] mb-3 md:mb-4 tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
      <div style={{ transform: "translateZ(20px)" }} className="flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-widest text-[var(--purple-mid)] opacity-0 group-hover:opacity-100 transition-all duration-300">
        Learn More <ChevronRight size={14} />
      </div>
    </motion.div>
  );
}

/* ─── Stat Pill ──────────────────────────────────────────── */
function StatPill({ label, value, suffix, index }: { label: string; value: number; suffix?: string; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card rounded-2xl px-4 py-6 md:px-8 text-center flex flex-col justify-center items-center" 
      style={{ border: '1px solid var(--border-bright)' }}
    >
      <p className="text-2xl md:text-3xl font-black gradient-text mb-1">
        <Counter end={value} suffix={suffix} />
      </p>
      <p className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-center" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-void)] font-sans">

      {/* ── Ambient Background Effects (Parallax) ── */}
      <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ y: yBg }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] opacity-15"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.3) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute top-1/2 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] opacity-5"
          style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(14,165,233,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.15) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </motion.div>

      {/* ── Navbar ── */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'backdrop-blur-2xl border-b py-2' : 'py-4 md:py-6'}`}
        style={{ backgroundColor: scrolled ? 'rgba(249,248,252,0.85)' : 'transparent', borderColor: scrolled ? 'var(--border-subtle)' : 'transparent' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center relative overflow-hidden hover:rotate-12 transition-transform cursor-pointer">
              <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="cursor-pointer">
              <span className="text-lg md:text-xl font-black tracking-tight text-[var(--text-primary)]">ChatLeads</span>
              <span className="ml-1 text-[10px] md:text-xs font-black text-[var(--purple-mid)]">AI</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-10">
            {['Technology', 'Pricing', 'Security', 'Docs'].map((item) => (
              <a key={item} href="#"
                className="text-sm font-bold transition-all duration-300 hover:text-[var(--purple-mid)] relative group"
                style={{ color: 'var(--text-secondary)' }}>
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{ background: 'linear-gradient(90deg, #2563eb, #a78bfa)' }} />
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <a href="/login?source=dashboard"
              className="hidden md:flex btn-primary px-6 md:px-7 py-3 md:py-3.5 rounded-2xl text-sm items-center gap-2 group shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow">
              Access Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 rounded-xl bg-white/50 backdrop-blur-md border border-[var(--border-subtle)] text-[var(--text-primary)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-3xl border-b border-[var(--border-subtle)] absolute w-full overflow-hidden top-full left-0 shadow-2xl"
          >
            <div className="flex flex-col px-6 py-6 gap-6">
              {['Technology', 'Pricing', 'Security', 'Docs'].map((item) => (
                <a key={item} href="#" className="text-lg font-bold text-[var(--text-primary)]">{item}</a>
              ))}
              <a href="/login?source=dashboard"
                className="btn-primary w-full py-4 rounded-xl text-center justify-center font-bold shadow-lg shadow-blue-500/20 mt-2 flex items-center gap-2">
                Access Dashboard
                <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-40 pb-20 md:pt-52 md:pb-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8 md:mb-10"
          >
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] shadow-sm"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', color: 'var(--purple-mid)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--purple-mid)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--purple-mid)' }} />
              </span>
              Live AI Extraction Engine Active
              <Sparkles size={12} className="hidden sm:block" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1] md:leading-[0.92] mb-6 md:mb-10"
          >
            <span className="text-[var(--text-primary)]">Turn WhatsApp</span><br />
            <span className="gradient-text drop-shadow-xl">into Leads.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 md:mb-14 px-4"
            style={{ color: 'var(--text-secondary)' }}>
            The world's first privacy-first lead extraction platform. Capture contacts from text and images with enterprise-grade AI intelligence.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 px-6"
          >
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="/login?source=launch"
              className="btn-primary w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-sm md:text-base font-black flex items-center justify-center gap-3 group shadow-xl shadow-blue-500/20 cursor-pointer">
              <Zap size={20} className="fill-white" />
              Launch Platform
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform hidden sm:block" />
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="/dashboard/whatsapp"
              className="btn-ghost w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-sm md:text-base font-black flex items-center justify-center gap-3 group cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}>
              <Smartphone size={20} />
              Connect WhatsApp
            </motion.a>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-16 md:mt-24 px-2 md:px-0">
            <StatPill label="Leads Captured" value={50000} suffix="+" index={1} />
            <StatPill label="Active Sessions" value={500} suffix="+" index={2} />
            <StatPill label="Accuracy Rate" value={99} suffix="%" index={3} />
            <StatPill label="Extraction Speed" value={420} suffix="ms" index={4} />
          </div>
        </div>

        {/* Floating particles (hidden on mobile for performance) */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <Particle key={i} delay={i * 0.5} x={10 + i * 12} size={4 + (i % 3) * 4} />
          ))}
        </div>
      </section>

      {/* ── 3D Dashboard Mockup ── */}
      <section className="relative z-10 px-4 md:px-8 pb-16 md:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, rotateX: 20, y: 100 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            className="card-3d w-full"
            style={{ perspective: 1200 }}
          >
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-bright)',
                boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.25)',
              }}>
              {/* Window bar */}
              <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border-b"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}>
                {['#ef4444','#f59e0b','#10b981'].map((c, i) => (
                  <div key={i} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                ))}
                <div className="flex-1 flex justify-center">
                  <div className="px-4 md:px-8 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    chatleads.ai/dashboard
                  </div>
                </div>
              </div>

              {/* Mock Content */}
              <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" style={{ minHeight: '200px' }}>
                {/* Stat cards mock */}
                {[
                  { label: 'Total Leads', val: '2,847', color: '#0ea5e9' },
                  { label: 'Active Fleet', val: '12', color: '#10b981' },
                  { label: 'Hot Ratio', val: '68%', color: '#f59e0b' },
                ].map((s, i) => (
                  <motion.div key={i} 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="rounded-xl md:rounded-2xl p-4 md:p-6"
                    style={{ background: 'var(--bg-hover)', border: `1px solid var(--border-glow)` }}
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl mb-3 md:mb-4 flex items-center justify-center"
                      style={{ background: `rgba(${s.color === '#0ea5e9' ? '14,165,233' : s.color === '#10b981' ? '16,185,129' : '245,158,11'},0.08)` }}>
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    </div>
                    <p className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-1">{s.val}</p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                  </motion.div>
                ))}
                
                {/* Activity mock - hidden on mobile for cleaner look */}
                <div className="hidden md:block col-span-3 rounded-2xl p-6"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-end gap-3 h-20">
                    {[30, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <motion.div key={i} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className="flex-1 rounded-t-lg"
                        style={{
                          background: `linear-gradient(180deg, rgba(37,99,235,${0.25 + h / 400}) 0%, rgba(37,99,235,0.12) 100%)`,
                          border: '1px solid var(--border-glow)',
                        }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl md:rounded-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.02) 0%, transparent 60%)' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-16 md:py-32 px-4 md:px-8 bg-white/50 backdrop-blur-xl border-y border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-20"
          >
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4 md:mb-5 text-[var(--purple-mid)]">
              Engineered For Scale
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4 md:mb-6">
              Built For <span className="gradient-text">Intelligence</span>
            </h2>
            <p className="max-w-xl mx-auto text-sm md:text-base px-4" style={{ color: 'var(--text-secondary)' }}>
              Every feature is precision-engineered to capture, analyze, and convert WhatsApp conversations into actionable leads.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard icon={<Globe size={28} />} title="Global Sync Engine" desc="Connect any WhatsApp account worldwide and start extracting leads in milliseconds with our always-on infrastructure." delay={1} />
            <FeatureCard icon={<Lock size={28} />} title="Sovereign Data Control" desc="Zero-knowledge architecture. Your keys never leave your system. Enterprise-grade privacy by design." delay={2} />
            <FeatureCard icon={<Eye size={28} />} title="Visual Intelligence OCR" desc="Built-in AI vision processes business cards and images as easily as plain text — powered by Gemini 2.5." delay={3} />
            <FeatureCard icon={<Activity size={28} />} title="Real-Time WebSocket" desc="Live feed of every extracted lead with persistent WebSocket connection and automatic reconnection." delay={4} />
            <FeatureCard icon={<Cpu size={28} />} title="AI Scoring Engine" desc="Automatic Hot/Warm/Cold classification based on intent signals, engagement depth, and contact completeness." delay={5} />
            <FeatureCard icon={<BarChart3 size={28} />} title="Fleet Analytics" desc="Monitor performance across all WhatsApp sessions with real-time charts and instant export to Excel." delay={6} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20 md:py-32 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-card rounded-3xl p-8 md:p-16 relative overflow-hidden"
            style={{ border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-purple)' }}>
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />
            {/* Orbit ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 rounded-full opacity-5 pointer-events-none animate-spin-slow"
              style={{ border: '2px dashed #0ea5e9' }} />

            <div className="relative z-10">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-6 md:mb-8 drop-shadow-xl cursor-pointer">
                <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] mb-4 md:mb-5">
                Ready to Scale?
              </h2>
              <p className="text-sm md:text-lg mb-8 md:mb-10 px-4" style={{ color: 'var(--text-secondary)' }}>
                Join 500+ businesses automating their WhatsApp lead generation with AI.
              </p>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/login?source=console"
                className="btn-primary inline-flex px-8 md:px-12 py-4 md:py-5 rounded-2xl text-base md:text-lg font-black items-center gap-3 group shadow-xl shadow-blue-500/30 cursor-pointer">
                <Zap size={22} className="fill-white" />
                Access the Console
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 md:py-12 border-t text-center"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
            <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] md:text-xs font-black text-[var(--text-primary)]">ChatLeads AI</span>
        </div>
        <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]" style={{ color: 'var(--text-ghost)' }}>
          © 2026 • All Systems Operational • Enterprise Console v2.0
        </p>
      </footer>
    </div>
  );
}

