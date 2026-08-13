'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { explorerTxUrl } from '@/lib/utils'
import {
  ArrowLeft, Bot, CheckCircle2, ExternalLink, Loader2,
  Search, Send, Shield, TrendingUp, User, XCircle,
  Globe, BarChart2, Zap, AlertTriangle, Sparkles,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent { id: string; name: string; status: string }

type StepType =
  | 'search'   | 'fetch'    | 'trending' | 'price'
  | 'tokens'   | 'analyze'  | 'policy'   | 'payment'
  | 'thinking' | 'error'

interface Step {
  id: string
  type: StepType
  status: 'running' | 'done' | 'error'
  label: string
  detail?: string
  data?: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps: Step[]
  txHash?: string | null
  txId?: string | null
  explorerUrl?: string | null
  blocked?: string | null
  isStreaming?: boolean
}

// ─── Tool → Step metadata ─────────────────────────────────────────────────────

const TOOL_META: Record<string, { icon: React.ElementType; label: (args: Record<string, unknown>) => string }> = {
  searchWeb:           { icon: Search,     label: (a) => `Searching web: "${a.query}"` },
  fetchPage:           { icon: Globe,      label: (a) => `Reading: ${String(a.url).replace(/^https?:\/\//, '').slice(0, 50)}` },
  getTrendingTokens:   { icon: TrendingUp, label: (a) => `Fetching trending tokens${a.chain ? ` on ${a.chain}` : ''}` },
  getTokenPrice:       { icon: BarChart2,  label: (a) => `Getting price: ${a.identifier}` },
  searchTokens:        { icon: Search,     label: (a) => `Searching tokens: "${a.query}"` },
  analyzeToken:        { icon: Shield,     label: (a) => `Analyzing token: ${a.address?.toString().slice(0, 10)}...` },
  checkSpendingPolicy: { icon: Shield,     label: (a) => `Checking policy: $${a.amountUSDT} USDT` },
  executePayment:      { icon: Zap,        label: (a) => `Executing payment: $${a.amountUSDT} USDT` },
}

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What meme coins are trending right now?",
  "Find me a token with momentum under $5M market cap",
  "What's the current price of PEPE and BONK?",
  "Search for new meme coin launches today",
  "Buy $1 worth of a trending token if it looks safe",
]

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatInterface({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I'm ${agent.name}. I can browse the internet, research tokens, analyze market data, and execute payments on BOT Chain — all within my spending policy. What do you need?`,
      steps: [],
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(0)
  const nextId = () => `m${(idCounter.current += 1)}`
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)

    const userMsg: Message = { id: nextId(), role: 'user', content: text, steps: [] }
    const assistantId = nextId()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      steps: [],
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: err.error ?? 'Something went wrong.', isStreaming: false }
              : m
          )
        )
        return
      }

      await consumeStream(res.body, assistantId)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Connection lost. Please try again.', isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Consume the Vercel AI SDK data stream.
   * Parts: 0:text  2:data  3:error  8:message_annotations  9:tool_call  a:tool_result  b:finish
   */
  const consumeStream = async (body: ReadableStream, assistantId: string) => {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const patch = (fn: (m: Message) => Message) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)))

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const colonIdx = line.indexOf(':')
          if (colonIdx === -1) continue

          const code = line.slice(0, colonIdx)
          const raw = line.slice(colonIdx + 1)

          // 0: text delta
          if (code === '0') {
            try {
              const text = JSON.parse(raw)
              patch((m) => ({ ...m, content: m.content + text }))
            } catch {}
            continue
          }

          let payload: Record<string, unknown>
          try { payload = JSON.parse(raw) } catch { continue }

          // 9: tool call started
          if (code === '9') {
            const toolName = payload.toolName as string
            const args = (payload.args ?? payload.input ?? {}) as Record<string, unknown>
            const meta = TOOL_META[toolName]
            const stepId = `step-${toolName}-${Date.now()}`

            patch((m) => ({
              ...m,
              steps: [
                ...m.steps,
                {
                  id: stepId,
                  type: toolNameToType(toolName),
                  status: 'running',
                  label: meta?.label(args) ?? toolName,
                },
              ],
            }))
          }

          // a: tool result
          if (code === 'a') {
            const toolName = payload.toolName as string
            const result = (payload.result ?? {}) as Record<string, unknown>

            patch((m) => {
              // Update the last step for this tool
              const steps = [...m.steps]
              const idx = [...steps].reverse().findIndex((s) => s.type === toolNameToType(toolName))
              if (idx !== -1) {
                const realIdx = steps.length - 1 - idx
                const detail = buildStepDetail(toolName, result)
                const isError = result.success === false || result.approved === false || result.found === false
                steps[realIdx] = {
                  ...steps[realIdx],
                  status: isError ? 'error' : 'done',
                  detail,
                  data: result,
                }
              }

              // Extract payment result
              let txHash = m.txHash
              let txId = m.txId
              let explorerUrl = m.explorerUrl
              let blocked = m.blocked

              if (toolName === 'executePayment') {
                if (result.success) {
                  txHash = (result.txHash as string) ?? null
                  txId = result.txId as string
                  explorerUrl = (result.explorerUrl as string) ?? null
                } else {
                  blocked = result.error as string
                }
              }

              if (toolName === 'checkSpendingPolicy' && result.approved === false) {
                blocked = result.reason as string
              }

              return { ...m, steps, txHash, txId, explorerUrl, blocked }
            })
          }

          // b: finish / e: error
          if (code === 'b' || code === 'e') {
            patch((m) => ({ ...m, isStreaming: false }))
          }

          // 3: stream error
          if (code === '3') {
            const errText = typeof payload === 'string' ? payload : JSON.stringify(payload)
            patch((m) => ({
              ...m,
              content: m.content || `Error: ${errText}`,
              isStreaming: false,
            }))
          }
        }
      }
    } finally {
      patch((m) => ({ ...m, isStreaming: false }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link href={`/agents/${agent.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20">
          <Bot className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{agent.name}</h2>
          <div className="flex items-center gap-1.5">
            <div className={cn('h-1.5 w-1.5 rounded-full', agent.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-500')} />
            <span className="text-xs text-zinc-500">{agent.status}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          <Globe className="h-3 w-3" /> Live internet access
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="space-y-8">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Try asking
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isLoading}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tell ${agent.name} what to do...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Agent browses the internet, analyzes data, and executes payments within its spending policy.
        </p>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[75%] items-end gap-2">
          <div className="rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white">
            {message.content}
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-600/20">
            <User className="h-3.5 w-3.5 text-violet-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800">
        <Bot className="h-3.5 w-3.5 text-zinc-300" />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {/* Live steps — the agent's working process */}
        {message.steps.length > 0 && (
          <div className="space-y-1.5 rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Working</p>
            {message.steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* Streaming indicator — no content yet */}
        {message.isStreaming && !message.content && message.steps.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
          </div>
        )}

        {/* Agent's response text */}
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
            <StreamingText text={message.content} isStreaming={!!message.isStreaming} />
          </div>
        )}

        {/* Payment confirmed */}
        {message.txHash && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Payment confirmed on BOT Chain
            </div>
            {message.explorerUrl && (
              <a
                href={message.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
              >
                <ExternalLink className="h-3 w-3" />
                View transaction on explorer
              </a>
            )}
            {!message.explorerUrl && message.txHash && (
              <a
                href={explorerTxUrl(message.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
              >
                <ExternalLink className="h-3 w-3" />
                {message.txHash.slice(0, 20)}...{message.txHash.slice(-8)}
              </a>
            )}
          </div>
        )}

        {/* Payment recorded (no contracts deployed) */}
        {message.txId && !message.txHash && !message.blocked && (
          <div className="rounded-xl border border-zinc-500/30 bg-zinc-800/50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-zinc-400" />
              Transaction recorded
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Deploy contracts to BOT Chain for on-chain execution and a real TX hash.
            </p>
          </div>
        )}

        {/* Payment blocked by policy */}
        {message.blocked && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Payment blocked by policy
            </div>
            <p className="mt-1 text-xs text-zinc-400">{message.blocked}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step row ─────────────────────────────────────────────────────────────────

function StepRow({ step }: { step: Step }) {
  const meta = TOOL_META[typeToToolName(step.type)]
  const Icon = meta?.icon ?? Zap

  return (
    <div className={cn(
      'flex items-start gap-2.5 text-xs',
      step.status === 'running' && 'text-violet-300',
      step.status === 'done' && 'text-zinc-400',
      step.status === 'error' && 'text-red-400',
    )}>
      <div className="mt-0.5 flex-shrink-0">
        {step.status === 'running' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : step.status === 'done' ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-medium">{step.label}</span>
        {step.detail && (
          <span className={cn('ml-2', step.status === 'done' ? 'text-zinc-500' : 'text-red-400')}>
            — {step.detail}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Streaming text with cursor ───────────────────────────────────────────────

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {text}
      {isStreaming && (
        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-violet-400 align-middle" />
      )}
    </span>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toolNameToType(toolName: string): StepType {
  const map: Record<string, StepType> = {
    searchWeb: 'search',
    fetchPage: 'fetch',
    getTrendingTokens: 'trending',
    getTokenPrice: 'price',
    searchTokens: 'tokens',
    analyzeToken: 'analyze',
    checkSpendingPolicy: 'policy',
    executePayment: 'payment',
  }
  return map[toolName] ?? 'thinking'
}

function typeToToolName(type: StepType): string {
  const map: Record<StepType, string> = {
    search: 'searchWeb',
    fetch: 'fetchPage',
    trending: 'getTrendingTokens',
    price: 'getTokenPrice',
    tokens: 'searchTokens',
    analyze: 'analyzeToken',
    policy: 'checkSpendingPolicy',
    payment: 'executePayment',
    thinking: 'searchWeb',
    error: 'searchWeb',
  }
  return map[type]
}

function buildStepDetail(toolName: string, result: Record<string, unknown>): string {
  switch (toolName) {
    case 'searchWeb':
      return result.found
        ? `${(result.results as unknown[])?.length ?? 0} results`
        : 'No results'
    case 'fetchPage':
      return result.error
        ? String(result.error).slice(0, 60)
        : `${result.length ?? 0} chars read`
    case 'getTrendingTokens':
      return result.found
        ? `${(result.tokens as unknown[])?.length ?? 0} tokens found`
        : 'No trending tokens'
    case 'getTokenPrice':
      return result.found
        ? `${result.symbol}: $${result.priceUsd}`
        : (result.error as string) ?? 'Not found'
    case 'searchTokens':
      return result.found
        ? `${(result.tokens as unknown[])?.length ?? 0} tokens`
        : 'No tokens found'
    case 'analyzeToken':
      return (result.recommendation as string) ?? ''
    case 'checkSpendingPolicy':
      return result.approved ? 'Approved' : `Blocked: ${result.reason}`
    case 'executePayment':
      return result.success
        ? `$${result.amountUSDT} sent${result.txHash ? ' · TX confirmed' : ' · recorded'}`
        : `Failed: ${result.error}`
    default:
      return ''
  }
}
