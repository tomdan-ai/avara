import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseUSDT } from '@/lib/utils'
import { z } from 'zod'

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(50),
  transactionLimitUSD: z.string(),
  dailyLimitUSD: z.string(),
  systemPrompt: z.string().optional(),
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, transactionLimitUSD, dailyLimitUSD, systemPrompt, walletAddress } = parsed.data

    // Upsert user by wallet address
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    })

    const agent = await prisma.agent.create({
      data: {
        name,
        ownerId: user.id,
        transactionLimit: parseUSDT(transactionLimitUSD),
        dailyLimit: parseUSDT(dailyLimitUSD),
        systemPrompt: systemPrompt || null,
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('[POST /api/agents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { transactions: true } } },
    })
    return NextResponse.json(agents)
  } catch (error) {
    console.error('[GET /api/agents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
