# Survey Corps Pi 런처 — 통합 가이드

> **기획서 작성부터 실제 프로덕트 빌딩까지.**
> Pi는 터미널에서 코드를 읽고, 쓰고, 실행하는 AI 코딩 에이전트입니다.

---

## 전체 흐름

```
[brief-maker.vercel.app] → API 키 등록
        ↓
터미널에서 scpi 실행
        ↓
멤버 선택 → 모델 선택 → Pi 시작
        ↓
AGENTS.md(브리프) 자동 로드 → 작업
        ↓
종료 시 세션 자동 저장 → 다음 실행 때 이어서
```

---

## 1단계 — 설치

### Node.js 확인

```bash
node -v
```

`v18` 이상이어야 합니다. 없으면 [nodejs.org](https://nodejs.org) 에서 LTS 설치.

### 런처 설치

```bash
npm install -g github:ralphxpdev-cell/sc-launcher
```

### 계정 등록

1. [brief-maker.vercel.app](https://brief-maker.vercel.app) 접속
2. 본인 이름 카드 클릭
3. API 키 등록 (하나 이상)

---

## 2단계 — API 키 발급

### Gemini 2.5 Flash — 무료 ⭐ 추천 시작점

| 항목 | 내용 |
|------|------|
| 비용 | 무료 (일일 한도 있음) |
| 속도 | 빠름 |
| 강점 | 긴 컨텍스트, 코드 작성, 빠른 반응 |
| 키 형식 | `AIzaSy...` |

**발급 방법:**
1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 접속
2. Google 계정 로그인
3. **"API 키 만들기"** 클릭
4. 생성된 `AIzaSy...` 키 복사

---

### LLaMA 3.3 (Groq) — 무료 ⭐ 추천 시작점

| 항목 | 내용 |
|------|------|
| 비용 | 무료 (분당 요청 한도 있음) |
| 속도 | 매우 빠름 (Groq 전용 하드웨어) |
| 강점 | 빠른 초안, 대화형 작업 |
| 키 형식 | `gsk_...` |

**발급 방법:**
1. [console.groq.com](https://console.groq.com) 접속
2. 회원가입 (Google 로그인 가능)
3. **API Keys** → **"Create API Key"**
4. 생성된 `gsk_...` 키 복사

---

### Claude Sonnet (Anthropic) — 유료

| 항목 | 내용 |
|------|------|
| 비용 | 입력 $3 / 출력 $15 (백만 토큰당) |
| 강점 | 코드 작성 최고, 긴 파일 분석, 정밀한 지시 수행 |
| 키 형식 | `sk-ant-...` |

**발급 방법:**
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. 회원가입 → 결제 수단 등록 (최소 $5 충전)
3. **Settings → API Keys → "Create Key"**
4. 생성된 `sk-ant-...` 키 복사

---

### GPT-4o (OpenAI) — 유료

| 항목 | 내용 |
|------|------|
| 비용 | 입력 $2.5 / 출력 $10 (백만 토큰당) |
| 강점 | 범용, 이미지 이해, 함수 호출 |
| 키 형식 | `sk-...` |

**발급 방법:**
1. [platform.openai.com](https://platform.openai.com) 접속
2. 회원가입 → 결제 수단 등록
3. **API Keys → "Create new secret key"**
4. 생성된 `sk-...` 키 복사 (한 번만 표시됨)

---

### Ollama — 완전 무료 (로컬 실행)

| 항목 | 내용 |
|------|------|
| 비용 | 완전 무료 |
| 조건 | 로컬 PC에서 직접 실행 (GPU 권장) |
| 강점 | 인터넷 없이 동작, 개인정보 보호 |

**설치 방법:**
```bash
# 1. ollama 설치 (ollama.ai)
# 2. 모델 다운로드
ollama pull llama3.2

# 3. 서버 실행 (별도 터미널)
ollama serve
```

scpi 실행 시 Ollama 선택하면 자동으로 `http://localhost:11434` 에 연결합니다.

---

## 3단계 — scpi 실행

```bash
scpi
```

### 첫 실행 화면

```
멤버를 선택하세요:

  1. 이태섭
  2. 안성은
  3. 백은총
  ...

번호: 2

🔑 키 확인 중... ✅

어떤 모델로 시작할까요?

  1. Gemini 2.5 Flash
  2. Claude Sonnet (Anthropic)
  3. LLaMA 3.3 (Groq, 무료)

번호: (엔터 = 기본값, 번호 = 선택 후 저장)
```

- **엔터**: 목록 첫 번째 모델로 시작 (저장 안 됨)
- **번호 입력**: 선택한 모델로 시작 + 다음부터 자동 선택

### 재설정

```bash
scpi --reset
```

멤버·모델 저장값 초기화. 다시 선택 화면부터 시작.

---

## 4단계 — Pi 기본 사용법

Pi가 시작되면 터미널에서 자연어로 지시합니다.

```
> 이 폴더에 React 앱 만들어줘
> package.json 읽고 의존성 설명해줘
> 로그인 페이지 만들어줘
> 버그 수정해줘 — TypeError: cannot read properties of undefined
```

Pi는 파일을 **직접 읽고, 쓰고, 수정**하며 **터미널 명령어도 실행**합니다.

---

## 5단계 — 활용 분야

### A. 기획서 작성

scpi 실행 시 `~/survey-corps/[이름]/AGENTS.md` 에 최신 브리프가 자동으로 로드됩니다.

```
> 브리프 읽고 요약해줘
> 이 서비스의 핵심 기능 목록 만들어줘
> 경쟁사 분석 초안 작성해줘
> 사용자 시나리오 3개 만들어줘
```

### B. 프로덕트 빌딩 (코드 작성)

Pi는 실제 코드를 작성하고 파일을 생성합니다. 기획서 단계를 넘어 직접 구현까지 가능합니다.

#### Next.js 앱 빌딩 예시

```
> Next.js 앱 초기 세팅해줘 (TypeScript, Tailwind)
> Supabase 연결하고 users 테이블 만들어줘
> 로그인/회원가입 페이지 만들어줘
> 대시보드 페이지 만들어줘
```

#### 반복 작업 예시

```
> 이 컴포넌트에 로딩 상태 추가해줘
> API 에러 핸들링 추가해줘
> 모바일 반응형으로 바꿔줘
> TypeScript 타입 오류 전부 수정해줘
```

#### 기존 프로젝트에 기능 추가

```
> 이 코드베이스 분석하고 구조 설명해줘
> [파일명] 읽고 여기에 검색 기능 추가해줘
> 테스트 코드 작성해줘
```

### C. 문서 & 리서치

```
> 이 코드에 주석 달아줘
> API 문서 초안 작성해줘
> 경쟁사 [서비스명] 분석해줘
> 이 기술 스택의 장단점 비교해줘
```

---

## 6단계 — 세션 저장 & 이어하기

Pi를 종료하면 (`/exit` 또는 Ctrl+C) 자동으로 세션이 저장됩니다.

```
💾 세션 저장 중...
✅ 저장 완료! brief-maker.vercel.app/dashboard
```

다음에 `scpi` 실행하면 저장된 컨텍스트가 `AGENTS.md`로 자동 로드됩니다.

**수동으로 확인:**
- [brief-maker.vercel.app/dashboard](https://brief-maker.vercel.app/dashboard) → 각 멤버의 세션 기록

---

## 모델별 추천 용도

| 모델 | 추천 용도 | 비용 | 속도 |
|------|----------|------|------|
| Gemini 2.5 Flash | 일반 코딩, 빠른 초안, 긴 파일 분석 | 무료 | ⚡⚡⚡ |
| LLaMA 3.3 (Groq) | 빠른 대화, 간단한 작업 | 무료 | ⚡⚡⚡⚡ |
| Claude Sonnet | 복잡한 코드, 정밀한 리팩토링, 버그 수정 | 유료 | ⚡⚡ |
| GPT-4o | 범용, 이미지 포함 작업 | 유료 | ⚡⚡ |
| Ollama | 오프라인 작업, 민감한 코드 | 무료 | ⚡ (PC 성능 의존) |

**추천 조합:**
- 처음 시작 → **Gemini** (무료, 빠름)
- 복잡한 코딩 → **Claude Sonnet**
- 빠른 반복 작업 → **Groq**

---

## 작업 폴더

scpi 실행 시 자동으로 아래 폴더가 생성되고 이동합니다.

```
~/survey-corps/[이름]/
├── AGENTS.md        ← 브리프 (자동 로드)
├── [프로젝트 파일들...]
```

Pi가 만드는 파일은 전부 이 폴더에 저장됩니다. VS Code로 열어서 같이 작업 가능합니다.

```bash
code ~/survey-corps/[이름]
```

---

## 자주 묻는 질문

**Q. Pi가 만든 파일은 어디에 있나요?**
`~/survey-corps/[이름]/` 폴더 안에 있습니다.

**Q. 모델을 중간에 바꾸고 싶어요.**
`scpi --reset` 으로 초기화 후 다시 선택하세요.

**Q. API 키를 추가하고 싶어요.**
[brief-maker.vercel.app](https://brief-maker.vercel.app) → 멤버 선택 → "API 키 추가/수정" 클릭.

**Q. 세션이 저장 안 됐어요.**
Pi 종료 시 `💾 세션 저장 중...` 메시지가 떠야 합니다. `~/.pi/agent/sessions/` 폴더에 세션 파일이 있어야 저장됩니다.

**Q. Gemini 무료 한도를 초과했어요.**
Groq(무료)로 전환하거나, 내일 다시 시도하세요.

**Q. Pi 명령어가 뭐가 있나요?**
Pi 안에서 `/help` 입력하면 전체 명령어 목록이 나옵니다.

---

## 업데이트

```bash
npm install -g github:ralphxpdev-cell/sc-launcher
```

같은 명령어로 업데이트합니다.
