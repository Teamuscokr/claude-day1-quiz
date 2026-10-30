import Link from "next/link";
import TeacherApp from "@/components/teacher/TeacherApp";

// 교사 화면. Google 로그인 후 서버(/api/teacher/session)가 허용된 교사로 확인해야 내용을 보여줍니다.
export default function TeacherPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-6 sm:py-12">
      <TeacherApp />

      <Link href="/" className="btn-secondary w-full">
        처음 화면으로
      </Link>
    </main>
  );
}
