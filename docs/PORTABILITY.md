# 이식성 — 다른 프로젝트로 이 체계 옮기기

이 저장소가 쓰는 **"스킬 + OMC 서브에이전트 위임"** 체계를 다른 저장소에 그대로 옮기는 가이드입니다. 핵심 아이디어는 (1) **메인은 Opus 유지**, (2) **무거운 실행은 OMC 서브에이전트가 흡수**, (3) **스킬은 사용자 진입점**.

`CLAUDE.md` §12에 명문화된 위임 정책을 다른 저장소에서 재현하려면 두 가지가 필요합니다:

1. **글로벌 아키텍처 스킬 4개** — 프로젝트 무관, 한 번 설치하면 모든 저장소가 공유.
2. **프로젝트 종속 스킬 3개** — 각 저장소의 스택·문서 구조에 맞게 그 저장소 안에 둠.

---

## 1. 무엇이 이식 가능하고 무엇이 프로젝트 종속인가

| 자산 | 종류 | 이식 위치 |
|---|---|---|
| `/exec-plan` 스킬 (executor 위임 모드) | **아키텍처** | 글로벌 (`~/.claude/skills/`) — 어떤 프로젝트든 plan→executor 흐름 동일 |
| `/raise-pr` 스킬 | 부분 아키텍처 + 부분 프로젝트 | 글로벌 코어 + per-project 검증 명령 오버라이드 |
| `/multi-agent-review` 스킬 | **아키텍처** | 글로벌 — OMC 3 reviewer 호출은 프로젝트 무관 |
| `/manual-test` 스킬 | 부분 아키텍처 + 부분 프로젝트 | 글로벌 (Playwright 패턴) + per-project (USER_JOURNEY 매핑) |
| `/plan-issue` 스킬 | **프로젝트 종속** | per-project — SPEC/JOURNEY/스키마 게이트는 그 저장소 한정 |
| `/dev-server` 스킬 | **프로젝트 종속** | per-project — 스택(Supabase/Docker/등)에 묶임 |
| `/setup-dev-environment` 스킬 | **프로젝트 종속** | per-project — 필수 도구가 스택마다 다름 |
| CLAUDE.md §12 (위임 정책) | **아키텍처** | per-project로 복사, 검증 명령만 교체 |
| README 워크플로우 섹션 | 부분 종속 | per-project — 7-스텝 사이클은 동일, 검증 명령만 교체 |

---

## 2. 추천 전략: 글로벌 4 + per-project 3

```
~/.claude/skills/                  ← 글로벌 (한 번만 설치)
├── exec-plan/SKILL.md
├── raise-pr/SKILL.md
├── multi-agent-review/SKILL.md
└── manual-test/SKILL.md

<신규 저장소>/.claude/skills/      ← per-project (저장소마다)
├── plan-issue/SKILL.md
├── dev-server/SKILL.md
└── setup-dev-environment/SKILL.md
```

**왜 이 분리인가**:
- 아키텍처 스킬 4개는 프로젝트 종속 정보가 거의 없어 글로벌화가 깔끔.
- 프로젝트 종속 스킬 3개는 SPEC/스택/도구가 매번 다르므로 각 저장소가 자기 버전 보유.
- 글로벌 스킬을 업데이트하면 모든 프로젝트가 동시에 혜택.

---

## 3. 글로벌 설치 (1회)

자기 머신에서 한 번만 실행:

```bash
# 1. 이 저장소를 참조용으로 클론 (이미 있다면 패스)
git clone https://github.com/junyoungDihisoft/claude-vercel-wbs ~/Dev/claude-vercel-wbs-ref

# 2. 아키텍처 스킬 4개를 글로벌로 복사
mkdir -p ~/.claude/skills
cp -r ~/Dev/claude-vercel-wbs-ref/.claude/skills/exec-plan ~/.claude/skills/
cp -r ~/Dev/claude-vercel-wbs-ref/.claude/skills/raise-pr ~/.claude/skills/
cp -r ~/Dev/claude-vercel-wbs-ref/.claude/skills/multi-agent-review ~/.claude/skills/
cp -r ~/Dev/claude-vercel-wbs-ref/.claude/skills/manual-test ~/.claude/skills/

# 3. 확인 — Claude Code 재시작 후 /agents 또는 / 입력해서 자동완성에 4개 명령이 보이는지
```

