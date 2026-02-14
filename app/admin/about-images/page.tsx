import { AdminHeader } from '@/components/admin/admin-header';
import { AboutImagesManager } from '@/components/admin/about-images-manager';

export default function AboutImagesPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <main className='container mx-auto px-4 py-8'>
        <AboutImagesManager />
      </main>
    </div>
  );
}
