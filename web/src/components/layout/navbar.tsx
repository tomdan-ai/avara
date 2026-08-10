'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@/components/wallet/connect-button'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/agents', label: 'Agents' },
  { href: '/services', label: 'Services' },
  { href: '/transactions', label: 'Transactions' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b-2 border-zinc-800 bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-violet-400 bg-violet-600 nb-shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <span className="text-lg font-black uppercase tracking-tight">Avara</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md border-2 px-3 py-1.5 text-sm font-bold transition',
                pathname === link.href || pathname?.startsWith(link.href + '/')
                  ? 'border-violet-400 bg-violet-600/25 text-violet-100'
                  : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-white/5 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet */}
        <ConnectButton />
      </div>
    </header>
  )
}
