// PATH: app/auth/sign-in/page.tsx
"use client"

import { Suspense } from "react"
import SignInContent from "./SignInContent"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Memuat halaman masuk...</div>}>
      <SignInContent />
    </Suspense>
  )
}
