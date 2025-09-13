'use client';

import type React from 'react';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePopupProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
}

export function ImagePopup({ images, currentIndex, onClose }: ImagePopupProps) {
  const [index, setIndex] = useState(currentIndex);

  const nextImage = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'
      onClick={handleBackdropClick}
    >
      <div className='relative max-w-4xl max-h-full'>
        <Button
          variant='ghost'
          size='icon'
          className='absolute -top-12 right-0 text-white hover:bg-white/20'
          onClick={onClose}
        >
          <X className='w-6 h-6' />
        </Button>

        <div className='relative'>
          <Image
            src={images[index] || '/placeholder.svg'}
            alt={`Hình ảnh ${index + 1}`}
            width={800}
            height={600}
            className='max-w-full max-h-[80vh] object-contain rounded-lg'
          />

          {images.length > 1 && (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20'
                onClick={prevImage}
              >
                <ChevronLeft className='w-6 h-6' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20'
                onClick={nextImage}
              >
                <ChevronRight className='w-6 h-6' />
              </Button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className='flex justify-center mt-4 gap-2'>
            {images.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === index ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
