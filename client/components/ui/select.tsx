import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "w-full px-[13px] py-[11px] border border-[oklch(0.84_0.014_78)] rounded-[3px] text-sm text-[oklch(0.24_0.014_55)] bg-[oklch(0.99_0.01_83)] outline-none focus:border-[oklch(0.55_0.16_41)] transition-colors disabled:opacity-50 cursor-pointer font-sans",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
