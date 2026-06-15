import { Montserrat, Playfair_Display, Space_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const playfair = Playfair_Display({
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
    <html lang="id" className={`${montserrat.variable} ${playfair.variable} ${spaceMono.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="font-sans bg-slate-50 dark:bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100/60 via-slate-50 to-yellow-100/40 dark:from-green-900/20 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-slate-100 antialiased selection:bg-yellow-400/80 selection:text-slate-900 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}