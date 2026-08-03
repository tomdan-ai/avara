import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicClient } from '@/lib/viem-server'

interface Context {
  params: Promise<{ hash: string }>
}

export async function GET(_req: NextRequest, { params }: Context) {
  const { hash } = await params
  try {
    // Check the database first
    const tx = await prisma.transaction.findFirst({
      where: { OR: [{ id: hash }, { txHash: hash }] },
      include: { agent: true, service: true },
    })

    if (!tx) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If pending and has a txHash, check on-chain status
    if (tx.status === 'PENDING' && tx.txHash) {
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: tx.txHash as `0x${string}`,
        })
        if (receipt?.status === 'success') {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
          })
          return NextResponse.json({ ...tx, status: 'CONFIRMED', receipt })
        }
      } catch {
        // Transaction not yet mined — return current state
      }
    }

    return NextResponse.json(tx)
  } catch (error) {
    console.error('[GET /api/transactions/:hash]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
