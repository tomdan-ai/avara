'use client'

import { useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { botChain } from '@/config/chains'
import { addAndSwitchToBotChain } from '@/lib/switch-chain'
import { AlertTriangle, Loader2 } from 'lucide-react'

export function NetworkBanner() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [isPending, setIsPending] = useState(false)

  if (!isConnected || chainId === botChain.id) return null

  const handleSwitch = async () => {
    setIsPending(true)
    try {
      await addAndSwitchToBotChain()
    } catch {
      // User rejected — do nothing
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Wrong network — Avara runs on <strong>BOT Chain Testnet (Chain 968)</strong>.
          You are on chain <strong>{chainId}</strong>.
        </span>
      </div>
      <button
        onClick={handleSwitch}
        disabled={isPending}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-60"
      >
        {isPending ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Switching...</>
        ) : (
          'Add & Switch to BOT Chain →'
        )}
      </button>
    </div>
  )
}
