import { listResults } from "@/lib/firebase/store";
import { averageScore } from "@/lib/quiz/records";
import { fail, rejectUnlessTeacher, withErrors } from "@/lib/server/http";

// 교사: 문제지별 학생 결과(이름별 최신 결과)와 평균
export async function GET(request: Request, ctx: RouteContext<"/api/teacher/papers/[id]/results">) {
  return withErrors(async () => {
    const denied = await rejectUnlessTeacher(request);
    if (denied) return denied;

    const { id } = await ctx.params;
    const found = await listResults(id);
    if (!found) return fail(404, "문제지를 찾지 못했습니다. 새로고침해 주세요.");
    return Response.json({ ...found, average: averageScore(found.rows) });
  });
}
