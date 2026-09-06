import React, { useState } from 'react';
import { Journal, JournalAnalysis } from '../../services/api';

interface JournalWorkspaceProps {
  journal: Journal | null;
  isCreatingNew: boolean;
  onSaveNew: (title: string, content: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
}

export const JournalWorkspace: React.FC<JournalWorkspaceProps> = ({
  journal,
  isCreatingNew,
  onSaveNew,
  onSendMessage,
  sendingMessage,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveNew(newTitle, newContent);
      setNewTitle('');
      setNewContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMessage) return;
    const msg = chatInput;
    setChatInput('');
    await onSendMessage(msg);
  };

  if (isCreatingNew) {
    return (
      <div className="workspace-panel">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>✍️ Compose New Journal Entry</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Protected with Zero-Trust Firestore tenant isolation and secure Gemini cognitive analysis.
          </p>
        </div>

        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Entry Title
            </label>
            <input
              type="text"
              className="text-input"
              style={{ width: '100%' }}
              placeholder="How are you feeling today? Or what idea would you like to explore?..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Reflections & Thoughts
            </label>
            <textarea
              className="text-input"
              style={{ width: '100%', minHeight: '220px', resize: 'vertical' }}
              placeholder="Write freely about your day or challenges. Gemini will listen empathetically and generate cognitive insights..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}
          >
            {isSubmitting ? 'Analyzing & Securing with Gemini...' : 'Save & Analyze with Gemini'}
          </button>
        </form>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="workspace-panel" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
        <h3>Select an entry or compose a new journal</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          All conversations and reflections are securely isolated and strictly confidential to your account.
        </p>
      </div>
    );
  }

  const analysis: JournalAnalysis | undefined = journal.analysis;

  return (
    <div className="workspace-panel">
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{journal.title}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date(journal.createdAt).toLocaleString('en-US')}
          </span>
        </div>
      </div>

      {/* Original Feature: AI Emotional Weather & Semantic Insights */}
      {analysis && (
        <div className="enrichment-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)' }}>
              ⚡ AI Emotional Weather & Semantic Intelligence
            </span>
            <div className="badge-row">
              <span className="badge mood-badge">Mood: {analysis.mood}</span>
              <span className="badge energy-badge">Energy: {analysis.energyLevel}</span>
            </div>
          </div>

          {analysis.summary && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
              &ldquo;{analysis.summary}&rdquo;
            </p>
          )}

          {analysis.mindfulnessPrompt && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-amber)', fontSize: '0.85rem' }}>
              <strong>💡 Mindfulness Reflection: </strong>
              {analysis.mindfulnessPrompt}
            </div>
          )}

          {analysis.keywords && (
            <div className="badge-row">
              {analysis.keywords.map(kw => (
                <span key={kw} className="badge">#{kw}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Multi-turn ongoing conversation */}
      <div className="chat-container">
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Dialogue Stream with Gemini</h4>

        {(journal.turns || []).map((turn, idx) => (
          <div
            key={idx}
            className={`turn-bubble ${turn.role === 'user' ? 'turn-user' : 'turn-model'}`}
          >
            <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem', color: turn.role === 'user' ? 'var(--accent-teal)' : 'var(--primary)' }}>
              {turn.role === 'user' ? '👤 YOU' : '✨ GEMINI ASSISTANT'}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{turn.content}</div>
          </div>
        ))}
      </div>

      {/* Multi-turn Chat Input */}
      <form onSubmit={handleSendChat} className="chat-input-row">
        <input
          type="text"
          className="text-input"
          placeholder="Continue reflecting or brainstorming with Gemini..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          disabled={sendingMessage}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={sendingMessage || !chatInput.trim()}
        >
          {sendingMessage ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
