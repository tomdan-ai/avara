'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { ERC20_ABI, AGENT_WALLET_ABI } from '@/config/abis'
import { USDT_ADDRESS } from '@/config/chains'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, DollarSign, Check } from 'lucide-react'

interface FundAgentButtonProps {
  agentId: string
  walletAddress: string | null
}

type Step = 'idle' | 'approving' | 'depositing' | 'done' | 'error'

export function FundAgentButton({ agentId, walletAddress }: FundAgentButtonProps) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { writeContractAsync } = useWriteContract()

  const handleFund = async () => {
    if (!walletAddress || !address || !amount) return
    setErrorMsg('')

    try {
      const amountWei = parseUnits(amount, 6)

      // Step 1: Approve USDT spend
      setStep('approving')
      const approveTx = await writeContractAsync({
        address: USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [walletAddress as `0x${string}`, amountWei],
      })

      // Step 2: Deposit into agent wallet
      setStep('depositing')
      const depositTx = await writeContractAsync({
        address: walletAddress as `0x${string}`,
        abi: AGENT_WALLET_ABI,
        functionName: 'deposit',
        args: [amountWei],
      })

      // Notify backend to record the deposit
      await fetch(`/api/agents/${agentId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountWei.toString(), txHash: depositTx }),
      })

      setStep('done')
    } catch (err) {
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  if (!isConnected) return null
  if (!walletAddress) {
    return (
      <p className="text-xs text-zinc-500">
        Agent wallet not yet deployed. Deploy the contracts first.
      </p>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
        <Check className="h-4 w-4" />
        Deposited {amount} USDT successfully
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!showForm ? (
        <Button variant="secondary" onClick={() => setShowForm(true)} className="w-full">
          <DollarSign className="h-4 w-4" />
          Fund Agent
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 p-4">
          <Label>Amount (USDT)</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {step === 'approving' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Approving USDT...
            </div>
          )}
          {step === 'depositing' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Depositing...
            </div>
          )}
          {step === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false)
                setStep('idle')
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleFund}
              disabled={!amount || step === 'approving' || step === 'depositing'}
            >
              {(step === 'approving' || step === 'depositing') && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Confirm Deposit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
