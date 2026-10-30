import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./config";

// 브라우저에서만 호출합니다(서버에서 미리 그릴 때는 부르지 않음).
export function getFirebaseAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
