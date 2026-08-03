'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { botChain } from '@/config/chains'
import { AlertTriangle } from 'lucide-react'

interface NetworkGuardProps {
  children: React.ReactNode
}

/**
 * Wraps children. When the user is connected to the wrong network,
 * shows a "Switch to BOT Chain" prompt instead.
 */
export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected) return <>{children}</>

  const isCorrectNetwork = chainId === botChain.id

  if (!isCorrectNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: botChain.id })}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-60"
      >
        <AlertTriangle className="h-4 w-4" />
        {isPending ? 'Switching...' : 'Switch to BOT Chain'}
      </button>
    )
  }

  return <>{children}</>
}
