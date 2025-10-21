// PATH: lib/supabaseServer.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  // Next.js 15: cookies() adalah Promise
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          // Hanya bisa menulis cookie di Route Handler / Server Action
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Jika dipanggil dari Server Component, abaikan (jangan lempar error)
          }
        },
      },
    }
  );

  return client;
}
