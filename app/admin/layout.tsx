// app/admin/layout.tsx
import { createServerSupabase } from "@/lib/supabaseServer"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()

  // 1) Cek user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/sign-in?redirect=/admin/events")
  }

  // 2) Cek membership admin
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single()

  if (!adminRow) {
    redirect("/403")
  }

  return <>{children}</>
}
