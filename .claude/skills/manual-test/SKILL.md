---
name: manual-test
description: Playwright MCP로 실제 브라우저를 띄워 이 프로젝트(Next.js + Chakra UI v3)의 UI 플로우를 end-to-end로 시연하고, `USER_JOURNEY.md`의 J1~J17 시나리오 각 상태마다 스크린샷을 남겨 수용 기준과 일치하는지 육안 검증한다. 사용자가 "실제 브라우저로 돌려봐", "UI 직접 확인", "manual test", "J3 시나리오 수동 검증", "브라우저에서 보여줘" 등으로 특정 화면/플로우의 동작 확인을 요청할 때 호출한다. 자동화 테스트(vitest·Playwright e2e)가 통과했더라도 실제 렌더링·스타일·상호작용을 눈으로 확인하고 증적을 남길 때. 원격(배포) URL에 쓰기 작업 시연은 범위 밖 — 읽기만 허용.
---

# manual-test — Playwright MCP 기반 UI 수동 회귀

이 프로젝트의 UI 플로우를 실제 브라우저로 열어 **시연하고 증적(스크린샷)을 남기는** 워크플로우. `USER_JOURNEY.md`의 J1~J17 시나리오가 기본 실행 카탈로그.

## 언제 쓰는가

- PR 리뷰 전 화면 렌더/레이아웃 육안 확인
- 자동화 테스트는 통과했지만 CSS·메시지·UX를 직접 확인하고 싶을 때
- 버그 재현 시나리오를 단계별 스크린샷으로 기록해야 할 때
- `USER_JOURNEY.md` 하단의 "수동 회귀 체크리스트"를 증적 포함으로 실행할 때
- 배포 후 공개 URL에서 **읽기 전용** 스모크 확인

**쓰지 말 것**:
- 회귀 방지용 자동화 — Playwright e2e spec(`tests/e2e/**`)에 고정.
- 배포된 URL에서 Task 생성/수정/삭제 같은 쓰기 시연 — 공유 상태 오염 위험 → 로컬 환경에서만.

## 전제

- 프로젝트 루트에 `package.json`, `playwright.config.ts` 존재.
- 현재 세션에서 Playwright MCP 사용 가능 (`mcp__playwright__browser_*`).
- Node 20+.
- 시나리오가 DB 상태에 의존하면 Supabase 로컬 컨테이너(`supabase status` ✅) + 로컬 Next.js dev 서버 기동 가능해야 함.
- `USER_JOURNEY.md`가 최신 상태.

## 워크플로우

### 1. 대상 플로우 확인

사용자 요청에서 다음을 파싱:
- **시나리오 ID** (예: `J1`, `J3`, `J15`) 또는 경로(`/`, `/tasks` 등)
- **케이스** (happy / 검증 실패 / 경계값 / 권한 없음 등)
- **대상 환경**: 로컬(`http://localhost:3000`, 기본) / 배포(`https://<vercel-url>`, 읽기만)
- **DB 상태 전제**: "빈 상태" / "Given N개 작업 존재" 등 — 필요하면 어떻게 준비할지 확인(아래 3-A 참조)

식별이 애매하면 짧게 질문. 기본은 **로컬 + USER_JOURNEY 해당 시나리오 Given/When/Then 그대로**.

### 2. USER_JOURNEY.md 해당 시나리오 로드

```bash
grep -A 20 "^### J<N>" USER_JOURNEY.md
```

Given/When/Then 블록을 뽑아 **실행 체크리스트**로 변환:
- Given → 준비 단계 (DB 시드, 서버 기동, 브라우저 열기)
- When → 상호작용 (navigate, fill, click)
- Then → 검증 (렌더된 문자열/요소/URL/상태)

### 3. 환경 준비

#### 3-A. DB 상태 맞추기 (Given에 전제가 있을 때)

사용자에게 확인:
> "J<N>의 Given이 `<작업이 N개 존재>`입니다. 현재 로컬 DB 상태 그대로 진행할까요, 아니면 초기화 후 시드할까요?"

