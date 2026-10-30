"use client";

import { useState } from "react";
import QuizApp from "@/components/quiz/QuizApp";
import NameStep from "./NameStep";

// 학생은 이름만 입력하고 들어갑니다. 이름은 브라우저에 저장하지 않으므로 새로고침하면 다시 입력합니다.
// 결과는 최종 제출할 때 이 이름으로 서버에 저장됩니다.
export default function StudentApp() {
  const [name, setName] = useState<string | null>(null);

  if (name === null) {
    return <NameStep onEnter={setName} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">{name}</span> 학생
      </p>
      <QuizApp studentName={name} />
    </div>
  );
}
