"use client";

import { useState } from "react";
import { gradeQuiz, type ScoreResult } from "@/lib/quiz/score";
import type { Answers, QuizFile } from "@/lib/quiz/types";
import ConfirmStep from "./ConfirmStep";
import ResultStep from "./ResultStep";
import SolveStep from "./SolveStep";
import UploadStep from "./UploadStep";

type Step =
  | { name: "upload" }
  | { name: "confirm"; quiz: QuizFile; fileName: string }
  | { name: "solving"; quiz: QuizFile }
  | { name: "result"; result: ScoreResult };

export default function QuizApp() {
  const [step, setStep] = useState<Step>({ name: "upload" });

  switch (step.name) {
    case "upload":
      return (
        <UploadStep
          onLoaded={(quiz, fileName) => setStep({ name: "confirm", quiz, fileName })}
        />
      );
    case "confirm":
      return (
        <ConfirmStep
          fileName={step.fileName}
          count={step.quiz.questions.length}
          onStart={() => setStep({ name: "solving", quiz: step.quiz })}
          onBack={() => setStep({ name: "upload" })}
        />
      );
    case "solving":
      return (
        <SolveStep
          questions={step.quiz.questions}
          onSubmit={(answers: Answers) =>
            setStep({ name: "result", result: gradeQuiz(step.quiz.questions, answers) })
          }
        />
      );
    case "result":
      return <ResultStep result={step.result} />;
  }
}
