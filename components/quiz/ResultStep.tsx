import type { ScoreResult } from "@/lib/quiz/score";

type Props = {
  result: ScoreResult;
};

function optionLabel(options: string[], no: number | null) {
  if (no === null) return "고르지 않음";
  return `${no}번. ${options[no - 1]}`;
}

export default function ResultStep({ result }: Props) {
  const { score, correctCount, total, results } = result;

  return (
    <div className="space-y-4">
      <section className="card text-center">
        <h1 className="text-lg font-semibold text-muted">내 점수</h1>
        <p className="mt-2 text-5xl font-bold text-blue-700">{score}점</p>
        <p className="mt-3 font-medium">
          {total}문제 중 {correctCount}개 정답
        </p>
      </section>

      <ol className="space-y-4">
        {results.map(({ question, chosen, isCorrect }, i) => (
          <li key={i} className="card">
            <div className="flex items-center gap-2">
              <span className="font-bold">{i + 1}번</span>
              <span
                className={`rounded-full px-3 py-0.5 text-sm font-bold ${
                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isCorrect ? "○ 정답" : "✕ 오답"}
              </span>
            </div>
            <p className="mt-3 font-semibold leading-relaxed">{question.question}</p>
            <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
              <div>
                <dt className="text-sm text-muted">내가 고른 답</dt>
                <dd className={isCorrect ? "text-green-800" : "text-red-800"}>
                  {optionLabel(question.options, chosen)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">정답</dt>
                <dd className="text-green-800">
                  {optionLabel(question.options, question.correctAnswer)}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-muted">해설</h2>
              <p className="mt-1 leading-relaxed">{question.explanation}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="pb-4 text-center text-sm text-muted">
        처음 화면으로 돌아가려면 브라우저를 새로고침하세요.
      </p>
    </div>
  );
}
