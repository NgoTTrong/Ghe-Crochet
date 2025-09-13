'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ImagePopup } from '@/components/image-popup';

interface AboutImage {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

interface AboutImageGalleryProps {
  images: AboutImage[];
}

export function AboutImageGallery({ images }: AboutImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closePopup = () => {
    setSelectedImageIndex(null);
  };

  const imageUrls = images.map((img) => img.image_url);

  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        {images.slice(0, 4).map((image, index) => (
          <div
            key={image.id}
            className={`relative rounded-2xl overflow-hidden cute-shadow cursor-pointer hover:scale-105 transition-transform ${
              index === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'
            }`}
            onClick={() => handleImageClick(index)}
          >
            <Image
              src={image.image_url || '/placeholder.svg'}
              alt={image.title}
              fill
              className='object-cover'
            />
            <div className='absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors' />
            <div className='absolute bottom-2 left-2 right-2'>
              <p className='text-white text-sm font-medium bg-black/50 rounded px-2 py-1 backdrop-blur-sm'>
                {image.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {images.length > 4 && (
        <div className='text-center'>
          <Button
            variant='outline'
            onClick={() => handleImageClick(0)}
            className='rounded-full'
          >
            Xem thêm {images.length - 4} hình ảnh
          </Button>
        </div>
      )}

      {selectedImageIndex !== null && (
        <ImagePopup
          images={imageUrls}
          currentIndex={selectedImageIndex}
          onClose={closePopup}
        />
      )}
    </>
  );
}
