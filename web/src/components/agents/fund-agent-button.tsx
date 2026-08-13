'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useChainId, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { ERC20_ABI, AGENT_WALLET_ABI } from '@/config/abis'
import { USDT_ADDRESS, botChain } from '@/config/chains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, DollarSign, Check, AlertTriangle } from 'lucide-react'

interface FundAgentButtonProps {
  agentId: string
  walletAddress: string | null
}

type Step = 'idle' | 'switching' | 'approving' | 'depositing' | 'done' | 'error'

export function FundAgentButton({ agentId, walletAddress }: FundAgentButtonProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Note: no chainId prop on writeContractAsync — we ensure the correct chain
  // is active BEFORE calling it. Passing chainId causes viem to reject the call
  // if the internal chain registry doesn't recognize the custom chain (968).
  const { writeContractAsync } = useWriteContract()

  const isWrongNetwork = isConnected && chainId !== botChain.id

  const ensureCorrectChain = async () => {
    if (chainId === botChain.id) return
    setStep('switching')
    toast({ title: 'Switching network', description: 'Confirm the network switch in MetaMask.' })
    await switchChainAsync({ chainId: botChain.id })
    // Give MetaMask a moment to propagate the switch before the next call
    await new Promise((r) => setTimeout(r, 500))
  }

  const handleFund = async () => {
    if (!walletAddress || !address || !amount) return
    setErrorMsg('')

    try {
      // Always ensure BOT Chain is active before any write
      await ensureCorrectChain()

      const amountWei = parseUnits(amount, 6)

      // Step 1: Approve USDT — no chainId prop, chain is already switched
      setStep('approving')
      toast({ title: 'Step 1 of 2', description: `Approve ${amount} USDT in MetaMask.` })
      await writeContractAsync({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [walletAddress as `0x${string}`, amountWei],
      })

      // Step 2: Deposit
      setStep('depositing')
      toast({ title: 'Step 2 of 2', description: 'Confirm the deposit in MetaMask.' })
      const depositTx = await writeContractAsync({
        address: walletAddress as `0x${string}`,
        abi: AGENT_WALLET_ABI,
        functionName: 'deposit',
        args: [USDT_ADDRESS, amountWei],
      })

      // Record in backend
      await fetch(`/api/agents/${agentId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountWei.toString(), txHash: depositTx }),
      })

      setStep('done')
      toast({ variant: 'success', title: 'Agent funded', description: `${amount} USDT deposited.` })
    } catch (err) {
      setStep('error')
      const message = err instanceof Error ? err.message : 'Transaction failed'
      const isRejected =
        message.toLowerCase().includes('rejected') ||
        message.toLowerCase().includes('denied') ||
        message.toLowerCase().includes('cancelled')
      setErrorMsg(isRejected ? 'Cancelled.' : message.slice(0, 200))
      if (!isRejected) {
        toast({ variant: 'destructive', title: 'Failed', description: message.slice(0, 120) })
      }
    }
  }

  if (!isConnected) return null

  if (!walletAddress) {
    return (
      <p className="text-xs text-zinc-500">
        Agent wallet not deployed on-chain yet.
      </p>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-300">
        <Check className="h-4 w-4" />
        Deposited {amount} USDT
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isWrongNetwork && !showForm && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Wrong network — will auto-switch to BOT Chain on deposit.
        </div>
      )}

      {!showForm ? (
        <Button variant="secondary" onClick={() => setShowForm(true)} className="w-full">
          <DollarSign className="h-4 w-4" />
          Fund Agent
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <Label>Amount (USDT)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="5.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {step === 'switching' && (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Switching to BOT Chain...
            </div>
          )}
          {step === 'approving' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Approving USDT (1/2)...
            </div>
          )}
          {step === 'depositing' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Depositing to agent wallet (2/2)...
            </div>
          )}
          {step === 'error' && (
            <p className="rounded bg-red-500/10 p-2 text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(false); setStep('idle') }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleFund}
              disabled={!amount || ['switching', 'approving', 'depositing'].includes(step)}
            >
              {['switching', 'approving', 'depositing'].includes(step) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {step === 'switching' ? 'Switching...' : 'Deposit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
