import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SITE_NAME } from "@/lib/constants";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — family lettings`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Family-run lettings for lock-up garages, shops, and flats. Swan Street lock-ups in Royal Leamington Spa.",
  metadataBase: new URL("https://blackwell.business"),
  openGraph: {
    title: SITE_NAME,
    description:
      "Family-run lettings for lock-up garages, shops, and flats.",
    images: ["/images/swan-street-lock-ups.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
