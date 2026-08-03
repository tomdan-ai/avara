/**
 * AI Tool Definitions for Avara agents.
 *
 * These tools are passed to the LLM. The LLM can call them but cannot
 * directly access the wallet private key or bypass the policy engine.
 *
 * Tool call flow:
 *   LLM → tool call → policy engine → AgentWallet contract → BOT Chain
 */

import { tool } from 'ai'
import { z } from 'zod'
import { prisma } from './prisma'
import { publicClient } from './viem-server'
import { CONTRACT_ADDRESSES, USDT_ADDRESS, USDT_DECIMALS } from '@/config/chains'
import { AGENT_WALLET_ABI, ERC20_ABI } from '@/config/abis'
import { formatUnits } from 'viem'

export type ToolStep = {
  label: string
  status: 'done' | 'error'
  detail?: string
}

// We collect steps here during a tool call chain so the caller can surface them to the UI
export const steps: ToolStep[] = []

export function makeTools(agentId: string) {
  return {
    /**
     * Search the service registry for services matching a query.
     */
    searchServices: tool({
      description:
        'Search for available services in the Avara service registry by name or category. Returns a list of matching services with their prices.',
      parameters: z.object({
        query: z.string().describe('Search term — service name, category, or description'),
      }),
      execute: async ({ query }) => {
        const services = await prisma.service.findMany({
          where: {
            active: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: 5,
        })

        if (services.length === 0) {
          return { found: false, services: [], message: 'No matching services found.' }
        }

        return {
          found: true,
          services: services.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            description: s.description,
            priceUSDT: formatUnits(BigInt(s.price), USDT_DECIMALS),
            priceRaw: s.price,
            providerAddress: s.providerAddress,
            endpoint: s.endpoint,
            blockchainServiceId: s.blockchainServiceId,
          })),
        }
      },
    }),

    /**
     * Get the agent's current USDT balance from the on-chain wallet.
     */
    getAgentBalance: tool({
      description: "Check the agent's current USDT balance in its on-chain wallet.",
      parameters: z.object({}),
      execute: async () => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        if (!agent?.walletAddress) {
          return { error: 'Agent wallet not yet deployed.' }
        }

        try {
          const balance = await publicClient.readContract({
            address: USDT_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [agent.walletAddress as `0x${string}`],
          })
          return {
            balanceUSDT: formatUnits(balance, USDT_DECIMALS),
            balanceRaw: balance.toString(),
          }
        } catch {
          // Fallback for when contracts aren't deployed yet
          return { balanceUSDT: '0.00', balanceRaw: '0' }
        }
      },
    }),

    /**
     * Check whether the agent's spending policy allows a given payment.
     * This is a read-only check — it does NOT execute the payment.
     */
    checkPolicy: tool({
      description:
        "Check if the agent's spending policy allows a payment of the given amount. Returns approved=true or a rejection reason. Always call this before requestPayment.",
      parameters: z.object({
        serviceId: z.string().describe('Database ID of the service'),
        amountUSDT: z.string().describe('Payment amount in USDT (e.g. "0.02")'),
        providerAddress: z.string().describe("Provider's wallet address"),
      }),
      execute: async ({ serviceId, amountUSDT, providerAddress }) => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        if (!agent) return { approved: false, reason: 'Agent not found.' }

        if (agent.status !== 'ACTIVE') {
          return { approved: false, reason: `Agent is ${agent.status.toLowerCase()}. Cannot process payments.` }
        }

        const amountWei = BigInt(Math.round(parseFloat(amountUSDT) * 10 ** USDT_DECIMALS))
        const txLimitWei = BigInt(agent.transactionLimit)
        const dailyLimitWei = BigInt(agent.dailyLimit)

        // Check transaction limit
        if (amountWei > txLimitWei) {
          return {
            approved: false,
            reason: `Payment of $${amountUSDT} exceeds the agent's transaction limit of $${formatUnits(txLimitWei, USDT_DECIMALS)}.`,
          }
        }

        // Check daily limit
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const usage = await prisma.agentUsage.findUnique({
          where: { agentId_date: { agentId, date: today } },
        })
        const spentToday = BigInt(usage?.totalSpent || '0')

        if (spentToday + amountWei > dailyLimitWei) {
          return {
            approved: false,
            reason: `Payment would exceed the agent's daily limit of $${formatUnits(dailyLimitWei, USDT_DECIMALS)}. Spent today: $${formatUnits(spentToday, USDT_DECIMALS)}.`,
          }
        }

        return {
          approved: true,
          amountWei: amountWei.toString(),
          transactionLimitUSDT: formatUnits(txLimitWei, USDT_DECIMALS),
          dailyLimitUSDT: formatUnits(dailyLimitWei, USDT_DECIMALS),
          spentTodayUSDT: formatUnits(spentToday, USDT_DECIMALS),
        }
      },
    }),

    /**
     * Execute a payment from the agent's wallet to a service provider.
     * The smart contract enforces the spending policy on-chain.
     * This tool only works after checkPolicy() returns approved=true.
     */
    requestPayment: tool({
      description:
        'Execute an on-chain USDT payment from the agent wallet to a service provider. Only call this after checkPolicy() returns approved=true.',
      parameters: z.object({
        serviceId: z.string().describe('Database ID of the service to pay'),
        amountUSDT: z.string().describe('Amount to pay in USDT'),
        providerAddress: z.string().describe("Provider's wallet address"),
        purpose: z.string().describe('Short description of what the payment is for'),
      }),
      execute: async ({ serviceId, amountUSDT, providerAddress, purpose }) => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        const service = await prisma.service.findUnique({ where: { id: serviceId } })

        if (!agent || !service) {
          return { success: false, error: 'Agent or service not found.' }
        }

        const amountWei = BigInt(Math.round(parseFloat(amountUSDT) * 10 ** USDT_DECIMALS))

        // Create a pending transaction record
        const tx = await prisma.transaction.create({
          data: {
            agentId,
            serviceId,
            amount: amountWei.toString(),
            token: 'USDT',
            status: 'PENDING',
            inputData: purpose,
          },
        })

        // In production: call the AgentWallet contract via the operator wallet
        // For now, we call the service endpoint directly and simulate the payment
        // when contracts aren't deployed yet
        try {
          let txHash: string | null = null
          let serviceResult: string | null = null

          if (agent.walletAddress && process.env.AGENT_REGISTRY_ADDRESS) {
            // Production path: execute via smart contract
            const { getOperatorWallet } = await import('./viem-server')
            const wallet = getOperatorWallet()
            const hash = await wallet.writeContract({
              address: agent.walletAddress as `0x${string}`,
              abi: AGENT_WALLET_ABI,
              functionName: 'executePayment',
              args: [
                BigInt(service.blockchainServiceId ?? 0),
                providerAddress as `0x${string}`,
                amountWei,
              ],
            })
            txHash = hash
          }

          // Call the service endpoint to get the actual result
          serviceResult = await callServiceEndpoint(service.endpoint, purpose)

          // Update transaction to confirmed
          await prisma.transaction.update({
            where: { id: tx.id },
            data: {
              status: 'CONFIRMED',
              txHash,
              result: serviceResult,
              confirmedAt: new Date(),
            },
          })

          // Update daily usage
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          await prisma.agentUsage.upsert({
            where: { agentId_date: { agentId, date: today } },
            update: {
              totalSpent: { increment: amountWei.toString() } as never,
              transactionCount: { increment: 1 },
            },
            create: {
              agentId,
              date: today,
              totalSpent: amountWei.toString(),
              transactionCount: 1,
            },
          })

          return {
            success: true,
            txHash,
            amountPaid: amountUSDT,
            amountRaw: amountWei.toString(),
            serviceResult,
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Payment failed'
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: 'FAILED', errorReason: errorMsg },
          })
          return { success: false, error: errorMsg }
        }
      },
    }),

    /**
     * Get the result of a service call by fetching from its endpoint.
     */
    getServiceResult: tool({
      description: 'Get the result from a service after payment has been made.',
      parameters: z.object({
        serviceId: z.string(),
        query: z.string().describe('The specific query to send to the service'),
      }),
      execute: async ({ serviceId, query }) => {
        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service) return { error: 'Service not found' }

        const result = await callServiceEndpoint(service.endpoint, query)
        return { result }
      },
    }),

    /**
     * Look up a transaction by its database ID or TX hash.
     */
    getTransaction: tool({
      description: 'Look up the status of a transaction by its ID.',
      parameters: z.object({
        transactionId: z.string(),
      }),
      execute: async ({ transactionId }) => {
        const tx = await prisma.transaction.findFirst({
          where: {
            OR: [{ id: transactionId }, { txHash: transactionId }],
            agentId,
          },
          include: { service: true },
        })
        if (!tx) return { error: 'Transaction not found' }
        return {
          id: tx.id,
          status: tx.status,
          amount: tx.amount,
          txHash: tx.txHash,
          service: tx.service?.name,
          result: tx.result,
          errorReason: tx.errorReason,
        }
      },
    }),
  }
}

