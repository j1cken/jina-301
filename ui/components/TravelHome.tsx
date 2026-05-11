'use client';

import { useState, useCallback, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import {
  Search, MapPin, Sparkles, X, Sun, Moon, Layers,
  Star, ArrowUpDown, Globe2, ChevronDown, SlidersHorizontal,
  CheckCircle2, Shield, Minus, Plus, Users, Camera, Image as ImageIcon,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Hotel } from '@/lib/types';
import { type TripCartState } from '@/components/TripCart';
import { apiUrl, BASE_PATH } from '@/lib/api';
import { resolveImageUrl } from '@/lib/images';
import HotelDetailModal from './HotelDetailModal';
import dynamic from 'next/dynamic';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

interface TravelHomeProps {
  onShowDemo: () => void;
  onSelectStation: (s: 'find' | 'rank' | 'look' | 'describe' | 'ingest' | 'capstone' | 'agent') => void;
  onOpenAgent: (query?: string, imageFile?: File) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  demoMode: boolean;
  onToggleDemo: () => void;
  cart: TripCartState;
  setCart: Dispatch<SetStateAction<TripCartState>>;
}

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

const HERO_IMAGE = resolveImageUrl(`/images/hotels/bellagio-las-vegas_1.png`) ?? `${BASE_PATH}/images/hotels/bellagio-las-vegas_1.png`;

const QUICK_CHIPS = [
  { label: '🌊 Beachfront', query: 'beachfront resort with ocean views' },
  { label: '🌿 Eco-lodge', query: 'eco-lodge wildlife photography safari' },
  { label: '🏙️ City boutique', query: 'quiet boutique hotel near the Strip' },
  { label: '💆 Spa & Wellness', query: 'luxury spa resort rooftop pool' },
  { label: '🏔️ Mountain retreat', query: 'mountain lodge nature retreat' },
  { label: '💼 Business', query: 'business hotel conference facilities' },
];

const FEATURED = [
  { name: 'Bellagio Las Vegas', slug: 'bellagio-las-vegas', location: 'The Strip, Las Vegas', price: 359, rating: 4.8, tag: 'Iconic' },
  { name: 'Caesars Palace', slug: 'caesars-palace-las-vegas', location: 'The Strip, Las Vegas', price: 289, rating: 4.7, tag: 'Luxury' },
  { name: 'Park MGM Las Vegas', slug: 'park-mgm-las-vegas', location: 'South Strip', price: 219, rating: 4.6, tag: 'Boutique' },
  { name: 'MGM Grand Las Vegas', slug: 'mgm-grand-las-vegas', location: 'South Strip', price: 189, rating: 4.5, tag: 'Resort' },
  { name: 'Golden Nugget', slug: 'golden-nugget-las-vegas', location: 'Downtown Las Vegas', price: 129, rating: 4.4, tag: 'Classic' },
  { name: 'Flamingo Las Vegas', slug: 'flamingo-las-vegas', location: 'Center Strip', price: 149, rating: 4.3, tag: 'Vibrant' },
];

const STYLE_OPTIONS = ['boutique', 'luxury', 'resort', 'eco', 'business', 'historic', 'beachfront'];
const AMENITY_OPTIONS = ['Pool', 'Spa', 'Gym', 'WiFi', 'Restaurant', 'Parking'];

const ratingLabel = (r: number) =>
  r >= 4.7 ? 'Exceptional' : r >= 4.4 ? 'Excellent' : r >= 4.0 ? 'Very Good' : 'Good';

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ aspectRatio: '16/9', background: 'var(--bg-surface)' }}
        className="animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="animate-pulse rounded-lg h-5 w-3/4" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3.5 w-1/2" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3.5 w-full" style={{ background: 'var(--border)' }} />
        <div className="animate-pulse rounded h-3.5 w-5/6" style={{ background: 'var(--border)' }} />
        <div className="flex gap-2 pt-1">
          <div className="animate-pulse rounded-full h-6 w-16" style={{ background: 'var(--border)' }} />
          <div className="animate-pulse rounded-full h-6 w-20" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel, onClick }: { hotel: Hotel; onClick: (h: Hotel) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const reviews = useMemo(() => 80 + (hotel.name.charCodeAt(0) % 200), [hotel.name]);
  return (
    <div onClick={() => onClick(hotel)} className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.22s ease' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; el.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; el.style.transform = 'translateY(0)'; }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {hotel.image_paths?.[0] && !imgErr
          ? <img src={resolveImageUrl(hotel.image_paths[0])} alt={hotel.name} onError={() => setImgErr(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: 'var(--bg-surface)' }}>🏨</div>
        }
        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
          style={{ background: 'rgba(34,197,94,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          <CheckCircle2 className="w-3 h-3" /> Free cancellation
        </div>
        {hotel.price_per_night_usd > 0 && (
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl font-bold"
            style={{ background: 'rgba(0,0,0,0.78)', color: '#fff', backdropFilter: 'blur(4px)', fontSize: '0.9rem' }}>
            ${hotel.price_per_night_usd}<span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.85 }}>/night</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold leading-tight line-clamp-1 mb-1.5" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{hotel.name}</h3>
        {hotel.rating > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: 'var(--elastic-blue)', color: '#fff' }}>
              <Star className="w-3 h-3" fill="currentColor" /> {hotel.rating.toFixed(1)}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ratingLabel(hotel.rating)}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {reviews} reviews</span>
          </div>
        )}
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{hotel.location_name}</span>
        </div>
        {hotel.descriptions?.[0] && (
          <p className="text-sm line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{hotel.descriptions[0]}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {hotel.style?.slice(0, 2).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
              style={{ background: 'rgba(0,119,204,0.08)', color: 'var(--elastic-blue)', border: '1px solid rgba(0,119,204,0.15)' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ hotel, onClick }: { hotel: typeof FEATURED[0]; onClick: (name: string) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const imgSrc = resolveImageUrl(`/images/hotels/${hotel.slug}_1.png`) ?? `${BASE_PATH}/images/hotels/${hotel.slug}_1.png`;
  return (
    <div onClick={() => onClick(hotel.name)} className="rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.22s ease' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; el.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; el.style.transform = 'translateY(0)'; }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {!imgErr
          ? <img src={imgSrc} alt={hotel.name} onError={() => setImgErr(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: 'var(--bg-surface)' }}>🏨</div>
        }
        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-xs font-bold"
          style={{ background: 'rgba(0,119,204,0.9)', color: '#fff', backdropFilter: 'blur(4px)' }}>
          {hotel.tag}
        </div>
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl font-bold"
          style={{ background: 'rgba(0,0,0,0.78)', color: '#fff', backdropFilter: 'blur(4px)', fontSize: '0.9rem' }}>
          from ${hotel.price}<span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.85 }}>/night</span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold leading-tight mb-0.5" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{hotel.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{hotel.location}</span>
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3" fill="var(--elastic-gold)" style={{ color: 'var(--elastic-gold)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{hotel.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TravelHome({ onShowDemo, onSelectStation, onOpenAgent, theme, onToggleTheme, demoMode, onToggleDemo, cart, setCart }: TravelHomeProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [styleFilters, setStyleFilters] = useState<string[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSearched(true); setSortKey('relevance');
    setStyleFilters([]); setAmenityFilters([]); setMinRating(0); setMaxPrice(2000);
    try {
      const res = await fetch(apiUrl('/api/search'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, demoMode }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.semantic || []);
    } catch {
      setError('Search unavailable — try Fallback mode or check the Ingest station.');
      setResults([]);
    } finally { setLoading(false); }
  }, [demoMode]);

  useEffect(() => {
    if (searched && !loading && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }, [searched, loading]);

  const displayed = useMemo(() => {
    let r = results;
    if (styleFilters.length) r = r.filter(h => h.style?.some(s => styleFilters.includes(s)));
    if (amenityFilters.length) r = r.filter(h => h.amenities?.some(a => amenityFilters.map(x => x.toLowerCase()).includes(a.toLowerCase())));
    if (minRating > 0) r = r.filter(h => h.rating >= minRating);
    if (maxPrice < 2000) r = r.filter(h => h.price_per_night_usd <= maxPrice);
    if (sortKey === 'price_asc') return [...r].sort((a, b) => a.price_per_night_usd - b.price_per_night_usd);
    if (sortKey === 'price_desc') return [...r].sort((a, b) => b.price_per_night_usd - a.price_per_night_usd);
    if (sortKey === 'rating') return [...r].sort((a, b) => b.rating - a.rating);
    return r;
  }, [results, styleFilters, amenityFilters, minRating, maxPrice, sortKey]);

  const sortLabels: Record<SortKey, string> = {
    relevance: 'Best Match', price_asc: 'Price: Low → High', price_desc: 'Price: High → Low', rating: 'Top Rated',
  };
  const activeFilterCount = styleFilters.length + amenityFilters.length + (minRating > 0 ? 1 : 0) + (maxPrice < 2000 ? 1 : 0);

  // Close hero pickers on outside click
  useEffect(() => {
    if (!showDatePicker && !showGuestPicker) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-hero-picker]')) {
        setShowDatePicker(false);
        setShowGuestPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDatePicker, showGuestPicker]);

  const fmtDate = (d?: Date) => d?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateLabel = cart.checkIn && cart.checkOut
    ? `📅 ${fmtDate(cart.checkIn)} – ${fmtDate(cart.checkOut)}`
    : cart.checkIn ? `📅 ${fmtDate(cart.checkIn)} – out?`
    : '📅 Add dates';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6"
        style={{ height: '60px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--elastic-blue)' }}>
            <Globe2 className="w-4 h-4" style={{ color: '#fff' }} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>Horizon</span>
          <span className="font-bold text-lg opacity-20" style={{ color: 'var(--text-muted)' }}>|</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>by</span>
          <img
            src={`${BASE_PATH}/images/${theme === 'dark' ? 'logo-elastic-horizontal-color-reverse.svg' : 'logo-elastic-horizontal-color.svg'}`}
            alt="Elastic"
            style={{ height: '28px', width: 'auto' }}
          />
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {['Hotels', 'Flights', 'Packages', 'Deals'].map((item, i) => (
            <button key={item} className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: i === 0 ? 'var(--elastic-blue)' : 'var(--text-muted)', background: i === 0 ? 'rgba(0,119,204,0.08)' : 'transparent', cursor: i === 0 ? 'pointer' : 'default' }}>
              {item}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>Sign in</button>
          <button onClick={onToggleTheme} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={onShowDemo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(0,191,179,0.1)', border: '1px solid rgba(0,191,179,0.3)', color: 'var(--elastic-teal)' }}>
            <Layers className="w-3.5 h-3.5" /> How It Works
          </button>
          {demoMode && (
            <button onClick={onToggleDemo} className="px-2 py-1 rounded text-xs font-semibold"
              style={{ background: 'rgba(254,197,20,0.15)', border: '1px solid var(--elastic-gold)', color: 'var(--elastic-gold)' }}>
              Fallback ON
            </button>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative flex flex-col items-center justify-center" style={{ minHeight: searched ? '240px' : '600px', transition: 'min-height 0.4s ease' }}>
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 55%' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.80) 100%)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 text-center">
          {!searched && (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(0,191,179,0.95)', letterSpacing: '0.18em' }}>
                AI-Powered Hotel Search
              </p>
              <h1 className="font-bold text-white mb-3"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 4.2rem)', lineHeight: 1.08, textShadow: '0 2px 24px rgba(0,0,0,0.5)', fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Where will you stay?
              </h1>
              <p className="mb-8" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}>
                Search 150+ properties with AI that understands what you actually want
              </p>
            </>
          )}

          {/* Search card */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 28px 70px rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)' }}>
            {/* Row 1: Input + Search button (always inline) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onOpenAgent(query || undefined); } }}
                  placeholder="Describe your ideal stay..."
                  style={{ width: '100%', padding: '13px 16px 13px 44px', fontSize: '0.975rem', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--elastic-blue)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <input ref={cameraRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { onOpenAgent(undefined, f); e.currentTarget.value = ''; } }} />
              <button onClick={async () => {
                  try {
                    const resp = await fetch(`${BASE_PATH}/images/sample-hotel-room.png`);
                    const buf = await resp.arrayBuffer();
                    onOpenAgent(undefined, new File([buf], 'sample-hotel-room.png', { type: 'image/png' }));
                  } catch (e) {
                    console.error('Sample image load failed:', e);
                  }
                }}
                style={{ padding: '13px 14px', borderRadius: '12px', flexShrink: 0, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Search with sample image">
                <ImageIcon className="w-5 h-5" />
              </button>
              <button onClick={() => cameraRef.current?.click()}
                style={{ padding: '13px 14px', borderRadius: '12px', flexShrink: 0, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Upload image to search">
                <Camera className="w-5 h-5" />
              </button>
              <button onClick={() => onOpenAgent(query || undefined)}
                style={{ padding: '13px 20px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', background: 'rgba(0,191,179,0.12)', color: 'var(--elastic-teal)', border: '1.5px solid rgba(0,191,179,0.35)', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
                <Sparkles className="w-4 h-4" /> Ask the Concierge
              </button>
            </div>
            {/* Row 2: Interactive date + guest chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {/* Date chip */}
              <div style={{ position: 'relative' }} data-hero-picker>
                <div
                  role="button" tabIndex={0}
                  onClick={() => { setShowDatePicker(s => !s); setShowGuestPicker(false); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setShowDatePicker(s => !s); setShowGuestPicker(false); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--bg-surface)', border: `1px solid ${showDatePicker ? 'var(--elastic-blue)' : 'var(--border)'}`, color: cart.checkIn ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}
                >
                  {dateLabel}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
                {showDatePicker && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', padding: '8px' }}>
                    <DayPicker
                      mode="range"
                      selected={{ from: cart.checkIn, to: cart.checkOut }}
                      onSelect={r => setCart(prev => ({ ...prev, checkIn: r?.from, checkOut: r?.to }))}
                      disabled={{ before: new Date() }}
                    />
                    {(cart.checkIn || cart.checkOut) && (
                      <button
                        onClick={() => { setCart(prev => ({ ...prev, checkIn: undefined, checkOut: undefined })); setShowDatePicker(false); }}
                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Clear dates
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Guest chip */}
              <div style={{ position: 'relative' }} data-hero-picker>
                <div
                  role="button" tabIndex={0}
                  onClick={() => { setShowGuestPicker(s => !s); setShowDatePicker(false); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setShowGuestPicker(s => !s); setShowDatePicker(false); } }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--bg-surface)', border: `1px solid ${showGuestPicker ? 'var(--elastic-blue)' : 'var(--border)'}`, color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Users className="w-3.5 h-3.5 opacity-60" />
                  {cart.guests} guest{cart.guests !== 1 ? 's' : ''}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
                {showGuestPicker && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: '160px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Guests</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <button
                        onClick={() => setCart(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: cart.guests <= 1 ? 'not-allowed' : 'pointer', opacity: cart.guests <= 1 ? 0.4 : 1 }}
                        disabled={cart.guests <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, minWidth: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>{cart.guests}</span>
                      <button
                        onClick={() => setCart(prev => ({ ...prev, guests: Math.min(8, prev.guests + 1) }))}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: cart.guests >= 8 ? 'not-allowed' : 'pointer', opacity: cart.guests >= 8 ? 0.4 : 1 }}
                        disabled={cart.guests >= 8}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span style={{ flex: 1 }} />
              <button
                onClick={() => setQuery('baller hotel room with view of vegas strip')}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, flexShrink: 0, background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent', cursor: 'pointer', opacity: 0.45, transition: 'opacity 0.2s', userSelect: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
                title="Demo query"
              >
                demo
              </button>
              <button onClick={() => runSearch(query)} disabled={loading || !query.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0, background: 'var(--bg-surface)', color: query.trim() ? 'var(--text-primary)' : 'var(--text-muted)', border: '1px solid var(--border)', cursor: query.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s', userSelect: 'none' }}>
                <Search className="w-3.5 h-3.5" />
                {loading ? <><span className="animate-spin inline-block">⟳</span> Searching</> : 'Search'}
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3"
              style={{ borderTop: '1px solid var(--border)' }}>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Star className="w-3.5 h-3.5" fill="var(--elastic-gold)" style={{ color: 'var(--elastic-gold)' }} />
                <strong style={{ color: 'var(--text-secondary)' }}>4.8</strong> avg guest rating
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                <strong style={{ color: 'var(--text-secondary)' }}>150+</strong> properties
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--elastic-blue)' }} />
                Free cancellation available
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--elastic-teal)' }} />
                Powered by Jina AI + Elastic
              </span>
            </div>
          </div>

          {/* Quick query chips */}
          {!searched && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_CHIPS.map(c => (
                <button key={c.label} onClick={() => { setQuery(c.query); runSearch(c.query); }}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.92)' }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {searched && (
        <div ref={resultsRef} className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Filters:</span>
              {styleFilters.map(f => (
                <button key={f} onClick={() => setStyleFilters(p => p.filter(x => x !== f))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--elastic-blue)', color: '#fff' }}>{f} <X className="w-3 h-3" /></button>
              ))}
              {amenityFilters.map(f => (
                <button key={f} onClick={() => setAmenityFilters(p => p.filter(x => x !== f))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--elastic-teal)', color: '#fff' }}>{f} <X className="w-3 h-3" /></button>
              ))}
              <button onClick={() => { setStyleFilters([]); setAmenityFilters([]); setMinRating(0); setMaxPrice(2000); }}
                className="text-xs px-2 py-1 rounded-full" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-4 flex-shrink-0" style={{ width: '256px' }}>
              <div className="sticky top-20 flex flex-col gap-3">
                {/* Sort */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <ArrowUpDown className="w-4 h-4" /> Sort by
                  </p>
                  {(['relevance', 'price_asc', 'price_desc', 'rating'] as SortKey[]).map(key => (
                    <button key={key} onClick={() => setSortKey(key)} className="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all mb-0.5"
                      style={{ background: sortKey === key ? 'rgba(0,119,204,0.1)' : 'transparent', color: sortKey === key ? 'var(--elastic-blue)' : 'var(--text-secondary)', fontWeight: sortKey === key ? 600 : 400 }}>
                      {sortLabels[key]}
                    </button>
                  ))}
                </div>
                {/* Rating */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Guest Rating</p>
                  {[{ l: 'Any', v: 0 }, { l: '4.0+', v: 4.0 }, { l: '4.3+', v: 4.3 }, { l: '4.6+', v: 4.6 }].map(opt => (
                    <button key={opt.v} onClick={() => setMinRating(opt.v)} className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm mb-0.5"
                      style={{ background: minRating === opt.v ? 'rgba(0,119,204,0.1)' : 'transparent', color: minRating === opt.v ? 'var(--elastic-blue)' : 'var(--text-secondary)', fontWeight: minRating === opt.v ? 600 : 400 }}>
                      {opt.v > 0 && <Star className="w-3.5 h-3.5" fill="var(--elastic-gold)" style={{ color: 'var(--elastic-gold)' }} />} {opt.l}
                    </button>
                  ))}
                </div>
                {/* Style */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Property Style</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STYLE_OPTIONS.map(s => (
                      <button key={s} onClick={() => setStyleFilters(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                        className="px-2.5 py-1 rounded-full text-xs capitalize"
                        style={{ background: styleFilters.includes(s) ? 'var(--elastic-blue)' : 'var(--bg-surface)', color: styleFilters.includes(s) ? '#fff' : 'var(--text-secondary)', border: `1px solid ${styleFilters.includes(s) ? 'var(--elastic-blue)' : 'var(--border)'}` }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Amenities */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Amenities</p>
                  {AMENITY_OPTIONS.map(a => (
                    <label key={a} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={amenityFilters.includes(a)}
                        onChange={() => setAmenityFilters(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                        style={{ accentColor: 'var(--elastic-blue)', width: '15px', height: '15px' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a}</span>
                    </label>
                  ))}
                </div>
                {/* Price */}
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Max / Night</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--elastic-blue)' }}>
                      {maxPrice >= 2000 ? 'Any' : `$${maxPrice}`}
                    </p>
                  </div>
                  <input type="range" min={50} max={2000} step={50} value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))} className="w-full"
                    style={{ accentColor: 'var(--elastic-blue)' }} />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>$50</span><span>$2000+</span>
                  </div>
                </div>
                {/* AI concierge CTA */}
                <button onClick={() => onOpenAgent(query || undefined)} className="rounded-2xl p-4 text-left w-full"
                  style={{ background: 'linear-gradient(135deg, rgba(0,119,204,0.12), rgba(0,191,179,0.08))', border: '1px solid rgba(0,191,179,0.3)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--elastic-teal)' }} />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Concierge</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Tell our agent what you want. It will find it for you.
                  </p>
                </button>
              </div>
            </aside>

            {/* Main results */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {loading ? 'Searching...' : `${displayed.length} hotels found`}
                  </span>
                  {!loading && results.length !== displayed.length && (
                    <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>of {results.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                    style={{ background: showMap ? 'rgba(0,119,204,0.1)' : 'var(--bg-card)', border: `1px solid ${showMap ? 'var(--elastic-blue)' : 'var(--border)'}`, color: showMap ? 'var(--elastic-blue)' : 'var(--text-secondary)' }}>
                    <MapPin className="w-3.5 h-3.5" /> Map
                  </button>
                  <div className="relative lg:hidden">
                    <button onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <SlidersHorizontal className="w-3.5 h-3.5" /> {sortLabels[sortKey]} <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 top-full mt-1 rounded-xl shadow-xl z-20 py-1 min-w-[180px]"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {(['relevance', 'price_asc', 'price_desc', 'rating'] as SortKey[]).map(key => (
                          <button key={key} onClick={() => { setSortKey(key); setShowSortMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm"
                            style={{ background: sortKey === key ? 'rgba(0,119,204,0.08)' : 'transparent', color: 'var(--text-secondary)' }}>
                            {sortLabels[key]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showMap && displayed.length > 0 && (
                <div className="mb-5 rounded-2xl overflow-hidden" style={{ height: '340px' }}>
                  <MapPanel hotels={displayed} onSelect={setSelectedHotel} />
                </div>
              )}

              {error && (
                <div className="rounded-2xl p-6 text-center mb-4"
                  style={{ background: 'rgba(240,78,152,0.07)', border: '1px solid rgba(240,78,152,0.2)', color: 'var(--elastic-pink)' }}>
                  {error}
                </div>
              )}

              {loading && (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {!loading && displayed.length > 0 && (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {displayed.map(h => <HotelCard key={h.id} hotel={h} onClick={setSelectedHotel} />)}
                </div>
              )}

              {!loading && searched && displayed.length === 0 && !error && (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {results.length > 0 ? 'No hotels match your filters' : 'No hotels found'}
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    {results.length > 0 ? 'Try relaxing your filters' : 'Try a different search — or check hotels are indexed in the Ingest station.'}
                  </p>
                  {results.length > 0 && (
                    <button onClick={() => { setStyleFilters([]); setAmenityFilters([]); setMinRating(0); setMaxPrice(2000); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--elastic-blue)', color: '#fff' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Landing: Featured Properties ── */}
      {!searched && (
        <div className="py-16 px-6" style={{ background: 'var(--bg-base)' }}>
          <div className="max-w-6xl mx-auto">
            {/* Featured properties */}
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--elastic-blue)', letterSpacing: '0.14em' }}>Las Vegas</p>
              <h2 className="font-bold mb-1" style={{ color: 'var(--text-primary)', fontSize: '1.8rem' }}>Featured Properties</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Hand-picked stays on the Strip and beyond</p>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {FEATURED.map(h => (
                  <FeaturedCard key={h.slug} hotel={h} onClick={name => { setQuery(name); runSearch(name); }} />
                ))}
              </div>
            </div>

            {/* Popular searches */}
            <div className="mb-12">
              <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>Popular Searches</h2>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map(c => (
                  <button key={c.label} onClick={() => { setQuery(c.query); runSearch(c.query); }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--elastic-blue)'; (e.currentTarget as HTMLElement).style.color = 'var(--elastic-blue)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI CTA strip */}
            <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
              style={{ background: 'linear-gradient(135deg, rgba(0,119,204,0.08), rgba(0,191,179,0.06))', border: '1px solid rgba(0,191,179,0.25)' }}>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                  Not sure what you want?
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Our AI concierge will have a conversation with you and find exactly the right hotel.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => onOpenAgent(query || undefined)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--elastic-blue)', color: '#fff' }}>
                  <Sparkles className="w-4 h-4" /> Chat with AI concierge
                </button>
                <button onClick={onShowDemo}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  <Layers className="w-4 h-4" /> How it works
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hotel detail modal */}
      {selectedHotel && (
        <HotelDetailModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)}
          onFindSimilar={() => { setSelectedHotel(null); onSelectStation('find'); }} />
      )}
    </div>
  );
}
