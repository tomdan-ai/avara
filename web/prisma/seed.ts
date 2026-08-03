/**
 * Seed script — populates the Avara database with built-in services.
 * Run with: npx ts-node prisma/seed.ts
 * Or add to package.json prisma.seed and run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Provider address — should be the deployed operator wallet address
const PROVIDER_ADDRESS = process.env.PROVIDER_ADDRESS || '0x0000000000000000000000000000000000000001'

const SERVICES = [
  {
    name: 'Weather Agent',
    description:
      'Real-time weather data for any city in the world. Returns current temperature, humidity, and conditions.',
    category: 'weather',
    price: '20000', // $0.02 in USDT wei (6 decimals)
    endpoint: 'builtin://weather',
    blockchainServiceId: 1,
  },
  {
    name: 'Market Data Agent',
    description:
      'Live cryptocurrency and asset prices. Supports Bitcoin, Ethereum, and other major assets.',
    category: 'market',
    price: '50000', // $0.05
    endpoint: 'builtin://market-data',
    blockchainServiceId: 2,
  },
  {
    name: 'Translation Agent',
    description:
      'Translate text between languages. Supports over 100 language pairs.',
    category: 'translation',
    price: '10000', // $0.01
    endpoint: 'builtin://translation',
    blockchainServiceId: 3,
  },
]

async function main() {
  console.log('Seeding Avara database...')

  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
    })

    if (existing) {
      console.log(`  Service "${service.name}" already exists — skipping`)
      continue
    }

    await prisma.service.create({
      data: {
        ...service,
        providerAddress: PROVIDER_ADDRESS,
        active: true,
      },
    })
    console.log(`  Created service: ${service.name}`)
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
