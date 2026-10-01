import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ThemeToggle from "./theme-toggle";

export const metadata: Metadata = {
  title: "Liga da Academia",
  description: "Ligas de treino com pontuacao, ranking e historico."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f8f46"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { var theme = localStorage.getItem('liga-theme'); document.documentElement.dataset.theme = theme === 'dark' || theme === 'light' ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (_) {}` }} />
      </head>
      <body><ThemeToggle />{children}</body>
    </html>
  );
}
