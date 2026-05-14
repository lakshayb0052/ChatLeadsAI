import React from 'react';
import { 
  Zap, 
  Shield, 
  Smartphone, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <Zap size={24} className="fill-white text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">ChatLeads</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Technology</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
          </div>
          <a href="/dashboard" className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100">
            Access Dashboard
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-indigo-50/50 blur-[120px] -z-10 rounded-full animate-pulse" />
        
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            Next-Gen AI Extraction
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black tracking-tight leading-[0.95] text-slate-900">
            Turn WhatsApp into your <span className="text-indigo-600">Growth Engine.</span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            The world's first local-first lead extraction platform. Capture contacts from text and images with enterprise-grade privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <a href="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 group active:scale-95">
              Launch Platform <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              View Architecture
            </button>
          </div>
        </div>

        {/* 3D Dashboard Mockup Effect */}
        <div className="max-w-6xl mx-auto mt-32 relative perspective-1000">
          <div className="absolute -inset-10 bg-indigo-100/50 rounded-[4rem] blur-3xl -z-10 opacity-50" />
          <div className="relative bg-white border border-slate-100 rounded-[3rem] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.06)] transform hover:rotate-x-1 transition-transform duration-700 ease-out">
            <div className="bg-slate-50 rounded-[2rem] aspect-[16/9] flex items-center justify-center group overflow-hidden">
               <div className="text-center space-y-6">
                 <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto animate-float">
                    <Zap size={48} className="text-indigo-600 fill-indigo-600/10" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900">Real-time Intelligence</h3>
                 <div className="flex gap-2 justify-center">
                    {[1,2,3,4].map(i => <div key={i} className="w-3 h-3 rounded-full bg-indigo-200 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-8 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16">
          <LandingFeature 
            icon={<Globe size={40} className="text-indigo-600" />}
            title="Global Sync"
            desc="Connect any WhatsApp account worldwide and start extracting leads in milliseconds."
          />
          <LandingFeature 
            icon={<Lock size={40} className="text-indigo-600" />}
            title="Sovereign Data"
            desc="We don't store your keys. Everything runs on your local infrastructure for max security."
          />
          <LandingFeature 
            icon={<BarChart3 size={40} className="text-indigo-600" />}
            title="Visual Intelligence"
            desc="Built-in OCR processes business cards and images as easily as plain text messages."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-8 text-center bg-white relative">
         <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-5xl font-black tracking-tight">Ready to scale your extraction?</h2>
            <p className="text-slate-500 font-medium">Join 500+ businesses automating their inbound WhatsApp leads.</p>
            <a href="/dashboard" className="inline-flex px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95">
              Access the Console
            </a>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-100 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">© 2026 ChatLeads AI • All Systems Operational</p>
      </footer>
    </div>
  );
}

function LandingFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-6 group">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-500 border border-slate-100 shadow-sm">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