> **글로벌 스킬 변수화**: 위 4개는 현재 이 저장소(WBS)의 검증 명령(`npm run lint`/`npm test`/`npm run build`)이 박혀있습니다. 다른 스택(예: pytest, cargo test)의 프로젝트에서도 자연스럽게 동작하려면 **각 프로젝트의 `CLAUDE.md` §12 검증 명령 표를 읽어 사용**하도록 글로벌 스킬을 한 번 손봐 주세요. 한 번 변수화하면 이후엔 그대로 재사용 가능.

---

## 4. 신규 프로젝트 부트스트랩 프롬프트

신규 저장소를 클론한 직후 Claude Code 첫 세션에 **아래 코드블록 본문을 그대로 붙여넣으면** 셋업이 시작됩니다. README나 메모에 보관해두세요.

```
이 저장소에 "스킬 + OMC 서브에이전트 위임" 개발 체계를 셋업해줘. 다음 순서를 따른다.

## 1. 프로젝트 진단 (병렬 Bash)
다음을 한 번에 확인하고 5줄 표로 보여줘.
- 빌드/테스트 매니페스트: package.json / pyproject.toml / Cargo.toml / go.mod / build.gradle / Makefile / *.xcodeproj 중 어느 것?
- 주 언어 + 테스트 러너 + 린터 + 포맷터 추정
- CI 설정 위치 (.github/workflows/, .gitlab-ci.yml 등)
- 기존 CLAUDE.md / .claude/ / README.md 존재 여부
- 스펙 문서(SPEC.md, docs/spec.md, requirements.md) + 시나리오 문서(USER_JOURNEY.md, tests/scenarios.md) 존재 여부
- ~/.claude/skills/ 에 exec-plan / raise-pr / multi-agent-review / manual-test 가 글로벌 설치되어 있는지

## 2. 글로벌 아키텍처 스킬 설치 확인
글로벌 4개 스킬이 없으면 사용자에게 안내(자동 실행 X):

  git clone https://github.com/junyoungDihisoft/claude-vercel-wbs ~/Dev/claude-vercel-wbs-ref
  cp -r ~/Dev/claude-vercel-wbs-ref/.claude/skills/{exec-plan,raise-pr,multi-agent-review,manual-test} ~/.claude/skills/

설치 확인 후 다음 단계로.

## 3. 프로젝트 종속 자산 생성/수정 (사용자 승인 단계별)

### 3-A. CLAUDE.md
없으면 신규 생성 (스택·금기사항·디렉토리 규약 자동 추정).
있으면 §12 "위임 정책" 섹션을 마지막에 추가:
- 진입점 우선순위 (스킬 → OMC ad-hoc → 메인 직접)
- OMC 서브에이전트 라우팅 표 (explore/executor/architect/debugger/git-master/verifier 등)
- 모델 스위치 금지 단락
- 핸드오프 규칙 (요약만, plan 절대경로 + 프로젝트 규약 인용)
- 검증 명령 표 (1단계 진단 결과로 채움)
- 예외 (trivial / 인터랙티브 도구 / 환경 작업은 메인 직접)

### 3-B. .claude/skills/plan-issue/SKILL.md (프로젝트 종속, 신규)
다음 변수를 채워 생성:
- 스펙 문서 경로 (있으면), 시나리오 문서 경로 (있으면)
- TDD 슬라이스 단위 (RED/GREEN/REFACTOR 또는 사용자 선호)
- 스키마/마이그레이션 워크플로우 (DB 사용 시)
- 검증 명령 (1단계 진단 결과)
스펙 문서가 없으면 "이슈 본문만 보고 진행" 모드로 단순화.

### 3-C. .claude/skills/dev-server/SKILL.md (프로젝트 종속, 신규)
프로젝트 스택에 맞춰:
- 의존성 컨테이너 기동 명령 (docker compose, supabase start, devcontainer 등)
- 환경변수 동기화 절차
- 개발 서버 기동 명령 (1단계 진단 결과의 dev script)

### 3-D. .claude/skills/setup-dev-environment/SKILL.md (프로젝트 종속, 신규)
필수 도구(node/python/rustup/docker/CI CLI 등) 진단 + 설치 가이드.

### 3-E. README.md
"개발 워크플로우 — 스킬 7개로 한 사이클" 섹션 추가:
- ASCII 사이클 다이어그램
- 7행 명령 표 (1단계 진단된 검증 명령으로 채움)
- "왜 이 구조인가" 4불릿
- "어느 명령을 써야 할지 모르겠다" 디시전 트리

## 4. 검증
- find .claude -type f
- grep -n "## 12" CLAUDE.md
- grep -n "스킬 7개" README.md
- 사용자에게 "Claude Code 재시작 후 /plan-issue, /exec-plan, /raise-pr, /multi-agent-review, /manual-test, /dev-server, /setup-dev-environment 가 모두 / 자동완성에 보이는지 확인" 안내.

## 5. 커밋
- chore: claude code skill+OMC 서브에이전트 체계 부트스트랩 (한 커밋, 또는 사용자 선호에 따라 분할)
- .gitignore 에 .claude/settings.local.json 만 추가 (이미 있으면 패스). .claude/skills/ 는 팀 공유용 — 절대 ignore 금지.

## 가드레일
- 자동 실행 금지: git push / git commit --no-verify / gh pr merge / rm -rf
- 기존 파일 덮어쓰기 전에 반드시 diff 보여주고 사용자 승인.
- 스펙/시나리오 문서가 없으면 "없는 상태로 진행할지, 빈 템플릿을 만들지" 사용자 질문.
- 글로벌 스킬을 손대지 않는다 (per-project 범위만).
- OMC가 깔려있어야 함 — ~/.claude/CLAUDE.md 에 oh-my-claudecode 언급이 있는지 1단계에 확인 추가.
- 영어 프로젝트면 생성되는 모든 본문을 영어로 통일하도록 지시.
```

