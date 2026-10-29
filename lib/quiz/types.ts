// 문제 파일 형식 (PRD.md "문제 파일" 참고)

export const OPTION_COUNT = 4;

export type Question = {
  question: string;
  options: string[];
  /** 정답 번호 1~4. 1이면 options의 첫 번째 보기가 정답 */
  correctAnswer: number;
  explanation: string;
};

export type QuizFile = {
  questions: Question[];
};

/** 문항 순서대로 이용자가 고른 보기 번호(1~4). 아직 고르지 않았으면 null */
export type Answers = (number | null)[];
