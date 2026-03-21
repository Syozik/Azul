import type { Metadata, Viewport } from "next";
import "@/app/static/style/globals.css";

export const metadata: Metadata = {
    title: "Azul",
    description: "Azul online game",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
