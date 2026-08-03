'use client'

import { useAccount, useBalance, useReadContract } from 'wagmi'
import { ERC20_ABI } from '@/config/abis'
import { USDT_ADDRESS } from '@/config/chains'
import { formatUnits } from 'viem'

export function WalletBalance() {
  const { address, isConnected } = useAccount()

  const { data: botBalance } = useBalance({
    address,
    query: { enabled: isConnected },
  })

  const { data: usdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-4 text-sm text-zinc-400">
      <span>
        {botBalance ? `${parseFloat(botBalance.formatted).toFixed(4)} BOT` : '— BOT'}
      </span>
      <span>
        {usdtBalance !== undefined
          ? `${parseFloat(formatUnits(usdtBalance, 6)).toFixed(2)} USDT`
          : '— USDT'}
      </span>
    </div>
  )
}
