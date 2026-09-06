import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createJournal, listJournals, getJournalById, addConversationTurn } from '../services/firestore';
import { processJournalConversation } from '../services/gemini';

const router = Router();

// Retrieve all journals for the authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const journals = await listJournals(userId);
    res.json({ success: true, count: journals.length, data: journals });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Internal Error', message: msg });
  }
});

// Create a new journal entry with initial Gemini cognitive analysis
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Bad Request', message: 'Title and content are required.' });
      return;
    }

    // Call Gemini with constitution guardrails
    let aiResponse;
    try {
      aiResponse = await processJournalConversation([], content);
    } catch (e) {
      console.warn('[JournalRoute] Gemini processing fallback:', e);
      aiResponse = {
        reply: 'Journal saved securely. (AI reflection is currently operating in offline mode).',
        analysis: {
          mood: 'Reflective',
          energyLevel: 'Medium' as const,
          keywords: ['journal', 'daily-reflection'],
          summary: title,
          mindfulnessPrompt: 'What brought you the greatest sense of calm or focus today?'
        }
      };
    }

    const journal = await createJournal(userId, {
      title,
      content,
      analysis: aiResponse.analysis,
      turns: [
        { role: 'user', content, timestamp: new Date().toISOString() },
        { role: 'model', content: aiResponse.reply, timestamp: new Date().toISOString() }
      ]
    });

    res.status(201).json({ success: true, data: journal });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Internal Error', message: msg });
  }
});

// Multi-turn ongoing conversation with Gemini inside a journal entry
router.post('/:journalId/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const journalId = Array.isArray(req.params.journalId) ? req.params.journalId[0] : req.params.journalId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Message text is required.' });
      return;
    }

    // Verify journal ownership
    const existingJournal = await getJournalById(userId, journalId);
    if (!existingJournal) {
      res.status(404).json({ error: 'Not Found', message: 'Journal not found or access denied.' });
      return;
    }

    // Format chat history for Gemini API
    const history = (existingJournal.turns || []).map(turn => ({
      role: turn.role,
      parts: [{ text: turn.content }]
    }));

    let aiResult;
    try {
      aiResult = await processJournalConversation(history, message);
    } catch (e) {
      console.warn('[JournalChat] Gemini call fallback:', e);
      aiResult = {
        reply: 'I am listening to your thoughts. Feel free to continue reflecting.',
      };
    }

    const updatedJournal = await addConversationTurn(userId, journalId, message, aiResult.reply, aiResult.analysis);

    res.json({
      success: true,
      reply: aiResult.reply,
      analysis: aiResult.analysis,
      journal: updatedJournal
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Internal Error', message: msg });
  }
});

export default router;
