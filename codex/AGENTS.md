<!-- BEGIN COMPOUND CODEX TOOL MAP -->
## Compound Codex Tool Mapping (Claude Compatibility)

This section maps Claude Code plugin tool references to Codex behavior.
Only this block is managed automatically.

Tool mapping:
- Read: use shell reads (cat/sed) or rg
- Write: create files via shell redirection or apply_patch
- Edit/MultiEdit: use apply_patch
- Bash: use shell_command
- Grep: use rg (fallback: grep)
- Glob: use rg --files or find
- LS: use ls via shell_command
- WebFetch/WebSearch: use curl or Context7 for library docs
- AskUserQuestion/Question: present choices as a numbered list in chat and wait for a reply number. For multi-select (multiSelect: true), accept comma-separated numbers. Never skip or auto-configure — always wait for the user's response before proceeding.
- Task (subagent dispatch) / Subagent / Parallel: run sequentially in main thread; use multi_tool_use.parallel for tool calls
- TaskCreate/TaskUpdate/TaskList/TaskGet/TaskStop/TaskOutput (Claude Code task-tracking, current): use update_plan (Codex's task-tracking primitive)
- TodoWrite/TodoRead (Claude Code task-tracking, legacy — deprecated, replaced by Task* tools): use update_plan
- Skill: open the referenced SKILL.md and follow it
- ExitPlanMode: ignore
<!-- END COMPOUND CODEX TOOL MAP -->

## Working Rules

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them; don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 실행 의도 확인 규칙

사용자의 메시지가 질문, 상담, 설명 요청, 아이디어 논의, 리뷰 요청인지
실제 작업 지시인지 먼저 판단한다.

- 사용자가 명시적으로 “수정해줘”, “추가해줘”, “만들어줘”, “삭제해줘”, “실행해줘”, “커밋해줘”처럼 작업을 요청했거나, 문맥상 파일 변경/명령 실행을 원한다는 점이 명백할 때만 실제 변경을 수행한다.
- “어떻게 할까?”, “뭐가 좋을까?”, “왜 이래?”, “가능해?”, “규칙을 뭐라고 쓰면 좋을까?” 같은 질문형 메시지는 기본적으로 대화/제안 요청으로 본다.
- 질문형 메시지에 대해 파일 수정, 코드 변경, 생성, 삭제, git 조작, 외부 상태 변경을 먼저 수행하지 않는다.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Write helpful comments when they clarify non-obvious intent, constraints, or tradeoffs.
- 블럭마다 간략한 설명 주석을 작성한다.
- Never modify or delete existing comments unless you are also changing the related code and the comment would become inaccurate.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it; don't delete it.

When your changes create orphans:

- Remove imports, variables, and functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Review Feedback Handling

리뷰 피드백은 정답이 아니라 검토할 입력으로 취급한다.

사용자, 리뷰어, 서브에이전트, 자동화 도구가 리뷰를 주면:

- 리뷰 내용을 100% 신뢰하지 않는다.
- 먼저 리뷰가 주장하는 문제를 정확히 파악한다.
- 주변 코드, 기존 로직, 테스트, 제품 의도를 확인한 뒤 수정 여부를 판단한다.
- 리뷰가 지적한 동작이 실제 버그인지, 의도된 동작인지 구분한다.
- 기존 로직이나 사용자 의도와 충돌하면 기술적 근거를 들어 설명하고 반박한다.
- 의도가 불명확하면 구현하지 말고 질문한다.
- 해당 코드베이스에서 리뷰가 타당하다고 확인된 뒤에만 수정한다.
- 검증 전에는 "맞습니다", "좋은 지적입니다" 같은 형식적 동의를 피한다.

목표는 모든 리뷰 코멘트를 그대로 반영하는 것이 아니라, 의도된 동작을 보존하면서 실제 문제만 고치는 것이다.

## Git Rules

- 커밋, 푸시, PR 생성 등 git/원격 저장소 상태를 바꾸는 작업은 사용자가 명시적으로 요청하고 직전 승인한 경우에만 수행한다.
- 브랜치는 바로 붙여넣을 수 있게 `git checkout -b <name>` 형식으로 제안한다.
- 브랜치 prefix는 `feat/`, `fix/`, `chore/`처럼 짧게 쓴다. `feature/`는 쓰지 않는다.

예:
`git checkout -b feat/context-tree-delete-menu`

- 커밋 메시지는 제목 + 본문으로 제안한다.
- 커밋 메시지는 작업 과정이 아니라 최종 코드 상태와 사용자/시스템 관점의 의미를 기준으로 작성한다.
- 제목은 가능한 한 `type(scope): 요약` 형식을 사용한다. 예: `feat(web): 문서 삭제 흐름 추가`
- scope는 한 영역만 명확히 수정했을 때만 넣는다. 여러 영역이면 scope를 생략한다.
- 제목은 구현 세부사항보다 "무엇이 가능해졌는지 / 무엇이 고쳐졌는지"를 요약한다.
- 본문은 Markdown 형식으로 작성한다.
- 본문 첫 섹션은 항상 `## Summary`로 시작한다.
- `## Summary` 아래에는 "왜 필요한 변경인지", "어떤 상태/동작이 달라졌는지", "사용자나 시스템에 어떤 의미가 있는지"를 1-2문장으로 요약한다.
- 요약 문장은 한국어 음슴체를 쓰되, `...함`으로 문장을 끝내기보다 명사형으로 간결하게 마무리한다. 예: `...흐름 개선`, `...상태 정리`, `...문제 축소`
- 요약 뒤에는 변경 내용을 bullet로 정리한다.
- 파일별 변경, 구현 단계, 시행착오, 중간 수정, 이전 결과를 고쳤다는 표현은 피한다.
- bullet은 구현 체크리스트가 아니라 의미 있는 변경 축을 기준으로 쓴다.

예:
```
feat(web): Context Tree 문서 삭제 추가

## Summary
문서 항목에서 삭제를 실행할 수 있게 하고, 삭제 성공 후 Context Tree와
열린 문서 상태를 실제 artifact 상태와 맞추도록 정리.

- 문서 항목에서 삭제 액션 추가
- 삭제 성공 후 Context Tree와 열린 문서 상태 갱신
- 사라진 artifact가 UI에 남는 상태 축소
```

- 여러 영역을 수정했으면 `## Summary` 아래에 전체 의미를 먼저 요약하고, 영역별 bullet을 덧붙인다.

예:
```
feat: 문서 삭제 흐름 추가

## Summary
Context Tree에서 문서 삭제를 시작할 수 있게 하고, API 삭제 결과에 따라
트리와 열린 문서 상태가 일관되게 갱신되도록 함.

[web]
- 문서 항목 삭제 액션 추가
- 삭제 후 열린 문서 상태 정리

[api-rust]
- artifact 삭제 응답 처리 보강
```

### PR 본문

- Codex가 PR을 생성하거나 기존 PR 본문을 수정할 때 적용한다.
- PR 본문 최하단에는 반드시 `## 머지 준비 상태` 섹션을 둔다.
- `## 머지 준비 상태`에는 다음 항목을 모두 포함한다.
  - `판정`: `바로 머지 가능`, `추가 검증 권장`, `머지 보류` 중 하나
  - `신뢰도`: `높음`, `중간`, `낮음` 중 하나
  - `근거`: 실행한 테스트, 빌드, 정적 검사, 브라우저 검증, 코드 리뷰 등 판정 근거
  - `미검증 영역`: 확인하지 못한 환경이나 동작. 없으면 `없음`
  - `남은 위험`: 알려진 회귀 가능성. 없으면 `없음`

## Markdown 원본 출력 규칙

사용자가 블로그 글, README, 문서 초안 등 Markdown 원본을 요청하면, 전체 원본을 4개 백틱 코드블록으로 감싸서 출력한다.

Markdown 원본 내부에 fenced code block이 포함될 수 있으므로, 바깥 fence는 내부 fence보다 길게 사용한다.

예:

`````text
````md
# 제목

```bash
echo hello
```
````
`````

사용자가 렌더링된 Markdown을 원한다고 명시한 경우에만 일반 Markdown으로 출력한다.
