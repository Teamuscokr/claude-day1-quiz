import { verifyTeacher } from "@/lib/teacher/verify";

// 교사 화면에 들어오기 전에 로그인한 계정이 허용된 교사인지 서버에서 확인합니다.
export async function GET(request: Request) {
  const check = await verifyTeacher(request.headers.get("authorization"));
  if (check.ok) {
    return Response.json({ email: check.email });
  }
  const status = check.reason === "not-allowed" ? 403 : check.reason === "not-configured" ? 500 : 401;
  return Response.json({ reason: check.reason }, { status });
}
