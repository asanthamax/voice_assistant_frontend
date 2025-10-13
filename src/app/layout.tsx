import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from './provider';

export const metadata: Metadata = {
  title: 'Voice Assistant',
  description: 'AI-powered voice interaction assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-white to-blue-50">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}