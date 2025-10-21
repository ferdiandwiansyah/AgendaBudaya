export function Badge({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[11px] border border-amber-100">
        {children}
      </span>
    )
  }
  