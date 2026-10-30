import { submitResult } from "@/lib/firebase/store";
import { MAX_NAME_LENGTH, isCompleteAnswers, normalizeName } from "@/lib/quiz/records";
import { fail, readJson, withErrors } from "@/lib/server/http";

// 학생: 최종 제출. 서버에서 채점·저장하고, 이 학생의 결과(정답·해설 포함)만 돌려줍니다.
export async function POST(request: Request) {
  return withErrors(async () => {
    const body = await readJson(request);
    const paperId = body?.paperId;
    const name = typeof body?.name === "string" ? normalizeName(body.name) : "";
    if (typeof paperId !== "string" || paperId === "") {
      return fail(400, "문제지를 알 수 없습니다. 처음부터 다시 시작해 주세요.");
    }
    if (name === "" || name.length > MAX_NAME_LENGTH) {
      return fail(400, `이름은 1~${MAX_NAME_LENGTH}글자로 입력해 주세요.`);
    }
    if (!Array.isArray(body?.answers) || !isCompleteAnswers(body.answers, body.answers.length)) {
      return fail(400, "모든 문제에 답을 골라 주세요.");
    }

    const submitted = await submitResult(paperId, name, body.answers);
    if (!submitted.ok) {
      return submitted.reason === "not-found"
        ? fail(404, "이 문제지는 지금 풀 수 없습니다. 선생님께 확인해 주세요.")
        : fail(400, "모든 문제에 답을 골라 주세요.");
    }
    return Response.json({ result: submitted.result });
  });
}
