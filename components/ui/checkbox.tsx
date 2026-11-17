"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-[#FCFBF8] transition-all outline-none cursor-pointer focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-700/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-terracotta aria-invalid:ring-2 aria-invalid:ring-terracotta/20 data-checked:border-botanical-700 data-checked:bg-botanical-700 data-checked:text-[#FCFBF8] dark:border-stone-700 dark:bg-stone-900 dark:data-checked:border-sage-400 dark:data-checked:bg-sage-400 dark:data-checked:text-stone-900",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3"
      >
        <CheckIcon className="stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
