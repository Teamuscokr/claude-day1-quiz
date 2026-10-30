import type { PublicPaper } from "@/lib/quiz/types";

type Props = {
  papers: PublicPaper[];
  onSelect: (paper: PublicPaper) => void;
};

export default function PaperListStep({ papers, onSelect }: Props) {
  return (
    <section className="card">
      <h1 className="text-2xl font-bold">문제풀이</h1>
      <p className="mt-3 text-muted">
        풀고 싶은 문제지를 골라주세요.
        <br />
        모든 문제를 푼 뒤에 점수와 해설을 볼 수 있습니다.
      </p>

      {papers.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-muted">
          아직 공개된 문제지가 없습니다. 선생님이 문제지를 공개하면 여기에 보입니다.
        </p>
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
    </section>
  );
}
