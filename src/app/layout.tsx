import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Provedores } from "@/componentes/provedores";
import "./globals.css";

const disp = localFont({
  src: [
    { path: "../fontes/barlow-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "../fontes/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "../fontes/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--fonte-disp",
  display: "swap",
});

const body = localFont({
  src: [
    { path: "../fontes/barlow-latin-400-normal.woff2", weight: "400" },
    { path: "../fontes/barlow-latin-500-normal.woff2", weight: "500" },
    { path: "../fontes/barlow-latin-600-normal.woff2", weight: "600" },
    { path: "../fontes/barlow-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--fonte-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealthCore",
  description: "Registro de treino com RIR, sono e recomendação de carga para dimorfismo e condicionamento.",
  applicationName: "HealthCore",
  appleWebApp: { capable: true, title: "HealthCore", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icone.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
    { media: "(prefers-color-scheme: light)", color: "#ECEEF1" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${disp.variable} ${body.variable}`}>
      <body>
        <Provedores>{children}</Provedores>
      </body>
    </html>
  );
}
