import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./jessica.css";
import "./interactive-messages.css";
import "./greeting-variants.css";
import { ThemeProvider } from "@/context/ThemeContext";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Jessica 3.0 — Deep Research AI",
  description: "Multi-source investigative AI agent. Powered by Tavily, Exa, SerperDev, SerpAPI & DuckDuckGo.",
  keywords: ["Jessica AI", "deep research", "AI agent", "investigative intelligence"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${jakarta.variable}`} style={{ fontFamily: "'Plus Jakarta Sans', 'Google Sans', system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
