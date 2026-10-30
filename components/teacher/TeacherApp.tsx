"use client";

import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import TeacherDashboard from "./TeacherDashboard";

type State =
  | { name: "loading" }
  | { name: "signedOut" }
  | { name: "checking" }
  | { name: "allowed"; email: string }
  | { name: "denied"; email: string | null }
  | { name: "error"; message: string };

// 로그인한 계정이 허용된 교사인지는 서버가 판단합니다. 화면은 그 결과만 따릅니다.
async function checkTeacher(user: User): Promise<State> {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/teacher/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { email } = (await res.json()) as { email: string };
      return { name: "allowed", email };
    }
    if (res.status === 403) return { name: "denied", email: user.email };
    if (res.status === 500) {
      return { name: "error", message: "교사 계정 설정이 아직 끝나지 않았습니다. 관리자에게 알려 주세요." };
    }
    return { name: "error", message: "로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요." };
  } catch {
    return { name: "error", message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }
}

function loginErrorMessage(error: unknown) {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "로그인 창이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요.";
    case "auth/operation-not-allowed":
      return "Google 로그인이 아직 켜져 있지 않습니다. Firebase 설정을 확인해 주세요.";
    case "auth/unauthorized-domain":
      return "이 주소에서는 로그인할 수 없습니다. Firebase의 허용 도메인에 이 주소를 추가해 주세요.";
    default:
      return "로그인하지 못했습니다. 다시 시도해 주세요.";
  }
}

export default function TeacherApp() {
  const [state, setState] = useState<State>({ name: "loading" });
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        setState({ name: "signedOut" });
        return;
      }
      setState({ name: "checking" });
      setState(await checkTeacher(user));
    });
  }, []);

  async function login() {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      setLoginError(loginErrorMessage(error));
    }
  }

  // 로그인이 풀렸으면 빈 증명을 보내고, 서버가 "다시 로그인" 안내를 돌려줍니다.
  const getToken = useCallback(async () => (await getFirebaseAuth().currentUser?.getIdToken()) ?? "", []);

  function logout() {
    void signOut(getFirebaseAuth());
  }

  const logoutButton = (
    <button type="button" className="btn-secondary" onClick={logout}>
      로그아웃
    </button>
  );

  switch (state.name) {
    case "loading":
    case "checking":
      return (
        <section className="card">
          <h1 className="text-2xl font-bold">교사 화면</h1>
          <p className="mt-3 text-muted">로그인 상태를 확인하고 있습니다…</p>
        </section>
      );
    case "signedOut":
      return (
        <section className="card">
          <h1 className="text-2xl font-bold">교사 화면</h1>
          <p className="mt-3 text-muted">교사로 등록된 Google 계정으로 로그인해 주세요.</p>
          <button type="button" className="btn-primary mt-6 w-full" onClick={login}>
            Google로 로그인
          </button>
          {loginError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {loginError}
            </p>
          )}
        </section>
      );
    case "denied":
      return (
        <section className="card">
          <h1 className="text-2xl font-bold">교사 화면</h1>
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 font-medium text-red-800">
            교사로 허용되지 않은 계정입니다.
            {state.email && <span className="mt-1 block break-all text-sm">{state.email}</span>}
          </p>
          <p className="mt-3 text-sm text-muted">로그아웃한 뒤 교사 계정으로 다시 로그인해 주세요.</p>
          <div className="mt-6 grid">{logoutButton}</div>
        </section>
      );
    case "error":
      return (
        <section className="card">
          <h1 className="text-2xl font-bold">교사 화면</h1>
          <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-4 font-medium text-amber-900">
            {state.message}
          </p>
          <div className="mt-6 grid">{logoutButton}</div>
        </section>
      );
    case "allowed":
      return (
        <>
          <section className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">교사 화면</h1>
                <p className="mt-1 break-all text-sm text-muted">{state.email}</p>
              </div>
              {logoutButton}
            </div>
            <p className="mt-3 text-muted">문제지를 등록·공개하고 학생들의 풀이 결과를 확인하는 곳입니다.</p>
          </section>
          <TeacherDashboard getToken={getToken} />
        </>
      );
  }
}
