"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function WhatsAppConnection() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/sessions/primary_account/qr`);
        const data = await res.json();
        setQrCode(data.qr_code);
        setStatus(data.status);
      } catch (err) {
        console.error("Failed to fetch QR", err);
      }
    };

    fetchQR();
    const interval = setInterval(fetchQR, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Reusing Sidebar Logic (Should be a component later) */}
      <aside className="w-64 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-10 px-2">ChatLeads <span className="text-blue-500">AI</span></h2>
        <nav className="space-y-2 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/whatsapp" className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-xl text-white font-medium">
            <span>📱</span> WhatsApp
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Connect WhatsApp</h1>
          <p className="text-slate-400 mb-8">Scan the QR code below with your WhatsApp app to start extracting leads.</p>

          <div className="bg-white p-4 rounded-2xl inline-block mb-8 shadow-2xl shadow-blue-500/20">
            {qrCode ? (
              <QRCode value={qrCode} size={256} />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                {status === "connected" ? "✅ Connected" : "⌛ Waiting for QR..."}
              </div>
            )}
          </div>

          <div className="space-y-4 text-left text-sm text-slate-400 bg-white/5 p-6 rounded-2xl border border-white/5">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Tap Menu or Settings and select Linked Devices</p>
            <p>3. Tap on Link a Device</p>
            <p>4. Point your phone to this screen to capture the code</p>
          </div>
        </div>
      </main>
    </div>
  );
}
