import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUnits, parseUnits } from 'viem'
import { USDT_DECIMALS } from '@/config/chains'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format USDT amount from wei string to human-readable "$0.02" */
export function formatUSDT(weiAmount: string | bigint): string {
  const amount = formatUnits(BigInt(weiAmount), USDT_DECIMALS)
  return `$${parseFloat(amount).toFixed(2)}`
}

/** Parse human-readable USDT amount to wei string */
export function parseUSDT(humanAmount: string): string {
  return parseUnits(humanAmount, USDT_DECIMALS).toString()
}

/** Shorten an Ethereum address: 0x1234...5678 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/** Format a date to a readable string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Build a BOT Chain explorer URL for a transaction */
export function explorerTxUrl(txHash: string): string {
  const base = process.env.NEXT_PUBLIC_BOT_EXPLORER || 'https://scan.botchain.ai'
  return `${base}/tx/${txHash}`
}

/** Build a BOT Chain explorer URL for an address */
export function explorerAddressUrl(address: string): string {
  const base = process.env.NEXT_PUBLIC_BOT_EXPLORER || 'https://scan.botchain.ai'
  return `${base}/address/${address}`
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}
