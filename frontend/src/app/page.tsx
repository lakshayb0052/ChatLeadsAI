import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4">
          ChatLeads <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate WhatsApp intelligence platform. Extract contacts, emails, and lead data automatically from messages and images.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20">
            Get Started
          </Link>
          <Link href="/dashboard" className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-bold transition-all transform hover:scale-105">
            View Demo
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-500 text-sm">
        Powered by OpenAI & Baileys
      </footer>
    </div>
  );
}