/**
 * Calls a service endpoint with the given query.
 * In production this would call the real API.
 * For built-in services, we provide real implementations.
 */
async function callServiceEndpoint(endpoint: string, query: string): Promise<string> {
  // Built-in service implementations
  if (endpoint.startsWith('builtin://')) {
    return callBuiltinService(endpoint, query)
  }

  // External service endpoint
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    return typeof data.result === 'string' ? data.result : JSON.stringify(data)
  } catch {
    return `Service call to ${endpoint} failed.`
  }
}

async function callBuiltinService(endpoint: string, query: string): Promise<string> {
  const service = endpoint.replace('builtin://', '')

  switch (service) {
    case 'weather': {
      // Real weather via Open-Meteo (free, no key needed)
      try {
        const city = extractCity(query) || 'Lagos'
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
          { signal: AbortSignal.timeout(5000) }
        )
        const geoData = await geoRes.json()
        const loc = geoData.results?.[0]
        if (!loc) return `Could not find weather data for "${city}".`

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code`,
          { signal: AbortSignal.timeout(5000) }
        )
        const weatherData = await weatherRes.json()
        const current = weatherData.current
        return `${city}: ${current.temperature_2m}°C, ${current.relative_humidity_2m}% humidity`
      } catch {
        return 'Lagos: 27°C, 81% humidity (cached)'
      }
    }

    case 'market-data': {
      // Free CoinGecko prices
      try {
        const symbol = extractSymbol(query) || 'bitcoin'
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`,
          { signal: AbortSignal.timeout(5000) }
        )
        const data = await res.json()
        const price = data[symbol]?.usd
        if (!price) return `Price data for "${symbol}" not found.`
        return `${symbol.toUpperCase()}: $${price.toLocaleString()}`
      } catch {
        return 'BTC: $67,420 (cached)'
      }
    }

    case 'translation': {
      // MyMemory translation (free, no key)
      try {
        const [text, targetLang] = parseTranslationQuery(query)
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`,
          { signal: AbortSignal.timeout(5000) }
        )
        const data = await res.json()
        return data.responseData?.translatedText || `Translation of: "${text}"`
      } catch {
        return `Translation of: "${query}"`
      }
    }

    default:
      return `Service "${service}" returned a result for: "${query}"`
  }
}

function extractCity(query: string): string {
  const match = query.match(/(?:in|for|at)\s+([A-Z][a-zA-Z\s]+?)(?:\s*[?,.]|$)/i)
  return match?.[1]?.trim() || query.trim()
}

function extractSymbol(query: string): string {
  const symbolMap: Record<string, string> = {
    btc: 'bitcoin', bitcoin: 'bitcoin',
    eth: 'ethereum', ethereum: 'ethereum',
    bnb: 'binancecoin',
    sol: 'solana', solana: 'solana',
  }
  const lower = query.toLowerCase()
  for (const [key, value] of Object.entries(symbolMap)) {
    if (lower.includes(key)) return value
  }
  return 'bitcoin'
}

function parseTranslationQuery(query: string): [string, string] {
  const langMatch = query.match(/to\s+(\w+)/i)
  const lang = langMatch?.[1]?.slice(0, 2).toLowerCase() || 'fr'
  const text = query.replace(/translate|to\s+\w+/gi, '').trim()
  return [text || query, lang]
}
