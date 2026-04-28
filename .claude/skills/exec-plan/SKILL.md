---
name: exec-plan
description: 사용자가 "plan 실행", "플랜 실행", "exec plan", "이행해", "plan대로 진행", "plan대로 실행" 등으로 요청할 때, `~/.claude/plans/`의 (인자 없으면 최신, 인자 있으면 해당 슬러그) 플랜 파일을 읽고 그 내용을 작업 지시로 해석해 즉시 실행한다. **plan mode에 재진입하거나 새 플랜을 작성하지 않는다.** trivial plan(≤2파일·≤20줄)은 메인 세션이 직접 처리해 학습 가시성을 유지하고, 그 외 모든 plan은 `Task(subagent_type="oh-my-claudecode:executor")`로 위임해 main 세션의 prompt cache를 보존하며 Sonnet 비용으로 구현·검증·커밋까지 끝낸다. 보고서형 plan은 그대로 출력. 신규 플랜 작성은 `plan-issue` 스킬 또는 plan mode 직접 호출 — 이 스킬 범위 밖.
---

# exec-plan — 기존 플랜 파일 실행 전용 스킬

이 스킬은 **이미 작성된 플랜 파일을 그대로 실행**한다. 새 플랜을 짜지 않는다.

## 왜 이 스킬이 필요한가

이 저장소의 작업 흐름은 **Opus 메인 세션이 `~/.claude/plans/<slug>.md`에 작업 플랜을 작성 → 같은 메인이 실행을 트리거**하는 분업이다. 사용자는 토큰 절감을 위해 "plan 실행"처럼 짧게 지시한다.

과거에 사용자가 `/model`로 Sonnet으로 전환한 뒤 본 스킬을 호출하던 패턴이 있었으나, 모델 스위치는 **prompt cache를 무효화**해 SPEC.md / USER_JOURNEY.md / 코드 파일을 다시 읽는 비용이 발생한다. 이를 막기 위해 **메인은 Opus를 유지하고, 본 스킬이 비-trivial plan을 OMC `executor` 서브에이전트(Sonnet, 자체 컨텍스트)에 위임**해 Sonnet 비용 효과를 캐시 손실 없이 얻는다. 학습 가시성이 중요한 trivial 수정만 메인이 직접 실행한다.

또한 Sonnet이 짧은 지시를 **새 plan 작성 요청**으로 오해해 plan mode에 재진입하는 케이스가 반복됐다. 이 스킬은 그 오해를 방지하는 명시적 진입점이다.

## 절대 하지 말 것 (가드)

- ❌ **plan mode에 재진입 금지** — `ExitPlanMode`/`EnterPlanMode` 호출 불가. 이 스킬이 호출된 이상 계획은 이미 완성돼 있다.
- ❌ **새 플랜 파일 작성 금지** — `~/.claude/plans/*.md`에 `Write` 금지. 플랜 파일은 **읽기 전용 입력**이다.
- ❌ **다른 플랜으로 임의 전환 금지** — 인자 없으면 최신, 인자 있으면 정확히 그 슬러그. 추측으로 다른 파일 선택 불가.
- ❌ **재플래닝 금지** — 플랜이 모호해도 새로 설계하지 말고 한 줄 질문으로 사용자에게 확인.
- ❌ **모델 스위치 강요 금지** — 사용자가 Sonnet으로 바꾸지 않아도 본 스킬은 정상 동작. 메인 Opus 유지가 정답.

## 입력

- **인자 없음**: `~/.claude/plans/` 에서 mtime 기준 최신 `.md` 파일.
- **인자 있음**: `/exec-plan <slug>` → `~/.claude/plans/<slug>.md` (확장자 생략 허용, 부분 매칭 시 prefix·infix 순으로 탐색).

## 워크플로우

### 1. 플랜 파일 식별

```bash
# 인자 없을 때 — 최신 파일
ls -t ~/.claude/plans/*.md | head -1

# 인자 있을 때 — 슬러그 매칭
ls ~/.claude/plans/*<slug>*.md | head -1
```

찾지 못하면 "지정한 플랜 파일을 찾지 못했습니다. 후보 목록: …" 을 출력하고 중단.

### 2. 플랜 분류

파일을 읽고 다음 세 유형 중 하나로 분류한다.

| 유형 | 신호 | 처리 |
|---|---|---|
| **A. 구현 지시형** | `## 커밋 슬라이스`, `## 추천 처리 순서`, `P0`, `P1`, `- [ ]` 체크박스 | → 3A 실행 (trivial / delegate 분기) |
| **B. 보고서형** | `## 결론`, `## 전체 평가`, `## 리뷰` 섹션만 있고 동작 지시 없음 | → 3B 실행 |
| **C. 혼합형** | 보고서 + P0 액션 항목 공존 (가장 흔한 케이스) | → 3C 실행 |

