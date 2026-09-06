import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { initializeFirebaseAdmin, requireAuth } from './middleware/auth';
import journalRoutes from './routes/journal';

dotenv.config();

// Initialize Firebase Admin SDK
initializeFirebaseAdmin(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

const app = express();
const PORT = process.env.PORT || 8080;

// Configure Helmet HTTP Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Allows hosting Vite SPA frontend securely on Cloud Run
}));

// Rate Limiter - Defense against Denial of Service and Brute-force attacks
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Maximum 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Request quota exceeded. Please wait a moment.' }
});
app.use('/api/', apiLimiter);

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Health check endpoint for Cloud Run Liveness and Readiness probes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Personal Gemini Journal on Google Cloud Run',
    securityProfile: 'Zero-Trust Defense-in-Depth',
    secretManagement: 'Google Cloud Secret Manager Enabled'
  });
});

// Guard journal routes with Firebase JWT Authentication
app.use('/api/journals', requireAuth as any, journalRoutes);

// Serve static React SPA on Google Cloud Run (Single-container deployment)
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
