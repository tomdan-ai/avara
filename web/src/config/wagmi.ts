import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { botChain } from './chains'

export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    // Uses the env-driven RPC from botChain (NEXT_PUBLIC_BOT_CHAIN_RPC)
    [botChain.id]: http(),
  },
  ssr: true,
})
