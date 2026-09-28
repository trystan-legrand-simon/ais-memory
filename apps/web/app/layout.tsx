import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Dashboard",
  description: "Graphe et édition des agents du dossier AIS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geist.variable} ${jetbrainsMono.variable} dark h-dvh antialiased`}
    >
      <body className="flex h-dvh">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