### 3A. 구현 지시형 — trivial / delegate 분기 판정

플랜의 **구현 규모**를 다음 휴리스틱으로 분류한다.

| 신호 | 분류 |
|---|---|
| 수정 대상 파일 ≤ 2개 **그리고** 총 변경 ≤ 20줄 추정 **그리고** RED 테스트 슬라이스 없음 **그리고** 스키마(`lib/db/schema.ts`) 미접촉 | **trivial** → §3A-trivial |
| 위 외 모든 경우 (RED→GREEN 슬라이스 존재 / 스키마 변경 / 신규 컴포넌트 / 3+ 파일) | **delegate** → §3A-delegate |

판정이 모호하면 **delegate를 기본값**으로 한다 (executor 위임이 학습 가시성보다 비용 효율이 클 가능성이 높음).

### 3A-trivial. 메인 직접 실행

학습 가시성을 위해 메인 세션이 직접 처리한다.

1. TaskCreate로 P0 → P1 → P2 항목을 순서대로 등록.
2. 각 항목을 `in_progress` → 완료 시 `completed` 로 갱신하며 순차 실행.
3. 검증 명령(`npm run lint` / `npm test` / `npm run build`)을 단계 완료 시마다 수행.
4. 모든 P0 완료 후 `/raise-pr` 흐름으로 자연스럽게 연결.

### 3A-delegate. executor 위임 실행 (기본 경로)

OMC `executor` 서브에이전트에 위임한다. 메인은 Opus 유지 → 캐시 보존 → Sonnet 비용 효과만 흡수.

1. plan 파일의 **절대 경로**를 확보 (`readlink -f` 또는 `realpath`).
2. **§3D 프롬프트 템플릿**을 그대로 채워 `Task(subagent_type="oh-my-claudecode:executor", prompt=<채워진 템플릿>)` 한 번 호출.
3. executor가 자체 컨텍스트에서 plan을 읽고 슬라이스별로 구현·커밋·검증을 수행.
4. 반환된 요약을 메인이 받아 다음을 검증:
   - 커밋 개수 ≥ plan에 명시된 슬라이스 개수
   - 각 슬라이스의 검증(`npm run lint` / `npm test`) 결과가 PASS로 보고됨
   - plan에서 벗어난 결정이 보고됐다면 사용자에게 즉시 공유
5. 검증 의심 시 **`Task(subagent_type="oh-my-claudecode:verifier")`** 로 cross-check (별도 세션, 자체 컨텍스트).
6. 모든 P0 슬라이스 완료 + 검증 통과 후 `/raise-pr` 흐름으로 연결.

### 3B. 보고서형 출력

플랜 파일의 내용을 사용자에게 그대로(또는 요약하여) 출력한다. 코드 변경·커밋 없음.

### 3C. 혼합형 처리

1. 보고서 부분을 1~2문단으로 요약해 사용자에게 먼저 출력.
2. P0 액션 항목부터 즉시 **3A 절차** (분기 판정 → trivial 또는 delegate)로 진입.

### 3D. executor 위임 프로토콜 (프롬프트 템플릿)

§3A-delegate에서 사용. `<ABS_PATH_TO_PLAN>` 자리에 1단계에서 확보한 plan 절대 경로를 박는다. 본문은 한국어로 유지(executor도 한국어 응답하도록 톤 통일).

