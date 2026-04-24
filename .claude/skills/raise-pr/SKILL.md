---
name: raise-pr
description: 이미 구현·커밋이 완료된 로컬 브랜치를 기준으로 PR을 생성하고, 이 프로젝트의 CI(`ci.yml`의 lint + vitest + build + Playwright e2e)를 통과시켜 리뷰 승인 대기까지 끌고 간다. 사용자가 "PR 올려줘", "raise pr", "PR 생성", "리뷰 요청", "이 브랜치로 PR" 등으로 요청할 때 호출한다. 이슈 분석·TDD 구현은 범위 밖(`plan-issue` 또는 자유 구현 흐름). 이 스킬은 push → PR 본문 작성 → CI 감시 → 실패 대응 → 이슈·PR 체크박스 갱신 → 머지 대기까지 일관되게 수행. `gh pr merge` 자동 실행은 하지 않음(사용자 승인 필요).
---

# raise-pr — 완료된 브랜치에서 PR을 올려 승인까지

이 프로젝트(Next.js 14 + Chakra UI v3 + Drizzle + Supabase + Vitest + Playwright) 규약에 맞게, **구현이 끝난 로컬 브랜치를 받아 PR 라이프사이클**만 일관 처리한다.

## 전제

- 현재 로컬 브랜치에 필요한 커밋이 모두 있고, **미커밋 변경 없음**(`git status` 클린).
- `main`에 비해 의미 있는 diff가 있음(`git log --oneline main..HEAD` 비어있지 않음).
- `gh` CLI 인증 완료, 원격 `origin` 설정됨.
- CLAUDE.md §9 규약(Conventional Commits, 이슈 번호 참조, 한국어 커밋) 준수한 커밋 구성.

아직 구현이 다 안 됐다면 이 스킬이 아니라 `plan-issue` 또는 직접 구현 흐름을 먼저 마친다.

## 언제 쓰는가

- 브랜치 작업이 끝났고 PR로 올릴 차례
- 올린 PR의 CI 실패 후 수정 push → 재검증 루프
- PR과 이슈 체크박스 정합성 감사·갱신

## Phase 1 — 사전 점검 (Push 전)

### 1.1 현재 상태
```bash
git branch --show-current
git status                           # 미커밋 없음 확인
git log --oneline main..HEAD         # 커밋 목록 (Conventional Commits 형식인지 육안 확인)
git diff --stat main...HEAD          # 파일 변경 요약
```

### 1.2 CLAUDE.md 규칙 점검

- **한 PR = 한 논리 단위**. `git diff --name-only main...HEAD` 결과가 과도하게 크면(예: 20+ 파일이고 서로 다른 관심사가 섞임), 사용자에게 `x.1/x.2`로 분할을 **제안**한다. 단 부트스트랩/foundation류로 사전 합의된 경우는 예외.
- **한 이슈 = 한 PR**. 커밋 메시지·브랜치명에 이슈 번호가 드러나야 함.
- **금기사항(§10) 위반 스캔**:
  - `.env.local` / `.env` / `supabase/.temp/` 가 diff에 들어갔는지 → 들어갔으면 즉시 중단하고 사용자에게 보고.
  - service role key 문자열(`service_role`, `SUPABASE_SERVICE_ROLE_KEY`)이 클라이언트 번들 경로(`app/`, `components/`, `lib/supabase/client.ts`)에 들어갔는지 → 있으면 중단.
  - `supabase migration new|db push|db reset` 이 scripts/문서에 제안됐는지 → 있으면 제거 제안.
  - `lib/db/schema.ts`만 있고 `drizzle/*.sql`이 빠져 있으면 → `npm run db:generate` 커밋 누락. 먼저 생성/커밋하라고 요청.

### 1.3 로컬 품질 게이트

CLAUDE.md §6의 "검증" 순서에 맞춰 **순차 실행** (모두 통과해야 push):

```bash
npm run lint    # ESLint (next/core-web-vitals)
npm test        # vitest (unit + contract)
npm run build   # next build (production)
```

e2e는 무거우므로 기본 **옵션**. UI/라우팅이 바뀐 경우만:
```bash
npm run test:e2e
```

**UI 변경이 포함된 PR**이면 `manual-test` 스킬을 돌려 USER_JOURNEY 해당 시나리오의 스크린샷 증적을 확보한 뒤 본 스킬로 돌아오는 것을 권장.

## Phase 2 — Push + PR 생성

### 2.1 Push

```bash
git push -u origin <current-branch>
```

기존 PR이 있으면 자동으로 업데이트되고 CI 재실행. 없으면 신규 upstream.

### 2.2 PR 본문 작성 (`/tmp/pr-body.md`)

**표준 템플릿**

