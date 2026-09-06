import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin, requireAuth } from './middleware/auth';
import journalRoutes from './routes/journal';

dotenv.config();

// Khởi tạo Firebase Admin SDK
initializeFirebaseAdmin(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

const app = express();
const PORT = process.env.PORT || 4000;

// Cấu hình Bảo vệ HTTP Headers (Helmet)
app.use(helmet());

// Giới hạn tần suất gọi API (Rate Limiter) - Phòng chống DoS & Brute Force
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 60, // Tối đa 60 requests/phút mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Tần suất gửi yêu cầu quá nhanh, vui lòng thử lại sau giây lát.' }
});
app.use('/api/', apiLimiter);

// Cấu hình CORS chặt chẽ
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    securityProfile: 'Zero-Trust Defense-in-Depth',
    secretManagement: 'Google Cloud Secret Manager Enabled'
  });
});

// Gắn middleware xác thực cho tất cả routes nhật ký
app.use('/api/journals', requireAuth as any, journalRoutes);

app.listen(PORT, () => {
  console.log(`[Secure Server] Personal Gemini Journal API running on port ${PORT}`);
  console.log(`[Security] Auth: Firebase Admin JWT Required | Database: Isolated Firestore`);
});
