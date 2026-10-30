"use client";

import { useState, type FormEvent } from "react";
import { MAX_NAME_LENGTH, normalizeName } from "@/lib/quiz/records";

type Props = {
  onEnter: (name: string) => void;
};

export default function NameStep({ onEnter }: Props) {
  const [value, setValue] = useState("");
  const [showError, setShowError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = normalizeName(value);
    if (name === "") {
      setShowError(true);
      return;
    }
    onEnter(name);
  }

  return (
    <section className="card">
      <h1 className="text-2xl font-bold">학생으로 시작하기</h1>
      <p className="mt-3 text-muted">이름을 입력하면 문제를 풀 수 있습니다.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label htmlFor="student-name" className="block font-semibold">
          이름
        </label>
        <input
          id="student-name"
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setShowError(false);
          }}
          autoComplete="name"
          maxLength={MAX_NAME_LENGTH}
          aria-invalid={showError}
          aria-describedby={showError ? "student-name-error" : undefined}
          className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 focus-visible:border-blue-600 focus-visible:outline-none"
        />
        {showError && (
          <p id="student-name-error" role="alert" className="text-sm font-medium text-red-700">
            이름을 입력해 주세요.
          </p>
        )}
        <button type="submit" className="btn-primary w-full">
          시작하기
        </button>
      </form>
    </section>
  );
}
