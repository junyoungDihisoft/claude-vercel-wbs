---
name: plan-issue
description: GitHub 이슈 번호를 받아 `SPEC.md` · `USER_JOURNEY.md` · `CLAUDE.md` 규약을 근거로 TDD 슬라이스(RED → GREEN → REFACTOR) 단위로 쪼갠 구현 계획을 세운다. 사용자가 "이슈 #3 계획 세워줘", "plan issue 5", "이슈부터 분석해줘", "구현 계획 짜줘" 등으로 요청할 때 호출한다. 입력은 이슈 번호(또는 URL). 구현·커밋·PR 생성은 **범위 밖** — 오직 계획서만 돌려준다. 스펙에 없는 기능을 요청하면 먼저 `SPEC.md` 갱신을 제안하고 중단한다.
---

# plan-issue — 이슈 번호 → TDD 구현 계획

GitHub 이슈 하나를 받아 "이 이슈를 어떻게 쪼개 구현할 것인가"를 **TDD 커밋 단위 + 파일 리스트 + 시나리오 매핑**으로 정리해 돌려주는 스킬. 이 스킬은 **계획만** 한다. 실제 파일을 수정하거나 커밋하지 않는다.

## 왜 이 스킬이 필요한가

- CLAUDE.md §1은 "한 번의 응답에 너무 많은 파일을 동시에 생성·수정하지 않는다. GitHub Issue 하나 = 커밋 하나"를 요구한다.
- §1-B는 "기능 구현 요청이 들어오면 먼저 `SPEC.md`를 읽고, 충돌·누락 시 먼저 스펙을 고친다"를 요구한다.
- §6은 스키마 변경 시 `schema.ts → generate → 리뷰 → migrate → 커밋` 순서를 강제한다.
- 수강생은 "이슈를 어떻게 쪼개야 하는지" 감이 없다. 매번 이걸 직접 설명하지 말고, 규약 기반 자동 계획으로 일관되게 제시한다.

## 언제 쓰는가

- `/plan-issue 3` 처럼 이슈 번호를 전달하며 "이 이슈부터 시작해줘"라고 할 때.
- 큰 이슈(여러 체크박스 포함)를 시작하기 전에 커밋 슬라이스를 미리 합의하고 싶을 때.
- `SPEC.md`에 없는 기능인지 먼저 확인받고 싶을 때.

**쓰지 말 것**:
- 계획 없이 바로 구현하고 싶을 때 — 자유 대화로 진행.
- 이미 계획이 있고 구현만 남은 경우 — 바로 구현 또는 `raise-pr`.
- PR 단위 리뷰 — `multi-agent-review`.

## 전제

- 저장소 루트에 `SPEC.md`, `USER_JOURNEY.md`, `CLAUDE.md` 존재.
- `gh` CLI 인증 완료.
- 대상 이슈가 이미 GitHub에 존재 (`gh issue list`).

## 워크플로우

### 1. 입력 파싱 및 이슈 읽기

```bash
gh issue view <N> --json number,title,body,labels,state
```

`state: "OPEN"`이 아니면 "이미 닫힌 이슈인데 계속 진행할까요?" 질문. 본문의 체크박스 `- [ ]` 를 **항목 리스트로 추출**.

이슈 번호를 못 받았으면:
```bash
gh issue list --state open --json number,title --limit 20
```
보여주고 "어느 이슈인가요?" 질문.

### 2. `SPEC.md` · `USER_JOURNEY.md` 교차 확인

1. `SPEC.md` 전문을 읽는다.
2. 이슈가 다루는 기능을 `SPEC.md`의 섹션(1~8)과 매핑.
3. 다음 3 케이스로 분기:

| 케이스 | 대응 |
|---|---|
| **스펙에 이미 정의됨** | 정의 그대로 따르기. 계획서에 해당 SPEC 섹션 ID 인용. |
| **스펙과 충돌** | 계획 수립을 멈추고 사용자에게 "SPEC을 업데이트할까요, 기존 정의를 따를까요?" 확인. |
| **스펙에 없음** | 계획 수립을 멈추고 "SPEC.md에 먼저 항목을 추가할까요?" 확인. 승인되면 SPEC 편집안을 먼저 제안. |

