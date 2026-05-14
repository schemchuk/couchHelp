import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'couchHelp',
  description: 'AI-помічник для коучів по AVGS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      __internal_clerkJSUrl="https://unpkg.com/@clerk/clerk-js@6/dist/clerk.browser.js"
      __internal_clerkUIUrl="https://unpkg.com/@clerk/ui@1/dist/ui.browser.js"
    >
      <html lang="de">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
