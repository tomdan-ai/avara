import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { NetworkBanner } from '@/components/wallet/network-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Navbar />
      {/* Shows amber banner + one-click switch whenever wallet is on wrong chain */}
      <NetworkBanner />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1 py-8 lg:pl-8">{children}</main>
      </div>
    </div>
  )
}
