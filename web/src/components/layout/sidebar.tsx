'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bot,
  ArrowLeftRight,
  PlusCircle,
  Store,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/services', label: 'Services', icon: Store },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-white/10 lg:flex lg:flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              pathname === href || pathname?.startsWith(href + '/')
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="mt-4 border-t border-white/10 pt-4">
          <Link
            href="/agents/new"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <PlusCircle className="h-4 w-4" />
            New Agent
          </Link>
        </div>
      </nav>
    </aside>
  )
}
