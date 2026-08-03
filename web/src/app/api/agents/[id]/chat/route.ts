import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { makeTools } from '@/lib/ai-tools'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'

interface Context {
  params: Promise<{ id: string }>
}

const MessageSchema = z.object({
  message: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params

  try {
    const body = await req.json()
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (agent.status !== 'ACTIVE') {
      return NextResponse.json({
        response: `This agent is currently ${agent.status.toLowerCase()} and cannot process requests.`,
        steps: [],
      })
    }

    // Build the LLM client — supports OpenRouter and direct OpenAI
    const apiKey = process.env.AI_API_KEY
    const model = process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free'
    const provider = process.env.AI_PROVIDER || 'openrouter'

    if (!apiKey) {
      // Fallback demo response when no API key is configured
      return NextResponse.json(demoResponse(parsed.data.message, agent.name))
    }

    // OpenRouter is OpenAI-compatible — just override the base URL
    const openai = createOpenAI({
      apiKey,
      baseURL:
        provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1'
          : 'https://api.openai.com/v1',
      headers:
        provider === 'openrouter'
          ? {
              'HTTP-Referer': 'https://avara.app',
              'X-Title': 'Avara',
            }
          : {},
    })
    const tools = makeTools(id)

    const systemPrompt = agent.systemPrompt || buildDefaultSystemPrompt(agent)

    const { text, steps: toolSteps } = await generateText({
      model: openai(model),
      system: systemPrompt,
      prompt: parsed.data.message,
      tools,
      maxSteps: 10,
    })

    // Extract structured step data from tool calls
    const uiSteps = buildUiSteps(toolSteps)

    // Find the most recent confirmed payment in the steps
    const paymentResult = extractPaymentResult(toolSteps)

    return NextResponse.json({
      response: text,
      steps: uiSteps,
      txHash: paymentResult?.txHash || null,
      amount: paymentResult?.amountRaw || null,
      error: paymentResult?.error || null,
    })
  } catch (error) {
    console.error('[POST /api/agents/:id/chat]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildDefaultSystemPrompt(agent: { name: string; transactionLimit: string; dailyLimit: string }) {
  const { formatUnits } = require('viem')
  const txLimit = formatUnits(BigInt(agent.transactionLimit), 6)
  const dailyLimit = formatUnits(BigInt(agent.dailyLimit), 6)

  return `You are ${agent.name}, an autonomous AI agent with a programmable wallet on BOT Chain.

Your capabilities:
- Search the Avara service registry for data services (weather, market data, translation, etc.)
- Check your spending policy before any payment
- Execute USDT payments autonomously using your on-chain wallet
- Report results clearly to the user

Your spending policy (enforced by smart contract — you cannot override these):
- Maximum per transaction: $${txLimit} USDT
- Maximum daily spend: $${dailyLimit} USDT

Workflow for any task requiring a service:
1. Call searchServices() to find relevant services
2. Call checkPolicy() to verify the payment is within limits
3. If approved: call requestPayment() to execute the payment
4. If rejected: explain the limit that was exceeded — do NOT attempt to work around it
5. Return the result to the user

Be transparent about what you're doing. When a payment is blocked, explain exactly why.
Keep responses concise and factual.`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildUiSteps(toolSteps: any[]): Array<{ label: string; status: string; detail?: string }> {
  const uiSteps: Array<{ label: string; status: string; detail?: string }> = []

  for (const step of toolSteps) {
    for (const tc of step.toolCalls ?? []) {
      const result = step.toolResults?.find((r: { toolCallId: string }) => r.toolCallId === tc.toolCallId)
      const output = result?.result

      switch (tc.toolName) {
        case 'searchServices':
          uiSteps.push({
            label: output?.found
              ? `✓ Found: ${output.services[0]?.name}`
              : 'No matching services found',
            status: output?.found ? 'done' : 'error',
            detail: output?.services[0]
              ? `$${output.services[0].priceUSDT}/request`
              : undefined,
          })
          break

        case 'getAgentBalance':
          uiSteps.push({
            label: `Balance: ${output?.balanceUSDT ?? '—'} USDT`,
            status: 'done',
          })
          break

        case 'checkPolicy':
          uiSteps.push({
            label: output?.approved ? '✓ Policy approved' : `✗ Policy rejected`,
            status: output?.approved ? 'done' : 'error',
            detail: output?.approved ? undefined : output?.reason,
          })
          break

        case 'requestPayment':
          uiSteps.push({
            label: output?.success ? `⛓ Payment confirmed` : `✗ Payment failed`,
            status: output?.success ? 'done' : 'error',
            detail: output?.success
              ? `$${output.amountPaid} USDT`
              : output?.error,
          })
          break
      }
    }
  }

  return uiSteps
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPaymentResult(toolSteps: any[]) {
  for (const step of toolSteps) {
    for (const result of step.toolResults ?? []) {
      if (result.result?.success && result.result?.txHash !== undefined) {
        return result.result
      }
      if (result.result?.success === false && result.result?.error) {
        return result.result
      }
    }
  }
  return null
}

/**
 * Demo response used when no AI API key is configured.
 * Shows the full agent flow for demonstration purposes.
 */
function demoResponse(message: string, agentName: string) {
  const lower = message.toLowerCase()

  if (lower.includes('weather')) {
    const city = message.match(/in ([A-Z][a-z]+)/)?.[1] || 'Lagos'
    return {
      response: `${city}: 27°C, Partly cloudy, 81% humidity. Light winds from the southwest at 12 km/h.`,
      steps: [
        { label: '🔎 Searching services...', status: 'done' },
        { label: '✓ Weather Agent found', status: 'done', detail: '$0.02/request' },
        { label: '✓ Policy approved', status: 'done' },
        { label: '⛓ Payment confirmed on BOT Chain', status: 'done', detail: '$0.02 USDT' },
      ],
      txHash: null,
      amount: '20000',
      error: null,
    }
  }

  if (lower.includes('bitcoin') || lower.includes('price') || lower.includes('market')) {
    return {
      response: 'Bitcoin (BTC): $67,420.00 USD — up 2.3% in the last 24 hours.',
      steps: [
        { label: '🔎 Searching services...', status: 'done' },
        { label: '✓ Market Data Agent found', status: 'done', detail: '$0.05/request' },
        { label: '✓ Policy approved', status: 'done' },
        { label: '⛓ Payment confirmed on BOT Chain', status: 'done', detail: '$0.05 USDT' },
      ],
      txHash: null,
      amount: '50000',
      error: null,
    }
  }

  if (lower.includes('$5') || lower.includes('5 usdt') || lower.includes('expensive')) {
    return {
      response:
        'I cannot process this payment. The requested amount exceeds my transaction limit.',
      steps: [
        { label: '🔎 Searching services...', status: 'done' },
        { label: '✗ Policy rejected', status: 'error', detail: '$5.00 exceeds $2.00 transaction limit' },
      ],
      txHash: null,
      amount: null,
      error: 'Payment of $5.00 exceeds the agent\'s transaction limit of $2.00.',
    }
  }

  return {
    response: `I'm ${agentName}. To enable live AI responses, add your AI_API_KEY to the environment variables. I can search services, check policies, and execute on-chain payments autonomously.`,
    steps: [],
    txHash: null,
    amount: null,
    error: null,
  }
}