4. `USER_JOURNEY.md`에서 이 이슈에 **대응하는 시나리오 ID(J1~J17)**를 찾는다. 없으면 "USER_JOURNEY에 시나리오를 먼저 추가할까요?"로 확인.

### 3. 스키마 변경 여부 판단

이슈가 `lib/db/schema.ts`를 건드릴 가능성이 있으면(`[db]` 라벨, tasks 테이블 언급, 필드 추가/삭제 등), CLAUDE.md §6의 스키마 변경 순서를 계획에 박는다:

1. `lib/db/schema.ts` 수정
2. `npm run db:generate` → `drizzle/` 폴더에 SQL 생성
3. 생성된 SQL 리뷰 (의도 확인)
4. `npm run db:migrate` → 로컬 DB 적용
5. 타입 오류 수정 + 기능 검증
6. `lib/db/schema.ts` + `drizzle/*.sql` + `drizzle/meta/*` 를 **한 커밋**으로 푸시

스키마 변경이 없으면 이 섹션은 건너뛴다.

### 4. TDD 슬라이스로 쪼개기

이슈 전체를 **3~6개의 커밋 슬라이스**로 나눈다. CLAUDE.md §9 "한 커밋 = 한 논리 단위" + Conventional Commits 규약. 각 슬라이스는 다음 중 하나:

- `test: #<N> <RED 설명>` — 실패하는 테스트 추가(이 이슈의 계약을 정의)
- `feat: #<N> <GREEN 설명>` — 테스트를 통과시키는 최소 구현
- `refactor: #<N> <REFACTOR 설명>` — 정리, 네이밍, 중복 제거 (필요 시)
- `chore: #<N> <…>` — 설정/의존성
- `fix: #<N> <…>` — 버그 수정
- `docs: #<N> <…>` — SPEC/USER_JOURNEY/CLAUDE 갱신

각 슬라이스에 다음을 명시:
- 건드릴 **파일 경로 리스트** (절대 경로 or 저장소 상대 경로)
- 관련 **USER_JOURNEY 시나리오 ID** (J1, J2, …)
- 예상 **테스트 파일** (`tests/unit/…`, `tests/integration/…`, `tests/e2e/…`)
- **검증 명령** (`npm run lint` / `npm test` / `npm run build` / `npm run test:e2e`)
- 스키마 변경이면 **drizzle 순서** 재인용

### 5. 계획서 출력 포맷

```markdown
# 이슈 #<N> 구현 계획 — <title>

## 스펙 근거
- SPEC.md §<섹션> — <인용 또는 요약>
- USER_JOURNEY.md — **J<x>**, **J<y>** (… 한 줄 요약)

## 전체 스코프
<2~4줄: 이 이슈가 끝났을 때 수강생이 할 수 있게 되는 것. SPEC에서 그대로 인용.>

## 범위 밖 (의식적으로 안 하는 것)
- <다른 이슈로 빠지는 항목>
- <SPEC §9 "범위 밖"에 들어가는 항목>

## 커밋 슬라이스

### 1. `test: #<N> <RED>` — 실패하는 테스트
**파일**:
- `tests/unit/<…>.test.ts` (새 파일)

**시나리오**: J<x> Given/When/Then
**검증**: `npm test` → 이 테스트만 실패해야 함 (다른 테스트는 그대로 통과)
**예상 실패 메시지**: "…"

### 2. `feat: #<N> <GREEN>` — 테스트 통과
**파일**:
- `lib/db/schema.ts` (수정, 스키마 변경 시)
- `drizzle/<timestamp>_<name>.sql` (자동 생성, 커밋 대상)
- `drizzle/meta/*` (자동 생성, 커밋 대상)
- `app/page.tsx` (수정)
- `components/<…>.tsx` (새 파일)

**스키마 변경 순서** (해당 시):
1. `lib/db/schema.ts` 수정
2. `npm run db:generate`
3. 생성된 SQL 리뷰
4. `npm run db:migrate`
5. 앱 코드 수정 + 타입 오류 해결
6. 위 파일 모두 한 커밋

**시나리오**: J<x>, J<y>
**검증**: `npm test` + `npm run lint` + `npm run build` (필요 시 `npm run test:e2e`)

### 3. `refactor: #<N> <…>` — (필요 시)
...

