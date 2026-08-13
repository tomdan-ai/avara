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

  const { writeContractAsync } = useWriteContract()

  const isWrongNetwork = isConnected && chainId !== botChain.id

  const handleFund = async () => {
    if (!walletAddress || !address || !amount) return
    setErrorMsg('')

    try {
      // Step 0: Ensure we're on BOT Chain before any transaction
      if (chainId !== botChain.id) {
        setStep('switching')
        toast({
          title: 'Switching network',
          description: 'Switching to BOT Chain testnet...',
        })
        await switchChainAsync({ chainId: botChain.id })
      }

      const amountWei = parseUnits(amount, 6)

      // Step 1: Approve USDT spend on BOT Chain
      setStep('approving')
      toast({
        title: 'Confirm in wallet',
        description: `Approve ${amount} USDT for the agent wallet on BOT Chain.`,
      })
      await writeContractAsync({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [walletAddress as `0x${string}`, amountWei],
        chainId: botChain.id,
      })

      // Step 2: Deposit into agent wallet
      setStep('depositing')
      toast({
        title: 'Confirm deposit',
        description: 'Confirm the deposit transaction in your wallet.',
      })
      const depositTx = await writeContractAsync({
        address: walletAddress as `0x${string}`,
        abi: AGENT_WALLET_ABI,
        functionName: 'deposit',
        args: [USDT_ADDRESS, amountWei],
        chainId: botChain.id,
      })

      // Notify backend
      await fetch(`/api/agents/${agentId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountWei.toString(), txHash: depositTx }),
      })

      setStep('done')
      toast({
        variant: 'success',
        title: 'Agent funded',
        description: `Deposited ${amount} USDT. The agent is ready.`,
      })
    } catch (err) {
      setStep('error')
      const message = err instanceof Error ? err.message : 'Transaction failed'
      // User rejected the switch or tx
      const isRejected = message.toLowerCase().includes('rejected') || message.toLowerCase().includes('denied')
      setErrorMsg(isRejected ? 'Transaction cancelled.' : message)
      if (!isRejected) {
        toast({
          variant: 'destructive',
          title: 'Funding failed',
          description: message.length > 120 ? `${message.slice(0, 120)}…` : message,
        })
      }
    }
  }

  if (!isConnected) return null

  if (!walletAddress) {
    return (
      <p className="text-xs text-zinc-500">
        Agent wallet not yet deployed on-chain.
      </p>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-300">
        <Check className="h-4 w-4" />
        Deposited {amount} USDT successfully
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Wrong network warning */}
      {isWrongNetwork && !showForm && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          You're on the wrong network. Clicking Fund Agent will switch to BOT Chain.
        </div>
      )}

      {!showForm ? (
        <Button variant="secondary" onClick={() => setShowForm(true)} className="w-full">
          <DollarSign className="h-4 w-4" />
          Fund Agent
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <Label>Amount (USDT)</Label>
            {isWrongNetwork && (
              <span className="text-xs text-amber-400">
                ⚠ Will switch to BOT Chain
              </span>
            )}
          </div>
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
              Approving USDT on BOT Chain...
            </div>
          )}
          {step === 'depositing' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Depositing to agent wallet...
            </div>
          )}
          {step === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
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
              {step === 'switching' ? 'Switching...' : 'Confirm Deposit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
