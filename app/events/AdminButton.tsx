"use client"

import { useRouter } from "next/navigation"
import { Button, Badge } from "../components/ui"

export default function AdminButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      onClick={() => router.push("/admin/events")}
      aria-label="Kelola event (Admin)"
    >
      Kelola (Admin)
    </Button>
  )
}
