"use client";
import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative h-[90vh] min-h-[560px] w-full overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/Lost&FOund (1).mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold mb-4"
        >
          Connecting People, Returning What’s Lost.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-lg md:text-2xl max-w-2xl mb-8"
        >
          Find or report lost items easily with Loqta — because every item deserves to find its way home.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-4">
          <Link href="/report" className="bg-primary text-black px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-transform hover:scale-[1.03] shadow">
            Get Started
          </Link>
          <Link href="/items" className="bg-white/10 backdrop-blur px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition-transform hover:scale-[1.02]">
            Browse Items
          </Link>
        </motion.div>
      </div>
    </section>
  );
}


