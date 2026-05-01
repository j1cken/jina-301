'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import ModelBadge from '@/components/shared/ModelBadge';
import HotelDetailModal from '@/components/HotelDetailModal';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { apiUrl } from '@/lib/api';

const EXAMPLE_IMAGES = [
  { src: '/images/hotels/bellagio-las-vegas_1.png', label: 'Luxury Casino' },
  { src: '/images/hotels/eco-camp-patagonia_1.png', label: 'Eco Lodge' },
  { src: '/images/hotels/alpenruh-mountain-lodge-grindelwald_1.png', label: 'Mountain Lodge' },
  { src: '/images/hotels/durban-beachfront-hotel_1.png', label: 'Beachfront' },
];

interface LookStationProps {
  demoMode: boolean;
  onVlmPrewarm?: () => void;
  onSelectStation?: (station: string) => void;
}

export default function LookStation({ demoMode, onVlmPrewarm, onSelectStation }: LookStationProps) {
  const [results, setResults] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [vectorPreview, setVectorPreview] = useState<number[] | null>(null);
  const [selectedModal, setSelectedModal] = useState<Hotel | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const inFlightRef = useRef(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const search = useCallback(async (base64: string, mime: string, logFn?: (msg: string) => void) => {
    setLoading(true);
    setResults([]);
    onVlmPrewarm?.();
    logFn?.('[ok] Calling Jina CLIP v2 for embedding...');

    try {
      const res = await fetch(apiUrl('/api/clip'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime, demoMode }),
      });
      const data = await res.json();
      logFn?.('[ok] Embedding + kNN complete');
      const hotels = data.results ?? [];
      setResults(hotels);
      setVectorPreview(data.query_vector_preview ?? null);
      logFn?.(`[ok] ${hotels.length} hotels found`);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [demoMode, onVlmPrewarm]);

  const handleFile = (file: File) => {
    if (inFlightRef.current) return;
    if (!file.type.startsWith('image/')) {
      setLogs([`[err] Not an image file (got: ${file.type || 'unknown'})`]);
      return;
    }
    const sizeLine = `[ok] Image selected: ${file.name} (${Math.round(file.size / 1024)}KB, ${file.type})`;
    if (file.size > 5_000_000) {
      setLogs([sizeLine, `[err] Image too large — max 5MB (got ${Math.round(file.size / 1024)}KB)`]);
      return;
    }
    inFlightRef.current = true;
    setLogs([sizeLine]);
    setLoading(true);
    setVectorPreview(null);

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      addLog('[ok] Converting to base64...');
      const base64 = dataUrl.split(',')[1];
      search(base64, file.type, addLog);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleExampleClick = async (src: string, label: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setLogs([`[ok] Image selected: ${label}`]);
    setVectorPreview(null);
    setPreview(resolveImageUrl(src) ?? src);

    const resolvedUrl = resolveImageUrl(src) ?? src;
    addLog('[ok] Fetching image bytes...');
    try {
      const res = await fetch(resolvedUrl);
      if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) {
        addLog('[err] Failed to load image — check path');
        setLoading(false);
        inFlightRef.current = false;
        return;
      }
      const buf = await res.arrayBuffer();
      const kb = Math.round(buf.byteLength / 1024);
      addLog(`[ok] Converting to base64 (${kb}KB)...`);
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const mime = res.headers.get('content-type') ?? 'image/png';
      await search(base64, mime, addLog);
    } catch {
      addLog('[err] Failed to fetch image');
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 style={{ color: 'var(--text-primary)' }}>Look</h2>
          <ModelBadge model="CLIP v2" api="jina" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          CLIP embeds images and text into the same vector space. Upload a photo — find hotels with the same aesthetic.
        </p>
      </div>

      {/* Log panel */}
      {logs.length > 0 && (
        <div className="text-xs p-3 rounded-lg font-mono space-y-0.5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {logs.map((l, i) => (
            <p key={i} style={{ color: l.startsWith('[err]') ? 'var(--elastic-pink)' : 'var(--elastic-teal)' }}>{l}</p>
          ))}
          {loading && (
            <p style={{ color: 'var(--text-muted)' }}>...</p>
          )}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors text-center"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {preview ? (
          <img src={preview} alt="query" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Drop an image or click to upload</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Any hotel photo — lobby, pool, room, exterior</p>
          </div>
        )}
      </div>

      {/* Example images */}
      <div>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Or use an example:</p>
        <div className="flex gap-3">
          {EXAMPLE_IMAGES.map(ex => {
            const resolved = resolveImageUrl(ex.src) ?? ex.src;
            return (
              <button
                key={ex.src}
                onClick={() => handleExampleClick(ex.src, ex.label)}
                disabled={loading}
                className="flex flex-col items-center gap-1 group disabled:opacity-50"
              >
                <div className="w-24 h-16 rounded-lg overflow-hidden border-2 transition-all group-hover:scale-105"
                  style={{ borderColor: preview === resolved ? 'var(--elastic-teal)' : 'var(--border)' }}>
                  <img src={resolved} alt={ex.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs" style={{ color: preview === resolved ? 'var(--elastic-teal)' : 'var(--text-muted)' }}>
                  {ex.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {vectorPreview && (
        <div className="text-xs p-3 rounded-lg font-mono" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
          Query vector (first 8 dims): [{vectorPreview.map(v => v.toFixed(4)).join(', ')}, ...]
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: 'var(--text-secondary)' }}>Visually Similar Hotels</h3>
            {onSelectStation && (
              <button
                onClick={() => onSelectStation('find')}
                className="text-sm px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'var(--elastic-teal)', color: '#07101F' }}
              >
                Find similar hotels →
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.map((hotel, i) => (
              <button
                key={hotel.id}
                onClick={() => setSelectedModal(hotel)}
                className="rounded-xl overflow-hidden text-left transition-all hover:scale-105"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  animationDelay: `${i * 70}ms`,
                }}
              >
                {hotel.image_paths?.[0] && (
                  <img src={resolveImageUrl(hotel.image_paths[0])} alt={hotel.name} className="w-full h-32 object-cover" />
                )}
                <div className="p-2">
                  <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{hotel.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hotel.location_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedModal && (
        <HotelDetailModal
          hotel={selectedModal}
          onClose={() => setSelectedModal(null)}
        />
      )}
    </div>
  );
}
