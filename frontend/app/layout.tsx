import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ChatLeads AI | Intelligent Lead Platform',
  description: 'Automated WhatsApp lead capture with a premium light-speed experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f9fafb] text-[#1e293b] antialiased selection:bg-indigo-100 selection:text-indigo-700`}>
        {children}
      </body>
    </html>
  );
}
