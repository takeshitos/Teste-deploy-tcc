import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Importa o componente Button base

const newsActionButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground hover:bg-gray-100", // Fundo branco, texto verde escuro, hover cinza claro
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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
      size: "sm", // Tamanho padrão para botões de notícia
    },
  }
);

export interface NewsActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof newsActionButtonVariants> {
  asChild?: boolean;
  href?: string; // Adicionado para links
}

const NewsActionButton = React.forwardRef<HTMLButtonElement, NewsActionButtonProps>(
  ({ className, variant, size, asChild = false, href, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cn(newsActionButtonVariants({ variant, size, className }))}>
          <Comp ref={ref} {...props} />
        </a>
      );
    }

    return (
      <Comp
        className={cn(newsActionButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
NewsActionButton.displayName = "NewsActionButton";

export { NewsActionButton, newsActionButtonVariants };