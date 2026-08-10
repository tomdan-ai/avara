'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { shortenAddress } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NetworkGuard } from './network-guard'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="nb-press flex items-center gap-2 rounded-lg border-2 border-violet-400 bg-violet-600 px-4 py-2 text-sm font-bold text-white nb-shadow-sm disabled:opacity-60"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <NetworkGuard>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="nb-press flex items-center gap-2 rounded-lg border-2 border-zinc-700 bg-[var(--surface)] px-4 py-2 text-sm font-bold text-white nb-shadow-sm"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          {shortenAddress(address!)}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border-2 border-zinc-700 bg-[var(--surface)] p-1 nb-shadow">
            <button
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </NetworkGuard>
  )
}
