#!/bin/sh

set -eu

# 이 스크립트가 있는 dotfiles/codex와 현재 노트북의 Codex 홈을 계산한다.
codex_source_dir=$(CDPATH= cd "$(dirname "$0")" && pwd)
codex_dir=${CODEX_HOME:-"${HOME}/.codex"}
codex_skills_dir="${codex_dir}/skills"
backup_id="$(date '+%Y%m%d-%H%M%S')-$$"
backup_dir="${codex_dir}/backups/dotfiles-link-${backup_id}"

# 기존 대상은 백업한 뒤 dotfiles 원본을 가리키는 절대 경로 링크로 교체한다.
link_item() {
  source_path=$1
  target_path=$2
  backup_relative_path=$3

  if [ -L "$target_path" ] && [ "$(readlink "$target_path")" = "$source_path" ]; then
    printf '이미 연결됨: %s -> %s\n' "$target_path" "$source_path"
    return
  fi

  if [ -e "$target_path" ] || [ -L "$target_path" ]; then
    backup_path="${backup_dir}/${backup_relative_path}"
    mkdir -p "$(dirname "$backup_path")"
    mv "$target_path" "$backup_path"
    printf '기존 항목 백업: %s\n' "$backup_path"
  fi

  mkdir -p "$(dirname "$target_path")"
  ln -s "$source_path" "$target_path"
  printf '연결 완료: %s -> %s\n' "$target_path" "$source_path"
}

# skills는 Codex의 시스템 관리 스킬을 보존하기 위해 개인 스킬만 하나씩 연결한다.
link_skills() {
  skills_source_dir=$1

  mkdir -p "$codex_skills_dir"
  for skill_source in "$skills_source_dir"/*; do
    if [ ! -f "${skill_source}/SKILL.md" ]; then
      continue
    fi

    skill_name=$(basename "$skill_source")
    link_item "$skill_source" "${codex_skills_dir}/${skill_name}" "skills/${skill_name}"
  done
}

# dotfiles/codex의 새 항목도 별도 목록 수정 없이 다음 실행부터 자동으로 연결한다.
mkdir -p "$codex_dir"
for source_item in "$codex_source_dir"/*; do
  if [ ! -e "$source_item" ] && [ ! -L "$source_item" ]; then
    continue
  fi

  item_name=$(basename "$source_item")
  case "$item_name" in
    install.sh)
      continue
      ;;
    skills)
      link_skills "$source_item"
      ;;
    *)
      link_item "$source_item" "${codex_dir}/${item_name}" "$item_name"
      ;;
  esac
done

printf 'Codex 전역 설정 연결이 완료됐어요.\n'
