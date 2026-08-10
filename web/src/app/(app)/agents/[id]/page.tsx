import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatUSDT, formatDate, shortenAddress, explorerTxUrl, explorerAddressUrl } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bot,
  ArrowLeft,
  MessageSquare,
  Wallet,
  Shield,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { FundAgentButton } from '@/components/agents/fund-agent-button'
import { AgentControls } from '@/components/agents/agent-controls'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { service: true },
      },
    },
  })

  if (!agent) notFound()

  // Calculate today's usage
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const usage = await prisma.agentUsage.findUnique({
    where: { agentId_date: { agentId: agent.id, date: today } },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-violet-400 bg-violet-600/25 nb-shadow-sm">
              <Bot className="h-6 w-6 text-violet-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white">{agent.name}</h1>
              <p className="text-sm text-zinc-500">
                Created {formatDate(agent.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agents/${agent.id}/chat`}>
            <Button>
              <MessageSquare className="h-4 w-4" />
              Open Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Wallet */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-zinc-400" />
                <CardTitle>Wallet</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border-2 border-zinc-700 bg-[var(--surface-2)] p-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Address</p>
                  <p className="font-mono text-sm text-zinc-200">
                    {agent.walletAddress ? shortenAddress(agent.walletAddress, 8) : 'Not deployed'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {agent.walletAddress && (
                    <a
                      href={explorerAddressUrl(agent.walletAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <FundAgentButton agentId={agent.id} walletAddress={agent.walletAddress} />
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {agent.transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No transactions yet. Start a chat to make your first payment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-zinc-700">
                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">Service</th>
                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">Amount</th>
                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">Status</th>
                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">Date</th>
                        <th className="pb-3 text-left text-xs font-bold uppercase tracking-wide text-zinc-400">TX</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-zinc-800">
                      {agent.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-3 font-semibold text-zinc-100">{tx.service?.name ?? '—'}</td>
                          <td className="py-3 font-mono font-semibold text-zinc-100">{formatUSDT(tx.amount)}</td>
                          <td className="py-3">
                            <TxStatusBadge status={tx.status} reason={tx.errorReason} />
                          </td>
                          <td className="py-3 text-zinc-500">{formatDate(tx.createdAt)}</td>
                          <td className="py-3">
                            {tx.txHash ? (
                              <a
                                href={explorerTxUrl(tx.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-violet-400 hover:text-violet-300"
                              >
                                View →
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — policy */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <CardTitle>Spending Policy</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Status</p>
                <div className="mt-1">
                  <Badge
                    variant={
                      agent.status === 'ACTIVE'
                        ? 'success'
                        : agent.status === 'PAUSED'
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Transaction Limit</p>
                <p className="mt-1 text-lg font-black text-white">
                  {formatUSDT(agent.transactionLimit)}
                </p>
                <p className="text-xs text-zinc-600">max per payment</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Daily Limit</p>
                <p className="mt-1 text-lg font-black text-white">{formatUSDT(agent.dailyLimit)}</p>
                <p className="text-xs text-zinc-600">max per day</p>
              </div>
              {usage && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Spent Today</p>
                    <p className="mt-1 text-lg font-black text-emerald-400">
                      {formatUSDT(usage.totalSpent)}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-zinc-700 bg-[var(--surface-2)]">
                      <div
                        className="h-full bg-violet-500"
                        style={{
                          width: `${Math.min(100, (Number(usage.totalSpent) / Number(agent.dailyLimit)) * 100).toFixed(1)}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-violet-400" />
                <CardTitle>Controls</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AgentControls
                agentId={agent.id}
                status={agent.status}
                transactionLimit={agent.transactionLimit}
                dailyLimit={agent.dailyLimit}
              />
            </CardContent>
          </Card>

          <div className="rounded-lg border-2 border-violet-500/40 bg-violet-500/10 p-4 text-xs text-zinc-300">
            Limits are enforced by the AgentWallet smart contract on BOT Chain and cannot be
            overridden by the AI or application code.
          </div>
        </div>
      </div>
    </div>
  )
}

function TxStatusBadge({ status, reason }: { status: string; reason: string | null }) {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    FAILED: 'destructive',
    REJECTED: 'destructive',
  }
  return (
    <div className="flex flex-col gap-1">
      <Badge variant={map[status] ?? 'secondary'}>{status}</Badge>
      {reason && <span className="text-xs text-zinc-500">{reason}</span>}
    </div>
  )
}
