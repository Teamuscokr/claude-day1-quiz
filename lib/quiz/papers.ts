// 서버(빌드)에서만 쓰는 파일입니다. 화면 코드에서 불러오지 않습니다.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Paper } from "./types";
import { validateQuizText } from "./validate";

/** 형식이 틀려 목록에서 뺀 문제지 */
export type PaperProblem = {
  fileName: string;
  errors: string[];
};

export type PaperList = {
  /** 제목 가나다순 */
  papers: Paper[];
  problems: PaperProblem[];
};

export type PaperSource = {
  fileName: string;
  text: string;
};

/** 문제지 파일 내용들을 검사해 목록으로 만듭니다. */
export function parsePapers(sources: PaperSource[]): PaperList {
  const papers: Paper[] = [];
  const problems: PaperProblem[] = [];
  for (const { fileName, text } of sources) {
    const result = validateQuizText(text);
    if (result.ok) {
      papers.push({ id: fileName, ...result.quiz });
    } else {
      problems.push({ fileName, errors: result.errors });
    }
  }
  papers.sort((a, b) => a.title.localeCompare(b.title, "ko") || a.id.localeCompare(b.id));
  problems.sort((a, b) => a.fileName.localeCompare(b.fileName));
  return { papers, problems };
}

/**
 * question-papers 폴더 안의 JSON 문제지를 모두 읽습니다.
 * 동기 방식으로 읽어서 Next가 페이지를 미리 만들 때(빌드 시) 결과가 함께 들어갑니다.
 * 경로를 process.cwd() + 고정 폴더 이름으로 적어야 Next가 이 폴더만 배포 파일에 포함합니다.
 */
export function loadPapers(): PaperList {
  let fileNames: string[];
  try {
    fileNames = readdirSync(join(process.cwd(), "question-papers")).filter((name) =>
      name.toLowerCase().endsWith(".json"),
    );
  } catch {
    return { papers: [], problems: [] };
  }
  return parsePapers(
    fileNames.map((fileName) => ({
      fileName,
      text: readFileSync(join(process.cwd(), "question-papers", fileName), "utf8"),
    })),
  );
}
