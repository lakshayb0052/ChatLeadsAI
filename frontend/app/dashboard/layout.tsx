import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Zap,
  Bell
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#1e293b] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col p-8 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 animate-float">
            <Zap size={28} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">ChatLeads</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Enterprise AI</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active href="/dashboard" />
          <NavItem icon={<Users size={20} />} label="Leads" href="/dashboard/leads" />
          <NavItem icon={<MessageSquare size={20} />} label="WhatsApp" href="/dashboard/whatsapp" />
          <NavItem icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-red-500 transition-all w-full rounded-2xl hover:bg-red-50 group font-bold">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-slate-200 bg-white/70 backdrop-blur-xl flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
               System Active
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">Lakshay</p>
                <p className="text-[11px] font-medium text-slate-400">System Admin</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-lg shadow-indigo-100" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, href }: { icon: React.ReactNode, label: string, active?: boolean, href: string }) {
  return (
    <a 
      href={href}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-x-2' 
          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`}>
        {icon}
      </span>
      <span className="font-bold tracking-tight">{label}</span>
    </a>
  );
}
