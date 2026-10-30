import { describe, expect, it } from "vitest";
import {
  averageScore,
  contentKey,
  isCompleteAnswers,
  normalizeName,
  titleKey,
  toPublicQuestions,
  wrongQuestionNumbers,
} from "./records";
import { gradeQuiz } from "./score";
import type { Question } from "./types";

const q = (correctAnswer: number, question = "문제"): Question => ({
  question,
  options: ["가", "나", "다", "라"],
  correctAnswer,
  explanation: "해설",
});

describe("normalizeName / titleKey", () => {
  it("앞뒤 공백을 지우고 가운데 공백을 하나로 합친다", () => {
    expect(normalizeName("  홍  길동 ")).toBe("홍 길동");
  });

  it("제목은 공백과 영문 대소문자를 무시하고 비교한다", () => {
    expect(titleKey(" Python  기초 ")).toBe(titleKey("python 기초"));
  });
});

describe("contentKey", () => {
  it("문항 내용이 같으면 같은 값, 다르면 다른 값", () => {
    expect(contentKey([q(1), q(2)])).toBe(contentKey([q(1), { ...q(2), question: " 문제 " }]));
    expect(contentKey([q(1), q(2)])).not.toBe(contentKey([q(1), q(3)]));
  });
});

describe("toPublicQuestions", () => {
  it("학생에게 보낼 문항에는 정답과 해설이 없다", () => {
    const [publicQ] = toPublicQuestions([q(3)]);
    expect(publicQ).toEqual({ question: "문제", options: ["가", "나", "다", "라"] });
    expect(publicQ).not.toHaveProperty("correctAnswer");
    expect(publicQ).not.toHaveProperty("explanation");
  });
});

describe("isCompleteAnswers", () => {
  it("문항 수와 같고 모두 1~4인 답만 받아들인다", () => {
    expect(isCompleteAnswers([1, 4], 2)).toBe(true);
    expect(isCompleteAnswers([1], 2)).toBe(false);
    expect(isCompleteAnswers([1, null], 2)).toBe(false);
    expect(isCompleteAnswers([1, 5], 2)).toBe(false);
    expect(isCompleteAnswers("1,2", 2)).toBe(false);
  });
});

describe("wrongQuestionNumbers / averageScore", () => {
  it("틀린 문항 번호를 1부터 센다", () => {
    expect(wrongQuestionNumbers(gradeQuiz([q(1), q(2), q(3)], [1, 1, 1]))).toEqual([2, 3]);
  });

  it("평균은 소수 첫째 자리까지, 결과가 없으면 null", () => {
    expect(averageScore([{ score: 100 }, { score: 67 }, { score: 33 }])).toBe(66.7);
    expect(averageScore([])).toBeNull();
  });
});