- "그대로" → 바로 3-B.
- "초기화" → 승인 후:
  ```bash
  supabase stop && supabase start
  npm run db:migrate
  # 시드는 별도 스크립트 또는 UI 조작으로 (supabase db reset 금지 — CLAUDE.md §10)
  ```

#### 3-B. 개발 서버 기동

`supabase status` + `npm run dev` (백그라운드):
```bash
# (필요 시) supabase start
npm run dev  # run_in_background: true, 출력 파일 확보
```

`Monitor` 로 ready 신호 대기:
```
tail -f <output-file> | grep -E --line-buffered \
  "Ready in|started server on|error|EADDRINUSE" | head -1
```

- 성공 시그널: `Ready in XXXms` / `started server on 0.0.0.0:3000`.
- 실패 시그널: `EADDRINUSE` (포트 이미 사용 중 → `lsof -i :3000` 확인 후 사용자에게 알림) / `Module not found` / `Type error`.

### 4. 브라우저 시연 — 각 시나리오 3단계 증적

Playwright MCP 툴 사용 패턴:

1. **초기 상태 (Given)**
   - `browser_navigate` → `http://localhost:3000<path>`
   - `browser_snapshot` → 접근성 트리 확인 (엘리먼트 `ref=eN` 확보; fill/click에 필수)
   - Chakra v3 + next-themes 테마 flash 대기: `browser_wait_for` 로 `networkidle` 또는 특정 텍스트/요소 등장까지.
   - `browser_take_screenshot` → `<scenario-id>-<state>.png` 예: `j1-empty-state.png`

2. **입력/상호작용 (When)**
   - `browser_fill_form` (여러 필드 일괄) 또는 `browser_type` (단일 필드)
   - 필요 시 `browser_take_screenshot` → `<scenario>-filled.png`
   - `browser_click` 로 submit/action

3. **결과 (Then)**
   - 페이지 전환 시 새 snapshot이 tool result에 포함됨
   - 검증: 기대 문자열/요소/URL 확인
   - `browser_take_screenshot` → `<scenario>-<result>.png` 예: `j3-after-add.png`, `j15-overdue-stripe.png`

시나리오를 연달아 돌릴 때는 사이에 `browser_navigate`로 초기 URL 재진입 (폼/상태 리셋) 또는 DB 상태 재준비.

### 5. 정리

- `mcp__playwright__browser_close` — 페이지 닫기
- `TaskStop` — `npm run dev` 백그라운드 태스크 중단 (사용자가 "켜둬"라고 하지 않은 한)
- `Monitor`도 정리

### 6. 결과 보고 (표 형태)

| 시나리오 | 상태 | 스크린샷 | 메모 |
|---|---|---|---|
| J1 빈 상태 | ✅ | `j1-empty-state.png` | 안내 문구 "아직 작업이 없습니다" 확인, `+ 작업 추가` 버튼 렌더 |
| J3 작업 생성 | ✅ | `j3-filled.png`, `j3-after-add.png` | 모달 입력 → 목록 최상단 추가 |
| J15 Overdue 빗금 | ❌ | `j15-expected-stripe.png` | 빗금이 렌더되지 않음. SPEC §5.3에 정의된 시각 표시 누락 → 이슈 #11로 보고 |

자동 테스트가 검증하는 계약과 실제 렌더링이 일치하는지 명시. **불일치 발견 시 즉시 보고** — 테스트 계약과 UI 문구 중 어느 쪽을 맞출지 사용자에게 결정 요청.

## 가이드라인

