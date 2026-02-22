import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azul",
  description: "Azul online game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
