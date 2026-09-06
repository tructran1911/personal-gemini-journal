# THREAT MODEL & SECURITY POSTURE: PERSONAL GEMINI JOURNAL
**Framework**: STRIDE Threat Modeling & OWASP Top 10 for LLM Applications

---

## 1. THREAT ANALYSIS MATRIX (MA TRẬN PHÂN TÍCH ĐE DỌA THEO STRIDE)

| Phân loại (STRIDE) | Rủi ro cụ thể trong GenAI Journal | Biện pháp kỹ thuật kiểm soát (Technical Mitigations) |
| :--- | :--- | :--- |
| **S - Spoofing (Giả mạo)** | Hacker mạo danh User A để yêu cầu xem toàn bộ nhật ký nhạy cảm | - Client xác thực qua Firebase Auth để nhận ID Token (JWT).<br/>- Backend kiểm tra cryptographic signature của JWT thông qua Firebase Admin SDK.<br/>- UID của người dùng được trích xuất trực tiếp từ token đã giải mã (`decodedToken.uid`), hoàn toàn vô hiệu hóa việc truyền UID giả mạo trong request body. |
| **T - Tampering (Xáo trộn)** | Thay đổi thông tin nhật ký hoặc can thiệp vào ngữ cảnh chat giữa chừng | - Firestore Security Rules từ chối ghi nếu `request.resource.data.userId != request.auth.uid`.<br/>- Ngăn chặn chỉnh sửa trường `userId` hoặc thời gian tạo gốc `createdAt`.<br/>- Input validation kiểm tra kiểu dữ liệu và độ dài chuỗi trước khi lưu trữ. |
| **R - Repudiation (Chối bỏ)** | Người dùng chối bỏ việc tạo bài viết hoặc xóa lịch sử | - Ghi nhận `createdAt`, `updatedAt` tự động bằng Firebase ServerTimestamp.<br/>- Audit log tại Backend theo dõi các hành vi xóa/sửa với Request ID và hashed user identifiers. |
| **I - Information Disclosure (Lộ lọt thông tin)** | Lộ Gemini API Key trong source code frontend hoặc đọc chéo dữ liệu người dùng | - **Secret Manager Integration**: Khóa Gemini API không bao giờ được gửi tới trình duyệt, được quản lý ở tầng GCP Secret Manager.<br/>- **Strict Collection Scoping**: Phân cấp dữ liệu theo đường dẫn `/users/{uid}/journals/{id}` thay vì bảng phẳng dùng chung. Rule `Default Deny` chặn triệt để mọi truy cập ngang hàng (Horizontal Privilege Escalation). |
| **D - Denial of Service (Từ chối dịch vụ)** | Kẻ tấn công gửi đoạn văn bản hàng triệu ký tự hoặc spam API gây cạn kiệt ngân sách AI | - Express `rate-limit` chặn IP/User gửi quá 30 requests/phút.<br/>- Giới hạn payload JSON tối đa 1MB, cắt gọn nội dung gửi tới Gemini tối đa 10,000 ký tự.<br/>- Thiết lập `maxOutputTokens` an toàn cho phản hồi từ Gemini. |
| **E - Elevation of Privilege (Leo thang đặc quyền)** | Người dùng chiếm đoạt quyền quản trị Firestore hoặc điều khiển mô hình AI | - Sử dụng Least Privilege IAM Service Account cho backend.<br/>- Cấm hoàn toàn việc dùng tài khoản Service Account có quyền Owner trên môi trường Production.<br/>- Không có khái niệm user tự gán role admin qua Firestore rules. |

---

## 2. PHÒNG THỦ CÁC LỖ HỔNG ĐẶC THÙ LLM (OWASP FOR LLM)
1. **LLM01: Prompt Injection**:
   - Sử dụng tách bạch ranh giới: `systemInstruction` chứa Hiến pháp bảo mật độc lập với `contents` của người dùng.
   - Thử nghiệm tấn công jailbreak chuẩn hóa (DAN, adversarial prefixes) để đảm bảo mô hình không rò rỉ prompt lõi.
2. **LLM02: Insecure Output Handling**:
   - Dữ liệu phản hồi từ Gemini được sanitize và render an toàn trên giao diện React (chống XSS).
   - Phần phân tích metadata JSON được parse với kiểm tra schema (Zod/TypeScript checks), dự phòng trường hợp AI sinh sai định dạng.
3. **LLM06: Sensitive Information Disclosure**:
   - Chỉ thị hệ thống cấm Gemini ghi nhớ hay lặp lại các thông tin nhạy cảm vào các phản hồi phân tích ngoài mục đích hỗ trợ cá nhân.
