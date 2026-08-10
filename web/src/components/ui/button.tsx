import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'nb-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-2 border-violet-400 bg-violet-600 text-white nb-shadow-sm',
        destructive: 'border-2 border-red-400 bg-red-600 text-white nb-shadow-sm',
        outline: 'border-2 border-zinc-600 bg-[var(--surface)] text-white nb-shadow-sm',
        ghost:
          'border-2 border-transparent text-zinc-300 shadow-none hover:border-zinc-700 hover:bg-white/5 hover:text-white',
        secondary: 'border-2 border-zinc-600 bg-zinc-800 text-white nb-shadow-sm',
        link: 'border-2 border-transparent text-violet-400 shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
