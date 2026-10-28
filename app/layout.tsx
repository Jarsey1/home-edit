import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { AppDataProvider } from "./lib/app-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Next Home Edit",
  description: "Your home search, organized.",
  applicationName: "The Next Home Edit",
  appleWebApp: {
    capable: true,
    title: "Home Edit",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}
