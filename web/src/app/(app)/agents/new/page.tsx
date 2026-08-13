'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Bot, ArrowLeft, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

export default function NewAgentPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    transactionLimit: '2',
    dailyLimit: '10',
    systemPrompt: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address) {
      setError('Please connect your wallet first.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          transactionLimitUSD: form.transactionLimit,
          dailyLimitUSD: form.dailyLimit,
          systemPrompt: form.systemPrompt,
          walletAddress: address,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create agent')
      }

      const agent = await res.json()
      toast({
        variant: 'success',
        title: 'Agent created',
        description: `${form.name} is ready. Fund it to start making payments.`,
      })
      router.push(`/agents/${agent.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast({ variant: 'destructive', title: 'Could not create agent', description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Create Agent</h1>
          <p className="text-sm text-zinc-400">
            Deploy an AI agent with a programmable wallet on BOT Chain.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-violet-400 bg-violet-600/25">
                <Bot className="h-4 w-4 text-violet-300" />
              </div>
              <div>
                <CardTitle>Agent Identity</CardTitle>
                <CardDescription>Give your agent a name and optional instructions.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Research Agent"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">
                Custom instructions <span className="text-zinc-500">(optional)</span>
              </Label>
              <Textarea
                id="systemPrompt"
                name="systemPrompt"
                placeholder="Focus on Solana meme coins. Only buy tokens under $1M market cap. Always explain your reasoning before purchasing..."
                value={form.systemPrompt}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Spending policy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-emerald-400 bg-emerald-600/25">
                <Shield className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <CardTitle>Spending Policy</CardTitle>
                <CardDescription>
                  These limits are enforced by the smart contract. The AI cannot override them.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionLimit">Max per transaction (USDT)</Label>
                <Input
                  id="transactionLimit"
                  name="transactionLimit"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="2.00"
                  value={form.transactionLimit}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-zinc-500">
                  Any single payment over this amount will be blocked.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily spending limit (USDT)</Label>
                <Input
                  id="dailyLimit"
                  name="dailyLimit"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="10.00"
                  value={form.dailyLimit}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-zinc-500">Agent cannot spend more than this per day.</p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-300">
                <strong>Security model:</strong> These limits are written to the AgentWallet smart
                contract on BOT Chain at deployment time. They cannot be bypassed by the AI model or
                any application-level code.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border-2 border-red-500/40 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            {error}
          </div>
        )}

        {!isConnected && (
          <div className="rounded-lg border-2 border-amber-500/40 bg-amber-500/10 p-4 text-sm font-medium text-amber-300">
            Connect your wallet to create an agent.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/agents">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading || !isConnected}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                Deploy Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
