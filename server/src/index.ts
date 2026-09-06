import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initializeFirebaseAdmin, requireAuth } from './middleware/auth';
import journalRoutes from './routes/journal';

dotenv.config();

// Khởi tạo Firebase Admin SDK
initializeFirebaseAdmin(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

const app = express();
const PORT = process.env.PORT || 8080;

// Cấu hình Bảo vệ HTTP Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Phục vụ SPA frontend tĩnh an toàn trên Cloud Run
}));

// Giới hạn tần suất gọi API (Rate Limiter) - Phòng chống DoS & Brute Force
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 60, // Tối đa 60 requests/phút mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Tần suất gửi yêu cầu quá nhanh, vui lòng thử lại sau giây lát.' }
});
app.use('/api/', apiLimiter);

// Cấu hình CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Health check endpoint cho Cloud Run Liveness/Readiness Probes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Personal Gemini Journal on Google Cloud Run',
    securityProfile: 'Zero-Trust Defense-in-Depth',
    secretManagement: 'Google Cloud Secret Manager Enabled'
  });
});

// Gắn middleware xác thực cho tất cả routes nhật ký
app.use('/api/journals', requireAuth as any, journalRoutes);

// Phục vụ tệp tĩnh React Frontend khi triển khai trên Cloud Run (Single Container Monolith)
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(publicDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('Personal Gemini Journal API is running. (Frontend building...)');
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Secure Server] Personal Gemini Journal running on port ${PORT}`);
  console.log(`[Security] Auth: Firebase Admin JWT Required | Database: Isolated Firestore`);
});
