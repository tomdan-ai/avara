import { prisma } from '@/lib/prisma'
import { formatUSDT, formatDate, explorerTxUrl } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftRight } from 'lucide-react'

async function getTransactions() {
  return prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      agent: true,
      service: true,
    },
  })
}

export default async function TransactionsPage() {
  const transactions = await getTransactions().catch(() => [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          All on-chain payments made by your agents, with BOT Chain explorer links.
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">No transactions yet</h3>
            <p className="text-sm text-zinc-400">
              Create an agent and start a chat to see transactions appear here.
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
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Token</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Time</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">TX Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="transition hover:bg-white/3">
                  <td className="px-4 py-3 text-zinc-200">{tx.agent.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{tx.service?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-zinc-200">{formatUSDT(tx.amount)}</td>
                  <td className="px-4 py-3 text-zinc-400">{tx.token}</td>
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
                        className="flex items-center gap-1 font-mono text-xs text-violet-400 hover:text-violet-300"
                      >
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                        <span className="not-mono">→</span>
                      </a>
                    ) : tx.errorReason ? (
                      <span className="text-xs text-zinc-500">{tx.errorReason}</span>
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
