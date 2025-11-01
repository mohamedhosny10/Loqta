"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image 
            src="/Logo B.png" 
            alt="Loqta" 
            width={130} 
            height={50} 
            // className="h-12 w-auto object-contain"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:opacity-80">Home</Link>
          <Link href="/report" className="hover:opacity-80">Report</Link>
          <Link href="/items" className="hover:opacity-80">Browse</Link>
          <a href="#contact" className="hover:opacity-80">Contact</a>
          <Link href="/report" className="ml-2 inline-block bg-primary text-black px-4 py-2 rounded-full font-semibold transition-transform hover:scale-[1.03] shadow-sm">Report Item</Link>
        </nav>
        <button aria-label="Open menu" className="md:hidden p-2" onClick={() => setOpen((v) => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/report" onClick={() => setOpen(false)}>Report</Link>
            <Link href="/items" onClick={() => setOpen(false)}>Browse</Link>
            <a href="#contact" onClick={() => setOpen(false)} className="scroll-smooth">Contact</a>
            <Link href="/report" onClick={() => setOpen(false)} className="bg-primary text-black px-4 py-2 rounded-full font-semibold text-center">Report Item</Link>
          </div>
        </div>
      )}
    </header>
  );
}


