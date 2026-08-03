import { defineChain } from 'viem'

// BOT Chain Mainnet
export const botChain = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BOT_CHAIN_RPC || 'https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOT Chain Explorer',
      url: process.env.NEXT_PUBLIC_BOT_EXPLORER || 'https://scan.botchain.ai',
    },
  },
  contracts: {},
})

// BOT Chain Testnet — update once official testnet details are published
export const botChainTestnet = defineChain({
  id: 677, // Update with actual testnet chain ID when available
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'], // Update with testnet RPC
    },
  },
  blockExplorers: {
    default: {
      name: 'BOT Chain Testnet Explorer',
      url: 'https://scan.botchain.ai', // Update with testnet explorer
    },
  },
  contracts: {},
  testnet: true,
})

export const SUPPORTED_CHAIN = botChain

export const USDT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_ADDRESS ||
  '0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C') as `0x${string}`

export const USDT_DECIMALS = 6

export const CONTRACT_ADDRESSES = {
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '') as `0x${string}`,
  serviceRegistry: (process.env.NEXT_PUBLIC_SERVICE_REGISTRY_ADDRESS || '') as `0x${string}`,
  paymentRouter: (process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS || '') as `0x${string}`,
  usdt: USDT_ADDRESS,
} as const
