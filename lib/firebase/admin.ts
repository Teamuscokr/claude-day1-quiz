// 서버 전용. 화면 코드에서 불러오지 않습니다.
// 서버용 키는 코드에 넣지 않고 환경변수로만 받습니다.
// - 내 컴퓨터: .env.local의 GOOGLE_APPLICATION_CREDENTIALS = 키 파일 경로(프로젝트 폴더 밖)
// - Vercel: FIREBASE_SERVICE_ACCOUNT_JSON = 키 파일 내용 전체
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { firebaseConfig } from "./config";

export class ServerConfigError extends Error {}

export function getDb(): Firestore {
  if (getApps().length === 0) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new ServerConfigError("서버용 Firebase 키가 설정되지 않았습니다.");
    }
    initializeApp({
      credential: json ? cert(JSON.parse(json)) : applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  }
  return getFirestore();
}
