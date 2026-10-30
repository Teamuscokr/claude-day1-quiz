import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTeacher } from "./verify";

describe("verifyTeacher", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("허용 이메일이 설정되지 않았으면 막는다", async () => {
    vi.stubEnv("TEACHER_EMAIL", "");
    expect(await verifyTeacher("Bearer abc")).toEqual({ ok: false, reason: "not-configured" });
  });

  it("로그인 증명이 없으면 막는다", async () => {
    vi.stubEnv("TEACHER_EMAIL", "teacher@example.com");
    expect(await verifyTeacher(null)).toEqual({ ok: false, reason: "no-token" });
    expect(await verifyTeacher("abc")).toEqual({ ok: false, reason: "no-token" });
  });

  it("가짜 로그인 증명은 막는다", async () => {
    vi.stubEnv("TEACHER_EMAIL", "teacher@example.com");
    expect(await verifyTeacher("Bearer not-a-real-token")).toEqual({ ok: false, reason: "invalid-token" });
  });
});
