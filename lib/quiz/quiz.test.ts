import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPapers, parsePapers } from "./papers";
import { gradeQuiz } from "./score";
import type { Question } from "./types";
import { validateQuizText } from "./validate";

const sampleText = readFileSync(
  join(process.cwd(), "question-papers", "sample-questions.json"),
  "utf8",
);

const q = (correctAnswer: number): Question => ({
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer,
  explanation: "해설",
});

function errorsOf(data: unknown): string[] {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  const result = validateQuizText(text);
  return result.ok ? [] : result.errors;
}

describe("validateQuizText", () => {
  it("예시 문제지의 제목과 10문항을 그대로 받아들인다", () => {
    const result = validateQuizText(sampleText);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const original = JSON.parse(sampleText);
      expect(result.quiz.title).toBe("중학교 정보과목");
      expect(result.quiz.questions).toEqual(original.questions);
      expect(result.quiz.questions).toHaveLength(10);
    }
  });

  it("JSON이 아니면 거부한다", () => {
    expect(errorsOf("문제입니다")[0]).toContain("파일을 읽을 수 없습니다");
  });

  it("title이 없으면 거부한다", () => {
    expect(errorsOf({ questions: [q(1)] })).toEqual(["문제지 제목(title)이 없습니다."]);
    expect(errorsOf({ title: "  ", questions: [q(1)] })).toEqual(["문제지 제목(title)이 없습니다."]);
  });

  it("questions가 없거나 비어 있으면 거부한다", () => {
    expect(errorsOf({ title: "t" })[0]).toContain("questions");
    expect(errorsOf("[]")[0]).toContain("questions");
    expect(errorsOf({ title: "t", questions: [] })[0]).toContain("하나도 없습니다");
  });

  it("보기가 4개가 아니면 문항 번호와 함께 거부한다", () => {
    const bad = { title: "t", questions: [q(1), { ...q(1), options: ["가", "나", "다"] }] };
    expect(errorsOf(bad)).toEqual(["2번 문제의 보기가 3개입니다. 보기는 4개여야 합니다."]);
  });

  it("정답 번호가 1~4 정수가 아니면 거부한다", () => {
    for (const value of [0, 5, 2.5, "1"]) {
      const bad = { title: "t", questions: [{ ...q(1), correctAnswer: value }] };
      expect(errorsOf(bad)[0]).toContain("1번 문제의 정답 번호가");
    }
  });

  it("빠진 항목을 모두 알려준다", () => {
    expect(errorsOf({ title: "t", questions: [{}] })).toHaveLength(4);
  });
});

describe("loadPapers", () => {
  it("question-papers 폴더의 예시 문제지를 읽는다", () => {
    const { papers, problems } = loadPapers();
    expect(problems).toEqual([]);
    expect(papers.map((p) => [p.id, p.title, p.questions.length])).toEqual([
      ["sample-questions.json", "중학교 정보과목", 10],
    ]);
  });

});

describe("parsePapers", () => {
  it("여러 문제지를 제목 가나다순으로 정리하고, 틀린 문제지는 따로 알려준다", () => {
    // 점검용 문제지는 메모리에서만 만들고 파일로 저장하지 않습니다.
    const { papers, problems } = parsePapers([
      { fileName: "a.json", text: JSON.stringify({ title: "하", questions: [q(1)] }) },
      { fileName: "b.json", text: JSON.stringify({ title: "가", questions: [q(2), q(3)] }) },
      { fileName: "c.json", text: JSON.stringify({ questions: [q(1)] }) },
    ]);
    expect(papers.map((p) => [p.id, p.title, p.questions.length])).toEqual([
      ["b.json", "가", 2],
      ["a.json", "하", 1],
    ]);
    expect(papers[0].questions).toEqual([q(2), q(3)]);
    expect(problems).toEqual([{ fileName: "c.json", errors: ["문제지 제목(title)이 없습니다."] }]);
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
