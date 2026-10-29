import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Playfair_Display } from "next/font/google";
import { AppDataProvider } from "./lib/app-data";
import { LanguageProvider } from "./lib/i18n";
import { isLocale, LOCALE_COOKIE } from "./lib/locale";
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

// The language cookie decides <html lang> before paint, so this route can
// block rather than prerendering a shell in the wrong language.
export const instant = false;

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

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(storedLocale) ? storedLocale : "en";

  return (
    <html
      lang={locale}
      // Extensions such as Grammarly inject attributes/children before React
      // hydrates. Suppress the noisy warning; the app's own markup is stable.
      suppressHydrationWarning
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <LanguageProvider initialLocale={locale}>
          <AppDataProvider>{children}</AppDataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
