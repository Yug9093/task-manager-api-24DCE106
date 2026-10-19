import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback({ message = 'Loading component...' }) {
  return (
    <div className="lazy-fallback-container">
      <div className="lazy-fallback-card">
        <div className="spinner-wrapper">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
        <p className="fallback-text">{message}</p>
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-short" />
      </div>
    </div>
  );
}
