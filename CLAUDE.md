# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 현재 상태

- 교육용 문제풀이 웹앱입니다. 요구사항 전체는 [PRD.md](PRD.md)에 있고, 모든 작업은 PRD.md를 기준으로 합니다.
- 1일차 앱(교사·학생 역할 화면 추가 전)이 Vercel 프로젝트 `claude-day1-quiz`(팀 teamus3)에 배포되어 있습니다: https://claude-day1-quiz.vercel.app . 교사·학생 화면 분리는 아직 배포하지 않았습니다. 배포는 사용자가 따로 요청할 때만 진행하고, 임시 확인용 배포 주소도 만들지 않습니다.
- Vercel 명령은 Claude 앱의 터미널 탭(`run_in_terminal`)에서 실행합니다. Claude의 PowerShell/Bash 도구는 `AppData\Roaming`이 앱 전용 공간으로 바뀌어 있어, 그 안의 Vercel 로그인 정보가 실제 사용자 것과 다릅니다.
- 버전 기록
  - **초기 버전**: 학생이 JSON 파일을 직접 업로드했습니다. 커밋 `fc722c2`에 남아 있으며 지금은 폐지되었습니다.
  - **폴더 목록 버전**: 학생이 `question-papers/` 폴더의 문제지 목록에서 골랐습니다. 커밋 `7dd260a`.
  - **현재 버전**: 교사가 JSON 문제지를 올려 Firestore에 저장·공개하고, 학생은 공개된 문제지만 풉니다. `question-papers/`의 파일은 교사가 올릴 예시 파일로만 남아 있고 학생 목록에는 직접 나오지 않습니다.
- 확인 작업을 위해 `question-papers/`에 임의의 문제지나 문항을 추가하지 않습니다. 여러 문제지 동작은 `parsePapers` 테스트처럼 메모리 안에서 점검합니다. Firestore에 확인용 데이터를 넣었다면 확인 뒤 지웁니다(예시 파일과 중복 검사에 걸리기 때문).
- 작업 폴더가 OneDrive 동기화 폴더이고, 경로에 공백과 한글(`OneDrive - Teamus\바탕 화면`)이 들어 있습니다. 패키지 설치 중 파일 잠금 오류(`EBUSY`, `EPERM`)가 나면 OneDrive 동기화 때문일 수 있습니다.

## 명령어

- `npm run dev`: 개발용 실행, http://localhost:3000 (`.claude/launch.json`에 `quiz-app`으로 등록됨)
- `npm run build`: 실제 배포용으로 만들기. TypeScript 검사도 함께 합니다.
- `npm run lint`: 코드 검사
- `npm test`: Vitest로 문제지 검사, 목록 정리, 채점 로직 테스트
- 테스트 하나만 실행: `npx vitest run -t "테스트 이름 일부"`
- `npx tsc --noEmit`만 따로 실행하면 `LayoutProps`를 찾지 못한다는 오류가 납니다. 이 타입은 Next가 dev/build할 때 만들어 주기 때문이므로, 타입 검사는 `npm run build`로 합니다.

## 구조

- Next.js 16 (App Router, Turbopack) + Tailwind 4. 이 버전은 예전 Next와 다른 점이 있으므로, API가 확실하지 않으면 `node_modules/next/dist/docs/`를 먼저 읽습니다([AGENTS.md](AGENTS.md) 참고).
- 화면은 주소별로 나뉩니다.
  - `app/page.tsx`(`/`): '교사로 시작하기'·'학생으로 시작하기'를 고르는 첫 화면
  - `app/teacher/page.tsx`(`/teacher`): `components/teacher/TeacherApp`이 Firebase Google 로그인(팝업)을 처리합니다. 로그인 후 ID 토큰을 `/api/teacher/session`에 보내 서버가 허용 교사인지 확인해야 `TeacherDashboard`(`PaperUpload` 문제지 올리기, 공개/비공개 버튼, `ResultsTable` 결과표·평균)를 보여줍니다.
  - 서버 검사: `lib/teacher/verify.ts`의 `verifyTeacher`가 `jose`로 Google 공개키를 써서 토큰을 검증하고(서비스 계정 비밀키 없음), 이메일을 환경변수 `TEACHER_EMAIL`(`.env.local`, 교사 1명)과 비교합니다. 앞으로 만드는 교사용 서버 기능도 처리 전에 반드시 이 함수를 거칩니다. Vercel에 배포할 때는 Vercel 환경변수에도 `TEACHER_EMAIL`이 있어야 하고, Firebase 로그인 허용 도메인에 배포 주소를 추가해야 합니다.
  - Firebase: 프로젝트 `claude-day1-quiz`, 웹 앱 `claude-day1-quiz-web`(무료 Spark 요금제). 예전 프로젝트 `quiz-day2`는 쓰지 않고 그대로 둡니다. Google 로그인은 `firebase.json`에 `auth.providers.googleSignIn`(oAuthBrandDisplayName "문제풀이", supportEmail = 교사 이메일, authorizedRedirectUris `https://claude-day1-quiz.firebaseapp.com/__/auth/handler`)을 적고 터미널 탭에서 `firebase deploy --only auth --project claude-day1-quiz`로 켰습니다(앱 배포가 아니라 Firebase 로그인 설정만 바꿈). 저장소가 공개라 이메일이 올라가지 않도록, 켠 뒤에는 `firebase.json`에서 `auth` 부분을 뺐습니다. 다시 적용해야 하면 잠시 넣었다가 빼세요. CLI로 만든 이 프로젝트에는 `localhost`가 로그인 허용 도메인에 기본으로 없었으므로 직접 추가했습니다. 지금 허용 도메인은 `claude-day1-quiz.firebaseapp.com`, `claude-day1-quiz.web.app`, `localhost`이고, Vercel 주소는 아직 없습니다. 공개 설정값은 `lib/firebase/config.ts`에 있습니다.
  - `app/student/page.tsx`(`/student`): `StudentApp`에서 이름을 입력하면(브라우저에 저장하지 않음) `QuizApp`이 `/api/student/papers`에서 공개 문제지(정답·해설 제외)를 받아옵니다. 최종 제출 때 `/api/student/results`가 서버에서 채점·저장하고 그 학생의 결과(정답·해설 포함)만 돌려줍니다. 저장 실패 시 '다시 시도'로 같은 답을 다시 보냅니다.
