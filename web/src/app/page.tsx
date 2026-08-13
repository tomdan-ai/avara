import Link from 'next/link'
import { Bot, Shield, Zap, ArrowRight, GitBranch, ChevronRight } from 'lucide-react'

const steps = [
  { label: 'Create Agent', description: 'Deploy an AI agent with a programmable wallet' },
  { label: 'Fund Agent', description: 'Deposit USDT into the agent wallet' },
  { label: 'Set Policy', description: 'Define transaction and daily spending limits' },
  { label: 'Agent Discovers Service', description: 'AI searches the on-chain service registry' },
  { label: 'Agent Pays', description: 'Payment request checked against policy' },
  { label: 'BOT Chain Settlement', description: 'USDT transferred, transaction confirmed on-chain' },
]

const features = [
  {
    icon: Bot,
    title: 'Programmable Agent Wallets',
    description:
      'Every agent gets its own on-chain wallet. Fund it with USDT and the agent can transact autonomously — without ever touching your main wallet.',
  },
  {
    icon: Shield,
    title: 'Enforceable Spending Policies',
    description:
      'Set per-transaction and daily limits. Smart contracts enforce them. The AI cannot override them — ever.',
  },
  {
    icon: Zap,
    title: 'On-Chain Service Discovery',
    description:
      'Agents discover and purchase services registered on BOT Chain. Every payment is transparent and verifiable on the explorer.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      {/* Navbar */}
      <header className="border-b-2 border-zinc-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-violet-400 bg-violet-600 nb-shadow-sm">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-lg font-black uppercase tracking-tight">Avara</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/tomdan-ai/avara"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-press flex items-center gap-2 rounded-lg border-2 border-zinc-700 bg-[var(--surface)] px-4 py-2 text-sm font-bold text-zinc-200 nb-shadow-sm"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
            <Link
              href="/dashboard"
              className="nb-press flex items-center gap-2 rounded-lg border-2 border-violet-400 bg-violet-600 px-4 py-2 text-sm font-bold text-white nb-shadow-sm"
            >
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-28 text-center sm:px-6 lg:px-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-violet-500/50 bg-violet-500/10 px-4 py-1.5 text-sm font-bold text-violet-300">
            <Zap className="h-3.5 w-3.5" />
            Built on BOT Chain · BOT Chain Africa Pioneer Builder Challenge
          </div>

          <h1 className="mb-6 text-5xl font-black uppercase leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Give AI Agents the
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              Power to Transact.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400">
            Programmable wallets and autonomous payments for AI agents on BOT Chain.
            The AI proposes. Policy authorizes. Blockchain enforces.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="nb-press flex items-center gap-2 rounded-lg border-2 border-violet-400 bg-violet-600 px-6 py-3 text-base font-bold text-white nb-shadow"
            >
              Launch Avara
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/tomdan-ai/avara"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-press flex items-center gap-2 rounded-lg border-2 border-zinc-700 bg-[var(--surface)] px-6 py-3 text-base font-bold text-zinc-200 nb-shadow"
            >
              <GitBranch className="h-5 w-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t-2 border-zinc-800 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-violet-400">
            How it works
          </h2>
          <h3 className="mb-16 text-center text-3xl font-black uppercase tracking-tight">From question to on-chain payment</h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.label}
                className="nb-press rounded-lg border-2 border-zinc-700 bg-[var(--surface)] p-6 nb-shadow hover:border-violet-400"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md border-2 border-violet-400 bg-violet-600/25 text-sm font-black text-violet-300">
                  {i + 1}
                </div>
                <h4 className="mb-1 font-bold text-white">{step.label}</h4>
                <p className="text-sm text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t-2 border-zinc-800 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-violet-400">
            Architecture
          </h2>
          <h3 className="mb-16 text-center text-3xl font-black uppercase tracking-tight">
            AI autonomy with blockchain-enforced safety
          </h3>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-violet-400 bg-violet-600/25 nb-shadow-sm">
                  <Icon className="h-6 w-6 text-violet-300" />
                </div>
                <h4 className="text-lg font-bold">{title}</h4>
                <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security callout */}
      <section className="border-t-2 border-zinc-800 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border-2 border-violet-500/50 bg-violet-500/10 p-10 text-center nb-shadow-violet">
          <Shield className="mx-auto mb-4 h-12 w-12 text-violet-400" />
          <h3 className="mb-4 text-2xl font-black uppercase tracking-tight">
            AI proposes. Policy authorizes. Blockchain enforces.
          </h3>
          <p className="mb-8 text-zinc-400">
            Agents can&apos;t override transaction limits, daily limits, or approved providers.
            Every policy is enforced at the smart contract level — not in application code.
          </p>
          <Link
            href="/agents/new"
            className="nb-press inline-flex items-center gap-2 rounded-lg border-2 border-violet-400 bg-violet-600 px-6 py-3 text-sm font-bold text-white nb-shadow"
          >
            Create your first agent
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-zinc-800 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-zinc-500">
          <span>Avara · BOT Chain Africa Pioneer Builder Challenge 2026</span>
          <a
            href={process.env.NEXT_PUBLIC_BOT_EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-zinc-300"
          >
            BOT Chain Explorer →
          </a>
        </div>
      </footer>
    </div>
  )
}
