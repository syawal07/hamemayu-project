import { Montserrat, Cormorant_Garamond, Space_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import { AccessibilityProvider } from './components/AccessibilityProvider';
import AccessibilityWidget from './components/AccessibilityWidget';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
});

export const metadata = {
  title: 'HamemayuJogja - Nusantara Digital City',
  description: 'Representasi Digital Nusantara - Yogyakarta',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${montserrat.variable} ${cormorant.variable} ${spaceMono.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="font-sans bg-slate-50 dark:bg-brutal-dark bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-green-100/60 via-slate-50 to-yellow-100/40 dark:from-green-900/20 dark:via-brutal-dark dark:to-brutal-dark text-slate-900 dark:text-slate-100 antialiased selection:bg-yellow-400/80 selection:text-slate-900 min-h-screen" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AccessibilityProvider>
            <AccessibilityWidget />
            {children}
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}