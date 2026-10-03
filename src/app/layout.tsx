// src/app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MIRSAD | Enterprise Compliance Platform',
  description: 'Saudi-first GRC automation: NCA ECC, NCA DCC, SAMA CSF, ISO 27001, NIST CSF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#080B11' }}>
        {children}
      </body>
    </html>
  )
}
