import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client using the service-role key.
 * Bypasses RLS — NEVER import this into a Client Component.
 * Used by admin API routes that have already verified the admin JWT.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
