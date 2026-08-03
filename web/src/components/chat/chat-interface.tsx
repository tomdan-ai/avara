'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Send,
  User,
  Search,
  CheckCircle2,
  DollarSign,
  Shield,
  Link2,
  Loader2,
  ArrowLeft,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { explorerTxUrl, formatUSDT } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  status: string
}

interface StepItem {
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
  detail?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: StepItem[]
  txHash?: string
  amount?: string
  error?: string
}

const STEP_ICONS = {
  search: Search,
  found: CheckCircle2,
  cost: DollarSign,
  policy: Shield,
  payment: Link2,
  error: XCircle,
}

export function ChatInterface({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi, I'm ${agent.name}. Tell me what you need and I'll find the right service and handle the payment automatically.`,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Add a placeholder assistant message with live steps
    const assistantId = (Date.now() + 1).toString()
    const placeholderSteps: StepItem[] = [
      { label: 'Searching services...', status: 'active' },
      { label: 'Checking price', status: 'pending' },
      { label: 'Validating policy', status: 'pending' },
      { label: 'Executing payment', status: 'pending' },
    ]
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', steps: placeholderSteps },
    ])

    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m
          return {
            ...m,
            content: data.response || '',
            steps: data.steps || [],
            txHash: data.txHash,
            amount: data.amount,
            error: data.error,
          }
        })
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m
          return {
            ...m,
            content: 'Something went wrong. Please try again.',
            steps: [],
            error: 'Request failed',
          }
        })
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link href={`/agents/${agent.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20">
          <Bot className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{agent.name}</h2>
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                agent.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-zinc-500'
              )}
            />
            <span className="text-xs text-zinc-500">{agent.status}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 pr-2">
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${agent.name} something...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          The agent will autonomously discover services and execute payments within its spending policy.
        </p>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[75%] items-end gap-2">
          <div className="chat-bubble-user">{message.content}</div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-600/20">
            <User className="h-3.5 w-3.5 text-violet-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700">
        <Bot className="h-3.5 w-3.5 text-zinc-300" />
      </div>
      <div className="max-w-[80%] space-y-3">
        {/* Execution steps */}
        {message.steps && message.steps.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 space-y-2">
            {message.steps.map((step, i) => (
              <StepRow key={i} step={step} />
            ))}
          </div>
        )}

        {/* Main response */}
        {message.content && (
          <div className="chat-bubble-agent">{message.content}</div>
        )}

        {/* Transaction confirmation */}
        {message.txHash && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Payment confirmed on BOT Chain
              {message.amount && (
                <span className="ml-1 font-mono">{formatUSDT(message.amount)}</span>
              )}
            </div>
            <a
              href={explorerTxUrl(message.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
            >
              View transaction →
            </a>
          </div>
        )}

        {/* Payment blocked */}
        {message.error && !message.txHash && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-red-400">
              <XCircle className="h-3.5 w-3.5" />
              Payment blocked
            </div>
            <p className="mt-1 text-xs text-zinc-400">{message.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StepRow({ step }: { step: StepItem }) {
  const isActive = step.status === 'active'
  const isDone = step.status === 'done'
  const isError = step.status === 'error'
  const isPending = step.status === 'pending'

  return (
    <div
      className={cn(
        'step-item',
        isDone && 'done',
        isActive && 'active',
        isError && 'text-red-400',
        isPending && 'opacity-40'
      )}
    >
      {isActive ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isDone ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isError ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <div className="h-3 w-3 rounded-full border border-current opacity-40" />
      )}
      <span>{step.label}</span>
      {step.detail && <span className="ml-1 opacity-70">{step.detail}</span>}
    </div>
  )
}
