import { prisma } from '@/lib/prisma'
import { formatUSDT } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, DollarSign, ArrowLeftRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDate, explorerTxUrl } from '@/lib/utils'

async function getDashboardStats() {
  const [agentCount, transactions, services] = await Promise.all([
    prisma.agent.count(),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { agent: true, service: true },
    }),
    prisma.service.count({ where: { active: true } }),
  ])

  // amount is stored as a String (wei), so we sum via raw query
  const totalSpentResult = await prisma.$queryRaw<[{ total: bigint | null }]>`
    SELECT SUM(CAST(amount AS NUMERIC))::BIGINT AS total
    FROM "Transaction"
    WHERE status = 'CONFIRMED'
  `

  return {
    agentCount,
    transactions,
    services,
    totalSpent: (totalSpentResult[0]?.total ?? BigInt(0)).toString(),
    transactionCount: await prisma.transaction.count(),
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats().catch(() => ({
    agentCount: 0,
    transactions: [],
    services: 0,
    totalSpent: '0',
    transactionCount: 0,
  }))

  const statCards = [
    {
      label: 'Agents',
      value: stats.agentCount.toString(),
      icon: Bot,
      href: '/agents',
    },
    {
      label: 'Total Spent',
      value: formatUSDT(stats.totalSpent),
      icon: DollarSign,
      href: '/transactions',
    },
    {
      label: 'Transactions',
      value: stats.transactionCount.toString(),
      icon: ArrowLeftRight,
      href: '/transactions',
    },
    {
      label: 'Active Services',
      value: stats.services.toString(),
      icon: TrendingUp,
      href: '/services',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Overview of your agents, spending, and on-chain activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition hover:border-violet-500/30 hover:bg-violet-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-zinc-400">{label}</CardTitle>
                  <Icon className="h-4 w-4 text-zinc-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <Link href="/transactions" className="text-sm text-violet-400 hover:text-violet-300">
            View all →
          </Link>
        </div>

        {stats.transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ArrowLeftRight className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400">No transactions yet.</p>
              <p className="mt-1 text-xs text-zinc-600">
                Create an agent and ask it to purchase a service to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Agent</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Service</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-400">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/3 transition">
                    <td className="px-4 py-3 text-zinc-200">{tx.agent.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{tx.service?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-zinc-200">{formatUSDT(tx.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3">
                      {tx.txHash ? (
                        <a
                          href={explorerTxUrl(tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    FAILED: 'destructive',
    REJECTED: 'destructive',
  }
  return <Badge variant={map[status] ?? 'secondary'}>{status}</Badge>
}
