import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';

dotenv.config();

let secretClient: SecretManagerServiceClient | null = null;

try {
  secretClient = new SecretManagerServiceClient();
} catch {
  console.log('[Secrets] SecretManagerServiceClient initialized in fallback mode');
}

/**
 * Lấy giá trị Secret an toàn từ Google Cloud Secret Manager.
 * Có cơ chế fallback về biến môi trường (Environment Variable) cho môi trường dev local.
 */
export async function getSecret(secretName: string, fallbackEnvVar: string): Promise<string> {
  const gcpProjectId = process.env.GCP_PROJECT_ID;
  
  if (secretClient && gcpProjectId) {
    try {
      const name = `projects/${gcpProjectId}/secrets/${secretName}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (payload) {
        console.log(`[Secrets] Successfully loaded secret [${secretName}] from GCP Secret Manager.`);
        return payload;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[Secrets] Warning: Could not retrieve secret [${secretName}] from GCP Secret Manager: ${errorMessage}. Falling back to env.`);
    }
  }

  // Fallback sang biến môi trường nếu Secret Manager chưa cấu hình trên môi trường dev
  const fallbackVal = process.env[fallbackEnvVar];
  if (!fallbackVal) {
    throw new Error(`[Secrets] Critical Error: Secret [${secretName}] and fallback env [${fallbackEnvVar}] are both missing!`);
  }
  return fallbackVal;
}
