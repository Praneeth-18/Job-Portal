import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-500/70 text-white backdrop-blur-sm hover:bg-blue-600/70",
        destructive: "bg-red-500/70 text-white backdrop-blur-sm hover:bg-red-600/70",
        outline: "border border-white/50 bg-white/30 text-black backdrop-blur-sm hover:bg-white/50",
        secondary: "bg-purple-500/70 text-white backdrop-blur-sm hover:bg-purple-600/70",
        ghost: "hover:bg-white/30 text-black backdrop-blur-sm hover:text-black",
        link: "text-blue-500 underline-offset-4 hover:underline",
        glass: "bg-white/20 backdrop-blur-md border border-white/40 shadow-md text-black hover:bg-white/30",
        glassDark: "bg-black/20 backdrop-blur-md border border-white/10 shadow-md text-white hover:bg-black/30",
        glassFrost: "bg-white/30 backdrop-blur-lg border border-white/30 shadow-md text-black hover:bg-white/40 hover:shadow-lg transition-all",
        success: "bg-green-500/70 text-white backdrop-blur-sm hover:bg-green-600/70",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
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