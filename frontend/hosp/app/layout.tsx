import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoveryAssistant v1.0",
  description: "Post-Op Monitoring Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
