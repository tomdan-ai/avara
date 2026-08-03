import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseUSDT } from '@/lib/utils'
import { z } from 'zod'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { service: true },
        },
      },
    })
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(agent)
  } catch (error) {
    console.error('[GET /api/agents/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  transactionLimitUSD: z.string().optional(),
  dailyLimitUSD: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'INACTIVE']).optional(),
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  blockchainAgentId: z.number().optional(),
})

export async function PATCH(req: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const body = await req.json()
    const parsed = UpdateAgentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { transactionLimitUSD, dailyLimitUSD, ...rest } = parsed.data
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...rest,
        ...(transactionLimitUSD && { transactionLimit: parseUSDT(transactionLimitUSD) }),
        ...(dailyLimitUSD && { dailyLimit: parseUSDT(dailyLimitUSD) }),
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('[PATCH /api/agents/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