```
프로젝트: claude-vercel-wbs (Next.js 14 App Router 풀스택 + Chakra UI v3 + Drizzle ORM + Supabase + Vitest + Playwright).
저장소 루트: /Users/mac/Dev/claude-vercel-wbs (또는 현재 작업 디렉토리)
실행할 plan: <ABS_PATH_TO_PLAN>

이 plan을 그대로 따라 구현해주세요. 추가 설계·재계획·플랜 분기 금지 — plan에 명시된 슬라이스 순서·파일·커밋 메시지를 그대로 따른다.

## 반드시 지킬 규칙 (CLAUDE.md 인용)

### §6 스키마 변경 순서 (plan에 schema 변경이 있으면 반드시 적용)
1. `lib/db/schema.ts` 수정
2. `npm run db:generate` → `drizzle/` 폴더에 SQL 마이그레이션 생성
3. 생성된 SQL을 눈으로 리뷰 (의도와 다르면 schema.ts 재수정 후 재생성)
4. `npm run db:migrate` → 로컬 DB(`DATABASE_URL`=`.env.local` 값) 적용
5. 앱 코드의 타입 오류 수정 + 기능 검증
6. `lib/db/schema.ts` + `drizzle/*.sql` + `drizzle/meta/*` 를 **한 커밋**으로 묶음

### §9 Conventional Commits + 한 커밋 = 한 논리 단위
- 형식: `<type>(<area>)?: #<이슈번호> <한국어 요약 ≤70자>`
- type: `feat` / `fix` / `chore` / `docs` / `refactor` / `test`
- TDD 슬라이스가 plan에 명시돼 있으면 **RED → GREEN → REFACTOR 순서로 별도 커밋**.
  - RED 커밋 직후 `npm test` 실행해 해당 테스트가 실제로 실패하는지 확인 (실패하지 않으면 테스트가 잘못 짜여진 것 — 사용자에게 보고 후 멈춤).
  - GREEN 커밋 직후 `npm test` 실행해 해당 테스트가 통과하는지 확인.

### §10 금기 (위반 시 즉시 멈추고 사용자에게 보고)
- Tailwind / shadcn 컴포넌트를 끌어오지 않는다 (Chakra UI v3만).
- `.env`, `.env.local`, `supabase/.temp/` 를 커밋하지 않는다.
- service role key를 클라이언트 번들 경로(`app/`, `components/`, `lib/supabase/client.ts`)에 두지 않는다.
- `supabase migration new` / `supabase db push` / `supabase db reset` 사용 금지.
- `drizzle-kit push` 사용 금지 (반드시 `generate` + `migrate`).
- Transaction pooler(6543) 문자열로 마이그레이션 실행 금지.
- 프로덕션 DB에 로컬에서 직접 migrate 금지 (GitHub Actions 경유만).
- 별도 백엔드 서버(Express/Fastify/NestJS) 추가 금지 — Server Action / Route Handler 안에서 처리.

## 검증 (각 슬라이스 완료마다)

순차 실행, 모두 통과해야 다음 슬라이스로:
- `npm run lint`
- `npm test`

마지막 슬라이스 완료 후 추가:
- `npm run build`
- e2e 영향이 있는 변경(라우팅·UI 계약 변경)이면 `npm run test:e2e`

## 가드

- plan에 명시되지 않은 파일을 수정하지 않는다 (필요하면 멈추고 사용자에게 보고).
- plan에 명시되지 않은 의존성을 `npm install` 하지 않는다.
- `git push` 금지 (PR 생성은 `/raise-pr` 스킬이 담당).
- `gh pr merge` 금지.
- 3회 연속 같은 슬라이스에서 실패하면 멈추고 OMC architect 에이전트에 cross-check 요청 또는 사용자에게 보고.

## 출력 (메인에게 돌려줄 요약)

1. 변경 파일 목록 — `path:line-range` 형식
2. 슬라이스별 커밋 — `<sha-7> <type>: #<num> <메시지>` 형식
3. 검증 결과 — 명령별 PASS/FAIL + 카운트
4. plan에서 벗어난 결정 (있다면)
5. 후속 권장 — 보통 `/raise-pr` 호출 안내
```

### 4. 종료

- 모든 P0 항목 완료 + 검증 통과 → "P0 완료" 보고.
- 남은 P1/P2가 있으면 "이어서 진행할까요, 별도 이슈로 옮길까요?" 한 줄 질문.

## 다른 스킬과의 관계

| 상황 | 스킬 / 에이전트 |
|---|---|
| 이슈를 분석해 **새 플랜을 작성**해야 함 | `plan-issue` 스킬 (Opus, 메인 세션) |
| **이미 있는 플랜을 실행**해야 함 (trivial) | **`exec-plan` (이 스킬)** — 메인이 직접 실행 |
| **이미 있는 플랜을 실행**해야 함 (그 외) | **`exec-plan` (이 스킬)** — 내부적으로 OMC `executor` 서브에이전트(Sonnet)에 위임 |
| 큰 변경 후 독립 검증이 필요함 | OMC `verifier` 서브에이전트 (메인이 ad-hoc 호출) |
| 구현 후 PR 생성·CI 감시 | `raise-pr` 스킬 |
| PR 머지 전 품질·보안·테스트 리뷰 | `multi-agent-review` 스킬 |

> **모델 스위치 금지**: 본 스킬을 호출하기 전에 `/model`로 메인을 Sonnet으로 바꾸지 않는다. 메인은 Opus를 유지하고, Sonnet 비용은 executor 위임을 통해 자동으로 발생한다.

## 언제 쓰지 말 것

- 아직 플랜이 없고 이슈부터 분석해야 하는 상황 → `plan-issue`.
- 구현 없이 바로 PR만 올리는 상황 → `raise-pr`.
- 플랜은 있지만 한 줄 추가 같은 정말 사소한 수정만 남은 경우 → 자유 대화로 바로 구현 (스킬 진입 자체가 오버헤드).
