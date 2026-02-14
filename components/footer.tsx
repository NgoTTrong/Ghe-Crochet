import Link from 'next/link';
import { Heart, Facebook, PhoneCall } from 'lucide-react';
import zaloImage from '@/public/zalo.png';
import Image from 'next/image';
import logoImage from '@/public/logo.jpg';

export function Footer() {
  return (
    <footer className='bg-card border-t border-border/40'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='space-y-4'>
            <Link
              href='/'
              className='flex items-center gap-2 font-bold text-xl'
            >
              <Image
                src={logoImage}
                alt='logo'
                width={32}
                height={32}
                className='w-8 h-8'
              />
              <span className='gradient-text'>Ghẹ Crochet</span>
            </Link>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              Tạo ra những sản phẩm handmade độc đáo với tình yêu và sự tỉ mỉ.
              Mỗi sản phẩm đều mang trong mình câu chuyện riêng.
            </p>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h3 className='font-semibold text-foreground'>Liên kết nhanh</h3>
            <nav className='flex flex-col gap-2'>
              <Link
                href='/'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Trang chủ
              </Link>
              <Link
                href='/products'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Sản phẩm
              </Link>
              <Link
                href='/about'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Về chúng tôi
              </Link>
              <Link
                href='/contact'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Liên hệ
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className='space-y-4'>
            <h3 className='font-semibold text-foreground'>Danh mục</h3>
            <nav className='flex flex-col gap-2'>
              <Link
                href='/products?category=bộ%20sưu%20tập%20gấu%20bông'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Bộ Sưu Tập Gấu Bông
              </Link>
              <Link
                href='/products?category=hộp%20quà%20handmade%20tình%20thân'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Hộp Quà Handmade Tình Thân
              </Link>
              <Link
                href='/products?category=lucky%20box%20-%20hộp%20quà%20may%20mắn'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Lucky Box - Hộp Quà May Mắn
              </Link>
              <Link
                href='/products?category=móc%20khóa%20len%20thủ%20công'
                className='text-sm text-muted-foreground hover:text-primary transition-colors'
              >
                Móc Khóa Len Thủ Công
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className='space-y-4'>
            <h3 className='font-semibold text-foreground'>Liên hệ</h3>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <PhoneCall className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>
                  0865180495
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <Link
                  href='https://www.tiktok.com/@ghe.crochet'
                  target='_blank'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  <svg
                    fill='#000000'
                    viewBox='0 0 32 32'
                    version='1.1'
                    xmlns='http://www.w3.org/2000/svg'
                    className='w-5 h-5'
                  >
                    <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
                    <g
                      id='SVGRepo_tracerCarrier'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    ></g>
                    <g id='SVGRepo_iconCarrier'>
                      {' '}
                      <title>tiktok</title>{' '}
                      <path d='M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z'></path>{' '}
                    </g>
                  </svg>
                </Link>
                <Link
                  href='https://www.facebook.com/ghecrochet'
                  target='_blank'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  <Facebook className='w-5 h-5 text-blue-500' />
                </Link>
                <Link
                  href='https://zalo.me/0865180495'
                  target='_blank'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  <Image
                    className='w-5 h-5 text-blue-500'
                    src={zaloImage}
                    alt='zalo'
                    width={20}
                    height={20}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 pt-8 border-t border-border/40 text-center'>
          <p className='text-sm text-muted-foreground'>
            © 2024 Ghẹ Crochet. Made with{' '}
            <Heart className='w-4 h-4 inline text-primary' /> in Vietnam.
          </p>
        </div>
      </div>
    </footer>
  );
}
