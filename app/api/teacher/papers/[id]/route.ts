import { setPublished } from "@/lib/firebase/store";
import { fail, readJson, rejectUnlessTeacher, withErrors } from "@/lib/server/http";

// 교사: 공개/비공개 바꾸기
export async function PATCH(request: Request, ctx: RouteContext<"/api/teacher/papers/[id]">) {
  return withErrors(async () => {
    const denied = await rejectUnlessTeacher(request);
    if (denied) return denied;

    const body = await readJson(request);
    if (typeof body?.published !== "boolean") {
      return fail(400, "공개 여부를 알 수 없습니다.");
    }
    const { id } = await ctx.params;
    if (!(await setPublished(id, body.published))) {
      return fail(404, "문제지를 찾지 못했습니다. 새로고침해 주세요.");
    }
    return Response.json({ id, published: body.published });
  });
}
