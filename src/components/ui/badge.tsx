import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-500/70 text-white",
        secondary: "bg-purple-500/70 text-white",
        destructive: "bg-red-500/70 text-white",
        outline: "text-black border border-white/50 bg-white/30",
        success: "bg-green-500/70 text-white",
        warning: "bg-amber-500/70 text-white",
        glass: "bg-white/20 border border-white/50 shadow-sm text-black backdrop-blur-md",
        glassDark: "bg-black/20 border border-white/10 shadow-sm text-white backdrop-blur-md",
        glassFrost: "bg-white/30 backdrop-blur-lg border border-white/30 shadow-sm text-black"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }; 