'use client'

import * as React from 'react'
import type { ToastProps, ToastActionElement } from '@/components/ui/toast'

const TOAST_LIMIT = 4
const TOAST_REMOVE_DELAY = 6000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type Toast = Omit<ToasterToast, 'id'>

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners: Array<(toasts: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []
const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

function setState(next: ToasterToast[]) {
  memoryState = next
  listeners.forEach((l) => l(memoryState))
}

function dismiss(id: string) {
  setState(memoryState.map((t) => (t.id === id ? { ...t, open: false } : t)))
  const timeout = setTimeout(() => {
    timeouts.delete(id)
    setState(memoryState.filter((t) => t.id !== id))
  }, 250)
  timeouts.set(id, timeout)
}

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (next: Partial<ToasterToast>) =>
    setState(memoryState.map((t) => (t.id === id ? { ...t, ...next } : t)))

  setState(
    [
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss(id)
        },
      },
      ...memoryState,
    ].slice(0, TOAST_LIMIT)
  )

  const auto = setTimeout(() => dismiss(id), TOAST_REMOVE_DELAY)
  timeouts.set(`${id}-auto`, auto)

  return { id, dismiss: () => dismiss(id), update }
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: (id: string) => dismiss(id),
  }
}

export { useToast, toast }
export type { ToasterToast }
