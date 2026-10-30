"use client";

import { useCallback, useEffect, useState } from "react";
import { callApi } from "@/lib/client/api";
import type { TeacherPaper } from "@/lib/quiz/records";
import PaperUpload from "./PaperUpload";
import ResultsTable from "./ResultsTable";

type Props = {
  /** 서버에 보낼 로그인 증명. 교사용 요청은 서버가 매번 다시 확인합니다. */
  getToken: () => Promise<string>;
};

type ListState = { name: "loading" } | { name: "error"; message: string } | { name: "loaded"; papers: TeacherPaper[] };

function byTitle(a: TeacherPaper, b: TeacherPaper) {
  return a.title.localeCompare(b.title, "ko");
}

// 교사: 문제지 올리기, 공개 상태 바꾸기, 문제지별 결과 보기
export default function TeacherDashboard({ getToken }: Props) {
  const [list, setList] = useState<ListState>({ name: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [resultsFor, setResultsFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await callApi<{ papers: TeacherPaper[] }>("/api/teacher/papers", { token: await getToken() });
      if (cancelled) return;
      setList(res.ok ? { name: "loaded", papers: res.data.papers } : { name: "error", message: res.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, reloadKey]);

  const updatePaper = useCallback((paper: TeacherPaper) => {
    setList((prev) =>
      prev.name === "loaded"
        ? { name: "loaded", papers: [...prev.papers.filter((p) => p.id !== paper.id), paper].sort(byTitle) }
        : prev,
    );
  }, []);

  async function togglePublished(paper: TeacherPaper) {
    setBusyId(paper.id);
    setToggleError(null);
    const res = await callApi(`/api/teacher/papers/${paper.id}`, {
      method: "PATCH",
      body: { published: !paper.published },
      token: await getToken(),
    });
    setBusyId(null);
    if (res.ok) {
      updatePaper({ ...paper, published: !paper.published });
    } else {
      setToggleError(res.message);
    }
  }

  return (
    <>
      <PaperUpload getToken={getToken} onCreated={updatePaper} />

      <section className="card">
        <h2 className="text-lg font-bold">등록한 문제지</h2>
        <p className="mt-2 text-sm text-muted">공개한 문제지만 학생 목록에 보입니다.</p>

        {list.name === "loading" && <p className="mt-4 text-muted">문제지 목록을 불러오는 중…</p>}

        {list.name === "error" && (
          <div role="alert" className="mt-4 space-y-3">
            <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">{list.message}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setList({ name: "loading" });
                setReloadKey((k) => k + 1);
              }}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {toggleError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">
            {toggleError}
          </p>
        )}

        {list.name === "loaded" &&
          (list.papers.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-muted">아직 등록한 문제지가 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.papers.map((paper) => (
                <li key={paper.id} className="rounded-xl border-2 border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{paper.title}</p>
                      <p className="text-sm text-muted">
                        {paper.questionCount}문제 ·{" "}
                        <span className={paper.published ? "font-semibold text-green-700" : ""}>
                          {paper.published ? "공개 중" : "비공개"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${paper.published ? "btn-secondary" : "btn-primary"} min-h-10 px-4 text-sm`}
                        disabled={busyId === paper.id}
                        onClick={() => togglePublished(paper)}
                      >
                        {busyId === paper.id ? "바꾸는 중…" : paper.published ? "비공개로 바꾸기" : "공개하기"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary min-h-10 px-4 text-sm"
                        aria-expanded={resultsFor === paper.id}
                        onClick={() => setResultsFor((id) => (id === paper.id ? null : paper.id))}
                      >
                        {resultsFor === paper.id ? "결과 닫기" : "결과 보기"}
                      </button>
                    </div>
                  </div>
                  {resultsFor === paper.id && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <ResultsTable paperId={paper.id} getToken={getToken} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </section>
    </>
  );
}
