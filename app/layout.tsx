import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Annotated | Keep the moment. Add the meaning.",
  description: "Clip the part that matters from any video, article, or podcast. Add your perspective and keep the original source attached.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://annotated-one.vercel.app"),
  openGraph: {
    title: "Annotated",
    description: "The source-first public notebook for the web.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
