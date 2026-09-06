import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthView } from './components/Auth/AuthView';
import { JournalSidebar } from './components/Journal/JournalSidebar';
import { JournalWorkspace } from './components/Journal/JournalWorkspace';
import { Journal, fetchJournals, createJournal, sendChatMessage } from './services/api';

export const App: React.FC = () => {
  const { user, loading, signOut, signInMock } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  const loadJournals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchJournals(user.idToken);
      setJournals(data);
      if (data.length > 0 && !activeJournalId && !isCreatingNew) {
        setActiveJournalId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load journals:', err);
    }
  }, [user, activeJournalId, isCreatingNew]);

  useEffect(() => {
    if (user) {
      setActiveJournalId(null);
      setIsCreatingNew(false);
      setSelectedTag(null);
      loadJournals();
    } else {
      setJournals([]);
    }
  }, [user]);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <AuthView />;
  }

  const activeJournal = journals.find(j => j.id === activeJournalId) || null;

  const handleSaveNew = async (title: string, content: string) => {
    try {
      const created = await createJournal(user.idToken, title, content);
      setJournals(prev => [created, ...prev]);
      setActiveJournalId(created.id);
      setIsCreatingNew(false);
    } catch (err) {
      alert('Error creating journal: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeJournalId) return;
    setSendingMessage(true);
    try {
      const res = await sendChatMessage(user.idToken, activeJournalId, text);
      setJournals(prev => prev.map(j => (j.id === activeJournalId ? res.journal : j)));
    } catch (err) {
      alert('Error communicating with Gemini: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand-badge">
          <span className="shield-icon">🛡️</span>
          <span>Personal Gemini Journal</span>
        </div>

        <div className="user-controls">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            👤 {user.displayName} <span style={{ color: 'var(--accent-teal)', fontSize: '0.75rem' }}>[UID: {user.uid}]</span>
          </div>

          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={() => signInMock(user.uid.includes('alice') ? 'bob' : 'alice')}
          >
            Switch to {user.uid.includes('alice') ? 'Bob' : 'Alice'}
          </button>

          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={signOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content">
        <JournalSidebar
          journals={journals}
          activeJournalId={activeJournalId}
          onSelectJournal={(id) => {
            setActiveJournalId(id);
            setIsCreatingNew(false);
          }}
          onNewJournalClick={() => {
            setIsCreatingNew(true);
            setActiveJournalId(null);
          }}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />

        <JournalWorkspace
          journal={activeJournal}
          isCreatingNew={isCreatingNew}
          onSaveNew={handleSaveNew}
          onSendMessage={handleSendMessage}
          sendingMessage={sendingMessage}
        />
      </main>
    </div>
  );
};
