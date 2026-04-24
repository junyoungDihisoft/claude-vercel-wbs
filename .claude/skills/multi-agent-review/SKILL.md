---
name: multi-agent-review
description: 하나의 PR/브랜치에 대해 `code-reviewer`(품질·아키텍처) / `security-reviewer`(보안·시크릿) / `test-engineer`(테스트·CI) 세 OMC 서브에이전트를 병렬 실행하고, 세 리포트를 교차 검증해 (1) 공통으로 지목된 진짜 리스크, (2) 관점별 고유 결함, (3) P0~P2 우선순위 개선안으로 정리해 돌려준다. 사용자가 "멀티 에이전트 리뷰", "multi agent review", "세 관점으로 리뷰", "크로스체크 리뷰", "리뷰어 여러 명 돌려줘", "PR 병렬 리뷰" 등으로 요청할 때 호출한다. 단일 관점 리뷰는 범위 밖 — 해당 에이전트를 직접 호출하면 된다. 이슈 생성·코드 수정도 범위 밖(`plan-issue`, `raise-pr` 담당).
---

# multi-agent-review — 세 관점 병렬 리뷰 + 교차 검증

하나의 PR을 **품질·아키텍처 / 보안 / 테스트·CI** 세 리뷰어가 각각 독립적으로 읽고, 메인 프로세서가 세 리포트를 병합해 **진짜 블로커**와 **관점별 고유 결함**을 분리해 제시한다.

## 왜 이 스킬이 필요한가

메인 프로세스는 자기가 짠 코드를 "괜찮다"고 판단하는 편향이 있다. 코드와 무관한 별도 서브에이전트에게 관점을 나눠 맡기면:

- **단일 관점 리뷰가 놓치는 교집합 리스크가 드러난다** — 세 관점이 동시에 같은 결함을 지목하면 토론의 여지 없는 머지 블로커.
- **관점별 격리로 중복 노이즈가 없다** — 한 에이전트가 모든 관점을 섞어 보는 것보다 각 관점의 깊이가 더 깊음.
- **메인 프로세서 컨텍스트 절약** — 세 리포트 원문은 종합 보고 형태로만 소비되므로 후속 작업 여유가 남음.

## 언제 쓰는가

- PR 머지 전 한 컨텍스트에서 품질·보안·테스트를 모두 검토.
- 리뷰 결과로 후속 이슈를 쪼갤 근거가 필요할 때.
- 자동화 테스트가 통과했지만 "이 PR이 진짜 준비됐는가"를 독립 관점으로 확인하고 싶을 때.

**쓰지 말 것**:
- 한 관점만 필요 → 해당 에이전트(`code-reviewer`/`security-reviewer`/`test-engineer`)를 직접 호출.
- 1~2파일짜리 자명한 수정 → 오버킬.
- 아직 코드가 다 안 된 상태 → 먼저 구현을 마치고 호출.

## 전제

- 저장소 루트에 `CLAUDE.md`·`SPEC.md`·`USER_JOURNEY.md` 존재 (세 리뷰어가 공통 근거로 삼음).
- `gh` CLI 인증 완료.
- PR 번호 **또는** 로컬 브랜치가 사용자 프롬프트 또는 현재 상태에서 식별 가능.
- OMC 에이전트(`oh-my-claudecode:code-reviewer` / `oh-my-claudecode:security-reviewer` / `oh-my-claudecode:test-engineer`)가 가용 상태.

## 워크플로우

### 1. 대상 확정

사용자 프롬프트에서 PR 번호(`#12`, `PR 12`)를 파싱. 없으면:

```bash
gh pr view --json number,headRefName,title
```

현재 브랜치의 PR을 조회. PR이 없고 브랜치만 있다면 브랜치 diff(`git diff main...<branch>`)만으로 진행. PR 번호를 못 찾으면 **사용자에게 확인** 후 진행.

diff·PR 본문·파일 리스트를 먼저 한 번 읽어 **공통 Context 문단**(1~2문장)을 작성한다. 예:
> "이슈 #1 부트스트랩 PR. Next.js 14 + Chakra UI v3 + Supabase @supabase/ssr + Drizzle postgres-js 클라이언트를 import 가능한 상태까지 올리는 PR로, tasks 테이블 정의는 #2 범위."

### 2. 세 에이전트 병렬 실행 — **한 메시지에서 세 Agent 호출**

병렬이 이 스킬의 핵심이다. 반드시 **같은 응답 안에 세 개의 Agent tool call**을 넣는다. 순차 호출 금지.

각 호출 공통:

- `subagent_type`: OMC 에이전트 이름
- `prompt`: 아래 템플릿 — 공통 Context + 관점별 스코프 + 공통 출력 포맷
- **세 프롬프트의 `Context`는 동일**. 세 리뷰어가 서로의 결과를 모른 채 독립 판단하도록 한다 (메인 프로세서의 결론·한쪽 리뷰어의 결론을 다른 리뷰어 프롬프트에 섞지 마라 — 편향 유발).

