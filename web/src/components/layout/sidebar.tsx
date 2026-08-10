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
    <aside className="hidden w-56 flex-shrink-0 border-r-2 border-zinc-800 lg:flex lg:flex-col">
      <nav className="flex flex-1 flex-col gap-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm font-bold transition',
              pathname === href || pathname?.startsWith(href + '/')
                ? 'border-violet-400 bg-violet-600/25 text-violet-100 nb-shadow-sm'
                : 'border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="mt-4 border-t-2 border-zinc-800 pt-4">
          <Link
            href="/agents/new"
            className="nb-press flex items-center gap-3 rounded-lg border-2 border-violet-400 bg-violet-600 px-3 py-2 text-sm font-bold text-white nb-shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            New Agent
          </Link>
        </div>
      </nav>
    </aside>
  )
}
