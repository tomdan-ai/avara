import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceUSDT: z.string(),
  providerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  endpoint: z.string().url().or(z.string().startsWith('builtin://')),
  blockchainServiceId: z.number().optional(),
})

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { transactions: { where: { status: 'CONFIRMED' } } } },
      },
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('[GET /api/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateServiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { priceUSDT, ...rest } = parsed.data
    const priceWei = BigInt(Math.round(parseFloat(priceUSDT) * 10 ** 6)).toString()

    const service = await prisma.service.create({
      data: { ...rest, price: priceWei },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('[POST /api/services]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
