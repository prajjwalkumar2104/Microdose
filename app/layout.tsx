import type { Metadata ,Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-sans",
});

const fraunces = Fraunces({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  axes: ["SOFT", "WONK"], // Gives it that premium editorial look
});

export const metadata: Metadata = {
  title: "Microdose | Minimalist Speaking Practice",
  description: "Minimal prep. Try to think quick on your feet.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Microdose",
  },
};

// Next.js now requires themeColor to live here instead!
export const viewport: Viewport = {
  themeColor: "#090514",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${fraunces.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}