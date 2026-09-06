import React, { useState } from 'react';
import { Journal } from '../../services/api';

interface JournalListProps {
  journals: Journal[];
  activeJournalId: string | null;
  onSelectJournal: (id: string) => void;
  onNewJournalClick: () => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export const JournalSidebar: React.FC<JournalListProps> = ({
  journals,
  activeJournalId,
  onSelectJournal,
  onNewJournalClick,
  selectedTag,
  onSelectTag,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Tập hợp danh sách tất cả các tag độc nhất được Gemini sinh ra
  const allTags = Array.from(
    new Set(journals.flatMap(j => j.analysis?.keywords || []))
  );

  const filteredJournals = journals.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTag = selectedTag ? j.analysis?.keywords?.includes(selectedTag) : true;
    return matchSearch && matchTag;
  });

  return (
    <aside className="sidebar-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nhật ký cá nhân</h3>
        <button className="btn btn-primary" onClick={onNewJournalClick} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          + Viết mới
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Tìm kiếm nhật ký..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="text-input"
        style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
      />

      {allTags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Thẻ AI tự động (Semantic Tags)
          </div>
          <div className="badge-row" style={{ maxHeight: '70px', overflowY: 'auto' }}>
            <span 
              className={`badge ${selectedTag === null ? 'mood-badge' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectTag(null)}
            >
              Tất cả
            </span>
            {allTags.map(tag => (
              <span
                key={tag}
                className={`badge ${selectedTag === tag ? 'mood-badge' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="journal-list">
        {filteredJournals.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
            Chưa có bài viết nào phù hợp.
          </div>
        ) : (
          filteredJournals.map(item => (
            <div
              key={item.id}
              className={`journal-item ${item.id === activeJournalId ? 'active' : ''}`}
              onClick={() => onSelectJournal(item.id)}
            >
              <div className="journal-item-title">{item.title}</div>
              <div className="journal-item-meta">
                <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                {item.analysis?.mood && (
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                    {item.analysis.mood}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
