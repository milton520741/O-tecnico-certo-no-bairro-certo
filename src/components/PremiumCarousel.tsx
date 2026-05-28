import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PremiumCarouselProps {
  title: string;
  children: React.ReactNode[];
  itemsPerView?: number;
}

export function PremiumCarousel({ 
  title, 
  children, 
  itemsPerView = 4 
}: PremiumCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = (container.clientWidth / itemsPerView) * 1.2;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = scrollContainerRef.current;
    if (container) {
      const diff = dragStart - e.clientX;
      container.scrollLeft += diff;
    }
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <section className="w-full py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {title}
            <span className="text-amber-500 ml-2">★</span>
          </h2>
          <span className="text-sm text-slate-500 font-medium">
            {children.length} Resultados
          </span>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {children.map((child, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 snap-center"
              >
                {child}
              </div>
            ))}
          </div>

          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Scroll Indicator */}
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </section>
  );
}
