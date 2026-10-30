import { connection } from "next/server";
import { listPublishedPapers } from "@/lib/firebase/store";
import { withErrors } from "@/lib/server/http";

// 학생: 공개된 문제지 목록(정답·해설 제외). 다른 학생의 결과는 보내지 않습니다.
export async function GET() {
  // 빌드할 때 미리 만들지 않고, 요청마다 Firestore에서 최신 공개 상태를 읽습니다.
  await connection();
  return withErrors(async () => Response.json({ papers: await listPublishedPapers() }));
}
