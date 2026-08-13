'use client'

/**
 * Adds BOT Chain to MetaMask if not present, then switches to it.
 * Uses raw window.ethereum calls because wagmi's useSwitchChain silently
 * fails when the chain isn't already in the wallet.
 *
 * Returns true if the wallet is now on BOT Chain.
 */
export async function addAndSwitchToBotChain(): Promise<boolean> {
  const ethereum = (window as unknown as { ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  } }).ethereum

  if (!ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  const chainIdHex = '0x' + Number(process.env.NEXT_PUBLIC_BOT_CHAIN_ID ?? 968).toString(16)
  const rpcUrl = process.env.NEXT_PUBLIC_BOT_CHAIN_RPC ?? 'https://rpc.bohr.life'
  const explorerUrl = process.env.NEXT_PUBLIC_BOT_EXPLORER ?? 'https://scan.bohr.life'

  // Step 1: Try to switch — this works if the chain is already added
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
    return true
  } catch (switchErr) {
    const err = switchErr as { code?: number }
    // 4902 = chain not added to MetaMask yet
    // -32603 = internal error (some wallets use this instead of 4902)
    if (err?.code !== 4902 && err?.code !== -32603) {
      throw switchErr // User rejected or other error — propagate
    }
  }

  // Step 2: Chain not in MetaMask — add it first, then switch
  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: chainIdHex,
        chainName: 'BOT Chain Testnet',
        nativeCurrency: {
          name: 'BOT',
          symbol: 'BOT',
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [explorerUrl],
      },
    ],
  })

  // Step 3: Verify the switch actually happened
  const currentChainId = await ethereum.request({ method: 'eth_chainId' }) as string
  return parseInt(currentChainId, 16) === Number(process.env.NEXT_PUBLIC_BOT_CHAIN_ID ?? 968)
}
