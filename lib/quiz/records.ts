// Firestore에 저장하는 문제지·결과와 관련된 순수 로직입니다(화면·서버 모두에서 쓸 수 있음).
import type { ScoreResult } from "./score";
import type { PublicQuestion, Question } from "./types";
import { OPTION_COUNT } from "./types";

export const MAX_NAME_LENGTH = 30;

/** 학생 이름 비교용: 앞뒤 공백을 지우고 가운데 공백은 하나로 합칩니다. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** 제목 중복 비교용: 공백 정리 + 영문 대소문자 무시 */
export function titleKey(title: string): string {
  return normalizeName(title).toLowerCase();
}

/** 문항 내용 중복 비교용 문자열. 같은 내용이면 같은 값이 나옵니다. */
export function contentKey(questions: Question[]): string {
  return JSON.stringify(
    questions.map((q) => [
      normalizeName(q.question),
      q.options.map(normalizeName),
      q.correctAnswer,
      normalizeName(q.explanation),
    ]),
  );
}

export function toPublicQuestions(questions: Question[]): PublicQuestion[] {
  return questions.map(({ question, options }) => ({ question, options: [...options] }));
}

/** 틀린 문항 번호(1부터) */
export function wrongQuestionNumbers(result: ScoreResult): number[] {
  return result.results.flatMap((r, i) => (r.isCorrect ? [] : [i + 1]));
}

/** 제출한 답이 문항 수와 맞고, 모두 1~4 중 하나인지 확인합니다. */
export function isCompleteAnswers(answers: unknown, questionCount: number): answers is number[] {
  return (
    Array.isArray(answers) &&
    answers.length === questionCount &&
    answers.every((a) => Number.isInteger(a) && a >= 1 && a <= OPTION_COUNT)
  );
}

/** 교사 목록에 보이는 문제지 요약 */
export type TeacherPaper = {
  id: string;
  title: string;
  questionCount: number;
  published: boolean;
  /** ISO 시각 */
  createdAt: string;
};

export type ResultRow = {
  studentName: string;
  score: number;
  wrongQuestions: number[];
  /** ISO 시각 */
  submittedAt: string;
};

/** 평균 점수(소수 첫째 자리 반올림). 결과가 없으면 null. 행은 이름별 최신 결과 하나씩입니다. */
export function averageScore(rows: Pick<ResultRow, "score">[]): number | null {
  if (rows.length === 0) return null;
  const sum = rows.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}
