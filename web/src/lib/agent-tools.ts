/**
 * Avara Agent Tools
 *
 * These are the real tools the agent uses to browse the internet,
 * analyze tokens, check policies, and execute on-chain payments.
 *
 * Security model: LLM calls tools → policy engine validates → contract enforces.
 * The LLM never touches a private key directly.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { prisma } from './prisma'
import { USDT_DECIMALS } from '@/config/chains'
import { formatUnits } from 'viem'

// ─── Internet Research Tools ──────────────────────────────────────────────────

/**
 * Search the web for real-time information.
 * Uses DuckDuckGo instant answers + scraping for crypto/finance queries.
 */
export const searchWeb = tool({
  description:
    'Search the internet for real-time information. Use this to find trending tokens, crypto news, market alpha, or any current information. Returns relevant snippets and URLs.',
  parameters: z.object({
    query: z.string().describe('Search query — be specific, e.g. "trending solana meme coins today" or "PEPE token price prediction"'),
  }),
  execute: async ({ query }) => {
    try {
      // DuckDuckGo HTML search (no API key needed)
      const encoded = encodeURIComponent(query)
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encoded}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Avara-Agent/1.0)',
            'Accept': 'text/html',
          },
          signal: AbortSignal.timeout(8000),
        }
      )
      const html = await res.text()

      // Extract result snippets
      const results: { title: string; snippet: string; url: string }[] = []
      const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
      const titleRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g

      const titles: { url: string; title: string }[] = []
      let tm: RegExpExecArray | null
      while ((tm = titleRegex.exec(html)) && titles.length < 6) {
        titles.push({
          url: decodeURIComponent(tm[1].replace(/.*uddg=/, '')),
          title: tm[2].replace(/<[^>]+>/g, '').trim(),
        })
      }

      let sm: RegExpExecArray | null
      let i = 0
      while ((sm = snippetRegex.exec(html)) && i < 5) {
        results.push({
          title: titles[i]?.title || '',
          snippet: sm[1].replace(/<[^>]+>/g, '').trim(),
          url: titles[i]?.url || '',
        })
        i++
      }

      if (results.length === 0) {
        return { found: false, query, results: [], message: 'No results found.' }
      }

      return { found: true, query, results }
    } catch (err) {
      return {
        found: false,
        query,
        results: [],
        message: `Search failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      }
    }
  },
})

/**
 * Fetch and read the content of a web page.
 * Use after searchWeb to get deeper information from a specific URL.
 */
export const fetchPage = tool({
  description:
    'Read the content of a specific web page URL. Use this to get detailed information from a page found via searchWeb — news articles, token pages, documentation, etc.',
  parameters: z.object({
    url: z.string().url().describe('Full URL of the page to read'),
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Avara-Agent/1.0)',
          'Accept': 'text/html,text/plain',
        },
        signal: AbortSignal.timeout(8000),
      })
      const html = await res.text()

      // Strip HTML tags, collapse whitespace, take first 3000 chars
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000)

      return { url, content: text, length: text.length }
    } catch (err) {
      return {
        url,
        content: '',
        error: `Failed to fetch page: ${err instanceof Error ? err.message : 'unknown'}`,
      }
    }
  },
})

// ─── Crypto Market Tools ──────────────────────────────────────────────────────

/**
 * Get trending tokens from DexScreener — the primary source for meme coin alpha.
 */
export const getTrendingTokens = tool({
  description:
    'Get currently trending tokens from DexScreener. Returns tokens with the most trading activity in the last 24 hours. Great for finding meme coins and new launches with momentum.',
  parameters: z.object({
    chain: z.string().optional().describe('Filter by chain: "ethereum", "bsc", "solana", "base", "arbitrum" etc. Leave empty for all chains.'),
    limit: z.number().min(1).max(20).default(10).describe('Number of trending tokens to return'),
  }),
  execute: async ({ chain, limit }) => {
    try {
      // DexScreener trending endpoint
      const url = 'https://api.dexscreener.com/token-boosts/top/v1'
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      const data = await res.json()

      let tokens = Array.isArray(data) ? data : (data.pairs ?? data.tokens ?? [])

      if (chain) {
        tokens = tokens.filter((t: Record<string, unknown>) =>
          String(t.chainId ?? t.chain ?? '').toLowerCase().includes(chain.toLowerCase())
        )
      }

      const results = tokens.slice(0, limit).map((t: Record<string, unknown>) => ({
        name: t.name ?? t.tokenAddress,
        symbol: t.description ?? '',
        address: t.tokenAddress,
        chain: t.chainId,
        url: t.url,
        links: t.links,
        boostAmount: t.amount,
        totalAmount: t.totalAmount,
      }))

      return {
        found: results.length > 0,
        chain: chain ?? 'all',
        tokens: results,
        source: 'DexScreener',
        timestamp: new Date().toISOString(),
      }
    } catch (err) {
      return {
        found: false,
        tokens: [],
        error: `DexScreener fetch failed: ${err instanceof Error ? err.message : 'unknown'}`,
      }
    }
  },
})

/**
 * Get real-time price and market data for a specific token.
 */
export const getTokenPrice = tool({
  description:
    'Get the current price, market cap, 24h volume, and price change for a specific token. Works for any token by contract address or by symbol for major coins.',
  parameters: z.object({
    identifier: z.string().describe('Token contract address (0x...) OR token symbol like "BTC", "ETH", "PEPE"'),
    chain: z.string().optional().describe('Chain name if using contract address: "ethereum", "bsc", "solana" etc.'),
  }),
  execute: async ({ identifier, chain }) => {
    try {
      // If it looks like a contract address, use DexScreener
      if (identifier.startsWith('0x') || identifier.length > 20) {
        const chainPath = chain ?? 'ethereum'
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${identifier}`,
          { signal: AbortSignal.timeout(8000) }
        )
        const data = await res.json()
        const pair = data.pairs?.[0]
        if (!pair) return { found: false, error: 'Token not found on DexScreener' }

        return {
          found: true,
          name: pair.baseToken?.name,
          symbol: pair.baseToken?.symbol,
          address: pair.baseToken?.address,
          chain: pair.chainId,
          priceUsd: pair.priceUsd,
          priceNative: pair.priceNative,
          marketCap: pair.marketCap,
          fdv: pair.fdv,
          liquidity: pair.liquidity?.usd,
          volume24h: pair.volume?.h24,
          priceChange: {
            m5: pair.priceChange?.m5,
            h1: pair.priceChange?.h1,
            h6: pair.priceChange?.h6,
            h24: pair.priceChange?.h24,
          },
          txns24h: pair.txns?.h24,
          dexUrl: pair.url,
          source: 'DexScreener',
        }
      }

      // Otherwise use CoinGecko by symbol
      const symbolMap: Record<string, string> = {
        BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin',
        SOL: 'solana', ADA: 'cardano', DOT: 'polkadot',
        AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink',
        UNI: 'uniswap', PEPE: 'pepe', SHIB: 'shiba-inu', DOGE: 'dogecoin',
        WIF: 'dogwifhat', BONK: 'bonk', FLOKI: 'floki',
      }
      const id = symbolMap[identifier.toUpperCase()] ?? identifier.toLowerCase()

      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await res.json()
      if (data.error) return { found: false, error: data.error }

      const md = data.market_data
      return {
        found: true,
        name: data.name,
        symbol: data.symbol?.toUpperCase(),
        priceUsd: md?.current_price?.usd,
        marketCap: md?.market_cap?.usd,
        volume24h: md?.total_volume?.usd,
        priceChange: {
          h1: md?.price_change_percentage_1h_in_currency?.usd,
          h24: md?.price_change_percentage_24h,
          d7: md?.price_change_percentage_7d,
        },
        ath: md?.ath?.usd,
        athDate: md?.ath_date?.usd,
        rank: data.market_cap_rank,
        description: data.description?.en?.slice(0, 300),
        source: 'CoinGecko',
      }
    } catch (err) {
      return {
        found: false,
        error: `Price fetch failed: ${err instanceof Error ? err.message : 'unknown'}`,
      }
    }
  },
})

