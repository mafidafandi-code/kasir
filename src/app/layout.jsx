import './globals.css';

export const metadata = {
  title: 'Aplikasi Kasir POS',
  description: 'Sistem Kasir Modern dengan Next.js dan Turso',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
