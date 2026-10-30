"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/client/api";
import type { ResultRow } from "@/lib/quiz/records";

type Props = {
  paperId: string;
  getToken: () => Promise<string>;
};

type Loaded = { title: string; rows: ResultRow[]; average: number | null };

type State = { name: "loading" } | { name: "error"; message: string } | { name: "loaded"; data: Loaded };

const timeFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" });

// 교사: 문제지 하나의 학생별 최신 결과와 평균
export default function ResultsTable({ paperId, getToken }: Props) {
  const [state, setState] = useState<State>({ name: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await callApi<Loaded>(`/api/teacher/papers/${paperId}/results`, { token: await getToken() });
      if (cancelled) return;
      setState(res.ok ? { name: "loaded", data: res.data } : { name: "error", message: res.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [paperId, getToken, reloadKey]);

  function reload() {
    setState({ name: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.name === "loading") {
    return <p className="text-muted">결과를 불러오는 중…</p>;
  }
  if (state.name === "error") {
    return (
      <div role="alert" className="space-y-3">
        <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800">{state.message}</p>
        <button type="button" className="btn-secondary" onClick={reload}>
          다시 불러오기
        </button>
      </div>
    );
  }

  const { title, rows, average } = state.data;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted">
            제출한 학생 {rows.length}명 · 평균 점수{" "}
            <span className="font-bold text-blue-700">{average === null ? "-" : `${average}점`}</span>
          </p>
        </div>
        <button type="button" className="btn-secondary min-h-10 px-4 text-sm" onClick={reload}>
          새로고침
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-muted">아직 제출한 학생이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-slate-50 text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">이름</th>
                <th scope="col" className="px-3 py-2 font-semibold">점수</th>
                <th scope="col" className="px-3 py-2 font-semibold">틀린 문제</th>
                <th scope="col" className="px-3 py-2 font-semibold">제출 시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentName} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium">{row.studentName}</td>
                  <td className="px-3 py-2">{row.score}점</td>
                  <td className="px-3 py-2">
                    {row.wrongQuestions.length === 0 ? "없음" : row.wrongQuestions.map((n) => `${n}번`).join(", ")}
                  </td>
                  <td className="px-3 py-2 text-muted">{timeFormat.format(new Date(row.submittedAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">같은 이름으로 다시 푼 경우 가장 최근 결과만 보이고, 평균도 그 결과로 계산합니다.</p>
    </div>
  );
}
