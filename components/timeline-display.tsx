'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  image_urls: string[] | null;
  display_order: number;
  is_active: boolean;
}

interface TimelineDisplayProps {
  events: TimelineEvent[];
}

/**
 * Drag/swipe handlers via Pointer Events — works for mouse, touch AND pen.
 * Fires onLeft (drag ←, next) / onRight (drag →, prev).
 */
function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    // Horizontal swipe only — ignore mostly-vertical scrolls.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? onLeft() : onRight();
    }
  };

  const onPointerCancel = () => {
    start.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}

/* Twisted-yarn strand, tiled vertically — the timeline's spine. */
const YARN_SPINE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='26' viewBox='0 0 20 26'%3E%3Cg fill='none' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M10 0 C2 6 2 10 10 13 C18 16 18 20 10 26' stroke='%237a4f37'/%3E%3Cpath d='M10 0 C18 6 18 10 10 13 C2 16 2 20 10 26' stroke='%23a9784f'/%3E%3C/g%3E%3C/svg%3E\")";

const PAPER = '#f6ecd9';

/** Fades + slides (and slightly rotates) children in the first time they scroll into view. */
function Reveal({
  children,
  from = 'up',
  rotate = 0,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  from?: 'up' | 'left' | 'right';
  rotate?: number;
  delay?: number;
  className?: string;
}) {
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
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset =
    from === 'left' ? 'translateX(-44px)' : from === 'right' ? 'translateX(44px)' : 'translateY(44px)';

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: visible ? `none` : `${offset} rotate(${rotate * 1.5}deg)`,
        opacity: visible ? 1 : 0,
      }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
    >
      {children}
    </div>
  );
}

/** A ball of yarn rendered purely in CSS — sits on the spine at each milestone. */
function YarnNode() {
  return (
    <span
      className="relative block h-12 w-12 rounded-full shadow-[0_6px_14px_rgba(122,79,55,0.4)] ring-[5px] ring-[var(--paper)]"
      style={
        {
          ['--paper' as any]: PAPER,
          backgroundColor: '#c98a52',
          backgroundImage:
            'radial-gradient(circle at 34% 28%, rgba(255,240,220,0.95), rgba(201,138,82,0) 55%),' +
            'repeating-linear-gradient(48deg, rgba(90,55,30,0.18) 0 3px, transparent 3px 7px),' +
            'repeating-linear-gradient(-42deg, rgba(90,55,30,0.16) 0 3px, transparent 3px 7px),' +
            'radial-gradient(circle at 70% 75%, rgba(80,45,22,0.45), transparent 60%)',
        } as React.CSSProperties
      }
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
    </span>
  );
}

