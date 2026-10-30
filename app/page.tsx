import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-12">
      <section className="card">
        <h1 className="text-2xl font-bold">문제풀이</h1>
        <p className="mt-3 text-muted">어떻게 시작할지 골라주세요.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/teacher" className="btn-secondary">
            교사로 시작하기
          </Link>
          <Link href="/student" className="btn-primary">
            학생으로 시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