- **시나리오 ID 일관성**: 스크린샷 파일명은 반드시 `<scenario-id>-<state>.png` 형태. 보고서 표에서도 ID로 지칭(`J15 통과`, `J3 실패`).
- **엘리먼트 참조는 snapshot에서만**: `browser_snapshot` 반환한 `ref=eN` 값을 `fill_form`/`click`의 `ref`에 그대로 전달. CSS selector 추측 금지.
- **Chakra v3 렌더 타이밍**: `next-themes`와 연동되어 **hydration 이후 색상/테마가 바뀔 수 있음**. 스크린샷 전 `browser_wait_for` 로 네트워크 idle + 특정 요소 등장 대기.
- **DB 상태 오염 주의**: J2~J8 같은 CRUD 시나리오 후에는 다음 시나리오 전에 DB를 되돌릴지 그대로 둘지 사용자 확인. `supabase db reset` 금지 (CLAUDE.md §10) — 필요하면 `supabase stop/start + db:migrate + 재시드`.
- **원격(배포) 환경**: `NEXT_PUBLIC_SUPABASE_URL`이 `.supabase.co` 도메인인 환경에서는 **읽기만** 허용. 생성/수정/삭제 조작은 로컬에서만 시연.
- **기동 시간 대응**: 첫 `next dev` 컴파일은 2~5초. `Monitor` 시그널 대기 후 navigate. `sleep` 조합 금지.
- **한 시나리오는 한 턴에 몰아서**: navigate → snapshot → fill → click → screenshot. 중간 설명 최소화.
- **한국어**로 대화.

## 자주 쓰는 경로 (이 프로젝트 기준)

- `/` — 홈 (Task 목록 + 간트 뷰, SPEC §5)
- `/` 빈 상태 → J1
- `+ 작업 추가` 모달 → J2, J3
- 인라인 편집 → J4~J7
- CSV Import/Export → J10, J11
- 간트 뷰 → J12~J15

UI 없는 Route Handler(`app/api/**`) 검증은 이 스킬 범위 밖 — `curl` / `fetch` 통합 테스트로.

## 후속 제안

시연 중 자동화하면 좋은 케이스를 발견하면:
- **Vitest unit/integration 추가** (`tests/unit/**`, `tests/integration/**`) — 빠르고 CI 기본 포함.
- **Playwright e2e 추가** (`tests/e2e/**`) — USER_JOURNEY 시나리오를 `describe('J<N> — 제목', …)` 로 묶어 고정.

자동화 제안은 이 스킬에서 수행하지 말고 사용자에게 "이 시나리오는 Playwright e2e로 고정할까요?"로 넘기라.

## 범위 밖

- 회귀 방지 자동화 spec 작성 — `tests/e2e/**`에 직접 추가 (`plan-issue` → `raise-pr` 흐름으로).
- 배포 URL에서 쓰기 작업 시연.
- 브라우저 확장/플러그인이 필요한 시나리오 (예: 실제 Supabase 대시보드 조작).
- 시각 회귀(스크린샷 diff) 툴링 세팅.

## 실행 예시 — J1 + J3 수동 회귀

**사용자**: "J1이랑 J3 브라우저로 확인해줘. 현재 DB 상태는 비어 있다고 가정."

**Claude**:
1. `grep -A 20 "^### J1" USER_JOURNEY.md` + `J3` 동일.
2. `supabase status` 확인 → ✅. `npm run dev` 백그라운드 기동 + Monitor `Ready in` 대기.
3. J1:
   - `browser_navigate http://localhost:3000` → `browser_snapshot` → `browser_wait_for("아직 작업이 없습니다")` → `j1-empty-state.png`
4. J3:
   - `browser_click ref=<+ 작업 추가>` → `browser_snapshot` (모달)
   - `browser_fill_form({title:"첫 번째 작업", startDate:"2026-04-25", dueDate:"2026-04-30"})` → `j3-filled.png`
   - `browser_click ref=<저장>` → `browser_wait_for("첫 번째 작업")` → `j3-after-add.png`
5. `browser_close` + `TaskStop npm run dev`.
6. 결과 표 + "J3 after 상태에서 목록 최상단에 바로 뜨는 것 확인. 간트 뷰의 막대는 다음 단계(J12)에서 확인 가능" 메모.
