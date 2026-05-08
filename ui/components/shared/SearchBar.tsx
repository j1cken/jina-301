'use client';

import { useRef } from 'react';
import { Search, Camera } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  onImageSearch?: (file: File) => void;
}

export default function SearchBar({ value, onChange, onSubmit, placeholder, disabled, suggestions, onImageSearch }: SearchBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !disabled && onSubmit()}
            placeholder={placeholder ?? 'Search hotels...'}
            disabled={disabled}
            className={`w-full pl-10 ${onImageSearch ? 'pr-12' : 'pr-4'} py-3 rounded-xl text-lg outline-none transition-colors`}
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          {onImageSearch && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Search by image"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:opacity-80 disabled:opacity-40"
                style={{ color: 'var(--text-muted)' }}
              >
                <Camera className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) { onImageSearch(file); e.target.value = ''; }
                }}
              />
            </>
          )}
        </div>
        <button
          data-bp-primary
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="px-6 py-3 rounded-xl font-semibold text-lg transition-all disabled:opacity-50"
          style={{ background: 'var(--elastic-blue)', color: 'white' }}
        >
          Search
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); }}
              className="text-sm px-3 py-1 rounded-full transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
