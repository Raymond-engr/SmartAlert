"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "relative inline-flex w-[42px] h-[24px] rounded-full border-2 border-transparent cursor-pointer transition-colors data-[state=checked]:bg-[oklch(0.55_0.16_41)] data-[state=unchecked]:bg-[oklch(0.84_0.014_78)] focus-visible:outline-none disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block w-[18px] h-[18px] rounded-full bg-[oklch(0.98_0.01_83)] shadow transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
