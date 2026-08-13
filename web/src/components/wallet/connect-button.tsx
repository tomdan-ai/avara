'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { botChain } from '@/config/chains'
import { shortenAddress } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [open, setOpen] = useState(false)

  const isWrongNetwork = isConnected && chainId !== botChain.id

  // Auto-prompt switch when connected to wrong network
  useEffect(() => {
    if (isWrongNetwork) {
      switchChain({ chainId: botChain.id })
    }
  }, [isConnected, chainId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    connect({ connector: connectors[0] })
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  // Wrong network — show prominent switch button
  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: botChain.id })}
        disabled={isSwitching}
        className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
      >
        <AlertTriangle className="h-4 w-4" />
        {isSwitching ? 'Switching...' : 'Switch to BOT Chain'}
      </button>
    )
  }

  // Connected + correct network
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
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-xl">
            <div className="px-3 py-2 text-xs text-zinc-500">
              Chain {chainId} · BOT Testnet
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