```markdown
Closes #<issue-num>

## Summary
- 1~3개 불릿: 무엇을 / 왜 (SPEC.md §<x> 근거 또는 USER_JOURNEY J<y> 시나리오 언급)

## TDD 증적 (해당 시)
- `test: #<N> ...` 커밋 → RED (실패 이유 한 줄)
- `feat: #<N> ...` 커밋 → GREEN
- (선택) `refactor: #<N> ...` 커밋 → 정리 포인트

## Test plan
- [x] `npm run lint` 로컬 초록불
- [x] `npm test` 로컬 초록불 (N passed)
- [x] `npm run build` 로컬 초록불
- [ ] CI `lint-unit-build` 초록불 (PR 생성 직후 확인)
- [ ] CI `e2e` 초록불
- [ ] (스키마 변경 시) 로컬 `npm run db:migrate` 적용 확인
- [ ] (UI 변경 시) `manual-test` 스크린샷 <첨부 경로>

## 파일 변경 요약
| # | 파일 | 구분 | 비고 |
|---|---|---|---|
| 1 | `lib/db/schema.ts` | 수정 | tasks 테이블 정의 |
| 2 | `drizzle/0000_*.sql` | 신규(자동생성) | 커밋 대상 |
| 3 | ... | | |

## 관련 시나리오 (USER_JOURNEY.md)
- **J1** 빈 상태에서 안내 문구와 `+ 작업 추가` 버튼 보임
- **J2** 최상위 작업 추가

## 주의 (있을 때만)
- SPEC.md §9 범위 밖 기능을 건드리지 않았음을 명시
- 스키마 변경 시 프로덕션 migrate는 `db-migrate.yml`이 `main` 머지 후 실행 — 이 PR은 로컬 적용만

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 2.3 PR 생성

```bash
gh pr create \
  --title "<type>(<area>): #<num> <요약 ≤70자>" \
  --body-file /tmp/pr-body.md \
  --base main
```

**제목 컨벤션** (CLAUDE.md §9):
- `feat: #3 Task 생성 모달`
- `fix: #11 Overdue 빗금 누락`
- `ci: #9 PRODUCTION_DATABASE_URL guard 제거`
- `chore: #13 스킬 4종 추가`
- `docs: #2 SPEC 업데이트`
- `refactor: #5 Task 편집 로직 분리`
- `test: #1 bootstrap test harness`

여러 이슈를 닫으려면 본문에 `Closes #A`, `Closes #B` 각각 줄 바꿈.

반환된 **PR URL·번호를 기록**.

## Phase 3 — CI 대기·실패 대응 루프

### 3.1 감시

이 프로젝트의 CI 잡 (`.github/workflows/ci.yml`):
- `lint-unit-build` — `npm ci` → `npm run lint` → `npm test` → `npm run build`
- `e2e` — Playwright chromium, 실패 시 `playwright-report` 아티팩트 업로드

`db-migrate.yml`은 **`main` push에서만** 돌고 PR에서는 skip (가드됨).

```bash
gh pr checks <pr-num>
```

또는 `Monitor` 도구로 `until` 루프:
```bash
until out=$(gh pr checks <pr-num> 2>&1); \
  echo "$out" | grep -qE "(pass|fail|cancelled)"; \
  do sleep 8; done; echo "$out"
```

### 3.2 실패 시 원인 격리

```bash
gh run view <run-id> --log-failed \
  | grep -E "FAIL|Error:|✘|Expected|Received|Module not found|Type error" \
  | head -30
```

**원인별 대응**

| 증상 | 대응 |
|---|---|
| `npm run lint` 실패 | `.eslintrc.json` 룰 위반 라인 수정. `any` 과다 사용 등은 진짜 타입으로 고치고 규칙을 풀지 마라. |
| `vitest` 실패 | `build/reports` 대신 CI 로그에서 "expected/received" 차이 확인 → 테스트 또는 구현 중 어느 쪽이 맞는지 판단 (보통 RED 때 정의한 계약이 정답). |
| `next build` 실패 | Server/Client 경계 오류(`'use client'` 누락 또는 `next/headers`를 client에서 import), 타입 오류. `lib/supabase/server.ts`를 client 컴포넌트에서 import한 경우가 흔함. |
| `playwright e2e` flaky | `playwright-report` 아티팩트의 trace 확인. `npm run dev` cold start 타이밍이면 `webServer.timeout` 상향 또는 CI에서 `next start` 사용. |
| `drizzle-kit` 관련 | `schema.ts` 수정 후 `drizzle/` 폴더 커밋 누락이 가장 흔함. `npm run db:generate` 실행 + 생성물 커밋. |

### 3.3 수정 커밋 → 재검증

- 메시지 컨벤션: `fix: #<N> CI lint 위반 수정` / `test: #<N> flaky e2e 방어 추가` / `chore: #<N> drizzle 메타 파일 커밋 누락 보정` 등.
- `git push` → CI 자동 재실행 → Monitor 재가동 (PR 번호 그대로, 동일 PR 업데이트).

## Phase 4 — 이슈 ↔ PR 적합성 감사

### 4.1 이슈 체크박스 1:1 대조

