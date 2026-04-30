'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface JinaCalloutProps {
  model: string;
  loading: boolean;
  loadingMessage: string;
  doneMessage?: string;
}

export default function JinaCallout({ model, loading, loadingMessage, doneMessage }: JinaCalloutProps) {
  return (
    <div className="jina-callout p-4 my-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          {loading ? (
            <span
              className="pulse-dot inline-block w-3 h-3 rounded-full"
              style={{ background: 'var(--elastic-teal)' }}
            />
          ) : (
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: 'var(--elastic-teal)', opacity: 0.5 }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--elastic-teal)' }}>
              Jina {model}
            </span>
            {loading && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>is working...</span>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={loading ? 'loading' : 'done'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              {loading ? loadingMessage : (doneMessage ?? loadingMessage)}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
