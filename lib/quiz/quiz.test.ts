import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeQuiz } from "./score";
import type { Question } from "./types";
import { validateQuizText } from "./validate";

const sampleText = readFileSync(join(__dirname, "../../sample-questions.json"), "utf8");

const q = (correctAnswer: number): Question => ({
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer,
  explanation: "해설",
});

function errorsOf(text: string): string[] {
  const result = validateQuizText(text);
  return result.ok ? [] : result.errors;
}

describe("validateQuizText", () => {
  it("예시 파일 10문항을 그대로 받아들인다", () => {
    const result = validateQuizText(sampleText);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const original = JSON.parse(sampleText).questions;
      expect(result.quiz.questions).toEqual(original);
      expect(result.quiz.questions).toHaveLength(10);
    }
  });

  it("JSON이 아니면 거부한다", () => {
    expect(errorsOf("문제입니다")[0]).toContain("파일을 읽을 수 없습니다");
  });

  it("questions가 없거나 비어 있으면 거부한다", () => {
    expect(errorsOf("{}")[0]).toContain("questions");
    expect(errorsOf("[]")[0]).toContain("questions");
    expect(errorsOf('{"questions": []}')[0]).toContain("하나도 없습니다");
  });

  it("보기가 4개가 아니면 문항 번호와 함께 거부한다", () => {
    const bad = { questions: [q(1), { ...q(1), options: ["가", "나", "다"] }] };
    expect(errorsOf(JSON.stringify(bad))).toEqual([
      "2번 문제의 보기가 3개입니다. 보기는 4개여야 합니다.",
    ]);
  });

  it("정답 번호가 1~4 정수가 아니면 거부한다", () => {
    for (const value of [0, 5, 2.5, "1"]) {
      const bad = { questions: [{ ...q(1), correctAnswer: value }] };
      expect(errorsOf(JSON.stringify(bad))[0]).toContain("1번 문제의 정답 번호가");
    }
  });

  it("빠진 항목을 모두 알려준다", () => {
    const errors = errorsOf(JSON.stringify({ questions: [{}] }));
    expect(errors).toHaveLength(4);
  });
});

describe("gradeQuiz", () => {
  it("정답 수 ÷ 전체 × 100을 정수로 반올림한다", () => {
    const qs = [q(1), q(2), q(3)];
    expect(gradeQuiz(qs, [1, 2, 4]).score).toBe(67);
    expect(gradeQuiz(qs, [1, 1, 1]).score).toBe(33);
    expect(gradeQuiz(qs, [1, 2, 3]).score).toBe(100);
    expect(gradeQuiz(qs, [4, 4, 4]).score).toBe(0);
  });

  it("문항별 정오와 고른 답을 돌려준다", () => {
    const result = gradeQuiz([q(1), q(2)], [1, 3]);
    expect(result.correctCount).toBe(1);
    expect(result.results.map((r) => [r.chosen, r.isCorrect])).toEqual([
      [1, true],
      [3, false],
    ]);
  });

  it("예시 파일을 모두 맞히면 100점", () => {
    const result = validateQuizText(sampleText);
    if (!result.ok) throw new Error("예시 파일 검사 실패");
    const answers = result.quiz.questions.map((x) => x.correctAnswer);
    expect(gradeQuiz(result.quiz.questions, answers).score).toBe(100);
  });
});
