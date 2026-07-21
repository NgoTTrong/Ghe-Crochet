import { createClient } from "@/lib/supabase/server"
import { SiteSettingsManager } from "@/components/admin/site-settings-manager"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "show_discounts")
    .maybeSingle()

  const showDiscounts = data?.value !== "false"

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Settings className="w-6 h-6" />
          Cài đặt hệ thống
        </h1>
        <p className="text-gray-600">Cấu hình và quản lý hệ thống</p>
      </div>

      <SiteSettingsManager initialShowDiscounts={showDiscounts} />
    </div>
  )
}
