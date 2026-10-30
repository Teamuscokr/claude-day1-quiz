// 서버 전용. Route Handler에서 함께 쓰는 응답·권한 도우미입니다.
import { ServerConfigError } from "../firebase/admin";
import { verifyTeacher } from "../teacher/verify";

/** 화면에 그대로 보여줄 쉬운 한국어 안내와 함께 실패 응답을 만듭니다. */
export function fail(status: number, message: string, extra?: Record<string, unknown>) {
  return Response.json({ message, ...extra }, { status });
}

/** 교사 권한이 없으면 실패 응답을, 있으면 null을 돌려줍니다. 교사용 서버 기능은 처리 전에 반드시 부릅니다. */
export async function rejectUnlessTeacher(request: Request): Promise<Response | null> {
  const check = await verifyTeacher(request.headers.get("authorization"));
  if (check.ok) return null;
  switch (check.reason) {
    case "not-allowed":
      return fail(403, "교사로 허용되지 않은 계정입니다.");
    case "not-configured":
      return fail(500, "교사 계정 설정이 아직 끝나지 않았습니다.");
    default:
      return fail(401, "로그인이 필요합니다. 다시 로그인해 주세요.");
  }
}

/** 예상하지 못한 오류를 쉬운 안내로 바꿉니다. 자세한 내용은 서버 기록에만 남깁니다. */
export async function withErrors(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error(error);
    if (error instanceof ServerConfigError) {
      return fail(500, "서버 저장소 설정이 아직 끝나지 않았습니다. 관리자에게 알려 주세요.");
    }
    return fail(500, "서버에서 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  }
}

/** 요청 본문을 JSON으로 읽습니다. 읽을 수 없으면 null */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
