"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Item } from './ItemCard';
import L from 'leaflet';

// Fix default icon paths for Leaflet in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapView({ items }: { items: Item[] }) {
  const center: [number, number] = items.length
    ? [items[0].lat, items[0].lng]
    : [25.2048, 55.2708];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lng] as [number, number]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{item.title}</p>
              <p className="text-gray-600">{item.location}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


