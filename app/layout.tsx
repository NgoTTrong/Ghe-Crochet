import { Analytics } from '@vercel/analytics/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type React from 'react'
import { Suspense } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ghe-crochet.asia'
  ),
  title: 'Ghẹ Crochet - Handmade with Love',
  description:
    'Khám phá những sản phẩm đan móc thủ công tuyệt đẹp, được làm nên bằng tình yêu. Từ những món amigurumi dễ thương đến các phụ kiện tiện dụng, mỗi tác phẩm đều mang trong mình một câu chuyện.',
  keywords: [
    'crochet',
    'handmade',
    'đan móc',
    'thủ công',
    'amigurumi',
    'len',
    'búp bê',
    'thú bông',
    'phụ kiện',
    'quà tặng',
    'Việt Nam'
  ],
  authors: [{ name: 'Ghẹ Crochet' }],
  creator: 'Ghẹ Crochet',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Ghẹ Crochet',
    title: 'Ghẹ Crochet - Handmade with Love',
    description:
      'Khám phá những sản phẩm đan móc thủ công tuyệt đẹp, được làm nên bằng tình yêu. Từ những món amigurumi dễ thương đến các phụ kiện tiện dụng, mỗi tác phẩm đều mang trong mình một câu chuyện.',
    images: [
      { url: '/main-image.jpg', width: 1200, height: 630, alt: 'Ghẹ Crochet' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ghẹ Crochet - Handmade with Love',
    description:
      'Khám phá những sản phẩm đan móc thủ công tuyệt đẹp, được làm nên bằng tình yêu.',
    images: ['/main-image.jpg']
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  },
  alternates: {
    canonical: '/'
  }
}
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='vi'>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
