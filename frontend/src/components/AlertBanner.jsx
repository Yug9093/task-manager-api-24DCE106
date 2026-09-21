import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export default function AlertBanner({ type = 'danger', message, onDismiss }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="btn-icon"
          onClick={onDismiss}
          style={{ padding: '0.2rem', color: 'inherit' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
