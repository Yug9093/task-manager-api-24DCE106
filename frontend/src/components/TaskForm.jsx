import React, { useState } from 'react';
import { generateAiDescription } from '../api';

export default function TaskForm({ onTaskCreated, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDesc, setShowDesc] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState(null); // { type: 'success' | 'warning', message: string }

  const handleGenerateAiDescription = async () => {
    if (!title.trim()) {
      setError('Please enter a task title first to generate an AI description');
      return;
    }

    setError('');
    setIsGeneratingAi(true);
    setAiNotice(null);

    try {
      const data = await generateAiDescription(title.trim());

      // Ensure description box is visible for reviewing/editing
      setShowDesc(true);

      if (data && data.description && !data.fallback) {
        // Step 5: Display returned description as an editable suggestion
        setDescription(data.description);
        setAiNotice({
          type: 'success',
          message: '✨ Gemini AI suggested a description! You can edit or keep it before saving.',
        });
      } else {
        // Step 6: Graceful fallback when AI is unavailable or API key is invalid
        setAiNotice({
          type: 'warning',
          message: data.message || '⚠️ AI service unavailable (fallback mode). You can enter a description manually.',
        });
      }
    } catch (err) {
      setShowDesc(true);
      setAiNotice({
        type: 'warning',
        message: '⚠️ Could not connect to AI service. You can enter a description manually.',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    setError('');

    const success = await onTaskCreated({
      title: title.trim(),
      description: description.trim(),
      completed: false,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setShowDesc(false);
      setAiNotice(null);
    }
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="simple-form">
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            disabled={isSubmitting || isGeneratingAi}
            style={{ flex: 1 }}
          />

          <button
            type="button"
            className="btn btn-ai"
            onClick={handleGenerateAiDescription}
            disabled={isSubmitting || isGeneratingAi}
            title="Generate description using Google Gemini AI"
          >
            {isGeneratingAi ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px' }} />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate description</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        {/* AI Notice Badge (Success or Fallback) */}
        {aiNotice && (
          <div
            className={`ai-notice-box ${aiNotice.type}`}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: aiNotice.type === 'success' ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${aiNotice.type === 'success' ? '#bbf7d0' : '#fef3c7'}`,
              color: aiNotice.type === 'success' ? '#166534' : '#92400e',
            }}
          >
            <span>{aiNotice.message}</span>
            <button
              type="button"
              onClick={() => setAiNotice(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: 'inherit',
                opacity: 0.7,
                marginLeft: '0.5rem',
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {showDesc ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Task Description / Notes (Editable):</span>
              {description && (
                <button
                  type="button"
                  onClick={() => setDescription('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Clear notes
                </button>
              )}
            </div>
            <textarea
              className="form-textarea"
              placeholder="Add details / notes (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting || isGeneratingAi}
              rows={3}
            />
          </div>
        ) : null}

        <div className="form-actions">
          {!showDesc && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              onClick={() => setShowDesc(true)}
              disabled={isSubmitting || isGeneratingAi}
            >
              + Add notes manually
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isGeneratingAi}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                <span>Adding...</span>
              </>
            ) : (
              'Add Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
