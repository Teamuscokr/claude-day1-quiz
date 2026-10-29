"use client";

import { useState } from "react";
import type { PaperList } from "@/lib/quiz/papers";
import { gradeQuiz, type ScoreResult } from "@/lib/quiz/score";
import type { Answers, Paper } from "@/lib/quiz/types";
import PaperListStep from "./PaperListStep";
import ResultStep from "./ResultStep";
import SolveStep from "./SolveStep";

type Step =
  | { name: "list" }
  | { name: "solving"; paper: Paper }
  | { name: "result"; result: ScoreResult };

export default function QuizApp({ papers, problems }: PaperList) {
  const [step, setStep] = useState<Step>({ name: "list" });

  switch (step.name) {
    case "list":
      return (
        <PaperListStep
          papers={papers}
          problems={problems}
          onSelect={(paper) => {
            setStep({ name: "solving", paper });
            window.scrollTo({ top: 0 });
          }}
        />
      );
    case "solving":
      return (
        <SolveStep
          questions={step.paper.questions}
          onSubmit={(answers: Answers) => {
            setStep({ name: "result", result: gradeQuiz(step.paper.questions, answers) });
            window.scrollTo({ top: 0 });
          }}
        />
      );
    case "result":
      return <ResultStep result={step.result} />;
  }
}
