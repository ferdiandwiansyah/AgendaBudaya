// PATH: app/admin/layout.tsx
import { createServerSupabase } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Selalu SSR client penuh di area admin
  const supabase = await createServerSupabase("server")

  // ✅ Validasi user ke Auth server (menghilangkan warning)
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    redirect("/auth/sign-in?redirect=/admin/events")
  }

  // ✅ Cek membership admin (no row = bukan admin)
  const { data: adminRow, error: adminErr } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (adminErr || !adminRow) {
    redirect("/403")
  }

  return <>{children}</>
}
