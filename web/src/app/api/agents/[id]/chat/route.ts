import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { makeAgentTools } from '@/lib/agent-tools'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { formatUnits } from 'viem'
import { z } from 'zod'

interface Context {
  params: Promise<{ id: string }>
}

const MessageSchema = z.object({
  message: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params

  const body = await req.json()
  const parsed = MessageSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid message' }), { status: 400 })
  }

  const agent = await prisma.agent.findUnique({ where: { id } })
  if (!agent) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404 })
  }

  if (agent.status !== 'ACTIVE') {
    return new Response(
      JSON.stringify({
        error: `Agent is ${agent.status.toLowerCase()} and cannot process requests.`,
      }),
      { status: 400 }
    )
  }

  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free'
  const provider = process.env.AI_PROVIDER || 'openrouter'

  if (!apiKey) {
    // No API key — return a helpful error as a stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const msg = '0:"No AI_API_KEY configured. Add your OpenRouter key to .env.local to enable the agent."\n'
        controller.enqueue(encoder.encode(msg))
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }

  const openai = createOpenAI({
    apiKey,
    baseURL:
      provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1'
        : 'https://api.openai.com/v1',
    headers:
      provider === 'openrouter'
        ? { 'HTTP-Referer': 'https://avara.app', 'X-Title': 'Avara' }
        : {},
  })

  const tools = makeAgentTools(id)

  const result = streamText({
    model: openai(model),
    system: buildSystemPrompt(agent),
    prompt: parsed.data.message,
    tools,
    maxSteps: 15,
    onStepFinish: async ({ stepType, toolCalls, toolResults }) => {
      // Log tool calls to the database for auditing
      if (stepType === 'tool-result') {
        console.log(
          '[agent]',
          toolCalls?.map((tc) => tc.toolName).join(', ')
        )
      }
    },
  })

  // Return the Vercel AI SDK data stream — the client reads this with useChat / processDataStream
  return result.toDataStreamResponse({
    headers: {
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

function buildSystemPrompt(agent: {
  name: string
  transactionLimit: string
  dailyLimit: string
  systemPrompt?: string | null
}) {
  const txLimit = formatUnits(BigInt(agent.transactionLimit), 6)
  const dailyLimit = formatUnits(BigInt(agent.dailyLimit), 6)

  const base = `You are ${agent.name}, an autonomous AI agent with a programmable on-chain wallet on BOT Chain.

You can browse the internet, research tokens, analyze markets, and execute real USDT payments on-chain.

## Your capabilities
- **searchWeb** — search the internet for real-time news, token alpha, trending meme coins
- **fetchPage** — read the content of any web page URL
- **getTrendingTokens** — get what's trending on DexScreener right now
- **getTokenPrice** — get live price, market cap, volume for any token
- **searchTokens** — find tokens by name or keyword on DexScreener
- **analyzeToken** — assess a token's risk: liquidity, age, red flags
- **checkSpendingPolicy** — verify a payment is within your limits BEFORE executing
- **executePayment** — send USDT on BOT Chain (records transaction hash)

## Spending policy (enforced by smart contract — you cannot override this)
- Maximum per transaction: $${txLimit} USDT
- Maximum daily spend: $${dailyLimit} USDT

## How to work
Think step by step. Show your reasoning. When the user asks you to find something or buy something:

1. **Research first** — use searchWeb, getTrendingTokens, getTokenPrice to understand the landscape
2. **Analyze** — use analyzeToken to check for risks before any purchase
3. **Check policy** — ALWAYS call checkSpendingPolicy before executePayment
4. **Decide** — explain your reasoning clearly. If something is too risky, say so.
5. **Execute** — if approved and risk is acceptable, executePayment
6. **Report** — summarize what you found, what you decided, and why

## Tone
Be direct, analytical, and transparent. Think out loud. When you search, say what you found. When you analyze, share the signals. When you're uncertain, say so. You are not a trading advisor — you are an autonomous agent carrying out instructions within defined limits.

## Important rules
- NEVER skip checkSpendingPolicy before executePayment
- If a payment is blocked by policy, explain exactly why and do NOT attempt workarounds
- Always analyze a token before recommending a purchase
- Be honest about risk — meme coins are highly speculative
- If you can't find reliable data, say so rather than guessing`

  return agent.systemPrompt ? `${base}\n\n## Custom instructions\n${agent.systemPrompt}` : base
}
