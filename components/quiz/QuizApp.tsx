"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/client/api";
import type { ScoreResult } from "@/lib/quiz/score";
import type { Answers, PublicPaper } from "@/lib/quiz/types";
import PaperListStep from "./PaperListStep";
import ResultStep from "./ResultStep";
import SolveStep from "./SolveStep";

type Step =
  | { name: "loading" }
  | { name: "loadError"; message: string }
  | { name: "list"; papers: PublicPaper[] }
  | { name: "solving"; paper: PublicPaper }
  | { name: "submitting"; paper: PublicPaper; answers: Answers }
  | { name: "submitFailed"; paper: PublicPaper; answers: Answers; message: string }
  | { name: "result"; result: ScoreResult };

type Props = {
  studentName: string;
};

// 화면 단계: 목록 → 풀이 → 제출(서버 채점·저장) → 결과
// 정답과 해설은 제출이 성공한 뒤 서버 응답으로만 받습니다.
export default function QuizApp({ studentName }: Props) {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await callApi<{ papers: PublicPaper[] }>("/api/student/papers");
      if (cancelled) return;
      setStep(res.ok ? { name: "list", papers: res.data.papers } : { name: "loadError", message: res.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  async function submit(paper: PublicPaper, answers: Answers) {
    setStep({ name: "submitting", paper, answers });
    window.scrollTo({ top: 0 });
    const res = await callApi<{ result: ScoreResult }>("/api/student/results", {
      method: "POST",
      body: { paperId: paper.id, name: studentName, answers },
    });
    setStep(
      res.ok
        ? { name: "result", result: res.data.result }
        : { name: "submitFailed", paper, answers, message: res.message },
    );
  }

  switch (step.name) {
    case "loading":
      return (
        <section className="card">
          <p className="text-muted">문제지 목록을 불러오는 중…</p>
        </section>
      );
    case "loadError":
      return (
        <section className="card">
          <p role="alert" className="rounded-xl bg-red-50 p-4 font-medium text-red-800">
            {step.message}
          </p>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => {
              setStep({ name: "loading" });
              setLoadKey((k) => k + 1);
            }}
          >
            다시 불러오기
          </button>
        </section>
      );
    case "list":
      return (
        <PaperListStep
          papers={step.papers}
          onSelect={(paper) => {
            setStep({ name: "solving", paper });
            window.scrollTo({ top: 0 });
          }}
        />
      );
    case "solving":
      return (
        <SolveStep questions={step.paper.questions} onSubmit={(answers: Answers) => submit(step.paper, answers)} />
      );
    case "submitting":
      return (
        <section className="card">
          <p className="text-muted">채점하고 결과를 저장하는 중…</p>
        </section>
      );
    case "submitFailed":
      return (
        <section className="card">
          <h1 className="text-lg font-bold">결과를 저장하지 못했습니다</h1>
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 font-medium text-red-800">
            {step.message}
          </p>
          <p className="mt-3 text-sm text-muted">고른 답은 그대로 남아 있습니다. 아래 버튼을 눌러 다시 제출해 주세요.</p>
          <button type="button" className="btn-primary mt-4 w-full" onClick={() => submit(step.paper, step.answers)}>
            다시 시도
          </button>
        </section>
      );
    case "result":
      return <ResultStep result={step.result} />;
  }
}
