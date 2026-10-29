import type { Answers, Question } from "./types";

export type QuestionResult = {
  question: Question;
  /** 이용자가 고른 보기 번호(1~4) */
  chosen: number | null;
  isCorrect: boolean;
};

export type ScoreResult = {
  /** 100점 만점, 정수로 반올림 */
  score: number;
  correctCount: number;
  total: number;
  results: QuestionResult[];
};

/** 점수 = 정답 수 ÷ 전체 문항 수 × 100 (모든 문항 배점 같음, 정수 반올림) */
export function gradeQuiz(questions: Question[], answers: Answers): ScoreResult {
  const results = questions.map((question, i) => {
    const chosen = answers[i] ?? null;
    return { question, chosen, isCorrect: chosen === question.correctAnswer };
  });
  const correctCount = results.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  return { score, correctCount, total, results };
}
