'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  Bell,
  ChevronRight,
  Activity,
  Menu,
  X,
  Briefcase,
  BarChart2
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

function NavItem({
  icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.a
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors duration-300 group font-bold text-sm relative overflow-hidden ${
        active
          ? 'bg-[var(--bg-hover)] text-[var(--purple-mid)] border-l-[3px] border-[var(--purple-mid)] shadow-sm'
          : 'text-[var(--text-secondary)] hover:text-[var(--purple-mid)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <span className={`transition-colors ${active ? 'text-[var(--purple-mid)]' : 'text-[var(--text-ghost)] group-hover:text-[var(--purple-mid)]'}`}>
        {icon}
      </span>
      <span className="tracking-tight">{label}</span>
      {active && (
        <span className="ml-auto">
          <ChevronRight size={14} className="text-[var(--purple-mid)] opacity-60" />
        </span>
      )}
    </motion.a>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(3);
  
  // Auth state
  const [role, setRole] = useState('user');
  const [displayName, setDisplayName] = useState('User');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role');
      const storedName = localStorage.getItem('display_name');
      const storedCompany = localStorage.getItem('company_name');
      
      if (!storedRole) {
        router.push('/login');
        return;
      }
      
      setRole(storedRole);
      setDisplayName(storedName || 'User');
      setCompanyName(storedCompany || 'Client Company');
    }
  }, [router]);

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/leads', label: 'Leads', icon: <Users size={20} /> },
    { href: '/dashboard/leads-dashboard', label: 'Leads Dashboard', icon: <BarChart2 size={20} /> },
    { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: <MessageSquare size={20} /> },
    ...(role === 'superadmin' ? [
      { href: '/dashboard/users', label: 'Companies', icon: <Briefcase size={20} /> }
    ] : []),
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleSignOut = () => {
    localStorage.clear();
    router.push('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-10 px-2"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center relative overflow-hidden">
          <img src="/logo.png" alt="ChatLeadsAI Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tight text-[var(--text-primary)]">ChatLeads</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--purple-mid)] animate-pulse" />
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[var(--purple-mid)]">Workspace AI Engine</p>
          </div>
        </div>
      </motion.div>

      {/* Section label */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 px-5"
        style={{ color: 'var(--text-ghost)' }}
      >
        Navigation
      </motion.p>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item, i) => (
          <motion.div 
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (i * 0.05) }}
          >
            <NavItem
              {...item}
              active={
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              }
              onClick={() => setMobileOpen(false)}
            />
          </motion.div>
        ))}
      </nav>

      {/* System status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-5 rounded-2xl mb-6 shadow-sm"
        style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(5,150,105,0.1)' }}>
            <Activity size={16} className="text-emerald-600" />
          </div>
          <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-wider">System Online</p>
        </div>
        <div className="space-y-2">
          {['API', 'WebSocket', 'AI Engine'].map((s) => (
            <div key={s} className="flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{s}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black text-emerald-600">OK</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign Out */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <motion.button 
          whileHover={{ x: 4, backgroundColor: 'rgba(239,68,68,0.05)', color: '#dc2626' }}
          onClick={handleSignOut}
          className="flex items-center gap-3 px-5 py-4 text-sm font-bold w-full rounded-2xl transition-colors duration-300 group"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-void)] font-sans">

      {/* ── Desktop Sidebar ── */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.1 }}
        className="hidden lg:flex w-72 flex-col p-6 relative z-20 shrink-0"
        style={{
          background: 'var(--bg-deep)',
          borderRight: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute top-0 right-0 w-px h-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(37,99,235,0.1) 30%, rgba(37,99,235,0.05) 70%, transparent)' }} />
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setMobileOpen(false)} 
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-[280px] sm:w-72 flex flex-col p-4 sm:p-6 z-10 shadow-2xl"
              style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}
            >
              <button className="absolute top-4 right-4 p-2 rounded-xl text-[var(--purple-mid)] hover:bg-[var(--bg-hover)] transition-colors"
                onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ── */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 z-10 relative shrink-0 shadow-sm"
          style={{
            background: 'var(--bg-deep)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)',
          }}>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile menu */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2 rounded-xl bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </motion.button>

            {/* Breadcrumb */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:flex items-center gap-2"
            >
              <div className="px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[11px] font-bold uppercase tracking-wider shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.03))',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--purple-mid)',
                }}>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Active
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Notifications */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 md:p-2.5 rounded-xl bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--purple-mid)] hover:bg-[var(--border-subtle)] transition-colors"
            >
              <Bell size={18} className="md:w-5 md:h-5" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--purple-mid)] border-2"
                  style={{ borderColor: 'var(--bg-deep)', boxShadow: '0 0 8px var(--purple-mid)' }} />
              )}
            </motion.button>

            <div className="hidden md:block w-px h-8" style={{ background: 'var(--border-subtle)' }} />

            {/* User details mapped dynamically */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 md:gap-3"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs md:text-sm font-black text-[var(--text-primary)] capitalize">{displayName}</p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {role === 'superadmin' ? 'System Admin' : companyName}
                </p>
              </div>
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl relative overflow-hidden flex items-center justify-center text-white font-black text-xs md:text-sm uppercase shadow-md cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                  border: '2px solid var(--border-glow)',
                }}
              >
                {displayName.charAt(0)}
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 custom-scrollbar relative"
          style={{ background: 'var(--bg-void)' }}>
          {/* Content glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(37,99,235,0.03) 0%, transparent 100%)' }} />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full h-full max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

