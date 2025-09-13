import Link from "next/link"
import { Heart, Instagram, Facebook, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="gradient-text">Ghẹ Crochet</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tạo ra những sản phẩm handmade độc đáo với tình yêu và sự tỉ mỉ. Mỗi sản phẩm đều mang trong mình câu
              chuyện riêng.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Liên kết nhanh</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sản phẩm
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Về chúng tôi
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Liên hệ
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Danh mục</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/products?category=amigurumi"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Amigurumi
              </Link>
              <Link
                href="/products?category=bags"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Túi xách & Phụ kiện
              </Link>
              <Link
                href="/products?category=home-decor"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Trang trí nhà
              </Link>
              <Link
                href="/products?category=baby"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Đồ cho bé
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">hello@ghecrochet.com</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Ghẹ Crochet. Made with <Heart className="w-4 h-4 inline text-primary" /> in Vietnam.
          </p>
        </div>
      </div>
    </footer>
  )
}
