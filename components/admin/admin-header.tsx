'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  ImageIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth';
import logoImage from '@/public/logo.jpg';
import Image from 'next/image';

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Sản phẩm', href: '/admin/products', icon: Package },
    { name: 'Danh mục', href: '/admin/categories', icon: Users },
    {
      name: 'Hình ảnh Về chúng tôi',
      href: '/admin/about-images',
      icon: ImageIcon,
    },
    { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-white shadow-sm'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link
            href='/admin'
            className='flex items-center gap-2 font-bold text-xl'
          >
            <Image
              src={logoImage}
              alt='logo'
              width={32}
              height={32}
              className='w-8 h-8'
            />
            <span className='text-gray-900'>Ghẹ Crochet Admin</span>
          </Link>

          {/* Navigation */}
          <nav className='hidden md:flex items-center gap-6'>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-pink-600',
                    isActive ? 'text-pink-600' : 'text-gray-700'
                  )}
                >
                  <Icon className='w-4 h-4' />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/' className='text-gray-700 hover:text-pink-600'>
                Xem trang chủ
              </Link>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleLogout}
              className='text-gray-700 hover:text-pink-600'
            >
              <LogOut className='w-4 h-4 mr-2' />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
