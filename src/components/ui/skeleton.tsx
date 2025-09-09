import { cn } from "@/lib/utils"

/**
 * A lightweight skeleton placeholder used to indicate loading content.
 *
 * Renders a div with default pulse, rounded, and muted background styles. The
 * provided `className` is merged with the component's base classes and all
 * other props are forwarded to the underlying div.
 *
 * @param className - Additional CSS classes merged with the component's base styles.
 * @returns A JSX element representing the skeleton placeholder.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
