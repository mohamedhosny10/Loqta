"use client";
import { ItemCard, type Item } from '@/components/ItemCard';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ItemsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    // Require auth before fetching
    const checkAuthAndFetch = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthed(false);
        setAuthChecked(true);
        router.push('/signin');
        return;
      }
      setIsAuthed(true);
      setAuthChecked(true);

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return; // fallback to mock if not configured

      setLoading(true);
      setError(null);
      // Select all columns including reward and user_id
      // Note: If you get an error about missing columns, run the migration in supabase_migration.sql
      const { data, error } = await supabase
        .from('items')
        .select('id, title, description, category, location, date, image_url, lat, lng, reward, reward_currency, user_id');
      if (error) {
        // If error is about missing columns, provide helpful message
        if (error.message.includes('reward') || error.message.includes('does not exist')) {
          setError('Database columns missing. Please run the migration in supabase_migration.sql in your Supabase SQL Editor.');
        } else {
        setError(error.message);
        }
        setLoading(false);
        return;
      }
      // Normalize storage image URLs: accept absolute URLs, convert storage paths to public URLs,
      // and fall back to a short-lived signed URL if bucket is private.
      const getNormalizedImageUrl = async (raw: string | null | undefined): Promise<string | undefined> => {
        if (!raw) return undefined;
        // If already an absolute URL, return as-is
        if (/^https?:\/\//i.test(raw)) return raw;
        // If looks like a full storage route (e.g. /storage/v1/object/public/items/...) trim to path
        const storagePrefix = '/storage/v1/object/public/';
        let objectPath = raw;
        if (raw.includes(storagePrefix)) {
          const idx = raw.indexOf(storagePrefix) + storagePrefix.length;
          objectPath = raw.substring(idx); // bucketName/path/to/file
        }
        // Extract bucket name and path
        const parts = objectPath.split('/');
        const bucket = parts.shift() || 'items';
        const path = parts.join('/');
        // Avoid duplicate bucket segment in path
        const cleanedPath = path.startsWith(`${bucket}/`) ? path.substring(bucket.length + 1) : path;
        // Try public URL first
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(cleanedPath);
        if (pub?.publicUrl) return pub.publicUrl;
        // Fallback to short-lived signed URL
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(cleanedPath, 60 * 60);
        return signed?.signedUrl;
      };

      const mapped: Item[] = await Promise.all(
        (data || []).map(async (row: any) => ({
        id: String(row.id),
        title: row.title,
        description: row.description ?? '',
        category: row.category || 'lost',
        type: (row.category || 'lost') === 'found' ? 'found' : 'lost',
        location: row.location ?? '',
        date: row.date ?? new Date().toISOString(),
          imageUrl: await getNormalizedImageUrl(row.image_url),
        lat: row.lat ?? 25.2048,
        lng: row.lng ?? 55.2708,
        user_id: row.user_id,
        reward: row.reward ?? null,
        rewardCurrency: row.reward_currency ?? null
        }))
      );
      setItems(mapped);
      setLoading(false);
    };

    checkAuthAndFetch();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesType = filter === 'all' || i.type === filter;
      const q = query.toLowerCase();
      const matchesQuery = !q || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [items, query, filter]);

  if (!authChecked) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-gray-600">Checking authentication…</p>
      </section>
    );
  }

  if (!isAuthed) return null; // redirected to /signin

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

      {loading && <p className="text-gray-600 mb-6">Loading items…</p>}
      {error && <p className="text-red-600 mb-6">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 mb-12">
          <p className="text-gray-500 text-lg mb-2">No items found</p>
          <p className="text-gray-400 text-sm">
            {items.length === 0
              ? "There are no items to display yet. Be the first to report a lost or found item!"
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.03 }}>
            <ItemCard item={item} />
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}


