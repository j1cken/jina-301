import type { Hotel } from '@/lib/types';
import type { ChatHotel } from '@/hooks/useAgentChat';

export function chatHotelToHotel(ch: ChatHotel): Hotel {
  return {
    id: ch.id,
    name: ch.name,
    descriptions: ch.descriptions ?? (ch.description ? [ch.description] : []),
    location: ch.location ?? { lat: 0, lon: 0 },
    location_name: ch.location_name ?? '',
    country: ch.country ?? '',
    region: ch.region ?? '',
    amenities: ch.amenities ?? [],
    style: ch.style ?? [],
    // trust hotels.json data; Tier 1 hotels fall back to 'mid'
    price_tier: (ch.price_tier as Hotel['price_tier']) ?? 'mid',
    price_per_night_usd: ch.price_per_night_usd ?? 0,
    image_paths: ch.image_paths,
    rating: ch.rating ?? 0,
    nearby_landmarks: ch.nearby_landmarks ?? [],
    room_description: ch.room_description,
  };
}
