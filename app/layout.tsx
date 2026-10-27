import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Configurateur vélo",
  description: "Trouve les composants compatibles pour upgrader ton vélo de route.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
