import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Distribution Playbook',
  description: 'Ask distribution questions — answers from PG essays, YC videos, Starter Story',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
