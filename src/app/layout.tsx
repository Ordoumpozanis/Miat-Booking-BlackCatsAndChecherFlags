import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const maxwell = localFont({
  src: [
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-UltraLight.otf', weight: '100', style: 'normal' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-UltraLightItalic.otf', weight: '100', style: 'italic' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-Light.otf', weight: '300', style: 'normal' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-LightItalic.otf', weight: '300', style: 'italic' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-Book.otf', weight: '400', style: 'normal' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-BookItalic.otf', weight: '400', style: 'italic' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-DemiBold.otf', weight: '600', style: 'normal' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-DemiBoldItalic.otf', weight: '600', style: 'italic' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-Bold.otf', weight: '700', style: 'normal' },
    { path: '../../public/Maxwell/Kimmy-Design---MaxwellSans-BoldItalic.otf', weight: '700', style: 'italic' },
  ],
  variable: '--font-maxwell',
  display: 'swap',
});

const revolution = localFont({
  src: '../../public/revolution_ii.ttf',
  variable: '--font-revolution',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ExhibitFlow",
  description: "Black Cats & Chequered Flags - Booking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${maxwell.variable} ${revolution.variable} antialiased selection:bg-yellow-400 selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
