import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicClient } from '@/lib/viem-server'

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agent: true, service: true },
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