#### 프롬프트 템플릿 (스코프만 교체)

```
GitHub PR #<N> (`<head-ref>` → `<base-ref>`)에 대해 **<관점 한국어 이름>** 관점으로 리뷰해 주세요.
저장소: `<absolute repo path>`. 프로젝트: 교육용 WBS (Next.js 14 App Router + Chakra UI v3 + Supabase @supabase/ssr + Drizzle postgres-js).

## 공통 Context
<1~2문장 — 이 PR이 다루는 slice, 이전/다음 이슈 맥락>

## 리뷰 스코프 (이 관점에만 집중 — 다른 관점은 건드리지 마세요)
<관점별 bullet 5~10개>

## 근거 문서
- CLAUDE.md §2(스택), §3(스키마), §6(워크플로우), §9(커밋), §10(금기)
- SPEC.md §9(범위 밖)
- USER_JOURNEY.md (J1~J17 시나리오)

## 리뷰 방법
1. `gh pr diff <N> --patch` 로 패치 읽기 + 파일별 Read 병행.
2. 각 지적에 severity 라벨 + 파일:라인 + 구체적 개선안 포함.
3. **다른 관점은 언급만, 제안은 원주인 스코프에 위임**.

## 출력 형식 (markdown, 한국어, 요약 600자 이내)
<관점별 섹션 템플릿>

파일 수정하지 말고 리뷰 결과만 돌려주세요.
```

#### 관점별 스코프

**A. 품질·아키텍처 — `oh-my-claudecode:code-reviewer`**
- 아키텍처 선택 (Next.js 풀스택 전제, Server/Client 경계, 별도 백엔드 금지), 레이어 분리(`app/` · `components/` · `lib/supabase/` · `lib/db/` · `drizzle/`)
- TypeScript strict, 네이밍, 파일 구조, Chakra UI v3 API 정합
- `drizzle.config.ts` §6 규약(`schema`, `out`, `strict`, `verbose`) 일치
- `package.json` 스크립트 이름(`db:generate`/`db:migrate`/`db:studio`/`test`/`test:e2e`) 및 버전 정합
- SOLID/DRY/KISS, CLAUDE.md §10 금기(Tailwind·shadcn 혼용, `drizzle-kit push`, `supabase db reset` 등) 위반
- severity: Blocker / Major / Minor / Nit
- 섹션: `## 요약` → `## Blocker` → `## Major` → `## Minor` → `## Nit` → `## 긍정 포인트`

**B. 보안 — `oh-my-claudecode:security-reviewer`**
- 환경변수: `NEXT_PUBLIC_*` 접두사 규칙, service role key 클라이언트 번들 유출, `.env.local` 계열 `.gitignore` 포함
- `lib/supabase/client.ts` (브라우저) vs `server.ts` (서버) 경계, `server-only` 가드 유무
- `DATABASE_URL` 분리: 마이그레이션(5432 Direct/Session pooler) vs 런타임(6543 Transaction pooler), Transaction pooler로 migrate 돌릴 위험
- `.github/workflows/` secret 취급, 이벤트 트리거 범위, 액션 버전 핀(SHA vs `@v4`), `permissions:` 최소화
- `package-lock.json` 상위 deps 취약성 스캔(특히 Next.js CVE)
- RLS 전제(MVP off) × 이 PR의 상호작용
- OWASP(A01 access control, A02 crypto failures, A05 misconfig, A07 auth, A08 integrity)
- severity: Critical / High / Medium / Low / Info
- 섹션: `## 요약` → `## Critical` → `## High` → `## Medium` → `## Low` → `## Info` → `## Security Checklist`

**C. 테스트·CI — `oh-my-claudecode:test-engineer`**
- 테스트가 의미 있는 보장을 제공하는지(문자열 존재 검증 vs 실제 계약 검증)
- `USER_JOURNEY.md` J1~J17 시나리오 매핑(테스트 `describe` 블록에 시나리오 ID 포함되는지)
- Vitest 구성(`vitest.config.ts`, `vitest.setup.ts` — jsdom, RTL, cleanup, matcher 로딩)
- Playwright 구성(`playwright.config.ts` — webServer/baseURL/trace/retries/reuseExistingServer/timeout)
- `.github/workflows/ci.yml` 잡 구성(Node 20, caching, playwright install, artifact, fail-fast, 병렬성, concurrency)
- TDD 흐름(RED 커밋이 진짜 RED였는지, 현재 GREEN 유지되는지 — 필요시 `npm test` 실제 실행)
- Flaky 리스크(dev 서버 cold start 타이밍, 병렬 DB 충돌 가능성)
- Page Object / fixture / DB seed 전략 부재 여부
- severity: Blocker / Major / Minor / Nit
- 섹션: `## 요약` → `## 커버리지 갭` → `## Flakiness 리스크` → `## CI 구성 개선` → `## 향후 TDD 확장 준비도` → `## 긍정 포인트`

