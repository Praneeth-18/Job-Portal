import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-roboto'
});

export const metadata: Metadata = {
  title: "Job Portal",
  description: "Track and manage your job applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${roboto.className} h-full`}>
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-white p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
