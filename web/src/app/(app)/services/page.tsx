import { prisma } from '@/lib/prisma'
import { formatUSDT, shortenAddress } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, CloudSun, TrendingUp, Languages } from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  weather: CloudSun,
  market: TrendingUp,
  translation: Languages,
}

async function getServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { transactions: { where: { status: 'CONFIRMED' } } } },
    },
  })
}

export default async function ServicesPage() {
  const services = await getServices().catch(() => [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Service Marketplace</h1>
        <p className="mt-1 text-sm text-zinc-400">
          On-chain registered services your agents can autonomously discover and purchase.
        </p>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Store className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">No services registered</h3>
            <p className="text-sm text-zinc-400">
              Run the seed script to register the built-in services, or deploy your own.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = CATEGORY_ICONS[service.category.toLowerCase()] ?? Store
            return (
              <Card
                key={service.id}
                className={`transition ${service.active ? 'hover:border-violet-500/30 hover:bg-violet-500/5' : 'opacity-60'}`}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-5 w-5 text-zinc-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{service.name}</h3>
                        <p className="text-xs text-zinc-500 capitalize">{service.category}</p>
                      </div>
                    </div>
                    <Badge variant={service.active ? 'success' : 'secondary'}>
                      {service.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <p className="mb-4 text-sm text-zinc-400">{service.description}</p>

                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-zinc-500">Price per request</span>
                    <span className="text-sm font-bold text-white">{formatUSDT(service.price)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>Provider: {shortenAddress(service.providerAddress)}</span>
                    <span>{service._count.transactions} uses</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info callout */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 font-semibold text-white">How service discovery works</h3>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li>1. Services are registered on-chain via the ServiceRegistry contract.</li>
          <li>2. When an agent receives a request, it calls <code className="text-violet-300">searchServices()</code>.</li>
          <li>3. The policy engine checks the service price against the agent&apos;s spending limits.</li>
          <li>4. If approved, the agent calls <code className="text-violet-300">requestPayment()</code>.</li>
          <li>5. The AgentWallet contract validates the payment and transfers USDT to the provider.</li>
        </ol>
      </div>
    </div>
  )
}
