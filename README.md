# dotfiles

여러 노트북에서 Codex 전역 설정과 개인 스킬을 동일하게 유지하기 위한 저장소입니다.

`dotfiles`를 원본으로 관리하고, 설치 스크립트가 각 항목을 `~/.codex`에 심볼릭 링크로 연결합니다. 어느 쪽 경로에서 수정하더라도 같은 원본이 바뀌므로 노트북마다 설정을 따로 관리할 필요가 없습니다.

## 관리 항목

```text
codex/
├── AGENTS.md
├── install.sh
└── skills/
    ├── codex-pr-review/
    │   ├── SKILL.md
    │   └── agents/
    │       └── openai.yaml
    └── pr-body/
        ├── SKILL.md
        └── agents/
            └── openai.yaml
```

- `codex/AGENTS.md`: Codex 전역 작업 규칙
- `codex/skills/`: 직접 관리하는 개인 스킬
  - `codex-pr-review`: PR에 일상 사용 기준의 Codex 리뷰 요청 댓글 등록
  - `pr-body`: 변경 전후와 검증 근거 중심의 PR 본문 작성
- `codex/install.sh`: `dotfiles/codex`의 항목을 Codex 홈에 연결하는 설치 스크립트

## 새 노트북에 설치하기

```bash
git clone git@github.com:heeeete/dotfiles.git ~/dotfiles
~/dotfiles/codex/install.sh
```

기본 설치 대상은 `~/.codex`입니다. 다른 Codex 홈을 사용한다면 `CODEX_HOME`을 지정할 수 있습니다.

```bash
CODEX_HOME=/path/to/codex-home ~/dotfiles/codex/install.sh
```

## 설치 스크립트 동작

- `codex/install.sh`를 제외한 `dotfiles/codex`의 항목을 같은 이름으로 Codex 홈에 연결합니다.
- `codex/skills/<skill-name>/SKILL.md`가 있는 개인 스킬을 `~/.codex/skills/<skill-name>`에 개별 연결합니다.
- Codex가 관리하는 `~/.codex/skills/.system`과 다른 로컬 스킬은 그대로 보존합니다.
- 같은 대상이 이미 올바른 심볼릭 링크라면 변경하지 않습니다.
- 기존 파일이나 잘못된 링크가 있으면 `~/.codex/backups/dotfiles-link-<timestamp>/`에 옮긴 뒤 연결합니다.

## 설정 동기화하기

한 노트북에서 설정을 수정한 후 `dotfiles` 저장소에 커밋하고 푸시합니다. 다른 노트북에서는 다음과 같이 반영합니다.

```bash
cd ~/dotfiles
git pull
./codex/install.sh
```

이미 연결된 파일이나 스킬의 내용만 바뀌었다면 `git pull` 즉시 반영됩니다. 새로운 전역 항목이나 새로운 스킬 디렉터리가 추가됐을 때는 설치 스크립트를 다시 실행해야 새 링크가 만들어집니다.

## 새 스킬 추가하기

```text
codex/skills/<skill-name>/
├── SKILL.md
└── agents/
    └── openai.yaml
```

`SKILL.md`는 필수이며 `agents/openai.yaml`은 UI 표시 정보가 필요할 때만 추가합니다. 스킬을 만든 뒤 각 노트북에서 설치 스크립트를 실행하면 자동으로 연결됩니다.

```bash
~/dotfiles/codex/install.sh
```