/** Polaroid-framed swipeable carousel + thumbnail rail. Swipe / drag to browse. */
function PhotoStack({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const n = images.length;
  const go = (d: number) => setIdx((i) => (i + d + n) % n);

  const swipe = useSwipe(
    () => go(1),
    () => go(-1)
  );

  return (
    <div className="relative bg-white p-2.5 pb-2 shadow-[0_8px_22px_rgba(70,45,25,0.28)]">
      {/* tape strips */}
      <span className="absolute -top-2 left-7 h-4 w-12 -rotate-6 bg-primary/25 backdrop-blur-sm" />
      <span className="absolute -top-2 right-7 h-4 w-12 rotate-6 bg-secondary/40 backdrop-blur-sm" />

      <div
        className={`group/gal relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden bg-muted ${
          n > 1 ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        {...swipe}
      >
        {images.map((url, i) => (
          <Image
            key={url}
            src={url}
            alt={`${title} — ${i + 1}`}
            fill
            draggable={false}
            className={`object-cover transition-opacity duration-500 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover/gal:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ảnh sau"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 shadow transition-opacity hover:bg-white group-hover/gal:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[10px] font-medium text-white">
              {idx + 1}/{n}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail rail — see every photo of this milestone at a glance */}
      {n > 1 && (
        <div className="mt-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Ảnh ${i + 1}`}
              className={`relative aspect-square w-full overflow-hidden rounded-md transition-all ${
                i === idx
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-white'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill draggable={false} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestoneCard({
  event,
  index,
  side,
}: {
  event: TimelineEvent;
  index: number;
  side: 'left' | 'right';
}) {
  const images = event.image_urls ?? [];
  const tilt = side === 'left' ? -1.1 : 1.1;
  const sealText = event.event_date?.trim() || `Cột mốc ${index + 1}`;

  return (
    <div
      className="group relative rounded-[14px] p-5 pt-7 sm:p-6 sm:pt-8 ring-1 ring-[#cdb892] transition-transform duration-300 hover:-translate-y-1 hover:rotate-0"
      style={{
        transform: `rotate(${tilt}deg)`,
        backgroundColor: PAPER,
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(120,90,60,0.10) 1px, transparent 0)',
        backgroundSize: '15px 15px',
        boxShadow: '0 14px 34px -12px rgba(80,50,28,0.45)',
      }}
    >
      {/* punched holes on the spine-facing edge, like a notebook page */}
      <span
        aria-hidden
        className={`absolute top-1/2 hidden h-20 -translate-y-1/2 flex-col justify-between md:flex ${
          side === 'left' ? 'right-2.5 items-end' : 'left-2.5 items-start'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-2 w-2 rounded-full bg-[#d8c19a] shadow-inner" />
        ))}
      </span>

      {/* Date seal / postage stamp */}
      <div
        className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 md:left-6 md:translate-x-0"
        style={{ transform: 'rotate(-7deg)' }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-primary to-[#7a4f37] px-3.5 py-1.5 font-mono text-sm font-bold tracking-tight text-primary-foreground shadow-[0_4px_10px_rgba(80,50,28,0.4)] ring-2 ring-[#f6ecd9]">
          <Heart className="h-3.5 w-3.5 fill-current opacity-80" />
          {sealText}
        </span>
      </div>

      {images.length > 0 && (
        <div className="mb-4">
          <PhotoStack images={images} title={event.title} />
        </div>
      )}

      <h3 className="font-bold text-lg sm:text-xl leading-snug text-[#4a3725]">{event.title}</h3>
      {event.description && (
        <p className="mt-2 text-sm leading-relaxed text-[#6f5b46]">{event.description}</p>
      )}

      {/* stitched accent under the title */}
      <span
        aria-hidden
        className="mt-3 block h-[3px] w-16 rounded-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--tw-color, #a9784f) 0 7px, transparent 7px 12px)',
          backgroundColor: 'transparent',
          backgroundSize: '12px 3px',
        }}
      />
    </div>
  );
}

export function TimelineDisplay({ events }: TimelineDisplayProps) {
  if (!events.length) return null;

  return (
    <div className="relative mx-auto max-w-5xl px-2 py-4">
      {/* soft paper atmosphere behind everything */}
      <div
        aria-hidden
        className="absolute -inset-x-2 -inset-y-2 -z-10 rounded-[2.5rem] opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(201,138,82,0.10), transparent 60%)',
        }}
      />

      {/* The yarn spine */}
      <div
        aria-hidden
        className="absolute top-6 bottom-20 left-[30px] w-5 -translate-x-1/2 md:left-1/2"
        style={{ backgroundImage: YARN_SPINE, backgroundRepeat: 'repeat-y', backgroundPosition: 'center' }}
      />

      <div className="space-y-12 md:space-y-20">
        {events.map((event, index) => {
          const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
          return (
            <div
              key={event.id}
              className="relative grid grid-cols-[60px_1fr] items-center gap-1 md:grid-cols-2 md:gap-16"
            >
              {/* Yarn-ball node on the spine */}
              <div className="absolute left-[30px] top-7 z-10 -translate-x-1/2 md:left-1/2 md:top-1/2 md:-translate-y-1/2">
                <Reveal from="up">
                  <YarnNode />
                </Reveal>
              </div>

              {/* Dashed thread connecting node → card (desktop only) */}
              <span
                aria-hidden
                className={`absolute top-1/2 z-0 hidden h-[3px] w-12 -translate-y-1/2 md:block ${
                  side === 'left' ? 'left-1/2 -translate-x-full -ml-3' : 'right-1/2 translate-x-full -mr-3'
                }`}
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #a9784f 0 6px, transparent 6px 11px)',
                  backgroundSize: '11px 3px',
                }}
              />

              {/* Card — alternates sides on desktop, capped width + hugged to the spine */}
              <div
                className={`col-start-2 col-end-3 w-full max-w-[420px] md:row-start-1 ${
                  side === 'left'
                    ? 'mr-auto md:col-start-1 md:col-end-2 md:ml-auto md:mr-0'
                    : 'mr-auto md:col-start-2 md:col-end-3 md:mr-auto md:ml-0'
                }`}
              >
                <Reveal from={side === 'left' ? 'left' : 'right'} rotate={side === 'left' ? -1 : 1} delay={60}>
                  <MilestoneCard event={event} index={index} side={side} />
                </Reveal>
              </div>
            </div>
          );
        })}
      </div>

      {/* Closing flourish — a finished knot */}
      <div className="relative mt-10 flex flex-col items-center gap-2">
        <Reveal from="up">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{
              backgroundColor: '#c98a52',
              backgroundImage:
                'radial-gradient(circle at 34% 28%, rgba(255,240,220,0.95), rgba(201,138,82,0) 55%),' +
                'repeating-linear-gradient(48deg, rgba(90,55,30,0.18) 0 3px, transparent 3px 7px),' +
                'repeating-linear-gradient(-42deg, rgba(90,55,30,0.16) 0 3px, transparent 3px 7px)',
            }}
          >
            <Heart className="h-6 w-6 fill-white/40" />
          </span>
        </Reveal>
        <Reveal from="up" delay={80}>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8a6f54]">
            ... hành trình vẫn tiếp tục
          </span>
        </Reveal>
      </div>
    </div>
  );
}
