import type { Metadata } from 'next'
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MEDI ONE',
  description: 'Sistema de gestión médica - Dra. Alejandra Bárcenas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="bg-bg-base text-content font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#FDF0EE',
              border: '1px solid #E8D5D3',
              color: '#3D1F1C',
              fontFamily: 'var(--font-jakarta)',
              borderRadius: '1rem',
            },
            classNames: {
              success: '!bg-green-50 !text-green-800 !border-green-200',
              error: '!bg-red-50 !text-red-800 !border-red-200',
              warning: '!bg-yellow-50 !text-yellow-800 !border-yellow-200',
            },
          }}
        />
      </body>
    </html>
  )
}
