export interface JournalAnalysis {
  mood: string;
  energyLevel: 'Low' | 'Medium' | 'High';
  keywords: string[];
  summary: string;
  mindfulnessPrompt: string;
}

export interface Turn {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Journal {
  id: string;
  userId: string;
  title: string;
  content: string;
  analysis?: JournalAnalysis;
  turns?: Turn[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8080/api';

export async function fetchJournals(idToken: string): Promise<Journal[]> {
  const res = await fetch(`${API_BASE}/journals`, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Không thể tải nhật ký. Trạng thái: ' + res.status);
  const data = await res.json();
  return data.data;
}

export async function createJournal(
  idToken: string,
  title: string,
  content: string
): Promise<Journal> {
  const res = await fetch(`${API_BASE}/journals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Lỗi khi tạo nhật ký. Trạng thái: ' + res.status);
  const data = await res.json();
  return data.data;
}

export async function sendChatMessage(
  idToken: string,
  journalId: string,
  message: string
): Promise<{ reply: string; analysis?: JournalAnalysis; journal: Journal }> {
  const res = await fetch(`${API_BASE}/journals/${journalId}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Lỗi gửi tin nhắn tới Gemini: ' + res.status);
  return await res.json();
}
