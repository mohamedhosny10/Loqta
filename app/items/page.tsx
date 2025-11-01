"use client";
import dynamic from 'next/dynamic';
import { ItemCard } from '@/components/ItemCard';
import { mockItems } from '@/components/mockData';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function ItemsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  const filtered = useMemo(() => {
    return mockItems.filter((i) => {
      const matchesType = filter === 'all' || i.type === filter;
      const q = query.toLowerCase();
      const matchesQuery = !q || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [query, filter]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Browse Items</h1>
          <p className="text-gray-600">Explore reported lost and found items near you.</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, category, or location" className="w-full md:w-80 border rounded-full px-4 py-2" />
          <div className="inline-flex rounded-full border border-gray-200 p-1 bg-white">
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === 'all' ? 'bg-black text-white' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === 'lost' ? 'bg-black text-white' : ''}`} onClick={() => setFilter('lost')}>Lost</button>
            <button className={`px-3 py-1.5 rounded-full text-sm ${filter === 'found' ? 'bg-black text-white' : ''}`} onClick={() => setFilter('found')}>Found</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {filtered.map((item, idx) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.03 }}>
            <ItemCard item={item} />
          </motion.div>
        ))}
      </div>

      <div className="h-[420px] rounded-xl overflow-hidden border border-gray-200">
        <MapView items={filtered} />
      </div>
    </section>
  );
}


