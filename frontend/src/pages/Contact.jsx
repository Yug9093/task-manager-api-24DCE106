import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function Contact({ currentUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [subject, setSubject] = useState('Feedback');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setMessage('');
      setSubmitted(false);
    }, 4000);
  };

  const faqs = [
    {
      q: 'How does route-based lazy loading improve application performance?',
      a: 'Route lazy loading splits large JavaScript application bundles into discrete on-demand chunks. Only code required for the initial route (e.g., Home/Tasks) is downloaded during first visit, drastically reducing First Contentful Paint (FCP) and Time to Interactive (TTI).'
    },
    {
      q: 'How are tasks scoped to individual users?',
      a: 'Every task in MongoDB contains a mandatory ObjectId referencing the authenticated user. All CRUD endpoints verify JWT Bearer tokens and restrict database operations to { user: req.user.id }.'
    },
    {
      q: 'What role does React Suspense play during lazy loading?',
      a: 'React Suspense catches unresolved promises triggered by dynamic import() operations and displays a configured fallback UI (such as skeleton screens or loading spinners) until the chunk asset finishes downloading.'
    }
  ];

  return (
    <div className="contact-page">
      <div className="page-header">
        <h1 className="page-title">Contact & Developer Support</h1>
        <p className="page-subtitle">
          Have questions regarding task synchronization, performance optimizations, or API integrations? Reach out below.
        </p>
      </div>

      <div className="contact-layout">
        {/* Contact Form */}
        <div className="card contact-form-card">
          <h3 className="section-title">Send a Message</h3>
          <p className="section-subtitle">Our team typically responds within 24 hours.</p>

          {submitted ? (
            <div className="alert alert-success" style={{ marginTop: '1rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <strong>Message Dispatched Successfully!</strong>
              </div>
              <p style={{ fontSize: '0.85rem' }}>
                Thank you for your feedback. A confirmation receipt has been noted for {email}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="simple-form" style={{ marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Dev"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Topic / Category
                </label>
                <select
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="Feedback">Application Feedback</option>
                  <option value="Performance">Performance & Bundle Analysis</option>
                  <option value="Bug">Bug Report / Error</option>
                  <option value="Security">Authentication & Security</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Message
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe your inquiry or suggestions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
              >
                <Send size={16} />
                <span>Transmit Message</span>
              </button>
            </form>
          )}
        </div>

        {/* Contact Info & Meta Details */}
        <div className="contact-sidebar">
          <div className="card">
            <h3 className="section-title">Support Channels</h3>
            <div className="contact-channels-list">
              <div className="channel-item">
                <div className="channel-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="channel-title">Direct Email</div>
                  <div className="channel-val">support@taskflow.dev</div>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="channel-title">Developer Hotline</div>
                  <div className="channel-val">+1 (555) 019-2834</div>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="channel-title">Engineering HQ</div>
                  <div className="channel-val">Tech Innovation Park, Campus II</div>
                </div>
              </div>

              <div className="channel-item">
                <div className="channel-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="channel-title">System Status</div>
                  <div className="channel-val" style={{ color: 'var(--success)' }}>
                    All Systems Operational (100% Uptime)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ summary */}
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--text-muted)' }} />
              <h3 className="section-title" style={{ margin: 0 }}>Frequently Asked Questions</h3>
            </div>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <h4 className="faq-question">{faq.q}</h4>
                  <p className="faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
