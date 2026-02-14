import type React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ghẹ Crochet - Handmade with Love',
  description:
    'Khám phá những sản phẩm đan móc thủ công tuyệt đẹp, được làm nên bằng tình yêu. Từ những món amigurumi dễ thương đến các phụ kiện tiện dụng, mỗi tác phẩm đều mang trong mình một câu chuyện.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='vi'>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  );
}
