import QuizApp from "@/components/quiz/QuizApp";
import { loadPapers } from "@/lib/quiz/papers";

export default function Home() {
  const { papers, problems } = loadPapers();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-12">
      <QuizApp papers={papers} problems={problems} />
    </main>
  );
}