```bash
gh issue view <num> --json body --jq '.body' > /tmp/issue-body-old.md
```

각 `- [ ]` 항목을 PR 구현 범위와 대조. 구현 완료 + 증적(테스트 경로/파일 경로) 확보한 것만 `[x]` 로 전환.

### 4.2 이슈 본문 갱신

```bash
# /tmp/issue-body-new.md 편집 후
gh issue edit <num> --body-file /tmp/issue-body-new.md
```

- 미완 항목은 **사실대로 `[ ]` 유지** + 짧은 각주 (*이후 이슈에서*, *로컬 검증 미완* 등)
- 허위 체크 금지

### 4.3 PR Test plan 갱신

```bash
gh pr view <pr-num> --json body --jq '.body' > /tmp/pr-body-old.md
# 체크박스 [x] 전환 + CI run 링크 삽입 후
gh pr edit <pr-num> --body-file /tmp/pr-body-new.md
```

## Phase 5 — 리뷰·승인·머지 대기

### 5.1 머지는 사용자가 한다

**Claude는 `gh pr merge` 자동 실행 금지.** 공유 상태(원격 main) 변경은 사용자 명시적 승인 필요.

리뷰 코멘트가 있으면 해당 사항만 수정해 Phase 3부터 재진행.

### 5.2 리뷰 받기

옵션: PR CI가 초록불인 상태에서 **`/multi-agent-review <PR번호>`** 스킬을 돌려 세 관점 교차 검증 리포트를 받는 것을 권장. 이 스킬의 출력(P0/P1 개선안)을 반영해 추가 커밋을 올리면 이 스킬의 Phase 3 루프로 다시 들어감.

### 5.3 머지 후 정리

```bash
git fetch origin --prune
git checkout main && git pull --ff-only
```

머지된 이슈가 에픽성 상위 이슈의 체크박스 중 하나였다면 상위 이슈 체크박스도 `[x]`로 갱신.

---

## 가이드라인 (박스 요약)

- **Push 전 필수 3가지**: 미커밋 없음 / 금기사항(§10) 스캔 통과 / `lint` + `test` + `build` 순차 초록불.
- **금지 행동 (사용자 승인 없이 금지)**: `gh pr merge`, `git push --force`(대신 `--force-with-lease`만, 그것도 rebase 등 명시적 상황에서만), `git reset --hard`, `gh run cancel`, `--no-verify` 커밋/푸시.
- **PR 본문 템플릿**: `Closes #N` → Summary → TDD 증적 → Test plan → 파일 표 → USER_JOURNEY 시나리오 → 주의 → Claude 푸터.
- **CI pending 1~3분 정상**: `Monitor`의 `until` 루프로 감시. 짧은 `sleep` 체인 금지.
- **실패 대응 원칙**: 룰/게이트를 느슨하게 하지 말고 **원인 수정**. 테스트 실패를 삭제/skip하지 말 것.
- **허위 체크박스 금지**: 이슈·PR 본문 체크는 실제 구현·검증 기반으로만.

## 이 프로젝트의 체크 지점 (빠른 참조)

| 항목 | 명령 / 파일 |
|---|---|
| Lint | `npm run lint` → `next lint` |
| Unit/contract | `npm test` → vitest (`tests/unit/**`, `tests/contract/**`) |
| Build | `npm run build` → Next.js production |
| e2e | `npm run test:e2e` → Playwright chromium |
| DB 마이그레이션 (로컬) | `npm run db:migrate` |
| CI workflow (PR) | `.github/workflows/ci.yml` — `lint-unit-build` + `e2e` |
| CI workflow (main push) | `.github/workflows/db-migrate.yml` — `drizzle-kit migrate` on `PRODUCTION_DATABASE_URL` (가드됨) |

## 다른 스킬과의 관계

- **선행**: `plan-issue` — 이슈 분석·질문·계획 수립. 이 스킬은 그 결과 구현이 끝난 상태를 전제.
- **옵션**: `manual-test` — UI 포함 변경이면 Phase 1 로컬 게이트나 Phase 4 증적 확보 시 사용.
- **후속**: `multi-agent-review` — Phase 5 직전에 세 관점 리뷰 받고 P0/P1 반영.
- **범위 밖**: `review` / `security-review` — 본 스킬은 자체 코드 리뷰 안 함.

---

## 실행 예시 — 이슈 #13 스킬 4종 PR

```
Phase 1: git status clean, 5 파일(+1 docs), lint/test/build 초록불
Phase 2: push → gh pr create (Closes #13, 4개 스킬 + CLAUDE.md §11 요약)
Phase 3: CI → lint-unit-build pass / e2e pass (스킬 파일은 CI 영향 없음)
Phase 4: 이슈 #13 체크박스 5/6 → [x] (마지막 "수동 호출 확인"은 머지 후)
Phase 5: 사용자 머지 대기 → 머지 후 main 동기화 + PR #12 rebase
```
