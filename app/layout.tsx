import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verdant Leads | Lead Generation Dashboard",
  description: "A calming, botanical SaaS dashboard to manage leads captured from browser extensions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full font-sans antialiased bg-[#F5F2ED] text-stone-900">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
