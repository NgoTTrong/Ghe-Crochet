import { createClient } from '@/lib/supabase/server'

/**
 * Whether sale / discount pricing should be shown across the storefront.
 * Controlled by the `show_discounts` row in `site_settings` (admin Settings page).
 * Fails open to `true` (current behavior) when the row is missing or a read fails.
 */
export async function getShowDiscounts(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'show_discounts')
      .maybeSingle()

    return data?.value !== 'false'
  } catch {
    return true
  }
}
