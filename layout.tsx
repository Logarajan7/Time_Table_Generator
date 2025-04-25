import type {Metadata} from 'next';
import {GeistSans} from 'geist/font/sans';
import {GeistMono} from 'geist/font/mono';
import './globals.css';
import {Toaster} from '@/components/ui/toaster'; // Import Toaster

export const metadata: Metadata = {
  title: 'TimeTable Pro',
  description: 'Generate optimal school and college timetables easily.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans">
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
