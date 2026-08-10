import { defineChain } from 'viem'

/**
 * BOT Chain (testnet) — every network value is read from the environment.
 * Nothing here is hardcoded, so switching networks only means changing env.
 *
 * Required (browser-safe) env vars — see .env.example:
 *   NEXT_PUBLIC_BOT_CHAIN_ID
 *   NEXT_PUBLIC_BOT_CHAIN_RPC
 *   NEXT_PUBLIC_BOT_EXPLORER
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so they must be referenced
 * as full literals (no dynamic key access) for Next.js to pick them up.
 */
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_BOT_CHAIN_ID)
const RPC_URL = process.env.NEXT_PUBLIC_BOT_CHAIN_RPC
const EXPLORER_URL = process.env.NEXT_PUBLIC_BOT_EXPLORER

if (!CHAIN_ID || Number.isNaN(CHAIN_ID) || !RPC_URL || !EXPLORER_URL) {
  throw new Error(
    'Missing BOT Chain env vars. Set NEXT_PUBLIC_BOT_CHAIN_ID, ' +
      'NEXT_PUBLIC_BOT_CHAIN_RPC and NEXT_PUBLIC_BOT_EXPLORER in .env.local',
  )
}

export const botChain = defineChain({
  id: CHAIN_ID,
  name: process.env.NEXT_PUBLIC_BOT_CHAIN_NAME || 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOT Chain Explorer',
      url: EXPLORER_URL,
    },
  },
  testnet: true,
  contracts: {},
})

export const SUPPORTED_CHAIN = botChain

export const USDT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_ADDRESS || '') as `0x${string}`

export const USDT_DECIMALS = 6

export const CONTRACT_ADDRESSES = {
  agentRegistry: (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '') as `0x${string}`,
  serviceRegistry: (process.env.NEXT_PUBLIC_SERVICE_REGISTRY_ADDRESS || '') as `0x${string}`,
  paymentRouter: (process.env.NEXT_PUBLIC_PAYMENT_ROUTER_ADDRESS || '') as `0x${string}`,
  usdt: USDT_ADDRESS,
} as const
