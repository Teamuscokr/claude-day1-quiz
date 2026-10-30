import StudentApp from "@/components/student/StudentApp";

// 학생 화면. 공개된 문제지 목록은 이름을 입력한 뒤 서버(/api/student/papers)에서 받아옵니다.
export default function StudentPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-12">
      <StudentApp />
    </main>
  );
}
