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
    const txLimitWei = parseUSDT(transactionLimitUSD)
    const dailyLimitWei = parseUSDT(dailyLimitUSD)

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    })

    // Create the DB record first (we'll update it with on-chain data after)
    const agent = await prisma.agent.create({
      data: {
        name,
        ownerId: user.id,
        transactionLimit: txLimitWei,
        dailyLimit: dailyLimitWei,
        systemPrompt: systemPrompt || null,
        status: 'ACTIVE',
      },
    })

    // If contracts are deployed, create the agent on-chain
    const registryAddress = process.env.AGENT_REGISTRY_ADDRESS
    if (registryAddress) {
      try {
        const { getOperatorWallet, publicClient } = await import('@/lib/viem-server')
        const { AGENT_REGISTRY_ABI } = await import('@/config/abis')

        const wallet = getOperatorWallet()

        // Simulate first to surface any revert reason
        const { request } = await publicClient.simulateContract({
          address: registryAddress as `0x${string}`,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'createAgent',
          args: [name, BigInt(dailyLimitWei), BigInt(txLimitWei)],
          account: wallet.account,
        })

        const txHash = await wallet.writeContract(request)

        // Wait for receipt and extract agentId + wallet address from the AgentCreated event
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        // Parse the AgentCreated event from the receipt logs
        let blockchainAgentId: number | null = null
        let agentWalletAddress: string | null = null

        for (const log of receipt.logs) {
          // AgentCreated topic: keccak256("AgentCreated(uint256,address,address,string)")
          if (log.address.toLowerCase() === registryAddress.toLowerCase()) {
            try {
              const { decodeEventLog } = await import('viem')
              const decoded = decodeEventLog({
                abi: AGENT_REGISTRY_ABI,
                data: log.data,
                topics: log.topics,
                eventName: 'AgentCreated',
              })
              blockchainAgentId = Number((decoded.args as { agentId: bigint }).agentId)
              agentWalletAddress = (decoded.args as { wallet: string }).wallet
              break
            } catch {
              // not the AgentCreated log — skip
            }
          }
        }

        // Update DB record with on-chain data
        const updated = await prisma.agent.update({
          where: { id: agent.id },
          data: {
            blockchainAgentId,
            walletAddress: agentWalletAddress,
          },
        })

        return NextResponse.json({
          ...updated,
          txHash,
          onChain: true,
        }, { status: 201 })
      } catch (chainErr) {
        // On-chain creation failed — still return the DB agent but flag it
        console.error('[createAgent on-chain]', chainErr)
        return NextResponse.json({
          ...agent,
          onChain: false,
          chainError: chainErr instanceof Error ? chainErr.message : 'On-chain creation failed',
        }, { status: 201 })
      }
    }

    // No contracts configured — return DB-only agent
    return NextResponse.json({ ...agent, onChain: false }, { status: 201 })
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
