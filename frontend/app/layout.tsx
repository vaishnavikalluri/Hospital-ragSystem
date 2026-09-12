import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Hospital Knowledge Assistant",
  description: "AI-powered clinical RAG platform for authorized hospital staff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <NavBar />
        <main className="flex-1 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
