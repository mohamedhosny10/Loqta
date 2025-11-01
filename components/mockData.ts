import type { Item } from './ItemCard';

export const mockItems: Item[] = [
  {
    id: '1',
    title: 'Black Wallet',
    type: 'lost',
    category: 'Wallet',
    description: 'Contains ID and a few cards. Leather with a small scratch on the corner.',
    location: 'Downtown Metro Station',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd3eea62a0?q=80&w=1200&auto=format&fit=crop',
    lat: 25.2048,
    lng: 55.2708
  },
  {
    id: '2',
    title: 'Silver Keys',
    type: 'found',
    category: 'Keys',
    description: 'Keychain with a green tag. Found near the park bench.',
    location: 'Greenwood Park',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?q=80&w=1200&auto=format&fit=crop',
    lat: 25.1972,
    lng: 55.2744
  },
  {
    id: '3',
    title: 'Backpack',
    type: 'lost',
    category: 'Bag',
    description: 'Blue backpack with laptop compartment. Brand logo on front pocket.',
    location: 'City Library',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop',
    lat: 25.2130,
    lng: 55.2653
  }
];


