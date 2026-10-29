import { OPTION_COUNT, type Question, type QuizFile } from "./types";

export type ValidationResult =
  | { ok: true; quiz: QuizFile }
  | { ok: false; errors: string[] };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function checkQuestion(item: unknown, no: number): string[] {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return [`${no}번 문제의 모양이 올바르지 않습니다.`];
  }
  const q = item as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(q.question)) {
    errors.push(`${no}번 문제에 문제 내용(question)이 없습니다.`);
  }

  if (!Array.isArray(q.options)) {
    errors.push(`${no}번 문제에 보기 목록(options)이 없습니다.`);
  } else if (q.options.length !== OPTION_COUNT) {
    errors.push(
      `${no}번 문제의 보기가 ${q.options.length}개입니다. 보기는 ${OPTION_COUNT}개여야 합니다.`,
    );
  } else if (!q.options.every(isNonEmptyString)) {
    errors.push(`${no}번 문제에 내용이 비어 있는 보기가 있습니다.`);
  }

  if (q.correctAnswer === undefined) {
    errors.push(`${no}번 문제에 정답 번호(correctAnswer)가 없습니다.`);
  } else if (
    typeof q.correctAnswer !== "number" ||
    !Number.isInteger(q.correctAnswer) ||
    q.correctAnswer < 1 ||
    q.correctAnswer > OPTION_COUNT
  ) {
    errors.push(
      `${no}번 문제의 정답 번호가 ${JSON.stringify(q.correctAnswer)}입니다. 정답 번호는 1~${OPTION_COUNT} 중 하나여야 합니다.`,
    );
  }

  if (!isNonEmptyString(q.explanation)) {
    errors.push(`${no}번 문제에 해설(explanation)이 없습니다.`);
  }

  return errors;
}

/** 올린 파일의 글자 내용을 검사합니다. 하나라도 틀리면 파일 전체를 받지 않습니다. */
export function validateQuizText(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: ["파일을 읽을 수 없습니다. 올바른 JSON 문제 파일인지 확인해주세요."],
    };
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, errors: ["파일 안에 문제 목록(questions)이 없습니다."] };
  }
  const list = (data as Record<string, unknown>).questions;
  if (!Array.isArray(list)) {
    return { ok: false, errors: ["파일 안에 문제 목록(questions)이 없습니다."] };
  }
  if (list.length === 0) {
    return { ok: false, errors: ["파일에 문제가 하나도 없습니다."] };
  }

  const errors = list.flatMap((item, i) => checkQuestion(item, i + 1));
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const questions: Question[] = list.map((item) => {
    const q = item as Question;
    return {
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });
  return { ok: true, quiz: { questions } };
}
