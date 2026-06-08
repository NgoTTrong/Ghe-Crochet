import { TimelineManager } from '@/components/admin/timeline-manager';

export default function TimelinePage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <main className='container mx-auto px-4 py-8'>
        <TimelineManager />
      </main>
    </div>
  );
}
