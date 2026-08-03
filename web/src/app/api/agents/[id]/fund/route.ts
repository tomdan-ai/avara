import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const { amount, txHash } = await req.json()

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Record the deposit as a transaction
    const tx = await prisma.transaction.create({
      data: {
        agentId: id,
        amount: amount.toString(),
        token: 'USDT',
        txHash: txHash || null,
        status: txHash ? 'CONFIRMED' : 'PENDING',
        confirmedAt: txHash ? new Date() : null,
      },
    })

    return NextResponse.json(tx)
  } catch (error) {
    console.error('[POST /api/agents/:id/fund]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
