import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-stone-200/90 bg-[#FCFBF8] px-3.5 py-2 text-sm text-[#232B28] transition-all outline-none font-sans shadow-2xs placeholder:text-stone-400 focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-700/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-stone-100/60 disabled:opacity-50 aria-invalid:border-terracotta aria-invalid:ring-2 aria-invalid:ring-terracotta/20 dark:bg-stone-900/40 dark:border-stone-800 dark:text-stone-100 dark:focus-visible:border-sage-400 dark:focus-visible:ring-sage-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
