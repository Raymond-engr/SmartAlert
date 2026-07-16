import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full px-[13px] py-[11px] border border-[oklch(0.84_0.014_78)] rounded-[3px] text-sm text-[oklch(0.24_0.014_55)] bg-[oklch(0.99_0.01_83)] placeholder:text-[oklch(0.66_0.01_55)] outline-none focus:border-[oklch(0.55_0.16_41)] transition-colors disabled:opacity-50 font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