/**
 * Search for tokens by name or keyword on DexScreener.
 */
export const searchTokens = tool({
  description:
    'Search for tokens by name or keyword. Use this to find the contract address and chain for a specific token you want to analyze or buy.',
  parameters: z.object({
    query: z.string().describe('Token name, symbol, or keyword to search for'),
  }),
  execute: async ({ query }) => {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await res.json()
      const pairs = data.pairs?.slice(0, 8) ?? []

      return {
        found: pairs.length > 0,
        query,
        tokens: pairs.map((p: Record<string, unknown>) => {
          const base = p.baseToken as Record<string, unknown>
          const liq = p.liquidity as Record<string, unknown>
          const vol = p.volume as Record<string, unknown>
          return {
            name: base?.name,
            symbol: base?.symbol,
            address: base?.address,
            chain: p.chainId,
            priceUsd: p.priceUsd,
            marketCap: p.marketCap,
            liquidity: liq?.usd,
            volume24h: vol?.h24,
            priceChange24h: (p.priceChange as Record<string, unknown>)?.h24,
            dexUrl: p.url,
          }
        }),
        source: 'DexScreener',
      }
    } catch (err) {
      return {
        found: false,
        query,
        tokens: [],
        error: `Search failed: ${err instanceof Error ? err.message : 'unknown'}`,
      }
    }
  },
})

