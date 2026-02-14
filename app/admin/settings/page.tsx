import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Clock } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Settings className="w-6 h-6" />
          Cài đặt hệ thống
        </h1>
        <p className="text-gray-600">Cấu hình và quản lý hệ thống</p>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Cài đặt hệ thống</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-pink-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
              <p className="text-gray-600 max-w-md">
                Tính năng cài đặt hệ thống đang được phát triển. Sẽ sớm có các tùy chọn cấu hình website, thanh toán, và
                nhiều tính năng khác.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
