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
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
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
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          {shortenAddress(address!)}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-xl">
            <button
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
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
