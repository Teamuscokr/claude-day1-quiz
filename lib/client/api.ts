// 화면에서 앱 서버(/api/...)를 부를 때 쓰는 도우미입니다. 실패하면 화면에 보여줄 쉬운 안내를 돌려줍니다.

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; errors?: string[] };

type Options = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** 교사 기능이면 Firebase 로그인 증명(ID 토큰) */
  token?: string;
};

export async function callApi<T>(path: string, { method = "GET", body, token }: Options = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, message: "서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요." };
  }

  const data: unknown = await res.json().catch(() => null);
  if (res.ok) return { ok: true, data: data as T };
  const info = (data ?? {}) as { message?: unknown; errors?: unknown };
  return {
    ok: false,
    status: res.status,
    message: typeof info.message === "string" ? info.message : "서버에서 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
    errors: Array.isArray(info.errors) ? info.errors.filter((e): e is string => typeof e === "string") : undefined,
  };
}