## 선행 조건
- [ ] 이슈 #<M> 완료 (<이유>)
- [ ] `supabase status` 가 ✅ — 로컬 DB 기동 중
- [ ] `.env.local` 에 `DATABASE_URL`·`NEXT_PUBLIC_SUPABASE_*` 세팅됨

## 이후 워크플로우
이 계획 승인 후 구현이 끝나면 **`/raise-pr`** 로 PR 생성 → CI 통과 후 **`/multi-agent-review <PR번호>`** 로 세 관점 리뷰 받는 순서 권장.

## 주의 (있을 때만)
- CLAUDE.md §10 금기사항 중 이 이슈에서 실수하기 쉬운 항목 환기
- SPEC.md §9 "범위 밖"에 닿는 유혹 지점
```

### 6. 승인 요청

계획서 출력 후 사용자에게 다음 중 하나로 질문:

> 이대로 구현을 시작할까요? 수정이 필요하면 말씀해주세요. (예/수정 요청)

- "예" → 이 스킬은 종료. 메인 세션에서 첫 번째 슬라이스(보통 RED 테스트)부터 구현에 들어감.
- 수정 요청 → 계획서를 고쳐 다시 보여줌.

## 가이드라인

- **SPEC이 정답**. 이슈 본문이 SPEC과 다르면 SPEC을 믿고 이슈를 고치는 쪽으로 유도.
- **한 커밋 = 한 논리 단위 = ≤ 수강생이 이해할 수 있는 크기**. 한 슬라이스가 10+ 파일을 건드리게 잡히면 더 쪼개라.
- **드리즐 변경은 반드시 한 커밋**. `schema.ts`만 커밋하고 `drizzle/` 폴더를 뺀 상태의 PR은 절대 제안하지 않는다.
- **테스트 먼저**. RED 커밋이 없는 슬라이스를 제안하지 마라 (정말 테스트 불가능한 경우 — UI 폴리시, 순수 설정 — 에만 예외 허용).
- **USER_JOURNEY 매핑 필수**. 시나리오 ID가 없는 기능 슬라이스는 `USER_JOURNEY.md`부터 먼저 고치라고 안내.
- **추정 금지**. 이슈 본문에 없는 요구를 계획에 섞지 마라 — SPEC에 추가한 다음 이슈 본문도 업데이트한 뒤 계획에 포함.
- **파일을 수정하거나 커밋하지 않는다**. 이 스킬은 오직 markdown 출력만.
- 한국어로 대화.

## 범위 밖

- 실제 파일 생성·수정 — 메인 세션에서 계획 승인 후 진행.
- `git commit` / `gh pr create` — `raise-pr` 스킬.
- 리뷰 — `multi-agent-review` 스킬.
- 수동 브라우저 확인 — `manual-test` 스킬.
- `SPEC.md` · `USER_JOURNEY.md` 편집 — 승인 후 **별도 턴**에서 먼저 진행하고 돌아와 계획 재수립.

## 예시 실행 — 이슈 #2

**사용자**: "/plan-issue 2"

**Claude**:
1. `gh issue view 2` → `[db] lib/db/schema.ts에 tasks 테이블 정의 + drizzle-kit generate/migrate로 로컬 적용`
2. `SPEC.md` §3 읽음 → tasks 데이터 모델 정의 확인. CLAUDE.md §3에도 Drizzle DSL 원본이 박혀 있음 — 정합.
3. `USER_JOURNEY.md` 검토 → 이 이슈는 인프라라 시나리오 직접 매핑 없음. 다만 이후 J1(빈 상태), J2(첫 작업 추가)가 이 스키마 위에서 돌아감.
4. 스키마 변경 **있음** → §6 순서 반영.
5. 커밋 슬라이스:
   - `test: #2 tasks schema contract test (RED)` — `tests/contract/tasks-schema.test.ts` 에서 `tasks` 테이블 존재 + status/progress check constraint 검증 (DB 쿼리 or drizzle 메타 리플렉션)
   - `feat: #2 define tasks table + initial migration (GREEN)` — `lib/db/schema.ts` + `drizzle/0000_*.sql` + `drizzle/meta/*` + `npm run db:migrate` 적용
   - (선택) `docs: #2 note tasks schema in CLAUDE.md §3` — 이미 반영돼 있으면 skip
6. 계획서 markdown 출력 + 승인 요청.
