"use client";
import Image from 'next/image';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24 animate-spin">
          <Image
            src="/Logo B.png"
            alt="Loading"
            fill
            className="object-contain animate-pulse"
          />
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

