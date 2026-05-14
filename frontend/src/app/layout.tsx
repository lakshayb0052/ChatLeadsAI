import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ChatLeads AI | WhatsApp Contact Intelligence",
  description: "Automatically extract leads from WhatsApp messages and images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}
