'use client';

import React, { useState, useEffect } from 'react';
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
  Briefcase
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
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group font-bold text-sm relative overflow-hidden ${
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
    </a>
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
      
      // Fallback redirect if not logged in
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
    <div className="flex flex-col h-full animate-fade-in">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-float relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 8px 20px rgba(124,58,237,0.2)',
          }}>
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent)' }} />
          <Zap size={26} className="text-white fill-white relative z-10" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">ChatLeads</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--purple-mid)] animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple-mid)]">Workspace AI Engine</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 px-5"
        style={{ color: 'var(--text-ghost)' }}>
        Navigation
      </p>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            }
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* System status */}
      <div className="mt-6 p-5 rounded-2xl mb-6"
        style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(5,150,105,0.1)' }}>
            <Activity size={16} className="text-emerald-600" />
          </div>
          <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">System Online</p>
        </div>
        <div className="space-y-2">
          {['API', 'WebSocket', 'AI Engine'].map((s) => (
            <div key={s} className="flex items-center justify-between">
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{s}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600">OK</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-5 py-4 text-sm font-bold w-full rounded-2xl transition-all duration-300 group"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}>
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden animate-fade-in"
      style={{ background: 'var(--bg-void)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-72 flex-col p-6 relative z-20"
        style={{
          background: 'var(--bg-deep)',
          borderRight: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}>
        {/* Sidebar glow */}
        <div className="absolute top-0 right-0 w-px h-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.1) 30%, rgba(124,58,237,0.05) 70%, transparent)' }} />
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 flex flex-col p-6 z-10"
            style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border-subtle)' }}>
            <button className="absolute top-4 right-4 p-2 rounded-xl text-[var(--purple-mid)]"
              style={{ background: 'var(--bg-hover)' }}
              onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ── */}
        <header className="h-20 flex items-center justify-between px-8 z-10 relative shrink-0"
          style={{
            background: 'var(--bg-deep)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)',
          }}>

          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <button className="lg:hidden p-2.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.03))',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--purple-mid)',
                }}>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Active
                </span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--purple-mid)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--purple-mid)] border-2"
                  style={{ borderColor: 'var(--bg-deep)', boxShadow: '0 0 8px var(--purple-mid)' }} />
              )}
            </button>

            <div className="w-px h-8" style={{ background: 'var(--border-subtle)' }} />

            {/* User details mapped dynamically */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-[var(--text-primary)] capitalize">{displayName}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {role === 'superadmin' ? 'System Admin' : companyName}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: '2px solid var(--border-glow)',
                  boxShadow: '0 4px 10px rgba(124,58,237,0.15)',
                }}>
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-sm uppercase">
                  {displayName.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar relative"
          style={{ background: 'var(--bg-void)' }}>
          {/* Content glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(124,58,237,0.02) 0%, transparent 100%)' }} />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
