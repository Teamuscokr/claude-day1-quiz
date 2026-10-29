import type { PaperProblem } from "@/lib/quiz/papers";
import type { Paper } from "@/lib/quiz/types";

type Props = {
  papers: Paper[];
  problems: PaperProblem[];
  onSelect: (paper: Paper) => void;
};

export default function PaperListStep({ papers, problems, onSelect }: Props) {
  return (
    <section className="card">
      <h1 className="text-2xl font-bold">문제풀이</h1>
      <p className="mt-3 text-muted">
        풀고 싶은 문제지를 골라주세요.
        <br />
        모든 문제를 푼 뒤에 점수와 해설을 볼 수 있습니다.
      </p>

      {papers.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-muted">아직 준비된 문제지가 없습니다.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {papers.map((paper) => (
            <li key={paper.id}>
              <button
                type="button"
                onClick={() => onSelect(paper)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span className="font-semibold">{paper.title}</span>
                <span className="shrink-0 text-sm text-muted">{paper.questions.length}문제</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {problems.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">열 수 없는 문제지가 있습니다.</p>
          <ul className="mt-2 space-y-2">
            {problems.map(({ fileName, errors }) => (
              <li key={fileName}>
                <span className="break-all font-medium">{fileName}</span>
                <ul className="mt-1 list-disc pl-5">
                  {errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
