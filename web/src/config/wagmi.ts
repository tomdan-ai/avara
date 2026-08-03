import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { botChain } from './chains'

export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [
    injected(), // MetaMask and other injected wallets
  ],
  transports: {
    [botChain.id]: http(process.env.NEXT_PUBLIC_BOT_CHAIN_RPC || 'https://rpc.botchain.ai'),
  },
  ssr: true,
})
