import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Layout/Navigation";
import { WorkspaceProvider } from "@/lib/workspace-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deal Command Center | Enterprise Multi-Threading",
  description:
    "AI-powered enterprise deal management and stakeholder tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <WorkspaceProvider>
          <Navigation />
          <main className="ml-60 min-h-screen">{children}</main>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
