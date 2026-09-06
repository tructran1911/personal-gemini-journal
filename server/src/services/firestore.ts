import * as admin from 'firebase-admin';
import { JournalAnalysis } from './gemini';

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  content: string;
  analysis?: JournalAnalysis;
  createdAt: FirebaseFirestore.Timestamp | Date | string;
  updatedAt: FirebaseFirestore.Timestamp | Date | string;
  turns?: Array<{
    role: 'user' | 'model';
    content: string;
    timestamp: Date | string;
  }>;
}

// Bộ lưu trữ in-memory cô lập dành cho dev local nếu chưa gắn Cloud Firestore live credentials
const inMemoryIsolatedStore: Map<string, Map<string, JournalEntry>> = new Map();

/**
 * Lấy Firestore instance (nếu có kết nối Firebase Admin hợp lệ)
 */
function getDb() {
  try {
    return admin.firestore();
  } catch {
    return null;
  }
}

/**
 * Lưu bài viết nhật ký mới với sự cô lập tuyệt đối theo userId
 */
export async function createJournal(userId: string, entry: Omit<JournalEntry, 'userId' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
  const db = getDb();
  const now = new Date();

  const newEntry: JournalEntry = {
    ...entry,
    userId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    turns: entry.turns || [],
  };

  if (db) {
    try {
      // Đường dẫn cô lập: /users/{userId}/journals/{journalId}
      const docRef = db.collection('users').doc(userId).collection('journals').doc();
      newEntry.id = docRef.id;
      await docRef.set({
        ...newEntry,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return newEntry;
    } catch (e) {
      console.warn('[Firestore] Live write failed, saving to isolated in-memory store:', e);
    }
  }

  // Fallback in-memory database với sự cô lập tuyệt đối theo userId (User Partition)
  if (!inMemoryIsolatedStore.has(userId)) {
    inMemoryIsolatedStore.set(userId, new Map());
  }
  const userMap = inMemoryIsolatedStore.get(userId)!;
  const generatedId = 'journal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  newEntry.id = generatedId;
  userMap.set(generatedId, newEntry);

  return newEntry;
}

/**
 * Lấy tất cả nhật ký chỉ thuộc về userId yêu cầu (Zero Cross-user leakage)
 */
export async function listJournals(userId: string): Promise<JournalEntry[]> {
  const db = getDb();

  if (db) {
    try {
      const snapshot = await db.collection('users').doc(userId).collection('journals')
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
    } catch (e) {
      console.warn('[Firestore] Live list failed, retrieving from isolated in-memory store:', e);
    }
  }

  const userMap = inMemoryIsolatedStore.get(userId);
  if (!userMap) return [];
  return Array.from(userMap.values()).sort((a, b) => 
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
  );
}

/**
 * Lấy chi tiết 1 nhật ký cụ thể, đảm bảo chỉ người sở hữu mới được xem
 */
export async function getJournalById(userId: string, journalId: string): Promise<JournalEntry | null> {
  const db = getDb();

  if (db) {
    try {
      const doc = await db.collection('users').doc(userId).collection('journals').doc(journalId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as JournalEntry;
    } catch (e) {
      console.warn('[Firestore] Live get failed, retrieving from in-memory:', e);
    }
  }

  const userMap = inMemoryIsolatedStore.get(userId);
  if (!userMap) return null;
  return userMap.get(journalId) || null;
}

/**
 * Thêm một lượt hội thoại (turn) vào nhật ký
 */
export async function addConversationTurn(
  userId: string, 
  journalId: string, 
  userText: string, 
  aiReply: string,
  analysis?: JournalAnalysis
): Promise<JournalEntry | null> {
  const journal = await getJournalById(userId, journalId);
  if (!journal) return null;

  const turns = journal.turns || [];
  turns.push(
    { role: 'user', content: userText, timestamp: new Date().toISOString() },
    { role: 'model', content: aiReply, timestamp: new Date().toISOString() }
  );

  journal.turns = turns;
  journal.updatedAt = new Date().toISOString();
  if (analysis) {
    journal.analysis = analysis;
  }

  const db = getDb();
  if (db) {
    try {
      await db.collection('users').doc(userId).collection('journals').doc(journalId).update({
        turns,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(analysis ? { analysis } : {})
      });
      return journal;
    } catch (e) {
      console.warn('[Firestore] Live update turns failed, saving in-memory:', e);
    }
  }

  const userMap = inMemoryIsolatedStore.get(userId);
  if (userMap) {
    userMap.set(journalId, journal);
  }
  return journal;
}
