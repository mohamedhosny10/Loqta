"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function ClickHandler({ onPick }: { onPick: (pos: { lat: number; lng: number }) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null);
  
  useMapEvents({
    click(e) {
      const next: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPos(next);
      onPick({ lat: next[0], lng: next[1] });
    }
  });

  return pos ? <Marker position={pos} /> : null;
}

export default function MapPicker({ onPick }: { onPick: (pos: { lat: number; lng: number }) => void }) {
  return (
    <MapContainer 
      center={[25.2048, 55.2708] as [number, number]} 
      zoom={12} 
      scrollWheelZoom={false} 
      className="h-full w-full"
      style={{ zIndex: 0, position: 'relative' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
    </MapContainer>
  );
}


