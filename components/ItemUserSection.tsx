"use client";
import Image from 'next/image';
import { User } from 'lucide-react';

type ItemUserSectionProps = {
  item: {
    id: string;
    type: 'lost' | 'found';
    user_id?: string | null;
    owner?: {
      id: string;
      full_name?: string | null;
      avatar_url?: string | null;
    } | null;
  };
  currentUserId: string | null;
  onActionClick?: () => void;
  isActionLoading?: boolean;
};

// Helper to get user initials
function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

// Avatar component
function UserAvatar({ 
  avatarUrl, 
  name, 
  size = 32,
  itemType = 'found'
}: { 
  avatarUrl?: string | null; 
  name?: string | null;
  size?: number;
  itemType?: 'lost' | 'found';
}) {
  const initials = getInitials(name);
  
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name || 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-gray-200"
      />
    );
  }
  
  // Use red for lost items, green (accent) for found items
  const bgColor = itemType === 'lost' ? 'bg-red-100' : 'bg-accent/20';
  const textColor = itemType === 'lost' ? 'text-red-600' : 'text-accent';
  
  return (
    <div 
      className={`rounded-full ${bgColor} flex items-center justify-center border-2 border-gray-200 ${textColor} font-semibold`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

export function ItemUserSection({ 
  item, 
  currentUserId, 
  onActionClick,
  isActionLoading = false 
}: ItemUserSectionProps) {
  const isOwner = currentUserId && item.user_id && currentUserId === item.user_id;
  const owner = item.owner;

  // Owner cases - show labels only, no buttons
  if (isOwner) {
    const isLost = item.type === 'lost';
    const bgColor = isLost ? 'bg-red-50' : 'bg-accent/5';
    const borderColor = isLost ? 'border-red-200' : 'border-accent/20';
    const textColor = isLost ? 'text-red-600' : 'text-accent';
    const labelBorderColor = isLost ? 'border-red-300' : 'border-accent/30';
    
    return (
      <div className={`flex items-center gap-3 p-3 ${bgColor} rounded-lg border ${borderColor}`}>
        <UserAvatar 
          avatarUrl={owner?.avatar_url} 
          name={owner?.full_name || 'You'} 
          size={36}
          itemType={item.type}
        />
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">You posted this</p>
          <div className={`px-4 py-2 bg-white ${textColor} rounded-lg font-semibold text-sm border ${labelBorderColor} text-center`}>
            {item.type === 'lost' ? 'You posted this lost item' : 'You posted this found item'}
          </div>
        </div>
      </div>
    );
  }

  // Non-owner cases
  if (item.type === 'lost') {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
        <UserAvatar 
          avatarUrl={owner?.avatar_url} 
          name={owner?.full_name} 
          size={36}
          itemType={item.type}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 font-medium truncate mb-1">
            {owner?.full_name || 'Anonymous User'}
          </p>
          <button
            onClick={onActionClick}
            disabled={isActionLoading}
            className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm flex items-center justify-center gap-2"
            style={{ borderRadius: '12px' }}
          >
            {isActionLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              "It's with me"
            )}
          </button>
        </div>
      </div>
    );
  } else {
    // item.type === 'found'
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <UserAvatar 
          avatarUrl={owner?.avatar_url} 
          name={owner?.full_name} 
          size={36}
          itemType={item.type}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 font-medium truncate mb-1">
            {owner?.full_name || 'Anonymous User'}
          </p>
          <button
            onClick={onActionClick}
            disabled={isActionLoading}
            className="w-full px-4 py-2.5 bg-[#00BFA6] text-white rounded-xl font-bold hover:bg-[#00A693] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm shadow-sm flex items-center justify-center gap-2"
            style={{ borderRadius: '12px' }}
          >
            {isActionLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              'Contact owner'
            )}
          </button>
        </div>
      </div>
    );
  }
}

