import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Avara — AI Agent Payments on BOT Chain',
  description:
    'Programmable wallets and autonomous payments for AI agents. Built on BOT Chain.',
  keywords: ['AI agents', 'blockchain payments', 'BOT Chain', 'autonomous payments', 'DeFi'],
  openGraph: {
    title: 'Avara',
    description: 'Give AI agents the power to transact.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