/**
 * Analyze a token for risk signals — liquidity, holder concentration, honeypot risk.
 */
export const analyzeToken = tool({
  description:
    'Analyze a token for basic risk signals: liquidity depth, 24h volume, price stability, and whether it looks like a rug pull or honeypot. Always analyze before recommending a buy.',
  parameters: z.object({
    address: z.string().describe('Token contract address'),
    chain: z.string().describe('Chain: "ethereum", "bsc", "base", "solana" etc.'),
  }),
  execute: async ({ address, chain }) => {
    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${address}`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await res.json()
      const pair = data.pairs?.[0]

      if (!pair) {
        return {
          safe: false,
          signals: ['Token not found on any DEX — likely no liquidity'],
          recommendation: 'DO NOT BUY',
        }
      }

      const signals: string[] = []
      let riskScore = 0

      const liquidity = pair.liquidity?.usd ?? 0
      const volume24h = pair.volume?.h24 ?? 0
      const marketCap = pair.marketCap ?? 0
      const priceChange24h = pair.priceChange?.h24 ?? 0
      const age = pair.pairCreatedAt
        ? Math.floor((Date.now() - pair.pairCreatedAt) / 1000 / 60 / 60 / 24)
        : null

      // Risk signals
      if (liquidity < 10000) { signals.push(`⚠️ Very low liquidity: $${liquidity?.toLocaleString()}`); riskScore += 3 }
      else if (liquidity < 50000) { signals.push(`⚡ Low liquidity: $${liquidity?.toLocaleString()}`); riskScore += 1 }
      else signals.push(`✓ Liquidity: $${liquidity?.toLocaleString()}`)

      if (volume24h < 1000) { signals.push(`⚠️ Very low 24h volume: $${volume24h?.toLocaleString()}`); riskScore += 2 }
      else signals.push(`✓ 24h volume: $${volume24h?.toLocaleString()}`)

      if (priceChange24h > 200) { signals.push(`🚀 Parabolic move: +${priceChange24h?.toFixed(1)}% in 24h (high volatility)`); riskScore += 2 }
      else if (priceChange24h > 50) signals.push(`📈 Strong momentum: +${priceChange24h?.toFixed(1)}% in 24h`)
      else if (priceChange24h < -50) { signals.push(`📉 Dumping: ${priceChange24h?.toFixed(1)}% in 24h`); riskScore += 1 }
      else signals.push(`Price change 24h: ${priceChange24h?.toFixed(1)}%`)

      if (age !== null) {
        if (age < 1) { signals.push(`🆕 Token is less than 24 hours old — extreme risk`); riskScore += 3 }
        else if (age < 7) signals.push(`Token age: ${age} days — new`)
        else signals.push(`Token age: ${age} days`)
      }

      const safe = riskScore <= 2
      const recommendation = riskScore === 0 ? 'LOOKS REASONABLE'
        : riskScore <= 2 ? 'MODERATE RISK — small position only'
        : riskScore <= 4 ? 'HIGH RISK — only if you understand the risks'
        : 'VERY HIGH RISK — likely rug or honeypot'

      return {
        safe,
        riskScore,
        signals,
        recommendation,
        data: {
          name: pair.baseToken?.name,
          symbol: pair.baseToken?.symbol,
          priceUsd: pair.priceUsd,
          liquidity: pair.liquidity?.usd,
          marketCap,
          volume24h,
          priceChange24h,
          dexUrl: pair.url,
          pairAge: age ? `${age} days` : 'unknown',
        },
        source: 'DexScreener',
      }
    } catch (err) {
      return {
        safe: false,
        signals: [`Analysis failed: ${err instanceof Error ? err.message : 'unknown'}`],
        recommendation: 'CANNOT ANALYZE — do not buy',
      }
    }
  },
})

// ─── Policy + Payment Tools ───────────────────────────────────────────────────

/**
 * Check the agent's spending policy before any purchase.
 */
export const checkSpendingPolicy = tool({
  description:
    "Check if the agent's spending policy allows a purchase of the given USDT amount. Always call this before executePayment. Returns approved or a reason why it's blocked.",
  parameters: z.object({
    amountUSDT: z.string().describe('Amount in USDT, e.g. "2.00"'),
    purpose: z.string().describe('What the payment is for — e.g. "buy PEPE token" or "weather data"'),
  }),
  execute: async ({ amountUSDT, purpose }) => {
    // agentId is closed over from the outer scope — injected when tools are created
    return { _needsAgentId: true, amountUSDT, purpose }
  },
})

/**
 * Execute a payment — USDT transfer on BOT Chain recorded on-chain.
 */
export const executePayment = tool({
  description:
    'Execute a USDT payment on BOT Chain. Only call this after checkSpendingPolicy returns approved=true. Records the transaction on-chain and returns a transaction hash.',
  parameters: z.object({
    amountUSDT: z.string().describe('Amount in USDT'),
    recipientAddress: z.string().describe('Recipient wallet address'),
    purpose: z.string().describe('Human-readable description of what this payment is for'),
    tokenAddress: z.string().optional().describe('Token contract address if buying a specific token'),
    tokenSymbol: z.string().optional().describe('Token symbol if buying a specific token'),
  }),
  execute: async ({ amountUSDT, recipientAddress, purpose }) => {
    // agentId is closed over — injected when tools are created
    return { _needsAgentId: true, amountUSDT, recipientAddress, purpose }
  },
})

// ─── Tools factory — injects agentId into stateful tools ─────────────────────

export function makeAgentTools(agentId: string) {
  return {
    searchWeb,
    fetchPage,
    getTrendingTokens,
    getTokenPrice,
    searchTokens,
    analyzeToken,

    checkSpendingPolicy: tool({
      description: checkSpendingPolicy.description,
      parameters: z.object({
        amountUSDT: z.string().describe('Amount in USDT, e.g. "2.00"'),
        purpose: z.string().describe('What the payment is for'),
      }),
      execute: async ({ amountUSDT, purpose }) => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        if (!agent) return { approved: false, reason: 'Agent not found' }
        if (agent.status !== 'ACTIVE') return { approved: false, reason: `Agent is ${agent.status}` }

        const amountWei = BigInt(Math.round(parseFloat(amountUSDT) * 10 ** USDT_DECIMALS))
        const txLimit = BigInt(agent.transactionLimit)
        const dailyLimit = BigInt(agent.dailyLimit)

        if (amountWei > txLimit) {
          return {
            approved: false,
            reason: `$${amountUSDT} exceeds transaction limit of $${formatUnits(txLimit, USDT_DECIMALS)}`,
            transactionLimit: formatUnits(txLimit, USDT_DECIMALS),
          }
        }

        const today = new Date(); today.setHours(0, 0, 0, 0)
        const usage = await prisma.agentUsage.findUnique({
          where: { agentId_date: { agentId, date: today } },
        })
        const spentToday = BigInt(usage?.totalSpent ?? '0')

        if (spentToday + amountWei > dailyLimit) {
          return {
            approved: false,
            reason: `Would exceed daily limit of $${formatUnits(dailyLimit, USDT_DECIMALS)}. Spent today: $${formatUnits(spentToday, USDT_DECIMALS)}`,
            dailyLimit: formatUnits(dailyLimit, USDT_DECIMALS),
            spentToday: formatUnits(spentToday, USDT_DECIMALS),
          }
        }

        return {
          approved: true,
          amountUSDT,
          purpose,
          transactionLimit: formatUnits(txLimit, USDT_DECIMALS),
          dailyLimitRemaining: formatUnits(dailyLimit - spentToday, USDT_DECIMALS),
        }
      },
    }),

    executePayment: tool({
      description: executePayment.description,
      parameters: z.object({
        amountUSDT: z.string().describe('Amount in USDT'),
        recipientAddress: z.string().describe('Recipient wallet address'),
        purpose: z.string().describe('Human-readable description'),
        tokenAddress: z.string().optional().describe('Token contract address if buying a token'),
        tokenSymbol: z.string().optional().describe('Token symbol'),
      }),
      execute: async ({ amountUSDT, recipientAddress, purpose, tokenAddress, tokenSymbol }) => {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } })
        if (!agent) return { success: false, error: 'Agent not found' }

        const amountWei = BigInt(Math.round(parseFloat(amountUSDT) * 10 ** USDT_DECIMALS))

        // Create a pending transaction record
        const tx = await prisma.transaction.create({
          data: {
            agentId,
            amount: amountWei.toString(),
            token: 'USDT',
            status: 'PENDING',
            inputData: JSON.stringify({ purpose, tokenAddress, tokenSymbol, recipientAddress }),
          },
        })

        try {
          let txHash: string | null = null

          // Production path: call PaymentRouter.routePayment()
          // The router validates agent/service, then calls AgentWallet.executePayment()
          // which enforces all spending limits on-chain.
          const routerAddress = process.env.PAYMENT_ROUTER_ADDRESS
          if (agent.walletAddress && agent.blockchainAgentId != null && routerAddress) {
            const { getOperatorWallet, publicClient } = await import('./viem-server')
            const { PAYMENT_ROUTER_ABI } = await import('@/config/abis')
            const wallet = getOperatorWallet()

            // Find the matching on-chain service by blockchainServiceId
            // For general payments (not a registered service), we fall back to
            // direct AgentWallet call if routePayment isn't applicable.
            const service = await prisma.service.findFirst({
              where: { active: true, price: { lte: amountWei.toString() } },
              orderBy: { price: 'desc' },
            })

            if (service?.blockchainServiceId != null) {
              // Route through PaymentRouter — validates service + enforces limits
              const { request } = await publicClient.simulateContract({
                address: routerAddress as `0x${string}`,
                abi: PAYMENT_ROUTER_ABI,
                functionName: 'routePayment',
                args: [
                  BigInt(agent.blockchainAgentId),
                  BigInt(service.blockchainServiceId),
                  amountWei,
                ],
                account: wallet.account,
              })
              txHash = await wallet.writeContract(request)
            } else {
              // No matching registered service — call AgentWallet directly
              const { AGENT_WALLET_ABI } = await import('@/config/abis')
              const usdtAddr = (process.env.USDT_ADDRESS || '') as `0x${string}`
              const { request } = await publicClient.simulateContract({
                address: agent.walletAddress as `0x${string}`,
                abi: AGENT_WALLET_ABI,
                functionName: 'executePayment',
                args: [
                  BigInt(0),
                  recipientAddress as `0x${string}`,
                  usdtAddr,
                  amountWei,
                ],
                account: wallet.account,
              })
              txHash = await wallet.writeContract(request)
            }
          }

          // Update usage tracking
          const today = new Date(); today.setHours(0, 0, 0, 0)
          await prisma.agentUsage.upsert({
            where: { agentId_date: { agentId, date: today } },
            update: {
              totalSpent: { increment: amountWei.toString() } as never,
              transactionCount: { increment: 1 },
            },
            create: { agentId, date: today, totalSpent: amountWei.toString(), transactionCount: 1 },
          })

          await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: 'CONFIRMED', txHash, confirmedAt: new Date() },
          })

          return {
            success: true,
            txHash,
            txId: tx.id,
            amountUSDT,
            amountWei: amountWei.toString(),
            purpose,
            tokenAddress,
            tokenSymbol,
            explorerUrl: txHash
              ? `${process.env.NEXT_PUBLIC_BOT_EXPLORER}/tx/${txHash}`
              : null,
            note: txHash
              ? 'Transaction confirmed on BOT Chain'
              : 'Recorded off-chain — deploy contracts for on-chain execution',
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Payment failed'
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: 'FAILED', errorReason: error },
          })
          return { success: false, error, txId: tx.id }
        }
      },
    }),
  }
}
