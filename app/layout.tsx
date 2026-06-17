import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { COMPANY_NAME } from '@/lib/constants'

const _poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: `${COMPANY_NAME} - Sistema de Gestión Poblacional`,
  description: `Plataforma web corporativa para el control de metas, caracterización y seguimiento de atenciones de ${COMPANY_NAME} en la cuenca del río Atrato.`,
  keywords: [COMPANY_NAME, 'atrato', 'choco', 'salud', 'gestión', 'atenciones', 'pacientes', 'sistema', 'pwa'],
  authors: [{ name: 'Arquitecto de Software' }],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: `${COMPANY_NAME} - Sistema de Gestión Poblacional`,
    description: 'Plataforma web corporativa para el control de metas y seguimiento de atenciones.',
    type: 'website',
    locale: 'es_CO',
    siteName: COMPANY_NAME,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F5132" />
      </head>
      <body className={`${_poppins.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors duration={8000} />
      </body>
    </html>
  )
}
