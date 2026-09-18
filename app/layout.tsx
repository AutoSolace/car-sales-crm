import type { Metadata } from "next";
import Script from "next/script";
import { MainNav } from "@/components/nav/MainNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoSolace CRM",
  description: "Contacts, deals, and follow-ups for a solo car salesperson.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* bm-design-system:start */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- rule only recognizes pages/_document.js; App Router's layout.tsx head is the correct place, and a plain <link> is required (not next/font) so the stylesheet loads before design-system.css's @layer rules apply */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <Script id="bm-theme-boot" strategy="beforeInteractive">
          {`(function () {
  try {
    var stored = localStorage.getItem('bm-ds-theme');
    var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    if (resolved === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();`}
        </Script>
        {/* bm-design-system:end */}
      </head>
      <body className="min-h-full">
        <div className="flex min-h-screen bg-page text-ink-body">
          <MainNav />
          <main className="min-w-0 flex-1 px-6 py-8 sm:px-10">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
