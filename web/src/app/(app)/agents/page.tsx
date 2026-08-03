import { prisma } from '@/lib/prisma'
import { formatUSDT, formatDate, shortenAddress } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, PlusCircle, MessageSquare, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

async function getAgents() {
  return prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { transactions: true } },
    },
  })
}

export default async function AgentsPage() {
  const agents = await getAgents().catch(() => [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create and manage your AI agents with programmable wallets.
          </p>
        </div>
        <Link href="/agents/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            New Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bot className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">No agents yet</h3>
            <p className="mb-6 text-sm text-zinc-400">
              Create your first agent to start making autonomous payments.
            </p>
            <Link href="/agents/new">
              <Button>
                <PlusCircle className="h-4 w-4" />
                Create Agent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="transition hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
                      <Bot className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {agent.walletAddress
                          ? shortenAddress(agent.walletAddress)
                          : 'Not deployed'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-zinc-500">Tx Limit</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {formatUSDT(agent.transactionLimit)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-xs text-zinc-500">Daily Limit</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {formatUSDT(agent.dailyLimit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {agent._count.transactions} transactions
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/agents/${agent.id}/chat`}>
                      <Button size="sm" variant="secondary">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat
                      </Button>
                    </Link>
                    <Link href={`/agents/${agent.id}`}>
                      <Button size="sm" variant="outline">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    ACTIVE: 'success',
    PAUSED: 'warning',
    INACTIVE: 'destructive',
  }
  return <Badge variant={map[status] ?? 'secondary'}>{status}</Badge>
}
