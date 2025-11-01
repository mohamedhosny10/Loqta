import Image from 'next/image';

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
};

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="group rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition transform hover:-translate-y-0.5">
      <div className="relative h-40 bg-gray-50">
        <Image
          src={item.imageUrl || 'https://images.unsplash.com/photo-1592878904946-b3cd3eea62a0?q=80&w=1200&auto=format&fit=crop'}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{item.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'lost' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {item.type.toUpperCase()}
          </span>
        </div>
        <p className="text-xs text-accent font-medium mb-1">{item.category}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{item.location}</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="h-1 w-0 bg-accent group-hover:w-full transition-all" />
    </article>
  );
}


