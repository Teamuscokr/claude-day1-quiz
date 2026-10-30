// 서버 전용. Firestore 읽기·쓰기는 모두 이 파일을 거칩니다.
// 브라우저는 Firestore에 직접 접근하지 못하고(firestore.rules), 서버가 권한을 확인한 뒤 이 함수들을 부릅니다.
//
// 저장 구조
// - papers/{paperId}: title, titleKey, contentHash, questions(정답·해설 포함), published, createdAt, updatedAt
// - results/{paperId}__{학생 이름}: paperId, studentName, answers, score, correctCount, total, wrongQuestions, submittedAt
//   같은 문제지를 같은 이름으로 다시 풀면 같은 문서를 덮어써서 최신 결과만 남습니다.
import { createHash } from "node:crypto";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import {
  contentKey,
  normalizeName,
  titleKey,
  toPublicQuestions,
  wrongQuestionNumbers,
  type ResultRow,
  type TeacherPaper,
} from "../quiz/records";
import { gradeQuiz, type ScoreResult } from "../quiz/score";
import type { PublicPaper, Question, QuizFile } from "../quiz/types";
import { getDb } from "./admin";

type PaperDoc = {
  title: string;
  titleKey: string;
  contentHash: string;
  questions: Question[];
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type ResultDoc = {
  paperId: string;
  studentName: string;
  answers: number[];
  score: number;
  correctCount: number;
  total: number;
  wrongQuestions: number[];
  submittedAt: Timestamp;
};

const papers = () => getDb().collection("papers");
const results = () => getDb().collection("results");

function byTitle<T extends { title: string }>(a: T, b: T) {
  return a.title.localeCompare(b.title, "ko");
}

export async function listTeacherPapers(): Promise<TeacherPaper[]> {
  const snap = await papers().get();
  return snap.docs
    .map((doc) => {
      const data = doc.data() as PaperDoc;
      return {
        id: doc.id,
        title: data.title,
        questionCount: data.questions.length,
        published: data.published,
        createdAt: data.createdAt.toDate().toISOString(),
      };
    })
    .sort(byTitle);
}

export type CreatePaperResult =
  | { ok: true; paper: TeacherPaper }
  | { ok: false; reason: "duplicate-title" | "duplicate-content"; existingTitle: string };

/** 검사를 마친 문제지를 비공개 상태로 저장합니다. 제목이 같거나 문항 내용이 똑같으면 저장하지 않습니다. */
export async function createPaper(quiz: QuizFile): Promise<CreatePaperResult> {
  const db = getDb();
  const key = titleKey(quiz.title);
  const hash = createHash("sha256").update(contentKey(quiz.questions)).digest("hex");

  return db.runTransaction(async (tx) => {
    const [sameTitle, sameContent] = await Promise.all([
      tx.get(papers().where("titleKey", "==", key).limit(1)),
      tx.get(papers().where("contentHash", "==", hash).limit(1)),
    ]);
    if (!sameTitle.empty) {
      return { ok: false, reason: "duplicate-title", existingTitle: sameTitle.docs[0].get("title") };
    }
    if (!sameContent.empty) {
      return { ok: false, reason: "duplicate-content", existingTitle: sameContent.docs[0].get("title") };
    }
    const ref = papers().doc();
    tx.create(ref, {
      title: quiz.title,
      titleKey: key,
      contentHash: hash,
      questions: quiz.questions,
      published: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      ok: true,
      paper: {
        id: ref.id,
        title: quiz.title,
        questionCount: quiz.questions.length,
        published: false,
        createdAt: new Date().toISOString(),
      },
    };
  });
}

/** 공개 여부를 바꿉니다. 문제지가 없으면 false */
export async function setPublished(paperId: string, published: boolean): Promise<boolean> {
  const ref = papers().doc(paperId);
  try {
    await ref.update({ published, updatedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === 5) return false; // NOT_FOUND
    throw error;
  }
}

/** 학생용: 공개된 문제지만, 정답과 해설을 뺀 채로 */
export async function listPublishedPapers(): Promise<PublicPaper[]> {
  const snap = await papers().where("published", "==", true).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data() as PaperDoc;
      return { id: doc.id, title: data.title, questions: toPublicQuestions(data.questions) };
    })
    .sort(byTitle);
}

export type SubmitResult =
  | { ok: true; result: ScoreResult }
  | { ok: false; reason: "not-found" | "invalid-answers" };

/** 학생 제출: 서버에서 채점하고, 이름별 최신 결과로 저장합니다. */
export async function submitResult(
  paperId: string,
  studentName: string,
  answers: number[],
): Promise<SubmitResult> {
  const snap = await papers().doc(paperId).get();
  const paper = snap.data() as PaperDoc | undefined;
  if (!paper || !paper.published) return { ok: false, reason: "not-found" };
  if (answers.length !== paper.questions.length) return { ok: false, reason: "invalid-answers" };

  const result = gradeQuiz(paper.questions, answers);
  const name = normalizeName(studentName);
  const doc: Omit<ResultDoc, "submittedAt"> & { submittedAt: FieldValue } = {
    paperId,
    studentName: name,
    answers,
    score: result.score,
    correctCount: result.correctCount,
    total: result.total,
    wrongQuestions: wrongQuestionNumbers(result),
    submittedAt: FieldValue.serverTimestamp(),
  };
  await results().doc(resultDocId(paperId, name)).set(doc);
  return { ok: true, result };
}

function resultDocId(paperId: string, name: string) {
  // 문서 id에 쓸 수 없는 '/'가 이름에 있어도 안전하도록 인코딩합니다.
  return `${paperId}__${encodeURIComponent(name)}`;
}

/** 교사용: 문제지 하나의 학생별 최신 결과. 문제지가 없으면 null */
export async function listResults(paperId: string): Promise<{ title: string; rows: ResultRow[] } | null> {
  const paperSnap = await papers().doc(paperId).get();
  if (!paperSnap.exists) return null;
  const snap = await results().where("paperId", "==", paperId).get();
  const rows = snap.docs
    .map((doc) => {
      const data = doc.data() as ResultDoc;
      return {
        studentName: data.studentName,
        score: data.score,
        wrongQuestions: data.wrongQuestions,
        submittedAt: data.submittedAt.toDate().toISOString(),
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
  return { title: paperSnap.get("title"), rows };
}
