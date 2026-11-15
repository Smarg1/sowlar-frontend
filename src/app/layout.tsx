import Navbar from "@component/navbar";
import { cn } from "@lib/utils";
import type { Metadata } from "next";
import { Figtree, Noto_Sans } from "next/font/google";
import "./globals.css";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SOWLAR: Earth Observation Crop Rotation Advisor",
  description:
    "Decision-support system combining NASA SMAP, MODIS, GPM & POWER datasets with local soil and market intelligence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        notoSans.variable,
        figtreeHeading.variable,
      )}
    >
      <body
        className={cn(
          "relative",
          "isolate",
          "flex",
          "flex-col",
          "bg-background",
          "text-foreground",
          "font-sans",
          "selection:bg-accent/40",
          "bg-hero-pattern",
          "bg-cover",
          "bg-center",
          "bg-repeat",
        )}
      >
        <div className="flex-1 flex flex-col">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
