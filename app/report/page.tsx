"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabaseClient';
import { ReportForm } from '@/components/ReportForm';

export default function ReportPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthed(false);
        setChecked(true);
        router.push('/signin');
        return;
      }
      setAuthed(true);
      setChecked(true);
    };
    run();
  }, [router]);

  if (!checked) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-gray-600">Checking authentication…</p>
      </section>
    );
  }
  if (!authed) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Report an Item</h1>
      <p className="text-gray-600 mb-8">
        Provide details about the lost or found item. Your report helps the community reconnect items with their owners.
      </p>
      <ReportForm />
    </section>
  );
}


