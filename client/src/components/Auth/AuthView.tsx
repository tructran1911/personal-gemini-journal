import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInMock } = useAuth();

  return (
    <div className="auth-hero">
      <div className="auth-card">
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
        <h2>Personal Gemini Journal</h2>
        <p>Enterprise-grade secure journaling & cognitive brainstorming with Google Gemini</p>

        <div className="security-highlights">
          <div className="security-tag">🔒 Zero-Trust Data Isolation</div>
          <div>Every user is partitioned to their own Firestore subcollection. Zero cross-user data leakage.</div>
          <div className="security-tag" style={{ color: 'var(--accent-purple)', marginTop: '0.4rem' }}>
            🔑 Google Cloud Secret Manager
          </div>
          <div>Gemini API keys are securely retrieved on the server. Never exposed to browser runtimes.</div>
          <div className="security-tag" style={{ color: 'var(--accent-amber)', marginTop: '0.4rem' }}>
            ⚡ AI Emotional Weather & Semantic Engine
          </div>
          <div>Automated mood detection, energy level scoring, semantic hashtagging, and actionable mindfulness reflection prompts.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => signInMock('alice')}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Sign In as Alice (Security Architect)
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={() => signInMock('bob')}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Sign In as Bob (Frontend Lead)
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          *Switch seamlessly between Alice and Bob to demonstrate zero cross-user database leakage.
        </p>
      </div>
    </div>
  );
};
