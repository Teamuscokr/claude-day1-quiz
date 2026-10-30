"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { callApi } from "@/lib/client/api";
import type { TeacherPaper } from "@/lib/quiz/records";
import type { QuizFile } from "@/lib/quiz/types";
import { validateQuizText } from "@/lib/quiz/validate";

type Props = {
  getToken: () => Promise<string>;
  onCreated: (paper: TeacherPaper) => void;
};

type Picked = { fileName: string; text: string; quiz: QuizFile };
type Problem = { message: string; errors?: string[] };

// 교사: JSON 문제지 파일을 골라 내용을 확인한 뒤 저장합니다(처음에는 비공개).
export default function PaperUpload({ getToken, onCreated }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  function reset() {
    setPicked(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setProblem(null);
    setSaved(null);
    setPicked(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setProblem({ message: "JSON 파일(.json)만 올릴 수 있습니다." });
      return;
    }
    const text = await file.text();
    const checked = validateQuizText(text);
    if (!checked.ok) {
      setProblem({ message: `"${file.name}" 파일의 형식이 올바르지 않습니다.`, errors: checked.errors });
      return;
    }
    setPicked({ fileName: file.name, text, quiz: checked.quiz });
  }

  async function save() {
    if (!picked) return;
    setSaving(true);
    setProblem(null);
    const res = await callApi<{ paper: TeacherPaper }>("/api/teacher/papers", {
      method: "POST",
      body: { text: picked.text },
      token: await getToken(),
    });
    setSaving(false);
    if (!res.ok) {
      setProblem({ message: res.message, errors: res.errors });
      return;
    }
    setSaved(res.data.paper.title);
    reset();
    onCreated(res.data.paper);
  }

  return (
    <section className="card">
      <h2 className="text-lg font-bold">문제지 올리기</h2>
      <p className="mt-2 text-sm text-muted">
        JSON 문제지 파일을 고르면 내용을 먼저 보여드립니다. 저장한 문제지는 비공개로 시작합니다.
      </p>

      <label className="btn-secondary mt-4 w-full">
        JSON 파일 고르기
        <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFile} />
      </label>

      {saved && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 font-medium text-green-800">
          &quot;{saved}&quot; 문제지를 저장했습니다. 아래 목록에서 &apos;공개하기&apos;를 누르면 학생에게 보입니다.
        </p>
      )}

      {problem && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{problem.message}</p>
          {problem.errors && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {problem.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {picked && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-muted">{picked.fileName}</p>
            <p className="mt-1 text-lg font-bold">{picked.quiz.title}</p>
            <p className="text-sm text-muted">{picked.quiz.questions.length}문제</p>
          </div>

          <ol className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-slate-200 p-4">
            {picked.quiz.questions.map((q, i) => (
              <li key={i} className="text-sm">
                <p className="font-semibold">
                  {i + 1}. {q.question}
                </p>
                <ol className="mt-1 space-y-0.5 pl-4">
                  {q.options.map((option, j) => (
                    <li key={j} className={j + 1 === q.correctAnswer ? "font-semibold text-green-800" : "text-muted"}>
                      {j + 1}) {option}
                      {j + 1 === q.correctAnswer && " (정답)"}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={reset} disabled={saving}>
              취소
            </button>
            <button type="button" className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "저장하는 중…" : "저장"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
