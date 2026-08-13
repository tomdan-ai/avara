'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { botChain } from '@/config/chains'
import { AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Full-width banner that appears at the top of every app page
 * whenever the user's wallet is on the wrong network.
 * One click switches to BOT Chain.
 */
export function NetworkBanner() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || chainId === botChain.id) return null

  return (
    <div className="flex w-full items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-amber-300">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          Wrong network detected. Avara runs on{' '}
          <strong>BOT Chain Testnet (Chain {botChain.id})</strong>.
        </span>
      </div>
      <button
        onClick={() => switchChain({ chainId: botChain.id })}
        disabled={isPending}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-60"
      >
        {isPending ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Switching...</>
        ) : (
          'Switch to BOT Chain →'
        )}
      </button>
    </div>
  )
}
