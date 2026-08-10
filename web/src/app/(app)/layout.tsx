import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1 py-8 lg:pl-8">{children}</main>
      </div>
    </div>
  )
}
