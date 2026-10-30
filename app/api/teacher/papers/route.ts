import { createPaper, listTeacherPapers } from "@/lib/firebase/store";
import { validateQuizText } from "@/lib/quiz/validate";
import { fail, readJson, rejectUnlessTeacher, withErrors } from "@/lib/server/http";

// 교사: 등록한 문제지 목록
export async function GET(request: Request) {
  return withErrors(async () => {
    const denied = await rejectUnlessTeacher(request);
    if (denied) return denied;
    return Response.json({ papers: await listTeacherPapers() });
  });
}

// 교사: JSON 문제지 등록(비공개로 저장). 화면에서 검사했더라도 서버에서 다시 검사합니다.
export async function POST(request: Request) {
  return withErrors(async () => {
    const denied = await rejectUnlessTeacher(request);
    if (denied) return denied;

    const body = await readJson(request);
    if (typeof body?.text !== "string") {
      return fail(400, "올린 파일 내용을 읽지 못했습니다. 다시 선택해 주세요.");
    }
    const checked = validateQuizText(body.text);
    if (!checked.ok) {
      return fail(400, "문제지 형식이 올바르지 않습니다.", { errors: checked.errors });
    }

    const created = await createPaper(checked.quiz);
    if (!created.ok) {
      const what = created.reason === "duplicate-title" ? "제목이 같은" : "문항 내용이 똑같은";
      return fail(409, `이미 등록된 문제지입니다. ${what} 문제지 "${created.existingTitle}"가 있습니다.`);
    }
    return Response.json({ paper: created.paper }, { status: 201 });
  });
}
