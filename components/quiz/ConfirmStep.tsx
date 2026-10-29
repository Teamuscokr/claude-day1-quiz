type Props = {
  fileName: string;
  count: number;
  onStart: () => void;
  onBack: () => void;
};

export default function ConfirmStep({ fileName, count, onStart, onBack }: Props) {
  return (
    <section className="card">
      <h1 className="text-2xl font-bold">문제 파일을 확인했습니다</h1>
      <dl className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-x-3">
          <dt className="text-muted">파일 이름</dt>
          <dd className="break-all font-medium">{fileName}</dd>
        </div>
        <div className="flex gap-x-3">
          <dt className="text-muted">문제 수</dt>
          <dd className="font-medium">문제 {count}개</dd>
        </div>
      </dl>
      <p className="mt-6 text-muted">
        한 문제씩 풀고, 마지막 문제까지 답한 뒤 채점합니다. 풀이 중에는 정답이 보이지 않습니다.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onBack}>
          다른 파일 고르기
        </button>
        <button type="button" className="btn-primary" onClick={onStart}>
          풀이 시작
        </button>
      </div>
    </section>
  );
}
