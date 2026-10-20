import type { Metadata } from "next";
import "./globals.css";
import "./recruitment.css";
import "./access.css";

export const metadata: Metadata = {
  title: "Talento · Reclutamiento",
  description: "Candidaturas, formularios y métricas de reclutamiento.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
