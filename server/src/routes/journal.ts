import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createJournal, listJournals, getJournalById, addConversationTurn } from '../services/firestore';
import { processJournalConversation } from '../services/gemini';

const router = Router();

// Lấy danh sách nhật ký của người dùng hiện tại
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

// Tạo nhật ký mới kèm tương tác khởi tạo từ Gemini
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Bad Request', message: 'Title and content are required.' });
      return;
    }

    // Phân tích và tương tác với Gemini
    let aiResponse;
    try {
      aiResponse = await processJournalConversation([], content);
    } catch (e) {
      console.warn('[JournalRoute] Gemini processing error:', e);
      aiResponse = {
        reply: 'Ghi chú đã được lưu bảo mật. (AI reflection hiện chưa khả dụng do thiếu API key).',
        analysis: {
          mood: 'Reflective',
          energyLevel: 'Medium' as const,
          keywords: ['journal', 'daily-thought'],
          summary: title,
          mindfulnessPrompt: 'Hôm nay điều gì khiến bạn cảm thấy bình yên nhất?'
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

// Trò chuyện đa lượt (Multi-turn ongoing conversation) với Gemini trong một trang nhật ký
router.post('/:journalId/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const journalId = Array.isArray(req.params.journalId) ? req.params.journalId[0] : req.params.journalId;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Bad Request', message: 'Message text is required.' });
      return;
    }

    // Kiểm tra quyền sở hữu bài viết
    const existingJournal = await getJournalById(userId, journalId);
    if (!existingJournal) {
      res.status(404).json({ error: 'Not Found', message: 'Journal not found or access denied.' });
      return;
    }

    // Định dạng lịch sử trò chuyện cho Gemini
    const history = (existingJournal.turns || []).map(turn => ({
      role: turn.role,
      parts: [{ text: turn.content }]
    }));

    let aiResult;
    try {
      aiResult = await processJournalConversation(history, message);
    } catch (e) {
      console.warn('[JournalChat] Gemini call failed:', e);
      aiResult = {
        reply: 'Tôi đang lắng nghe bạn. Hãy tiếp tục chia sẻ suy nghĩ nhé.',
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
