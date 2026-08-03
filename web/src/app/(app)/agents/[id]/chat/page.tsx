import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentChatPage({ params }: Props) {
  const { id } = await params

  const agent = await prisma.agent.findUnique({
    where: { id },
  })

  if (!agent) notFound()

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <ChatInterface agent={{ id: agent.id, name: agent.name, status: agent.status }} />
    </div>
  )
}
