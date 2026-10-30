// 문제지 파일 형식 (PRD.md "문제지 파일" 참고)

export const OPTION_COUNT = 4;

export type Question = {
  question: string;
  options: string[];
  /** 정답 번호 1~4. 1이면 options의 첫 번째 보기가 정답 */
  correctAnswer: number;
  explanation: string;
};

export type QuizFile = {
  title: string;
  questions: Question[];
};

/** question-papers 폴더에서 읽은 문제지 하나 */
export type Paper = QuizFile & {
  /** 파일 이름. 목록에서 문제지를 구분하는 데만 쓰고 화면에는 보이지 않음 */
  id: string;
};

/** 학생에게 보내는 문항. 정답과 해설은 빼고 보냅니다(채점은 서버에서). */
export type PublicQuestion = Pick<Question, "question" | "options">;

/** 학생 목록에 보이는 공개 문제지. id는 Firestore 문서 id */
export type PublicPaper = {
  id: string;
  title: string;
  questions: PublicQuestion[];
};

/** 문항 순서대로 이용자가 고른 보기 번호(1~4). 아직 고르지 않았으면 null */
export type Answers = (number | null)[];
