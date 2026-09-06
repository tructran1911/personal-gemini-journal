import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Interface mở rộng Request để đính kèm thông tin người dùng đã xác thực
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

let firebaseAppInitialized = false;

export function initializeFirebaseAdmin(serviceAccountJson?: string) {
  if (firebaseAppInitialized) return;
  try {
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
      console.log('[Auth] Firebase Admin initialized with custom service account credentials.');
    } else {
      admin.initializeApp();
      console.log('[Auth] Firebase Admin initialized with application default credentials.');
    }
    firebaseAppInitialized = true;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn('[Auth] Firebase Admin initialization note:', errorMessage);
  }
}

/**
 * Middleware bảo vệ API:
 * 1. Bắt buộc header Authorization: Bearer <ID_TOKEN>
 * 2. Giải mã và kiểm tra chữ ký cryptographic của token bằng Firebase Admin
 * 3. Trích xuất UID và gắn vào req.user (tuyệt đối không tin tưởng UID do client tự khai báo trong body)
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Bearer token required.',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    // Với môi trường dev demo hoặc mock mode nếu chưa nối Firebase live:
    if (process.env.ALLOW_MOCK_AUTH === 'true' && idToken.startsWith('mock_token_')) {
      const mockUid = idToken.replace('mock_token_', '');
      req.user = {
        uid: mockUid,
        email: `${mockUid}@demo.secure.local`,
        name: `Demo User (${mockUid})`,
      };
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Auth] Token verification failed:', errorMessage);
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid, expired, or untrusted Firebase authentication token.',
    });
    return;
  }
}
