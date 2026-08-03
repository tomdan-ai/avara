import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatUnits } from 'viem'
import { USDT_DECIMALS } from '@/config/chains'

/**
 * GET a payment quote — validates policy without executing.
 * Used by the frontend to show cost + policy check before confirming.
 */
export async function POST(req: NextRequest) {
  try {
    const { agentId, serviceId } = await req.json()

    const [agent, service] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agentId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ])

    if (!agent || !service) {
      return NextResponse.json({ error: 'Agent or service not found' }, { status: 404 })
    }

    const priceWei = BigInt(service.price)
    const txLimitWei = BigInt(agent.transactionLimit)
    const dailyLimitWei = BigInt(agent.dailyLimit)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const usage = await prisma.agentUsage.findUnique({
      where: { agentId_date: { agentId, date: today } },
    })
    const spentToday = BigInt(usage?.totalSpent || '0')

    const checks = {
      agentActive: agent.status === 'ACTIVE',
      withinTxLimit: priceWei <= txLimitWei,
      withinDailyLimit: spentToday + priceWei <= dailyLimitWei,
    }

    const approved = Object.values(checks).every(Boolean)

    let rejectionReason: string | null = null
    if (!checks.agentActive) rejectionReason = `Agent is ${agent.status}`
    else if (!checks.withinTxLimit)
      rejectionReason = `$${formatUnits(priceWei, USDT_DECIMALS)} exceeds transaction limit of $${formatUnits(txLimitWei, USDT_DECIMALS)}`
    else if (!checks.withinDailyLimit)
      rejectionReason = `Would exceed daily limit of $${formatUnits(dailyLimitWei, USDT_DECIMALS)}`

    return NextResponse.json({
      approved,
      rejectionReason,
      quote: {
        service: { id: service.id, name: service.name },
        priceUSDT: formatUnits(priceWei, USDT_DECIMALS),
        priceRaw: service.price,
        agentBalance: null, // populated by client via on-chain read
        spentTodayUSDT: formatUnits(spentToday, USDT_DECIMALS),
        dailyLimitUSDT: formatUnits(dailyLimitWei, USDT_DECIMALS),
        txLimitUSDT: formatUnits(txLimitWei, USDT_DECIMALS),
      },
      checks,
    })
  } catch (error) {
    console.error('[POST /api/payments/quote]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
