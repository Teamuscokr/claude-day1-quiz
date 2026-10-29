"use client";

import { useState, type ChangeEvent } from "react";
import type { QuizFile } from "@/lib/quiz/types";
import { validateQuizText } from "@/lib/quiz/validate";

type Props = {
  onLoaded: (quiz: QuizFile, fileName: string) => void;
};

export default function UploadStep({ onLoaded }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // 같은 파일을 고친 뒤 다시 골라도 바로 반영되도록 선택을 비웁니다.
    input.value = "";
    if (!file) return;

    setFileName(file.name);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrors(["파일을 열 수 없습니다. 다른 파일을 골라주세요."]);
      return;
    }

    const result = validateQuizText(text);
    if (result.ok) {
      setErrors([]);
      onLoaded(result.quiz, file.name);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <section className="card">
      <h1 className="text-2xl font-bold">문제풀이</h1>
      <p className="mt-3 text-muted">
        선생님께 받은 문제 파일(JSON)을 올려주세요.
        <br />
        모든 문제를 푼 뒤에 점수와 해설을 볼 수 있습니다.
      </p>

      <label className="btn-primary mt-6 w-full sm:w-auto">
        파일 선택
        <input
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      {errors.length > 0 && (
        <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">
            {fileName ? `"${fileName}" 파일을 사용할 수 없습니다.` : "파일을 사용할 수 없습니다."}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">파일을 고친 뒤 다시 올려주세요.</p>
        </div>
      )}
    </section>
  );
}
