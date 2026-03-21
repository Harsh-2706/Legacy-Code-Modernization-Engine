import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legacy Code Modernization Engine",
  description: "Transform legacy code into modern Python/Go with context optimization",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f172a] text-slate-200 overflow-hidden`}>
        <div className="flex h-screen w-screen">
          <Sidebar />
          <main className="flex-1 h-screen overflow-auto relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
