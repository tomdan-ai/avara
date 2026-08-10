/**
 * Server-side viem client.
 * Never import this in client components — it references BOT_PRIVATE_KEY.
 */
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { botChain } from '@/config/chains'

export const publicClient = createPublicClient({
  chain: botChain,
  // Falls back to botChain's env-driven RPC when BOT_RPC_URL is unset
  transport: http(process.env.BOT_RPC_URL),
})

/**
 * Operator wallet — used to submit transactions on behalf of agents.
 * The smart contract enforces all spending limits; this key only triggers
 * pre-authorized contract calls.
 */
export function getOperatorWallet() {
  const privateKey = process.env.BOT_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('BOT_PRIVATE_KEY is not configured')
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  return createWalletClient({
    account,
    chain: botChain,
    transport: http(process.env.BOT_RPC_URL),
  })
}
