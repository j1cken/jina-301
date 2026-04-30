'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload } from 'lucide-react';
import JinaCallout from '@/components/JinaCallout';
import ModelBadge from '@/components/shared/ModelBadge';
import HotelDetailModal from '@/components/HotelDetailModal';
import type { Hotel } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { apiUrl, BASE_PATH } from '@/lib/api';

const EXAMPLE_IMAGES = [
  { src: `${BASE_PATH}/images/hotels/bellagio-las-vegas_1.png`, label: 'Luxury Casino' },
  { src: `${BASE_PATH}/images/hotels/eco-camp-patagonia_1.png`, label: 'Eco Lodge' },
  { src: `${BASE_PATH}/images/hotels/alpenruh-mountain-lodge-grindelwald_1.png`, label: 'Mountain Lodge' },
  { src: `${BASE_PATH}/images/hotels/durban-beachfront-hotel_1.png`, label: 'Beachfront' },
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
  const fileRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (base64: string, mime: string) => {
    setLoading(true);
    setResults([]);
    onVlmPrewarm?.();

    try {
      const res = await fetch(apiUrl('/api/clip'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime, demoMode }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setVectorPreview(data.query_vector_preview ?? null);
    } finally {
      setLoading(false);
    }
  }, [demoMode, onVlmPrewarm]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      search(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleExampleClick = async (src: string) => {
    setPreview(src);
    const res = await fetch(src);
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) return;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const mime = res.headers.get('content-type') ?? 'image/png';
    search(base64, mime);
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

      <JinaCallout
        model="CLIP v2"
        loading={loading}
        loadingMessage="Jina CLIP v2 is embedding your image into a 1024-dim vector — the same space as all hotel images..."
        doneMessage="Image embedded. kNN search found hotels with the most similar visual aesthetic. Text and images — same space."
      />

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
          accept="image/*"
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
          {EXAMPLE_IMAGES.map(ex => (
            <button
              key={ex.src}
              onClick={() => handleExampleClick(ex.src)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-24 h-16 rounded-lg overflow-hidden border-2 transition-all group-hover:scale-105"
                style={{ borderColor: preview === ex.src ? 'var(--elastic-teal)' : 'var(--border)' }}>
                <img src={ex.src} alt={ex.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs" style={{ color: preview === ex.src ? 'var(--elastic-teal)' : 'var(--text-muted)' }}>
                {ex.label}
              </span>
            </button>
          ))}
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
