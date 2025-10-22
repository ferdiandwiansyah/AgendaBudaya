// PATH: app/components/ui/Badge.tsx
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium
      bg-emerald-50 text-emerald-700 border border-emerald-100">
      {children}
    </span>
  )
}
