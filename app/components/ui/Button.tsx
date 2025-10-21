export function Button({
    children,
    variant = "solid",
    size = "md",
    className = "",
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "ghost"
    size?: "md" | "lg"
  }) {
    const base =
      "inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
    const v =
      variant === "solid"
        ? "bg-brand-600 text-white hover:shadow-card-hover"
        : "bg-white border hover:shadow-card"
    const s = size === "lg" ? "h-11 px-5" : "h-10 px-4"
  
    return (
      <button className={`${base} ${v} ${s} ${className}`} {...props}>
        {children}
      </button>
    )
  }
  