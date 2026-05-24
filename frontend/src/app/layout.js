import "./globals.css";

export const metadata = {
  title: "Senegal Economic Observatory — Intelligence Économique",
  description: "Plateforme d'intelligence économique appliquée sur le Sénégal et la zone UEMOA. Données de conjoncture ANSD/DPEE restructurées, indicateurs composites avancés et récits analytiques.",
  metadataBase: new URL("https://senegalecon.org"),
  openGraph: {
    title: "Senegal Economic Observatory — Intelligence Économique",
    description: "Plateforme d'intelligence économique appliquée sur le Sénégal et la zone UEMOA. Données de conjoncture DPEE, indicateurs composites avancés et récits analytiques.",
    url: "https://senegalecon.org",
    siteName: "Senegal Economic Observatory",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Senegal Economic Observatory — Intelligence Économique",
    description: "Plateforme d'intelligence économique appliquée sur le Sénégal et la zone UEMOA.",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col font-sans text-text-main bg-background overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
