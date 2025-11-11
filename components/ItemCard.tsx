"use client";
import Image from 'next/image';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';

export type Item = {
  id: string;
  title: string;
  type: 'lost' | 'found';
  category: string;
  description: string;
  location: string;
  date: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  user_id?: string;
  reward?: number | null;
  rewardCurrency?: string | null;
};

export function ItemCard({ item }: { item: Item }) {
  const [imgSrc, setImgSrc] = useState<string | null>(item.imageUrl || null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const handleClaimItem = async () => {
    if (!item.id) return;

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('You must be signed in to claim an item.');
      return;
    }

    setIsClaiming(true);
    setClaimMessage(null);

    try {
      const response = await fetch('/api/claim-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClaimMessage(data.message || 'Your claim request has been sent to the finder.');
      } else {
        setClaimMessage(data.error || 'Failed to send claim request.');
      }
    } catch (error) {
      setClaimMessage('An error occurred. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <article className="group rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition transform hover:-translate-y-0.5 flex flex-col h-full">
      <div className="relative h-40 bg-gray-50 flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={item.title}
            fill
            className="object-cover"
            onError={() => setImgSrc(null)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-gray-500">No image</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{item.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {item.type.toUpperCase()}
          </span>
        </div>
        <p className={`text-xs font-medium mb-1 ${item.type === 'lost' ? 'text-red-600' : 'text-accent'}`}>{item.category}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2 flex-grow">{item.description}</p>
        {item.type === 'lost' && item.reward && (
          <p className="text-xs font-semibold text-orange-600 mb-1">
            Reward: {formatReward(item.reward, item.rewardCurrency)}
          </p>
        )}
        <div className="text-xs text-gray-500 flex items-center justify-between mb-2">
          <span>{item.location}</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
        <div className="mt-auto">
          {item.type === 'found' ? (
            <button
              onClick={handleClaimItem}
              disabled={isClaiming}
              className="w-full px-4 py-2 bg-primary text-black rounded-full font-semibold hover:opacity-90 transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {isClaiming ? 'Sending Request...' : 'I Lost This Item'}
            </button>
          ) : (
            <div className="h-[36px]"></div>
          )}
          {claimMessage && (
            <p className={`mt-2 text-xs ${claimMessage.includes('error') || claimMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {claimMessage}
            </p>
          )}
        </div>
      </div>
      <div className={`h-1 w-0 group-hover:w-full transition-all ${item.type === 'lost' ? 'bg-red-600' : 'bg-accent'}`} />
    </article>
  );
}

function formatReward(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return '';
  const code = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}


