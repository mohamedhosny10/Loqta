"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { ItemUserSection } from './ItemUserSection';

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
  owner?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export function ItemCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const [imgSrc, setImgSrc] = useState<string | null>(item.imageUrl || null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const isOwner = currentUserId && item.user_id && currentUserId === item.user_id;

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
        // Show success message with email confirmation
        const successMsg = item.type === 'lost'
          ? '📨 Email sent! The person who lost this item has been notified.'
          : '📨 Email sent! The finder has been notified about your claim.';
        setClaimMessage(successMsg);
      } else {
        // Show error message
        const errorMsg = data.error || data.message || 'Failed to send email. Please try again.';
        setClaimMessage(`Error: ${errorMsg}`);
      }
    } catch (error) {
      setClaimMessage('An error occurred. Please try again.');
      console.error('Error claiming item:', error);
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
            alt={`${item.title} - ${item.type === 'lost' ? 'Lost' : 'Found'} item`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            quality={85}
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
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">{item.description}</p>
        {item.type === 'lost' && item.reward && (
          <p className="text-xs font-semibold text-orange-600 mb-3">
            Reward: {formatReward(item.reward, item.rewardCurrency)}
          </p>
        )}
        <div className="text-xs text-gray-500 flex items-center justify-between mb-3">
          <span>{item.location}</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
        <div className="mt-auto">
          <ItemUserSection
            item={item}
            currentUserId={currentUserId}
            onActionClick={handleClaimItem}
            isActionLoading={isClaiming}
          />
          {claimMessage && (
            <p className={`mt-2 text-xs ${
              claimMessage.includes('error') || claimMessage.includes('Failed') 
                ? 'text-red-600' 
                : item.type === 'lost' 
                  ? 'text-red-600' 
                  : 'text-green-600'
            }`}>
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


