"use client";

import { useState } from "react";
import type { Answers, Question } from "@/lib/quiz/types";

type Props = {
  questions: Question[];
  onSubmit: (answers: Answers) => void;
};

export default function SolveStep({ questions, onSubmit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => questions.map(() => null));

  const total = questions.length;
  const current = questions[index];
  const chosen = answers[index];
  const isLast = index === total - 1;

  function choose(optionNo: number) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? optionNo : a)));
  }

  function move(nextIndex: number) {
    setIndex(nextIndex);
    window.scrollTo({ top: 0 });
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {index + 1} / {total}
        </span>
        <span>{answers.filter((a) => a !== null).length}문제 답함</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h1 className="mt-6 text-lg font-semibold leading-relaxed sm:text-xl">
        <span className="mr-1 text-blue-700">{index + 1}.</span>
        {current.question}
      </h1>

      <ol className="mt-5 space-y-3" aria-label="보기">
        {current.options.map((option, i) => {
          const optionNo = i + 1;
          const selected = chosen === optionNo;
          return (
            <li key={optionNo}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => choose(optionNo)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {optionNo}
                </span>
                <span className="pt-0.5">{option}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          이전
        </button>
        {isLast ? (
          <button
            type="button"
            className="btn-primary"
            disabled={chosen === null}
            onClick={() => onSubmit(answers)}
          >
            제출하고 채점하기
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={chosen === null}
            onClick={() => move(index + 1)}
          >
            다음
          </button>
        )}
      </div>
    </section>
  );
}
