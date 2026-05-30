'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, Heart, Sparkles, X } from 'lucide-react';

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

/** Fades + slides its children in the first time they scroll into view. */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
}

const TILT = [-2.5, 1.8, -1.4, 2.2, -2, 1.2];

/** A printed photo on a kraft-paper album page. */
function PhotoPage({ image, index }: { image: AboutImage; index: number }) {
  const tilt = TILT[index % TILT.length];
  return (
    <div className="absolute inset-0 bg-[#f3e7d3] overflow-hidden">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(120,90,60,0.10) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />
      <span className="absolute left-4 top-4 text-base opacity-50 rotate-12 select-none">✿</span>
      <span className="absolute right-5 bottom-4 text-base opacity-50 -rotate-6 select-none">★</span>

      <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
        <div
          className="relative w-[78%] max-w-[420px] bg-white px-3 pt-3 pb-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
          style={{ transform: `rotate(${tilt}deg)` }}
        >
          <div className="absolute -top-2.5 left-6 h-5 w-14 -rotate-6 bg-primary/30 backdrop-blur-sm" />
          <div className="absolute -top-2.5 right-6 h-5 w-14 rotate-6 bg-secondary/40 backdrop-blur-sm" />

          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <Image
              src={image.image_url || '/placeholder.svg'}
              alt={image.title}
              fill
              priority={index === 0}
              className="object-cover"
            />
          </div>

          <div className="px-1 pt-2 pb-1 text-center">
            <p className="font-mono text-sm sm:text-base font-bold text-neutral-800 leading-tight">
              {image.title}
            </p>
            {image.description && (
              <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-500 leading-snug line-clamp-2">
                {image.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutImageGallery({ images }: AboutImageGalleryProps) {
  const [opened, setOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [animating, setAnimating] = useState<number | null>(null);
  const [lbIndex, setLbIndex] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = images.length;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Keyboard nav for the lightbox.
  useEffect(() => {
    if (lbIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLbIndex(null);
      if (e.key === 'ArrowRight') setLbIndex((i) => (i === null ? i : (i + 1) % n));
      if (e.key === 'ArrowLeft') setLbIndex((i) => (i === null ? i : (i - 1 + n) % n));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbIndex, n]);

  if (n === 0) return null;

  const viewIndex = Math.min(currentPage, n - 1);
  const multi = n > 1;

  const flagAnimating = (index: number) => {
    setAnimating(index);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnimating(null), 800);
  };

  const open = () => setOpened(true);

  const next = () => {
    if (!opened) return open();
    if (currentPage >= n - 1) return;
    flagAnimating(currentPage);
    setCurrentPage((p) => p + 1);
  };

  const prev = () => {
    if (currentPage <= 0) {
      setOpened(false);
      return;
    }
    flagAnimating(currentPage - 1);
    setCurrentPage((p) => p - 1);
  };

  const jump = (target: number) => {
    setAnimating(null);
    setOpened(true);
    setCurrentPage(target);
  };

  const zFor = (i: number) => {
    if (i === animating) return 800;
    return i < currentPage ? i : n - i;
  };

  const lbImage = lbIndex !== null ? images[lbIndex] : null;

  return (
    <div className="relative">
      {/* paper backdrop */}
      <div
        aria-hidden
        className="absolute -inset-4 sm:-inset-10 rounded-[2.5rem] bg-gradient-to-br from-secondary/20 via-background to-accent/15 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <Heart aria-hidden className="hidden sm:block absolute -left-5 top-10 w-7 h-7 text-primary/40 fill-primary/20 animate-float" />
      <span aria-hidden className="hidden sm:block absolute -right-4 top-1/4 text-3xl animate-float" style={{ animationDelay: '1.2s' }}>🧶</span>
      <span aria-hidden className="hidden sm:block absolute left-8 -bottom-4 text-2xl animate-float" style={{ animationDelay: '0.6s' }}>✿</span>

      <Reveal>
        <div className="relative mx-auto w-full max-w-2xl [perspective:2400px]">
          <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-3 rounded-2xl bg-[#d9c7a8] -z-[1]" />
          <div aria-hidden className="absolute inset-0 translate-x-1 translate-y-1.5 rounded-2xl bg-[#e7d8bd]" />

          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#f3e7d3] cute-shadow ring-1 ring-black/10 [transform-style:preserve-3d]">
            <div aria-hidden className="pointer-events-none absolute left-0 top-0 bottom-0 z-[500] w-8 bg-gradient-to-r from-black/20 to-transparent" />

            {images.map((image, i) => {
              const turned = i < currentPage;
              return (
                <div
                  key={image.id}
                  className="absolute inset-0 origin-left transition-transform duration-700 ease-in-out [transform-style:preserve-3d]"
                  style={{
                    transform: turned ? 'rotateY(-178deg)' : 'rotateY(0deg)',
                    zIndex: zFor(i),
                  }}
                >
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Lật trang tiếp"
                    className="absolute inset-0 [backface-visibility:hidden] cursor-pointer"
                  >
                    <PhotoPage image={image} index={i} />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/15 to-transparent" />
                  </button>

                  <div
                    className="absolute inset-0 [backface-visibility:hidden] bg-[#ecdcc0]"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 1px 1px, rgba(120,90,60,0.12) 1px, transparent 0)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* COVER leaf */}
            <div
              className="absolute inset-0 origin-left transition-transform duration-[800ms] ease-in-out [transform-style:preserve-3d]"
              style={{
                transform: opened ? 'rotateY(-178deg)' : 'rotateY(0deg)',
                zIndex: opened ? 0 : 900,
              }}
            >
              <button
                type="button"
                onClick={open}
                aria-label="Mở album"
                className="group absolute inset-0 [backface-visibility:hidden] cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-[#7a4f37]" />
                <div className="absolute inset-4 rounded-xl border-2 border-dashed border-white/50" />
                <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6 gap-3">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-[0.2em]">Ghẹ Crochet</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold drop-shadow">Album Kỷ Niệm</h3>
                  <p className="text-white/80 text-sm max-w-xs">
                    Hành trình làm nghề qua từng khoảnh khắc
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                    Mở album <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <div className="absolute -right-1 top-10 h-6 w-16 rotate-6 bg-white/25" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/25 to-transparent" />
              </button>

              <div
                className="absolute inset-0 [backface-visibility:hidden] bg-[#ecdcc0] flex items-center justify-center"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="flex flex-col items-center gap-2 text-primary/50">
                  <Heart className="w-8 h-8 fill-primary/20" />
                  <span className="font-mono text-xs tracking-widest uppercase">Bắt đầu hành trình</span>
                </div>
              </div>
            </div>

            {opened && multi && (
              <div className="absolute top-3 left-3 z-[600] px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-medium">
                {viewIndex + 1} / {n}
              </div>
            )}
            {opened && (
              <button
                type="button"
                onClick={() => setLbIndex(viewIndex)}
                aria-label="Phóng to"
                className="absolute top-3 right-3 z-[600] w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/55 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {opened && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Trang trước"
                className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-foreground shadow-lg ring-1 ring-black/5 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={currentPage >= n - 1}
                aria-label="Trang sau"
                className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-30 disabled:hover:scale-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </Reveal>

      {multi && (
        <Reveal delay={120}>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => jump(i)}
                aria-label={image.title}
                className={`relative w-16 h-14 sm:w-20 sm:h-16 overflow-hidden rounded-lg bg-white p-1 shadow-md transition-all ${
                  opened && i === viewIndex
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 rotate-0'
                    : 'opacity-80 hover:opacity-100 rotate-[-3deg] hover:rotate-0'
                }`}
              >
                <span className="relative block w-full h-full overflow-hidden rounded">
                  <Image src={image.image_url || '/placeholder.svg'} alt={image.title} fill className="object-cover" />
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {/* Album-styled lightbox */}
      {lbImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-8 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLbIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => setLbIndex(null)}
            aria-label="Đóng"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {multi && (
            <>
              <button
                type="button"
                onClick={() => setLbIndex((i) => (i === null ? i : (i - 1 + n) % n))}
                aria-label="Ảnh trước"
                className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setLbIndex((i) => (i === null ? i : (i + 1) % n))}
                aria-label="Ảnh sau"
                className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Big polaroid */}
          <div
            key={lbImage.id}
            className="relative bg-white p-3 sm:p-4 pb-3 shadow-[0_25px_60px_rgba(0,0,0,0.5)] rotate-[-1.2deg] animate-scale-in"
          >
            <div className="absolute -top-3 left-10 h-7 w-24 -rotate-6 bg-primary/40 backdrop-blur-sm" />
            <div className="absolute -top-3 right-10 h-7 w-24 rotate-6 bg-secondary/50 backdrop-blur-sm" />

            <div
              className="relative bg-muted overflow-hidden"
              style={{ width: 'min(86vw, 900px)', height: 'min(64vh, 640px)' }}
            >
              <Image
                src={lbImage.image_url || '/placeholder.svg'}
                alt={lbImage.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="px-2 pt-3 pb-1 text-center">
              <p className="font-mono text-base sm:text-lg font-bold text-neutral-800">{lbImage.title}</p>
              {lbImage.description && (
                <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
                  {lbImage.description}
                </p>
              )}
              {multi && (
                <p className="mt-2 font-mono text-[11px] text-neutral-400">
                  {lbIndex! + 1} / {n}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
