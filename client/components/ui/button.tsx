import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[7px] border rounded-[3px] font-semibold text-sm cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans",
  {
    variants: {
      variant: {
        primary:
          "border-[oklch(0.55_0.16_41)] bg-[oklch(0.55_0.16_41)] text-[oklch(0.99_0.01_83)] hover:bg-[oklch(0.43_0.15_41)] hover:border-[oklch(0.43_0.15_41)]",
        ghost:
          "border-[oklch(0.82_0.014_78)] bg-transparent text-[oklch(0.24_0.014_55)] hover:bg-[oklch(0.94_0.03_50)]",
        destructive:
          "border-[oklch(0.55_0.2_27)] bg-[oklch(0.55_0.2_27)] text-[oklch(0.98_0.01_83)] hover:bg-[oklch(0.45_0.2_27)]",
        "destructive-outline":
          "border-[oklch(0.6_0.18_27)] bg-transparent text-[oklch(0.53_0.2_27)] hover:bg-[oklch(0.95_0.02_27)]",
        "moved-outline":
          "border-[oklch(0.68_0.14_66)] bg-transparent text-[oklch(0.5_0.13_62)] hover:bg-[oklch(0.95_0.02_60)]",
        link: "border-transparent bg-transparent text-[oklch(0.52_0.16_41)] hover:underline p-0",
      },
      size: {
        default: "px-[20px] py-[11px]",
        sm: "px-[16px] py-[9px] text-[13px]",
        xs: "px-[12px] py-[6px] text-[12px]",
        full: "w-full px-[20px] py-[13px]",
        icon: "w-[38px] h-[38px] p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
