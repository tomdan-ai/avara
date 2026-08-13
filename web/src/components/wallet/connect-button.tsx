'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { botChain } from '@/config/chains'
import { addAndSwitchToBotChain } from '@/lib/switch-chain'
import { shortenAddress } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [open, setOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const isWrongNetwork = isConnected && chainId !== botChain.id

  // Auto-prompt switch once after connect if on wrong chain
  useEffect(() => {
    if (!isConnected || chainId === botChain.id) return
    const t = setTimeout(async () => {
      try {
        await addAndSwitchToBotChain()
      } catch {
        // User dismissed — they'll see the banner
      }
    }, 500)
    return () => clearTimeout(t)
  }, [isConnected]) // only run once on connect // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwitch = async () => {
    setIsSwitching(true)
    try {
      await addAndSwitchToBotChain()
    } catch {
      // User rejected
    } finally {
      setIsSwitching(false)
    }
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={handleSwitch}
        disabled={isSwitching}
        className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
      >
        {isSwitching ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Switching...</>
        ) : (
          <><AlertTriangle className="h-4 w-4" /> Switch to BOT Chain</>
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        {shortenAddress(address!)}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-xl">
            <div className="px-3 py-2 text-xs text-zinc-500">
              BOT Chain Testnet · Chain {chainId}
            </div>
            <button
              onClick={() => { disconnect(); setOpen(false) }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  )
}
