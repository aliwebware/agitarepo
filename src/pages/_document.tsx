// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Neonderthaw&display=swap" rel="stylesheet" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Primary Meta Tags */}
        <meta name="title" content="Agita - Descubra e Cadastre Festas" />
        <meta name="description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta name="keywords" content="festas, eventos, Luanda, Angola, balada, agita, cadastrar festa, eventos culturais, vida noturna" />
        <meta name="author" content="Alcino Jaime" />
        <meta name="theme-color" content="#7c3aed" />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Agita - Descubra e Cadastre Festas" />
        <meta property="og:description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.seusite.com" />
        <meta property="og:image" content="https://www.seusite.com/og-image.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Agita - Descubra e Cadastre Festas" />
        <meta name="twitter:description" content="Descubra, cadastre e participe das melhores festas da cidade. Agita conecta você à vida noturna!" />
        <meta name="twitter:image" content="https://www.seusite.com/og-image.jpg" />
        <link rel="canonical" href="https://www.seusite.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Agita",
              "url": "https://www.seusite.com",
              "logo": "https://www.seusite.com/logo.png",
              "sameAs": [
                "https://instagram.com/",
                "https://facebook.com/"
              ]
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