- Firestore(서울 `asia-northeast3`, 무료 요금제)
  - `firestore.rules`는 브라우저의 직접 읽기·쓰기를 모두 막습니다(`allow read, write: if false`). 모든 접근은 서버 Route Handler → `lib/firebase/store.ts`(Admin SDK)로만 합니다. 규칙은 터미널 탭에서 `firebase deploy --only firestore:rules --project claude-day1-quiz`로 올립니다.
  - 컬렉션: `papers`(title, titleKey, contentHash, questions, published), `results`(문서 id `{paperId}__{인코딩한 이름}`, 같은 이름은 덮어써서 최신 결과만 남음)
  - 중복 문제지: 제목(`titleKey`)이 같거나 문항 내용 해시(`contentHash`)가 같으면 409로 거절합니다.
  - 교사용 Route Handler(`app/api/teacher/**`)는 처음에 `rejectUnlessTeacher`(`lib/server/http.ts`)를 부릅니다.
  - 서버용 키: `lib/firebase/admin.ts`가 `FIREBASE_SERVICE_ACCOUNT_JSON`(Vercel용, 키 내용) 또는 `GOOGLE_APPLICATION_CREDENTIALS`(내 컴퓨터용, `.env.local`에 키 파일 경로)를 읽습니다. 키 파일은 프로젝트 폴더 밖(`C:\Users\YoonKeumJae\.firebase-keys\`)에 두고, 내용을 열거나 출력하지 않습니다. 키가 없으면 API가 "서버 저장소 설정이 아직 끝나지 않았습니다"를 돌려줍니다.
  - `GET /api/student/papers`는 요청을 읽지 않으므로 `connection()`으로 빌드 때 미리 만들지 않게 했습니다(Cache Components 사용 중).
- `lib/quiz/`: 화면과 분리된 로직입니다. 2일차에도 재사용할 수 있습니다.
  - `types.ts`: 문제지 형식(`title`, `questions`), 학생용 `PublicQuestion`/`PublicPaper`(정답·해설 없음)
  - `validate.ts`: 문제지 검사. 하나라도 틀리면 문제지 전체를 쓰지 않고, 문항 번호와 함께 쉬운 한국어 메시지를 돌려줍니다. 교사 업로드 때 화면과 서버에서 모두 씁니다.
  - `records.ts`: 이름·제목 정리, 중복 비교 키, 답 검사, 틀린 문항, 평균
  - `papers.ts`: `loadPapers`/`parsePapers`. 지금은 화면에서 쓰지 않고 예시 파일 검사 테스트에만 씁니다.
  - `score.ts`: 채점(서버에서만 실행)
- `components/quiz/QuizApp.tsx`: 화면 단계(`loading → list → solving → submitting/submitFailed → result`)를 관리합니다.
- `lib/client/api.ts`의 `callApi`: 화면에서 서버를 부를 때 쓰고, 실패하면 서버가 보낸 쉬운 안내 문구를 돌려줍니다.

## 기술 구성 (PRD.md 기준)

- Next.js + TypeScript, Vercel 배포, PC와 휴대폰 화면 모두 지원
- 문제지 파일: `question-papers/` 안의 JSON. 최상위에 `title`(목록에 표시할 제목)과 `questions` 배열을 둡니다. 각 문항은 `question`, `options`(보기 4개), `correctAnswer`(1~4, 1이 첫 번째 보기), `explanation`으로 구성합니다.
- 문제지의 문제·보기·정답·해설은 사용자 요청 없이 바꾸지 않습니다.
- 풀이 중에는 정답 여부·점수·해설을 숨기고, 모든 문항을 끝낸 뒤 한 번에 채점
- 점수 = 정답 수 ÷ 전체 문항 수 × 100 (모든 문항 배점 같음)

## 지금 만들 기능과 나중 기능

- **1일차 (지금)**: 문제지 목록 표시와 선택, 4지선다 풀이, 완료 후 채점·점수·정오·해설, 로컬 실행, Vercel 배포(요청 시)
- **2일차 (나중)**: 교사 Google 로그인과 학생 이름 기반 게스트 입장, Azure AI 문제 생성, 문제 저장·공개, Firestore 결과 저장, 교사용 성적 조회
- 1일차에는 로그인·AI 문제 생성·DB 저장을 만들지 않습니다. 2일차에 기능을 붙이기 쉬운 구조로 만들되, 2일차 기능을 미리 구현하지 않습니다.

## 사용자가 정한 사항 (현재 버전)

- 목록에서 문제지를 누르면 바로 1번 문제가 나옵니다. 문항 확인 화면은 없습니다.
- 목록에는 제목과 문항 수를 보여주고, 제목 가나다순으로 정렬합니다.
- 형식이 틀린 문제지는 목록에서 빼고, 목록 아래에 파일 이름과 틀린 이유를 보여줍니다.
- 풀이 중에 '이전' 버튼으로 돌아가 답을 바꿀 수 있습니다. 답을 고르지 않으면 '다음'으로 넘어갈 수 없습니다. 이 경우 따로 안내 문구는 띄우지 않습니다.
- 점수는 정수로 반올림합니다. 예: 2/3 → 67점
- 결과 화면에는 점수, 정오, 해설과 함께 내가 고른 답과 정답을 보여줍니다. '다시 풀기' 버튼은 넣지 않고, 처음으로 가려면 새로고침합니다.

## 아직 정해지지 않은 사항

- Vercel 계정과 배포 방식. 배포는 사용자가 요청할 때만 진행합니다.

## 작업 규칙

### 앱을 만드는 기준

- PRD.md에 적힌 요구사항을 기준으로 작업합니다.
- 지금 만들 기능과 나중에 추가할 기능을 구분합니다.
- 정해진 조건을 마음대로 바꾸거나 요청하지 않은 기능을 추가하지 않습니다.
- 정해지지 않은 내용이나 선택이 필요한 사항은 먼저 질문합니다.
- 기존 파일의 내용과 PRD.md가 서로 다르면 임의로 결정하지 않고 사용자에게 알립니다.

### 사용자에게 설명하는 방법

사용자는 개발을 모르는 일반인입니다.

- 새 세션을 시작하면 1일차인지 2일차인지 먼저 물어봅니다.
- 모든 설명은 쉬운 한국어로 합니다. 개발 지식이 있어야 이해할 수 있는 기술용어를 쓰지 않습니다.
- 사용자가 무엇을 하면 되는지, 어떤 결과가 나오는지를 중심으로 설명합니다.
- 화면에 보이는 버튼 이름과 파일 이름은 그대로 알려주고, 설명은 쉬운 말로 합니다.
- 설치나 설정이 필요하면 다음 순서로 안내합니다.
  1. 어느 화면을 열어야 하는지
  2. 무엇을 누르거나 입력해야 하는지
  3. 제대로 됐는지 무엇을 보고 확인하는지
- 사용자가 입력할 내용은 그대로 복사해서 쓸 수 있게 제공합니다.
- 여러 가지를 한꺼번에 시키지 않고 한 단계씩 안내합니다.
- 오류가 나면 원인과 해결 방법을 쉬운 말로 설명합니다.

### 작업을 진행하는 방법

- 앱을 만들기 전에 무엇을 어떤 순서로 만들지 짧게 설명하고 사용자의 확인을 받습니다.
- 수정한 뒤에는 무엇이 바뀌었는지, 사용자가 어떻게 확인하면 되는지 알려줍니다.
- 실제로 확인한 결과와 아직 확인하지 못한 부분을 구분해서 말합니다.
- 실행하거나 확인하지 않은 일을 완료했다고 말하지 않습니다.
- 앱 화면의 안내 문구와 오류 메시지도 일반인이 이해할 수 있는 쉬운 말로 작성합니다.
