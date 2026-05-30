import "./globals.css";
import ThemeProvider from "../components/ThemeProvider.jsx";

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

// Apply the persisted theme synchronously before paint to avoid a flash
// between dark default and the user-selected light mode.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('seo-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
