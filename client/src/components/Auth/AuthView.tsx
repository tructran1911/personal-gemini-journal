import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInMock } = useAuth();

  return (
    <div className="auth-hero">
      <div className="auth-card">
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
        <h2>Personal Gemini Journal</h2>
        <p>Không gian nhật ký tự sự và sáng tạo bảo mật cấp cao với Google Gemini</p>

        <div className="security-highlights">
          <div className="security-tag">🔒 Zero-Trust Data Isolation</div>
          <div>Mỗi người dùng sở hữu không gian phân vùng độc lập tuyệt đối. Zero cross-user data leakage.</div>
          <div className="security-tag" style={{ color: 'var(--accent-purple)', marginTop: '0.4rem' }}>
            🔑 Google Cloud Secret Manager
          </div>
          <div>Gemini API Keys được khóa kín ở backend máy chủ, không bao giờ lộ ra trình duyệt.</div>
          <div className="security-tag" style={{ color: 'var(--accent-amber)', marginTop: '0.4rem' }}>
            ⚡ AI Emotional Weather & Semantic Engine
          </div>
          <div>Tự động gắn thẻ, nhận diện sắc thái tâm lý và gợi ý bài học phát triển cá nhân.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => signInMock('alice')}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Đăng nhập với Alice (Security Architect)
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={() => signInMock('bob')}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            Đăng nhập với Bob (Frontend Lead)
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          *Thử nghiệm chuyển đổi qua lại giữa Alice và Bob để chứng thực tính năng cô lập dữ liệu 100% không rò rỉ.
        </p>
      </div>
    </div>
  );
};
