import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseConfig } from "../firebase/config";

// 서버 전용. 교사 기능의 서버 코드(Route Handler 등)는 처리 전에 반드시 verifyTeacher를 거칩니다.
// Firebase가 발급한 ID 토큰을 Google 공개키로 직접 검증하므로 비밀키(서비스 계정)가 필요 없습니다.

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "not-configured" | "no-token" | "invalid-token" | "not-allowed" };

export async function verifyTeacher(authorization: string | null): Promise<TeacherCheck> {
  const allowedEmail = process.env.TEACHER_EMAIL?.trim().toLowerCase();
  if (!allowedEmail) return { ok: false, reason: "not-configured" };

  const token = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { ok: false, reason: "no-token" };

  let payload;
  try {
    ({ payload } = await jwtVerify(token, GOOGLE_KEYS, {
      issuer: `https://securetoken.google.com/${firebaseConfig.projectId}`,
      audience: firebaseConfig.projectId,
    }));
  } catch {
    return { ok: false, reason: "invalid-token" };
  }

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  if (!email || payload.email_verified !== true || email !== allowedEmail) {
    return { ok: false, reason: "not-allowed" };
  }
  return { ok: true, email };
}
