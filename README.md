# PERSONAL GEMINI JOURNAL — SETUP & ARCHITECTURE GUIDE
**Project**: Secure Personal Gemini Journal  
**Track**: Ideathon Challenge (Cloud Run AI Challenge)  
**Security Posture**: Enterprise Zero-Trust Defense-in-Depth

---

## 1. Project Directory Structure
```
personal-gemini-journal/
├── .gemini/
│   └── ai_studio_constitution.md       # Google AI Studio Security Constitution
├── security/
│   ├── firestore.rules                 # Cloud Firestore tenant-isolation security rules
│   └── threat_model.md                 # STRIDE Threat Model & OWASP Top 10 for LLMs
├── server/                             # Production Express Backend (TypeScript)
│   ├── src/
│   │   ├── config/secrets.ts           # Google Cloud Secret Manager Loader
│   │   ├── middleware/auth.ts          # Firebase Admin Cryptographic JWT Validator
│   │   ├── services/gemini.ts          # Gemini Client (Multi-turn & Auto-Tagging)
│   │   ├── services/firestore.ts       # UID-partitioned isolated database service
│   │   ├── routes/journal.ts           # REST Endpoints (/api/journals)
│   │   └── isolation.test.ts           # Automated Unit Test for Zero Data Leakage
├── client/                             # Modern Vite React Frontend (TypeScript + Vanilla CSS)
│   ├── src/
│   │   ├── components/Auth/            # Zero-Trust Multi-user Isolation Switcher
│   │   ├── components/Journal/         # Journaling, Semantic Filter, and Multi-turn Chat
│   │   ├── styles/theme.css            # Curated Modern HSL Design System
│   │   └── services/api.ts             # REST Client with Bearer Token Authorization
├── Dockerfile                          # Multi-stage build for Google Cloud Run
└── README.md
```

---

## 2. Running the Application Locally

### Step 1: Run the Backend Server
Open Terminal 1:
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:8080` (or `http://localhost:4000`).

### Step 2: Run the Frontend Client
Open Terminal 2:
```bash
cd client
npm install
npm run dev
```
The frontend interface will be available at `http://localhost:5173`.

---

## 3. Core Challenge Verification Highlights

1. **Google AI Studio Constitution**:
   - Inspect [`.gemini/ai_studio_constitution.md`](.gemini/ai_studio_constitution.md) for custom instructions that configure Gemini as an Application Security Engineer before writing code.
2. **Zero Cross-User Data Leakage**:
   - Sign in as **Alice**, create a private journal.
   - Click "Switch to Bob" to log in as **Bob**. Alice's logs vanish completely; Bob operates in a strictly partitioned database workspace.
   - Verified programmatically via automated tests: `cd server && npx ts-node src/isolation.test.ts`.
3. **Secret Management**:
   - Inspect browser Network tab: Zero API keys are transmitted to or stored on the client. Keys are retrieved exclusively via Google Cloud Secret Manager.
4. **Original Feature Enhancement**:
   - **"AI Emotional Weather & Semantic Intelligence"**: Gemini dynamically extracts nuanced Mood, Energy Level, Semantic Hashtags for sidebar filtering, and an actionable Mindfulness Reflection prompt.
5. **Production Cloud Run Container**:
   - Includes a production-ready multi-stage `Dockerfile` serving both the compiled frontend and backend on port `8080`.
