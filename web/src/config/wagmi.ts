import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { botChain } from './chains'

export const wagmiConfig = createConfig({
  chains: [botChain],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [botChain.id]: http(process.env.NEXT_PUBLIC_BOT_CHAIN_RPC),
  },
  ssr: true,
})