### 3. 교차 검증 (cross-check)

세 리포트가 돌아오면 메인 프로세서가 직접 교차표를 작성한다. 메모리·파일이 아니라 **응답 안에** 그려서 사용자에게 보여준다.

| # | 이슈 요약 | 품질 | 보안 | 테스트 |
|---|-----------|:----:|:----:|:------:|
| C1 | ... | ✔ | ✔ | ✔ |
| C2 | ... | ✔ | ✔ | — |

- **둘 이상에서 지목 = 진짜 리스크 (P0 후보)**
- 한 관점 단독 = 그 관점의 고유 관찰 (P1/P2 후보)
- 표기는 "공통 이슈" 블록(`C1`, `C2`, …)으로 먼저 묶고, 이어서 "관점별 고유 이슈"로 내려간다.

### 4. 우선순위별 개선안으로 정리

사용자에게 반환할 최종 포맷:

```markdown
# PR #<N> 종합 리뷰 — `<branch>`

## 전체 평가
<2~4줄: 머지 가능 여부, 세 리뷰어의 공통 기저 판단, 구조적 약점 한 문장>

## 🔴 세 관점이 동시에 지적한 공통 이슈 (최우선)
### C1. <제목>
- 품질: ...
- 보안: ...
- 테스트: ...
- **개선안**: ...

### C2. ...

## 🟡 관점별 고유 이슈
### 품질/아키텍처
- **[Major] 파일:라인** — 문제. 개선안.
- ...

### 보안
- **[High] 파일:라인** — 문제. 영향. 개선안.
- ...

### 테스트/CI
- **[Major] 파일:라인** — 문제. 개선안.
- ...

## 🟢 세 리뷰어 모두 칭찬한 부분
- ...

## 추천 처리 순서
| 우선순위 | 작업 | 근거 |
|---|---|---|
| P0 (이 PR에 추가 커밋) | ... | ... |
| P1 (이 PR 또는 후속 커밋) | ... | ... |
| P2 (별도 이슈) | ... | ... |
| P3 (메모) | ... | ... |
```

**CLAUDE.md §9 "한 커밋 = 한 논리 단위" 원칙을 우선순위표에 의식적으로 반영**한다. P0 묶음이 한 커밋에 담기지 않는 규모면 하위 분할안까지 본문에 포함.

### 5. 종료

- 세 리뷰어의 원문 리포트는 **요청이 있을 때만** 전체 공개. 기본은 종합 리뷰만 출력.
- 이슈 생성·코드 수정·PR 코멘트 작성은 **별도 턴** 또는 다른 스킬(`raise-pr`, `plan-issue`) 담당.

## 가이드라인

- **세 Agent 호출은 반드시 한 메시지 = 진짜 병렬.** 순차 호출은 시간·토큰 낭비이고 어차피 독립 판단이 목적이므로 순서 의미 없음.
- **스코프 침범 감시**: 같은 결함이 두 리포트에 동시에 등장하면 **원주인 스코프로 귀속**하고 다른 쪽에서는 언급만 (교차표의 가치가 오히려 커진다).
- **중립적 Context 전달**: 메인 프로세서의 선입견을 프롬프트에 섞지 마라 ("시크릿 관리가 허술해 보이는데 확인" 금지 — 리뷰어가 그 지점만 보게 된다).
- **CLAUDE.md §9 기반 권고**: 개선안은 커밋 분리를 전제로 묶어라.
- **사용자가 "원문 보고서"를 요구하면** 세 리포트를 순서대로(품질 → 보안 → 테스트) 그대로 덤프.
- 한국어로 대화.

## 범위 밖

- 이슈 생성 — `plan-issue` 스킬 또는 별도 턴.
- 코드 수정 · 테스트 실행 · PR 코멘트 자동 작성 — 이 스킬은 **리뷰 결과물만** 책임.
- 단일 관점 리뷰 — 해당 에이전트 직접 호출.
- 비-PR 전체 감사(아키텍처 deep-dive, security audit 전반) — 다른 스킬 또는 general-purpose.

## 예시 실행 — PR #12

**사용자**: "PR #12 멀티 에이전트 리뷰 돌려줘."

**메인 프로세서**:
1. `gh pr view 12 --json headRefName,title,body` → branch=`feat/issue-1-bootstrap`, title=`feat: #1 bootstrap …`
2. `gh pr diff 12 --name-only` + 본문에서 공통 Context 도출.
3. **한 메시지에서 세 Agent tool call 동시 호출**:
   - `subagent_type=oh-my-claudecode:code-reviewer`, scope=품질·아키텍처
   - `subagent_type=oh-my-claudecode:security-reviewer`, scope=보안
   - `subagent_type=oh-my-claudecode:test-engineer`, scope=테스트·CI
4. 세 리포트 수신 → 공통/고유 finding 교차표 작성 → P0~P3 개선안 표 작성.
5. 사용자에게 종합 리포트만 제시. 원문은 요청 시 공개.