---

## 5. 점진적 확장 — `/install-tdd-pipeline` 메타-스킬 (선택)

위 부트스트랩 프롬프트를 2~3 프로젝트에 적용해 안정화한 뒤, 동일 본문을 `~/.claude/skills/install-tdd-pipeline/SKILL.md` 로 박으면 신규 저장소에서 `/install-tdd-pipeline` 한 줄로 셋업이 가능합니다. 본 가이드 범위 밖 — 후속 이슈 후보.

---

## 6. 이식 시 주의사항

- **OMC가 깔려있어야 함**: 신규 머신·환경에 [oh-my-claudecode](https://github.com/) 가 없으면 `oh-my-claudecode:executor` / `code-reviewer` 등 호출이 모두 실패합니다. 부트스트랩 1단계에 `~/.claude/CLAUDE.md` 에 `oh-my-claudecode` 언급이 있는지 확인하는 진단을 추가하세요.
- **언어 선택**: 본 저장소는 한국어 톤. 영어 프로젝트로 옮길 땐 부트스트랩 프롬프트의 한국어 본문을 영어로 바꾸고, 생성되는 스킬 본문도 영어로 통일하도록 지시 추가.
- **스펙 문서 부재**: SPEC.md / USER_JOURNEY.md 같은 문서가 없는 프로젝트에서는 `plan-issue` 스킬의 게이트 단계가 "이슈 본문만 보고 진행"으로 단순화돼야 합니다. 부트스트랩 §3-B에서 분기.
- **CI 부재**: GitHub Actions가 없으면 `/raise-pr` Phase 3(CI 감시) 단계는 skip. 부트스트랩이 CI 진단 결과로 자동 분기하도록 명시.
- **모노레포**: 한 저장소에 여러 패키지가 있으면 `/exec-plan` 위임 시 executor 프롬프트에 "작업 디렉토리"를 명시해야 합니다. CLAUDE.md §12 검증 명령 표를 패키지별로 분리하는 것을 고려.

---

## 7. 참고

- 위임 정책 본문: [`../CLAUDE.md`](../CLAUDE.md) §12
- 워크플로우 사이클: [`../README.md`](../README.md) "🛠 개발 워크플로우 — 스킬 7개로 한 사이클" 섹션
- 설계 plan: `~/.claude/plans/tingly-wiggling-platypus.md` §11
