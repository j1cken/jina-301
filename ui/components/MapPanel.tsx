'use client';

import { useEffect, useRef } from 'react';
import type { Hotel } from '@/lib/types';

interface MapPanelProps {
  hotels: Hotel[];
  onSelect?: (hotel: Hotel) => void;
  selected?: Hotel | null;
  center?: [number, number];
  style?: React.CSSProperties;
}

export default function MapPanel({ hotels, onSelect, selected, center, style }: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as ReturnType<typeof L.map>).remove();
      }

      const defaultCenter: [number, number] = center ?? (
        hotels.length > 0
          ? [hotels[0].location.lat, hotels[0].location.lon]
          : [36.1147, -115.1728]
      );

      const map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: hotels.length > 5 ? 3 : 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersRef.current = [];

      hotels.forEach((hotel, i) => {
        if (!hotel.location?.lat || !hotel.location?.lon) return;
        if (hotel.location.lat === 0 && hotel.location.lon === 0) return;

        const isSelected = selected?.id === hotel.id;
        const color = isSelected ? '#0077CC' : '#00BFB3';

        const icon = L.divIcon({
          html: `
            <div class="pin-drop" style="animation-delay:${i * 60}ms">
              <div style="
                width:28px;height:28px;border-radius:50%;
                background:${color};
                border:2.5px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;
                font-weight:700;font-size:12px;color:white;
              ">${i + 1}</div>
            </div>
          `,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([hotel.location.lat, hotel.location.lon], { icon })
          .addTo(map)
          .bindPopup(`<div style="font-size:13px;font-weight:600;min-width:120px">${hotel.name}<br/><span style="font-size:11px;opacity:0.7">${hotel.location_name}</span></div>`);

        marker.on('click', () => onSelect?.(hotel));
        markersRef.current.push(marker);
      });

      if (hotels.length > 1) {
        const validHotels = hotels.filter(h => h.location?.lat && !(h.location.lat === 0 && h.location.lon === 0));
        if (validHotels.length > 0) {
          const bounds = L.latLngBounds(validHotels.map(h => [h.location.lat, h.location.lon] as [number, number]));
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    };

    initMap().catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotels, selected, center, onSelect]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: '360px', background: 'var(--bg-card)', border: '1px solid var(--border)', ...style }}
    />
  );
}
