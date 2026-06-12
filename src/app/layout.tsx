import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import LanguageInitializer from "@/components/layout/LanguageInitializer"

export const metadata: Metadata = {
  title: "GestScol - Gestion Scolaire de Prestige",
  description: "Gérez votre école privée en toute simplicité en Côte d'Ivoire et en Afrique de l'Ouest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
