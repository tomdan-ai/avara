'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Pause, Play, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { formatUnits } from 'viem'
import { USDT_DECIMALS } from '@/config/chains'

interface AgentControlsProps {
  agentId: string
  status: string
  /** wei strings from the DB */
  transactionLimit: string
  dailyLimit: string
}

/** wei string → plain dollar string for the input, e.g. "2000000" → "2" */
function weiToUSD(wei: string): string {
  return formatUnits(BigInt(wei), USDT_DECIMALS)
}

export function AgentControls({ agentId, status, transactionLimit, dailyLimit }: AgentControlsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [txLimit, setTxLimit] = useState(weiToUSD(transactionLimit))
  const [dayLimit, setDayLimit] = useState(weiToUSD(dailyLimit))

  const isActive = status === 'ACTIVE'
  const nextStatus = isActive ? 'PAUSED' : 'ACTIVE'

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  }

  async function toggleStatus() {
    setBusy(true)
    try {
      const ok = await patch({ status: nextStatus })
      if (!ok) throw new Error()
      toast({
        variant: nextStatus === 'ACTIVE' ? 'success' : 'warning',
        title: nextStatus === 'ACTIVE' ? 'Agent activated' : 'Agent paused',
        description:
          nextStatus === 'ACTIVE'
            ? 'The agent can now discover services and make payments.'
            : 'The agent will reject new payment requests until resumed.',
      })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Update failed', description: 'Could not change the agent status.' })
    } finally {
      setBusy(false)
    }
  }

  async function saveLimits() {
    if (!txLimit || !dayLimit) return
    setBusy(true)
    try {
      const ok = await patch({ transactionLimitUSD: txLimit, dailyLimitUSD: dayLimit })
      if (!ok) throw new Error()
      toast({
        variant: 'success',
        title: 'Limits updated',
        description: `Per-tx $${txLimit} · Daily $${dayLimit}`,
      })
      setEditing(false)
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Update failed', description: 'Could not update spending limits.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Button
          variant={isActive ? 'outline' : 'default'}
          onClick={toggleStatus}
          disabled={busy || status === 'INACTIVE'}
          className="w-full"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isActive ? 'Pause Agent' : 'Activate Agent'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => setEditing((v) => !v)}
          disabled={busy}
          className="w-full"
        >
          {editing ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          {editing ? 'Cancel' : 'Edit Limits'}
        </Button>
      </div>

      {editing && (
        <div className="space-y-3 rounded-lg border-2 border-zinc-700 bg-[var(--surface-2)] p-4">
          <div className="space-y-2">
            <Label htmlFor="ctl-tx">Max per transaction (USDT)</Label>
            <Input
              id="ctl-tx"
              type="number"
              min="0.01"
              step="0.01"
              value={txLimit}
              onChange={(e) => setTxLimit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctl-day">Daily limit (USDT)</Label>
            <Input
              id="ctl-day"
              type="number"
              min="0.01"
              step="0.01"
              value={dayLimit}
              onChange={(e) => setDayLimit(e.target.value)}
            />
          </div>
          <Button onClick={saveLimits} disabled={busy || !txLimit || !dayLimit} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Limits
          </Button>
          <p className="text-xs text-zinc-500">
            Updates the off-chain policy record. On-chain limits are set at deployment.
          </p>
        </div>
      )}
    </div>
  )
}
