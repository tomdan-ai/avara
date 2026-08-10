import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-violet-400/60 bg-violet-600/25 text-violet-200',
        success: 'border-emerald-400/60 bg-emerald-600/25 text-emerald-200',
        warning: 'border-amber-400/60 bg-amber-600/25 text-amber-200',
        destructive: 'border-red-400/60 bg-red-600/25 text-red-200',
        outline: 'border-zinc-600 text-zinc-300',
        secondary: 'border-zinc-600 bg-zinc-800 text-zinc-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
