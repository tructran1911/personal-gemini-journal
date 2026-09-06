# THREAT MODEL & SECURITY POSTURE: PERSONAL GEMINI JOURNAL
**Framework**: STRIDE Threat Modeling & OWASP Top 10 for LLM Applications

---

## 1. THREAT ANALYSIS MATRIX (STRIDE METHODOLOGY)

| Threat Category (STRIDE) | Attack Scenario in GenAI Journal | Technical Mitigations Enforced |
| :--- | :--- | :--- |
| **S - Spoofing** | Attacker impersonates User A to read private journal reflections | - Client authenticates via Firebase Auth to obtain a signed ID Token (JWT).<br/>- Backend cryptographically verifies the token signature using Firebase Admin SDK.<br/>- User ID (`uid`) is extracted directly from the verified token (`decodedToken.uid`), rejecting any client-supplied body IDs. |
| **T - Tampering** | Malicious alteration of journal content or cross-tenant context injection | - Cloud Firestore Security Rules reject mutations where `request.resource.data.userId != request.auth.uid`.<br/>- Immutable fields: `userId` and `createdAt` cannot be altered once written.<br/>- Server-side input validation and strict typing on all payloads. |
| **R - Repudiation** | User denies creating, editing, or deleting a journal log | - Automated timestamps generated via Firebase `serverTimestamp()`.<br/>- Audit logs record transaction IDs, actions, and hashed user identifiers without exposing entry bodies. |
| **I - Information Disclosure** | Exposure of Gemini API keys or cross-user database leakage | - **Secret Manager Integration**: API keys never reach the browser; retrieved dynamically via GCP Secret Manager on the server.<br/>- **Strict Sub-collection Scoping**: `/users/{uid}/journals/{id}` isolation with `Default Deny` security rules eliminates cross-tenant access. |
| **D - Denial of Service** | Flooding backend with millions of tokens or continuous chat loops | - Express `rate-limit` enforces a 60 requests/minute quota per client IP.<br/>- JSON payloads are capped at 1MB, input text is truncated to 10,000 characters before sending to Gemini.<br/>- Safe `maxOutputTokens` constraints set on LLM responses. |
| **E - Elevation of Privilege** | Standard user attempts administrative database access | - Backend runs with Least Privilege IAM Service Account permissions.<br/>- Production environments disallow Service Accounts with Project Owner roles.<br/>- Zero client-side privilege escalation paths in Firestore rules. |

---

## 2. DEFENSE AGAINST OWASP TOP 10 FOR LLMS
1. **LLM01: Prompt Injection**:
   - Explicit separation between system instructions and untrusted user input using the native SDK parameter fields.
   - Built-in jailbreak rejection preserving the core journaling persona.
2. **LLM02: Insecure Output Handling**:
   - Model responses are sanitized and safely parsed before client rendering to prevent XSS.
   - Analytical JSON payloads are validated with fallbacks in case of non-conforming model completions.
3. **LLM06: Sensitive Information Disclosure**:
   - Custom instructions command Gemini to never reveal internal prompts, keys, or architectural blueprints.
