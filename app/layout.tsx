import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Student Report Cards - K-12 Report Card & Grade Tracking",
    template: "%s | Student Report Cards",
  },
  description:
    "Secure report card and grade-tracking tool for K-12 schools and academies. Import students, staff, courses, and grades from CSV. Generate printable report cards with customizable templates.",
  metadataBase: new URL("https://studentreportcards.com"),
  openGraph: {
    title: "Student Report Cards - K-12 Report Card & Grade Tracking",
    description:
      "Secure report card and grade-tracking tool for K-12 schools and academies.",
    url: "https://studentreportcards.com",
    siteName: "Student Report Cards",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
