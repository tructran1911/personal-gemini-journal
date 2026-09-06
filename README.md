# PERSONAL GEMINI JOURNAL — SETUP & DEMO GUIDE
**Mục tiêu**: Hướng dẫn khởi chạy và kiểm thử kiến trúc bảo mật toàn diện của ứng dụng Personal Gemini Journal.

---

## 1. Cấu trúc Thư mục Dự án
```
personal-gemini-journal/
├── .gemini/
│   └── ai_studio_constitution.md       # Hiến pháp an ninh cho AI Studio
├── security/
│   ├── firestore.rules                 # Quy tắc Firestore cô lập dữ liệu
│   └── threat_model.md                 # Phân tích đe dọa chuẩn STRIDE & OWASP LLM
├── server/                             # Backend API bảo mật (Express + TypeScript)
│   ├── src/
│   │   ├── config/secrets.ts           # GCP Secret Manager Loader
│   │   ├── middleware/auth.ts          # Firebase Admin JWT Validator
│   │   ├── services/gemini.ts          # Gemini Client (Multi-turn + Auto-Tagging)
│   │   ├── services/firestore.ts       # Database Partitioning theo User UID
│   │   ├── routes/journal.ts           # REST Endpoints
│   │   └── isolation.test.ts           # Unit test kiểm chứng Zero Data Leakage
├── client/                             # Frontend React (TypeScript + Vite)
│   ├── src/
│   │   ├── components/Auth/            # Switcher mô phỏng Multi-user Isolation
│   │   ├── components/Journal/         # Giao diện viết nhật ký, tags & multi-turn chat
│   │   ├── styles/theme.css            # Vanilla CSS tinh tế, responsive
│   │   └── services/api.ts             # REST Client với Bearer Authorization
```

---

## 2. Cách Chạy Ứng Dụng (Local Development)

### Bước 1: Chạy Backend Server
Mở terminal 1:
```bash
cd server
npm install
npm run dev
```
Server sẽ khởi chạy tại `http://localhost:4000` (hoặc `http://localhost:8080`).

### Bước 2: Chạy Frontend Client
Mở terminal 2:
```bash
cd client
npm install
npm run dev
```
Giao diện sẽ hiển thị tại `http://localhost:5173`.

---

## 3. Các Điểm Kiểm Thử Trọng Yếu (Evaluation Points)
1. **Google AI Studio Constitution**: Xem tài liệu [`ai_studio_constitution.md`](.gemini/ai_studio_constitution.md) để nạp vào mục System Instructions trên Google AI Studio.
2. **Zero Cross-User Leakage**: 
   - Đăng nhập với tài khoản **Alice**, tạo một nhật ký.
   - Nhấn nút "Chuyển nhanh sang Bob", đăng nhập với tài khoản **Bob**. Toàn bộ dữ liệu của Alice biến mất hoàn toàn, danh sách bài viết của Bob là một không gian độc lập.
3. **Secret Security**:
   - Mở DevTools Network Tab trên trình duyệt: Không hề có bất kỳ API key nào được gửi qua mạng hay lưu trong mã nguồn frontend. Khóa được quản lý hoàn toàn ở server qua GCP Secret Manager.
4. **Original Feature Enhancement**:
   - Ngay khi lưu bài viết hoặc trò chuyện đa lượt, Gemini kích hoạt bộ máy **"AI Emotional Weather & Semantic Intelligence"** trích xuất:
     - Mood (Sắc thái tâm lý đa chiều)
     - Energy Level (Mức năng lượng)
     - Semantic Tags (Thẻ chủ đề để lọc bài viết ở sidebar)
     - Actionable Mindfulness Prompt (Câu hỏi chiêm nghiệm gợi mở)
