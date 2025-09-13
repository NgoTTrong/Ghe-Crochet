'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import logoImage from '@/public/logo.jpg';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Sản phẩm', href: '/products' },
    { name: 'Về chúng tôi', href: '/about' },
    { name: 'Liên hệ', href: '/contact' },
  ];

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-white shadow-sm'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2 font-bold text-xl'>
            <Image
              src={logoImage}
              alt='logo'
              width={32}
              height={32}
              className='w-8 h-8'
            />
            <span className='text-gray-900'>Ghẹ Crochet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-6'>
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-pink-600',
                    isActive ? 'text-pink-600' : 'text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Contact Button */}
          <div className='hidden md:flex items-center gap-4'>
            <Button
              asChild
              className='bg-pink-600 hover:bg-pink-700 text-white rounded-full'
            >
              <Link href='/contact'>Đặt hàng ngay</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant='ghost'
            size='sm'
            className='md:hidden text-gray-700'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className='w-5 h-5' />
            ) : (
              <Menu className='w-5 h-5' />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='md:hidden py-4 border-t border-gray-200'>
            <nav className='flex flex-col gap-4'>
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-pink-600',
                      isActive ? 'text-pink-600' : 'text-gray-700'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              <Button
                asChild
                className='bg-pink-600 hover:bg-pink-700 text-white rounded-full w-fit'
              >
                <Link href='/contact' onClick={() => setIsMenuOpen(false)}>
                  Đặt hàng ngay
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
